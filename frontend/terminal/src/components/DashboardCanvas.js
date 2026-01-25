import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { BarChart, LineChart, PieChart, ScatterChart, HistogramChart, AreaChart, HeatmapChart } from '../charts';
import { apiService } from '../services/api';
import layoutService from '../services/layoutService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartBar, 
  faChartLine, 
  faChartPie, 
  faCircle, 
  faBolt, 
  faBullseye, 
  faUsers, 
  faDollarSign,
  faCog,
  faTrash,
  faTimes,
  faChartArea,
  faChartColumn,
  faFire
} from '@fortawesome/free-solid-svg-icons';

const iconMap = {
  bar: faChartBar,
  line: faChartLine, 
  pie: faChartPie,
  scatter: faCircle,
  histogram: faChartColumn,
  area: faChartArea,
  heatmap: faFire,
  activity: faBolt,
  kpi: faBullseye,
  users: faUsers,
  revenue: faDollarSign,
};

const chartComponentMap = {
  bar: BarChart,
  line: LineChart,
  pie: PieChart,
  scatter: ScatterChart,
  histogram: HistogramChart,
  area: AreaChart,
  heatmap: HeatmapChart,
  activity: null, // Widget components
  kpi: null,
  users: null,
  revenue: null,
};

const mockData = {
  bar: { value: "Sales by Month", subtitle: "Last 6 months performance" },
  line: { value: "User Growth", subtitle: "Monthly active users" },
  pie: { value: "Traffic Sources", subtitle: "Website analytics" },
  scatter: { value: "Correlation Analysis", subtitle: "Relationship between variables" },
  activity: { value: "Recent Activity", subtitle: "Latest user actions" },
  kpi: { value: "94.2%", subtitle: "Conversion Rate" },
  users: { value: "12,847", subtitle: "Active Users" },
  revenue: { value: "$84,392", subtitle: "Monthly Revenue" },
};

const DashboardCanvas = forwardRef(({ mode, showChat, onCreateChart, onDeleteChart, onUpdateChart }, ref) => {
  const [items, setItems] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [fullscreenItem, setFullscreenItem] = useState(null);
  const [chartData, setChartData] = useState({});
  const [loading, setLoading] = useState(false);
  const [rangeFilters, setRangeFilters] = useState({});
  const [availableColumns, setAvailableColumns] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null); // Will be set when schema loads
  const [schema, setSchema] = useState({});
  const [tables, setTables] = useState([]);
  const [viewNameMapping, setViewNameMapping] = useState({}); // Maps custom view names to base view names
  const [dateTimeColumn, setDateTimeColumn] = useState(null); // The dateTime column for the selected view
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Load database schema on mount
  useEffect(() => {
    const loadSchema = async () => {
      try {
        console.log('Loading database schema...');
        const schemaData = await apiService.getSchema();
        if (schemaData && schemaData.schema) {
          setSchema(schemaData.schema);
          setTables(schemaData.tables || []);
          
          // Build mapping of custom view names to base view names
          const mapping = {};
          Object.keys(schemaData.schema).forEach(viewName => {
            const viewInfo = schemaData.schema[viewName];
            if (viewInfo.baseViewName) {
              mapping[viewName] = viewInfo.baseViewName;
              console.log(`Mapping: ${viewName} -> ${viewInfo.baseViewName}`);
            }
          });
          setViewNameMapping(mapping);
          
          // Set default to first available view/table from schema
          // Don't hardcode 'shipments' - use whatever views are available
          let defaultTable = null;
          if (schemaData.tables && schemaData.tables.length > 0) {
            // Use first available view/table from the schema
            defaultTable = schemaData.tables[0];
          } else if (schemaData.schema && Object.keys(schemaData.schema).length > 0) {
            // Fallback: use first key from schema object
            defaultTable = Object.keys(schemaData.schema)[0];
          }
          
          if (defaultTable) {
            setSelectedTable(defaultTable);
            setAvailableColumns(schemaData.schema[defaultTable]?.columns || []);
            console.log('Default view/table set to:', defaultTable);
          } else {
            // If no views/tables found, set to null but log a warning
            console.warn('No views/tables found in schema');
          }
          console.log('Schema loaded:', schemaData);
        }
      } catch (error) {
        console.error('Error loading schema:', error);
        // Fallback to empty array
        setAvailableColumns([]);
      }
    };
    
    loadSchema();
  }, []);

  // Update columns when table changes
  useEffect(() => {
    if (schema[selectedTable]) {
      setAvailableColumns(schema[selectedTable].columns || []);
    }
  }, [selectedTable, schema]);

  // Fetch view details to get dateTime column when selectedTable changes
  useEffect(() => {
    const fetchViewDetails = async () => {
      if (!selectedTable) {
        setDateTimeColumn(null);
        return;
      }
      
      try {
        // Check if it's a custom view by trying to fetch view details
        const viewDetails = await apiService.getView(selectedTable);
        if (viewDetails && viewDetails.dateTime) {
          setDateTimeColumn(viewDetails.dateTime);
          console.log('View dateTime column:', viewDetails.dateTime);
        } else {
          setDateTimeColumn(null);
        }
      } catch (error) {
        // Not a custom view or view doesn't exist, no dateTime column
        setDateTimeColumn(null);
        console.log('No dateTime column for table/view:', selectedTable);
      }
    };
    
    fetchViewDetails();
  }, [selectedTable]);

  // Refresh all charts when date filters change (if dateTimeColumn exists)
  // This useEffect will trigger when dateFrom or dateTo changes
  useEffect(() => {
    // Skip if no dateTime column or no items
    if (!dateTimeColumn || items.length === 0) {
      return;
    }
    
    // Skip initial render when both dates are empty (to avoid unnecessary refresh on mount)
    // But allow refresh when dates are cleared (both become empty after being set)
    const wasInitialMount = dateFrom === '' && dateTo === '';
    if (wasInitialMount && !chartData || Object.keys(chartData).length === 0) {
      return;
    }
    
    console.log('📅 Date filter changed, refreshing all charts...', { dateFrom, dateTo });
    const refreshAllCharts = async () => {
      setLoading(true);
      try {
        const refreshPromises = items.map(async (item) => {
          const { xField, yField, yFields, type } = item.config;
          const isPieChartReady = type === 'pie' && yField;
          const isOtherChartReady = type !== 'pie' && xField && (yField || yFields);
          
          if (isPieChartReady || isOtherChartReady) {
            try {
              const isMultiValue = yFields && yFields.length > 1;
              const filters = {
                ...rangeFilters[item.id],
                ...(dateFrom ? { dateFrom } : {}),
                ...(dateTo ? { dateTo } : {})
              };
              
              const data = isMultiValue ? 
                await fetchMultiValueChartData(xField, yFields, type, filters) :
                await fetchChartData(xField, yField, type, filters);
              
              setChartData(prev => ({
                ...prev,
                [item.id]: data
              }));
              console.log(`✅ Refreshed chart ${item.id} with date filter`);
            } catch (error) {
              console.error(`❌ Error refreshing chart ${item.id}:`, error);
            }
          }
        });
        await Promise.all(refreshPromises);
      } finally {
        setLoading(false);
      }
    };
    
    // Debounce to avoid too many refreshes when user is typing/selecting dates
    const timeoutId = setTimeout(refreshAllCharts, 500);
    return () => clearTimeout(timeoutId);
  }, [dateFrom, dateTo, dateTimeColumn]); // Depend on date filters

  // Debug: Log when items array changes
  useEffect(() => {
    console.log('DashboardCanvas: Items array updated:', items.length, 'items');
    console.log('DashboardCanvas: Items content:', items);
  }, [items]);

  // Note: Removed click-outside-to-close functionality for modal edit interface

  // Function to refresh items from API
  const refreshItemsFromAPI = async () => {
    try {
      console.log('Refreshing items from API...');
      const response = await fetch('http://localhost:4000/api/layout');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.layout) {
          console.log('Items refreshed from API:', data.layout.length, 'items');
          console.log('API layout data:', data.layout);
          return data.layout;
        }
      }
      console.log('No layout found in API');
      return [];
    } catch (error) {
      console.error('Error refreshing items from API:', error);
      return [];
    }
  };

  // Handle chart creation and deletion from chatbot
  useEffect(() => {
    if (onCreateChart) {
      const handleChartCreation = (chartConfig) => {
        console.log('DashboardCanvas received chart config:', chartConfig);
        console.log('Creating new chart from chatbot with config:', {
          id: chartConfig.id,
          type: chartConfig.type,
          title: chartConfig.config.title,
          xField: chartConfig.config.xField,
          yField: chartConfig.config.yField
        });
        
        // Create a new chart item
        const newChartItem = {
          id: chartConfig.id,
          type: chartConfig.type,
          config: chartConfig.config,
          position: { x: 0, y: 0, w: 6, h: 4 } // Default position and size
        };
        
        // Add the new chart to the items
        setItems(prevItems => {
          const updatedItems = [...prevItems, newChartItem];
          
          // Save the updated layout to the API (always save for chatbot-created charts)
          layoutService.saveLayout(updatedItems)
            .then(async () => {
              console.log('✅ New chart saved to layout API');
              console.log('✅ Chart will persist in database');
              
              // Verify the chart was saved by fetching from API
              try {
                const verification = await refreshItemsFromAPI();
                console.log('✅ Verification: Chart confirmed in API with', verification.length, 'total charts');
              } catch (error) {
                console.error('❌ Verification failed:', error);
              }
            })
            .catch(error => {
              console.error('❌ Error saving new chart to layout API:', error);
            });
          
          return updatedItems;
        });
        
        // Fetch data for the new chart
        const { xField, yField, yFields, type } = chartConfig.config;
        if (xField && (yField || yFields)) {
          const isMultiValue = yFields && yFields.length > 1;
          const fetchFunction = isMultiValue ? 
            fetchMultiValueChartData(xField, yFields, type, {}) :
            fetchChartData(xField, yField, type, {});
            
          fetchFunction
            .then(data => {
              setChartData(prev => ({
                ...prev,
                [chartConfig.id]: data
              }));
              console.log(`✅ Fetched data for new chart: ${data.data ? data.data.length : data.length} records`);
            })
            .catch(error => {
              console.error('❌ Error fetching data for new chart:', error);
            });
        }
      };
      
      // Store the handler for external calls
      window.createChartFromChatbot = handleChartCreation;
    }

    if (onDeleteChart) {
      const handleChartDeletion = async (chartName) => {
        console.log('DashboardCanvas received delete request for:', chartName);
        const deleted = await deleteChartByName(chartName);
        if (deleted) {
          console.log(`Successfully deleted chart: "${chartName}"`);
        } else {
          console.log(`Chart "${chartName}" not found for deletion`);
        }
      };
      
      // Store the handler for external calls
      window.deleteChartFromChatbot = handleChartDeletion;
    }

    if (onUpdateChart) {
      const handleChartUpdate = async (chartConfig) => {
        console.log('DashboardCanvas received update request for:', chartConfig);
        const updated = await updateChartByName(chartConfig);
        if (updated) {
          console.log(`Successfully updated chart: "${chartConfig.plotName}"`);
        } else {
          console.log(`Chart "${chartConfig.plotName}" not found for update`);
        }
      };
      
      // Store the handler for external calls
      window.updateChartFromChatbot = handleChartUpdate;
      console.log('DashboardCanvas: Registered window.updateChartFromChatbot');
    } else {
      console.log('DashboardCanvas: onUpdateChart prop not provided');
    }
  }, [onCreateChart, onDeleteChart, onUpdateChart]);

  // Load saved layout on component mount - but wait for schema to be loaded first
  useEffect(() => {
    const loadLayout = async () => {
      // Wait for schema and selectedTable to be loaded
      if (!selectedTable || tables.length === 0) {
        console.log('DashboardCanvas: Waiting for schema to load before loading layout...');
        return;
      }
      
      try {
        console.log('DashboardCanvas: Loading layout from API...');
        console.log('DashboardCanvas: selectedTable is:', selectedTable, 'tables:', tables);
        
        // Use the refresh function to load items from API
        const apiItems = await refreshItemsFromAPI();
        
        // If we have items from API, set them and fetch their data
        if (apiItems.length > 0) {
          console.log('DashboardCanvas: Setting items from API and fetching data...');
          console.log('DashboardCanvas: API items to set:', apiItems);
          setItems(apiItems); // Set the items array first
          console.log('DashboardCanvas: Items array set from API');
          setLoading(true);
          const fetchPromises = apiItems.map(async (item) => {
            const { xField, yField, yFields, type } = item.config;
            
            // Check if chart has required fields configured
            const isPieChartReady = type === 'pie' && yField;
            const isOtherChartReady = type !== 'pie' && xField && (yField || yFields);
            
            if (isPieChartReady || isOtherChartReady) {
              try {
                console.log(`Fetching data for ${item.id}: xField=${xField}, yField=${yField}, yFields=${yFields}, type=${type}`);
                const isMultiValue = yFields && yFields.length > 1;
                const data = isMultiValue ? 
                  await fetchMultiValueChartData(xField, yFields, type, {}) :
                  await fetchChartData(xField, yField, type, {});
                setChartData(prev => ({
                  ...prev,
                  [item.id]: data
                }));
                console.log(`✅ Fetched data for ${item.id}:`, data.data ? data.data.length : data.length, 'records');
              } catch (error) {
                console.error(`❌ Error fetching data for ${item.id}:`, error);
              }
            } else {
              console.log(`⏭️ Skipping ${item.id}: missing required fields (xField=${xField}, yField=${yField}, yFields=${yFields})`);
            }
          });
          
          // Wait for all data fetching to complete
          await Promise.all(fetchPromises);
          setLoading(false);
        }
        // If no items from API, try fallback to layoutService
        else if (apiItems.length === 0) {
          console.log('DashboardCanvas: No items from API, trying fallback...');
          const savedLayout = await layoutService.loadLayout();
          console.log('DashboardCanvas: Fallback layout result:', savedLayout);
          
          if (savedLayout && savedLayout.length > 0) {
            setItems(savedLayout);
            console.log('Loaded saved layout with', savedLayout.length, 'items');
            
            // Fetch data for all charts that have x and y fields configured
            setLoading(true);
            const fetchPromises = savedLayout.map(async (item) => {
              const { xField, yField, yFields, type } = item.config;
              
              // Check if chart has required fields configured
              const isPieChartReady = type === 'pie' && yField;
              const isOtherChartReady = type !== 'pie' && xField && (yField || yFields);
              
              if (isPieChartReady || isOtherChartReady) {
                try {
                  console.log(`Fetching data for ${item.id}: xField=${xField}, yField=${yField}, yFields=${yFields}, type=${type}`);
                  const isMultiValue = yFields && yFields.length > 1;
                  const data = isMultiValue ? 
                    await fetchMultiValueChartData(xField, yFields, type, {}) :
                    await fetchChartData(xField, yField, type, {});
                  setChartData(prev => ({
                    ...prev,
                    [item.id]: data
                  }));
                  console.log(`✅ Fetched data for ${item.id}:`, data.data ? data.data.length : data.length, 'records');
                } catch (error) {
                  console.error(`❌ Error fetching data for ${item.id}:`, error);
                }
              } else {
                console.log(`⏭️ Skipping ${item.id}: missing required fields (xField=${xField}, yField=${yField}, yFields=${yFields})`);
              }
            });
            
            // Wait for all data fetching to complete
            await Promise.all(fetchPromises);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error loading layout:', error);
      }
    };
    
    loadLayout();
  }, [selectedTable, tables]); // Re-run when selectedTable or tables change

  // Refetch chart data when selectedTable changes and items already exist
  useEffect(() => {
    if (!selectedTable || items.length === 0) {
      return; // Don't fetch if no table selected or no items
    }
    
    console.log('🔄 selectedTable changed, refetching data for existing items...');
    const refetchData = async () => {
      setLoading(true);
      const fetchPromises = items.map(async (item) => {
        const { xField, yField, yFields, type } = item.config;
        
        // Check if chart has required fields configured
        const isPieChartReady = type === 'pie' && yField;
        const isOtherChartReady = type !== 'pie' && xField && (yField || yFields);
        
        if (isPieChartReady || isOtherChartReady) {
          try {
            // Resolve custom view name to base view name
            let tableToUse = selectedTable;
            if (viewNameMapping[selectedTable]) {
              tableToUse = viewNameMapping[selectedTable];
              console.log(`🔄 Refetching data for ${item.id}: resolved "${selectedTable}" to "${tableToUse}"`);
            } else {
              console.log(`🔄 Refetching data for ${item.id} with table: ${tableToUse}`);
            }
            
            const isMultiValue = yFields && yFields.length > 1;
            const data = isMultiValue ? 
              await fetchMultiValueChartData(xField, yFields, type, {}) :
              await fetchChartData(xField, yField, type, {});
            setChartData(prev => ({
              ...prev,
              [item.id]: data
            }));
            console.log(`✅ Refetched data for ${item.id}:`, data.data ? data.data.length : data.length, 'records');
          } catch (error) {
            console.error(`❌ Error refetching data for ${item.id}:`, error);
          }
        }
      });
      
      await Promise.all(fetchPromises);
      setLoading(false);
    };
    
    refetchData();
  }, [selectedTable, viewNameMapping]); // Depend on selectedTable and viewNameMapping

  // Save layout whenever items change (only in design mode)
  useEffect(() => {
    if (mode === 'design' && items.length > 0) {
      const timeoutId = setTimeout(async () => {
        try {
          await layoutService.saveLayout(items);
        } catch (error) {
          console.error('Error saving layout:', error);
        }
      }, 1000); // Debounce saving by 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [items, mode]);

  // availableColumns is now loaded from database schema dynamically


  // Fetch chart data from backend with table name
  const fetchChartData = async (xAxis, yAxis, chartType, filters = {}) => {
    console.log('🚀 fetchChartData CALLED with:', { xAxis, yAxis, chartType, filters, selectedTable, tables });
    try {
      setLoading(true);
      // Use selectedTable or fallback to first available table from schema
      let tableToUse = selectedTable || (tables.length > 0 ? tables[0] : null);
      
      // Resolve custom view name to base view name if it's a custom view
      if (tableToUse && viewNameMapping[tableToUse]) {
        const baseViewName = viewNameMapping[tableToUse];
        console.log(`🔄 Resolving custom view "${tableToUse}" to base view "${baseViewName}"`);
        tableToUse = baseViewName;
      }
      
      console.log('🚀 fetchChartData: tableToUse =', tableToUse);
      
      if (!tableToUse) {
        console.error('❌ fetchChartData: No view/table selected and no tables available');
        console.error('❌ selectedTable:', selectedTable, 'tables:', tables);
        return { data: [], isMultiValue: false, yAxes: [] };
      }
      
      if (!xAxis || !yAxis) {
        console.error('❌ fetchChartData: Missing xAxis or yAxis', { xAxis, yAxis });
        return { data: [], isMultiValue: false, yAxes: [] };
      }
      
      // Add date range filters if dateTime column exists and dates are set
      const finalFilters = { ...filters };
      if (dateTimeColumn) {
        if (dateFrom) finalFilters.dateFrom = dateFrom;
        if (dateTo) finalFilters.dateTo = dateTo;
      }
      
      console.log('🚀 fetchChartData: Calling apiService.getChartData with:', { xAxis, yAxis, chartType, filters: finalFilters, tableToUse });
      const data = await apiService.getChartData(xAxis, yAxis, chartType, null, finalFilters, tableToUse);
      console.log('🚀 fetchChartData: Received data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching chart data:', error);
      return { data: [], isMultiValue: false, yAxes: [] };
    } finally {
      setLoading(false);
    }
  };

  // Fetch multi-value chart data from backend with table name
  const fetchMultiValueChartData = async (xAxis, yAxes, chartType, filters = {}) => {
    console.log('🚀 fetchMultiValueChartData CALLED with:', { xAxis, yAxes, chartType, filters, selectedTable, tables });
    try {
      setLoading(true);
      // Use selectedTable or fallback to first available table from schema
      let tableToUse = selectedTable || (tables.length > 0 ? tables[0] : null);
      
      // Add date range filters if dateTime column exists and dates are set
      const finalFilters = { ...filters };
      if (dateTimeColumn) {
        if (dateFrom) finalFilters.dateFrom = dateFrom;
        if (dateTo) finalFilters.dateTo = dateTo;
      }
      
      // Resolve custom view name to base view name if it's a custom view
      if (tableToUse && viewNameMapping[tableToUse]) {
        const baseViewName = viewNameMapping[tableToUse];
        console.log(`🔄 Resolving custom view "${tableToUse}" to base view "${baseViewName}"`);
        tableToUse = baseViewName;
      }
      
      console.log('🚀 fetchMultiValueChartData: tableToUse =', tableToUse);
      
      if (!tableToUse) {
        console.error('❌ fetchMultiValueChartData: No view/table selected and no tables available');
        console.error('❌ selectedTable:', selectedTable, 'tables:', tables);
        return { data: [], isMultiValue: false, yAxes: [] };
      }
      
      if (!xAxis || !yAxes || (Array.isArray(yAxes) && yAxes.length === 0)) {
        console.error('❌ fetchMultiValueChartData: Missing xAxis or yAxes', { xAxis, yAxes });
        return { data: [], isMultiValue: false, yAxes: [] };
      }
      
      console.log('🚀 fetchMultiValueChartData: Calling apiService.getMultiValueChartData with:', { xAxis, yAxes, chartType, filters: finalFilters, tableToUse });
      const data = await apiService.getMultiValueChartData(xAxis, yAxes, chartType, null, finalFilters, tableToUse);
      console.log('🚀 fetchMultiValueChartData: Received data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching multi-value chart data:', error);
      return { data: [], isMultiValue: false, yAxes: [] };
    } finally {
      setLoading(false);
    }
  };

  // Get available fields for configuration
  const getAvailableFields = () => {
    return availableColumns.map(column => ({
      value: column.name,
      label: column.name,
      type: column.type,
      description: column.description
    }));
  };

  const getAvailableYFields = () => {
    // Allow all fields for Y-axis - no restrictions
    return availableColumns.map(column => ({
      value: column.name,
      label: column.name,
      type: column.type,
      description: column.description
    }));
  };

  // Handle chart configuration updates
  const handleItemConfig = async (itemId, config) => {
    const updatedItems = items.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            config: { ...item.config, ...config },
            // Update item height when config height changes
            ...(config.height && { height: config.height })
          }
        : item
    );
    
    setItems(updatedItems);
    
    // Save layout after configuration changes
    if (mode === 'design') {
      try {
        await layoutService.saveLayout(updatedItems);
      } catch (error) {
        console.error('Error saving layout after config change:', error);
      }
    }
    
    // Don't auto-fetch data - only fetch when Fetch Data button is pressed
  };



  // Conservative height calculation to prevent overflow
  const getDynamicHeight = () => {
    const isTwoColumnLayout = (mode === 'design' || showChat);
    const baseHeight = isTwoColumnLayout ? 350 : 280; // Reduced base heights
    const minHeight = isTwoColumnLayout ? 300 : 250;   // Reduced minimum heights
    
    if (isTwoColumnLayout) {
      // 2-column layout: moderate charts
      if (items.length <= 2) return Math.max(minHeight, baseHeight + 50);
      if (items.length <= 4) return baseHeight;
      if (items.length <= 6) return Math.max(minHeight, baseHeight - 25);
      return Math.max(minHeight, baseHeight - 50);
    } else {
      // 3-column layout: compact charts
      if (items.length <= 3) return Math.max(minHeight, baseHeight + 30);
      if (items.length <= 6) return baseHeight;
      if (items.length <= 9) return Math.max(minHeight, baseHeight - 15);
      return Math.max(minHeight, baseHeight - 30);
    }
  };

  // Dynamic grid layout based on mode and chatbot state
  const getGridLayout = () => {
    // Use 2 columns for design mode or when chatbot is open, 3 columns otherwise
    const columns = (mode === 'design' || showChat) ? 2 : 3;
    
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`, // Dynamic columns based on mode
      gridAutoRows: 'minmax(300px, auto)', // Reduced minimum height to prevent overflow
      gap: '16px', // Reduced gap for better space utilization
      padding: '16px', // Reduced padding for more chart space
      paddingBottom: '80px', // Reduced bottom padding
      width: '100%',
      minHeight: 'auto',
      alignContent: 'start'
    };
  };


  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const chartType = e.dataTransfer.getData("text/plain");

    const newItem = {
      id: `${chartType}-${Date.now()}`,
      type: chartType,
      config: {
        title: mockData[chartType]?.value || 'New Chart',
        xField: '',
        yField: '',
        height: getDynamicHeight(),
        ...(chartType === 'pie' && { labelField: '', valueField: '' })
      }
    };

    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    
    // Save layout immediately after adding new item
    if (mode === 'design') {
      try {
        await layoutService.saveLayout(updatedItems);
      } catch (error) {
        console.error('Error saving layout after drop:', error);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const removeItem = async (id) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    // Save layout after removal
    if (mode === 'design') {
      try {
        await layoutService.saveLayout(updatedItems);
      } catch (error) {
        console.error('Error saving layout after removal:', error);
      }
    }
  };

  // Clear all items and save empty layout
  const clearLayout = async () => {
    setItems([]);
    if (mode === 'design') {
      try {
        await layoutService.saveLayout([]);
      } catch (error) {
        console.error('Error clearing layout:', error);
      }
    }
  };

  // Expose clearLayout function to parent component
  useImperativeHandle(ref, () => ({
    clearLayout
  }));

  // Delete chart by name (for chatbot integration)
  const deleteChartByName = async (chartName) => {
    console.log(`Deleting chart with name: "${chartName}"`);
    
    // Fetch current charts from API
    let currentCharts = [];
    try {
      const layoutResponse = await fetch('http://localhost:4000/api/layout');
      if (layoutResponse.ok) {
        const layoutData = await layoutResponse.json();
        if (layoutData.success && layoutData.layout) {
          currentCharts = layoutData.layout;
          console.log('Fetched charts from API for deletion:', currentCharts);
        }
      }
    } catch (error) {
      console.error('Error fetching charts from API:', error);
      // Fallback to local items
      currentCharts = items;
    }
    
    // Normalize names for comparison (lowercase, replace spaces with underscores)
    const normalizeName = (name) => name.toLowerCase().replace(/\s+/g, '_');
    const normalizedChartName = normalizeName(chartName);
    
    // Find the chart by name using normalized comparison
    const chartToDelete = currentCharts.find(item => 
      item.config && item.config.title && 
      normalizeName(item.config.title) === normalizedChartName
    );
    
    if (chartToDelete) {
      console.log(`Found chart to delete:`, chartToDelete);
      const updatedItems = currentCharts.filter(item => item.id !== chartToDelete.id);
      
      // Save layout after removal to API
      try {
        await layoutService.saveLayout(updatedItems);
        console.log(`Successfully deleted chart: "${chartName}" and saved to API`);
        
        // Update local items array to reflect the API state
        setItems(updatedItems);
        console.log('Local items array updated after deletion');
      } catch (error) {
        console.error('Error saving layout after chart deletion:', error);
      }
      return true; // Chart found and deleted
    } else {
      console.log(`Chart with name "${chartName}" not found`);
      return false; // Chart not found
    }
  };

  // Update chart by name (for chatbot integration)
  const updateChartByName = async (chartConfig) => {
    console.log(`Updating chart with name: "${chartConfig.plotName}"`);
    
    // Fetch current charts from API
    let currentCharts = [];
    try {
      const response = await apiService.getExistingCharts();
      if (response) {
        // Parse the slash-separated string back to array
        const chartTitles = response.split('/').filter(title => title.trim());
        console.log('Fetched chart titles from API:', chartTitles);
        
        // Get full layout data
        const layoutResponse = await fetch('http://localhost:4000/api/layout');
        if (layoutResponse.ok) {
          const layoutData = await layoutResponse.json();
          if (layoutData.success && layoutData.layout) {
            currentCharts = layoutData.layout;
            console.log('Fetched full layout from API:', currentCharts);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching charts from API:', error);
      // Fallback to local items
      currentCharts = items;
    }
    
    console.log(`Available charts:`, currentCharts.map(item => ({ 
      id: item.id, 
      title: item.config?.title, 
      type: item.type 
    })));
    
    // Normalize names for comparison (lowercase, replace spaces with underscores)
    const normalizeName = (name) => name.toLowerCase().replace(/\s+/g, '_');
    const normalizedPlotName = normalizeName(chartConfig.plotName);
    console.log(`Normalized plot name: "${normalizedPlotName}"`);
    console.log(`Available normalized chart names:`, currentCharts.map(item => 
      item.config?.title ? normalizeName(item.config.title) : 'no title'
    ));
    
    // Find the chart by name using normalized comparison
    const chartToUpdate = currentCharts.find(item => 
      item.config && item.config.title && 
      normalizeName(item.config.title) === normalizedPlotName
    );
    
    if (chartToUpdate) {
      console.log(`Found chart to update:`, chartToUpdate);
      
      // Start with existing chart configuration (preserve all existing values)
      const updatedChart = {
        ...chartToUpdate,
        config: {
          ...chartToUpdate.config
        }
      };
      
      console.log('Original chart config:', {
        type: chartToUpdate.type,
        xField: chartToUpdate.config.xField,
        yField: chartToUpdate.config.yField,
        height: chartToUpdate.config.height,
        title: chartToUpdate.config.title
      });
      
      console.log('Update request fields:', {
        plotType: chartConfig.plotType,
        xAxis: chartConfig.xAxis,
        yAxis: chartConfig.yAxis,
        size: chartConfig.size
      });
      
      // Only update fields that are provided in the chartConfig (preserve others)
      if (chartConfig.plotType) {
        updatedChart.type = chartConfig.plotType;
        console.log(`✅ Updating chart type: ${chartToUpdate.type} → ${chartConfig.plotType}`);
      } else {
        console.log(`⏭️ Preserving chart type: ${chartToUpdate.type}`);
      }
      
      if (chartConfig.xAxis) {
        updatedChart.config.xField = chartConfig.xAxis;
        console.log(`✅ Updating xField: ${chartToUpdate.config.xField} → ${chartConfig.xAxis}`);
      } else {
        console.log(`⏭️ Preserving xField: ${chartToUpdate.config.xField}`);
      }
      
      if (chartConfig.yAxis) {
        updatedChart.config.yField = chartConfig.yAxis;
        console.log(`✅ Updating yField: ${chartToUpdate.config.yField} → ${chartConfig.yAxis}`);
      } else {
        console.log(`⏭️ Preserving yField: ${chartToUpdate.config.yField}`);
      }
      
      if (chartConfig.size) {
        const newHeight = chartConfig.size === 'small' ? 300 : chartConfig.size === 'large' ? 400 : 350;
        updatedChart.config.height = newHeight;
        console.log(`✅ Updating chart size: ${chartToUpdate.config.height} → ${newHeight} (${chartConfig.size})`);
      } else {
        console.log(`⏭️ Preserving chart height: ${chartToUpdate.config.height}`);
      }
      
      console.log('Final updated chart config:', {
        type: updatedChart.type,
        xField: updatedChart.config.xField,
        yField: updatedChart.config.yField,
        height: updatedChart.config.height,
        title: updatedChart.config.title
      });
      
      // Update the items array (both local state and API)
      const updatedItems = currentCharts.map(item => 
        item.id === chartToUpdate.id ? updatedChart : item
      );
      
      // Save the updated layout to the API
      try {
        await layoutService.saveLayout(updatedItems);
        console.log('Updated layout saved to API');
        
        // Update local items array to reflect the API state
        setItems(updatedItems);
        console.log('Local items array updated with API data');
      } catch (error) {
        console.error('Error saving updated layout to API:', error);
      }
      
      // Fetch new data for the updated chart only if xAxis or yAxis changed
      const needsDataRefresh = chartConfig.xAxis || chartConfig.yAxis || chartConfig.yAxes;
      if (needsDataRefresh && updatedChart.config.xField && (updatedChart.config.yField || updatedChart.config.yFields)) {
        try {
          const { xField, yField, yFields, type } = updatedChart.config;
          const isMultiValue = yFields && yFields.length > 1;
          const data = isMultiValue ? 
            await fetchMultiValueChartData(xField, yFields, type, {}) :
            await fetchChartData(xField, yField, type, {});
          setChartData(prev => ({
            ...prev,
            [chartToUpdate.id]: data
          }));
          console.log(`Fetched new data for updated chart:`, data.data ? data.data.length : data.length, 'records');
        } catch (error) {
          console.error('Error fetching data for updated chart:', error);
        }
      }
      
      // Save layout after update
      if (mode === 'design') {
        try {
          await layoutService.saveLayout(updatedItems);
          console.log(`Successfully updated chart: "${chartConfig.plotName}"`);
        } catch (error) {
          console.error('Error saving layout after chart update:', error);
        }
      }
      return true; // Chart found and updated
    } else {
      console.log(`Chart with name "${chartConfig.plotName}" not found`);
      return false; // Chart not found
    }
  };


  const renderChart = (item, isFullscreen = false) => {
    const ChartComponent = chartComponentMap[item.type];
    const { xField, yField, yFields, title, height } = item.config;
    
        if (!ChartComponent) {
          // Render widget components
          const data = mockData[item.type];
          return (
            <div className="flex items-center justify-center h-48 bg-slate-50 dark:bg-slate-700 rounded">
              <div className="text-center text-slate-500 dark:text-slate-400">
                <FontAwesomeIcon icon={iconMap[item.type]} className="text-4xl mb-2 block" />
                <p className="text-sm font-medium">{data?.value}</p>
                <p className="text-xs">{data?.subtitle}</p>
              </div>
            </div>
          );
        }

    if (!xField || (!yField && !yFields)) {
      return (
        <div className="flex items-center justify-center h-48 bg-slate-50 dark:bg-slate-700 rounded">
          <div className="text-center text-slate-500 dark:text-slate-400">
            <FontAwesomeIcon icon={iconMap[item.type]} className="text-4xl mb-2 block" />
            <p className="text-sm">Configure variables to see chart</p>
          </div>
        </div>
      );
    }

    // Get data from chartData state
    const chartDataItem = chartData[item.id] || { data: [], isMultiValue: false, yAxes: [] };
    const data = chartDataItem.data || [];
    const isMultiValue = chartDataItem.isMultiValue || false;
    const yAxes = chartDataItem.yAxes || [];
    
    if (loading) {
      return (
        <div className="flex items-center justify-center h-48 bg-slate-50 dark:bg-slate-700 rounded">
          <div className="text-center text-slate-500 dark:text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm">Loading data...</p>
          </div>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 bg-slate-50 dark:bg-slate-700 rounded">
          <div className="text-center text-slate-500 dark:text-slate-400">
            <FontAwesomeIcon icon={iconMap[item.type]} className="text-4xl mb-2 block" />
            <p className="text-sm">No data available</p>
          </div>
        </div>
      );
    }

    // Determine if this is a multi-value chart
    const hasMultipleYFields = isMultiValue || (yFields && yFields.length > 1);
    const currentYFields = yFields || yAxes;

    // console.log('📊 DashboardCanvas - renderChart for item:', {
    //   itemId: item.id,
    //   itemType: item.type,
    //   xField,
    //   yField,
    //   yFields,
    //   isMultiValue,
    //   yAxes,
    //   hasMultipleYFields,
    //   currentYFields,
    //   dataLength: data.length,
    //   firstDataItem: data[0]
    // });

    const chartProps = {
      data: data,
      xField: 'x_value',
      yField: hasMultipleYFields ? null : 'y_value',
      xFieldLabel: xField,  // Use actual field name for axis label
      yFieldLabel: hasMultipleYFields ? null : yField,  // Use actual field name for axis label
      title: title,
      height: isFullscreen && item.type === 'pie' ? '70vh' : height,
      // Multi-value support
      isMultiValue: hasMultipleYFields,
      yFields: hasMultipleYFields ? currentYFields : null,
      seriesLabels: hasMultipleYFields ? currentYFields : null,
      // Aggregation for bar charts
      ...(item.type === 'bar' && {
        aggregation: item.config.aggregation || 'sum'
      }),
      ...(item.type === 'pie' && {
        labelField: 'x_value',
        valueField: 'y_value',
        labelFieldLabel: xField,  // Use actual field name for pie chart labels
        valueFieldLabel: yField   // Use actual field name for pie chart values
      })
    };

    // console.log('📊 DashboardCanvas - chartProps:', chartProps);

    return <ChartComponent {...chartProps} />;
  };

  const renderItem = (item) => {
    const icon = iconMap[item.type];
    const data = mockData[item.type];
    
    return (
      <div
        key={item.id}
        className={`chart-item bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col ${
          mode === "design" ? "cursor-move hover:shadow-lg" : "cursor-pointer hover:shadow-lg"
        } ${editingItem === item.id ? "ring-2 ring-blue-500 dark:ring-blue-400" : ""}`}
        style={{
          minHeight: getDynamicHeight(),
          height: '100%',
          position: 'relative',
        }}
        onClick={() => mode === "view" && setFullscreenItem(item)}
      >
        {/* Chart Header */}
            <div className="flex items-center justify-between p-1.5 bg-slate-50 dark:bg-slate-700 border-b  border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-2 ">
                <FontAwesomeIcon icon={icon} className="text-lg text-slate-600 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.config.title || data?.value}</span>
              </div>
          {mode === "design" && (
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent event bubbling
                  const newEditingItem = editingItem === item.id ? null : item.id;
                  console.log('Edit button clicked:', { 
                    current: editingItem, 
                    new: newEditingItem, 
                    itemId: item.id,
                    item: item,
                    items: items.length
                  });
                  setEditingItem(newEditingItem);
                  console.log('setEditingItem called with:', newEditingItem);
                }}
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                title="Configure"
              >
                <FontAwesomeIcon icon={faCog} className="w-4 h-4" />
              </button>
              <button
                onClick={() => removeItem(item.id)}
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                title="Remove"
              >
                <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Chart Content */}
        <div className="p-0.5 flex-1 flex flex-col">
          <div className="flex-1">
            {renderChart(item)}
          </div>
        </div>

      </div>
    );
  };

  // Get the current item being edited for the modal
  const getEditingItemData = () => {
    return items.find(item => item.id === editingItem);
  };

  const renderEditModal = () => {
    const item = getEditingItemData();
    console.log('renderEditModal called:', { editingItem, item });
    if (!item) {
      console.log('No item found for editing, returning null');
      return null;
    }

    return (
      <div 
        className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 animate-fadeIn"
        style={{ zIndex: 9999 }}
      >
        <div 
          className="bg-white dark:bg-slate-800 rounded-lg shadow-lg w-full max-w-md animate-slideUp transform transition-all duration-300 ease-out border border-slate-200 dark:border-slate-700"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-md">
                <FontAwesomeIcon icon={faCog} className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Chart Configuration</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">Customize your chart settings</p>
              </div>
            </div>
            <button
              onClick={() => {
                console.log('Close button clicked');
                setEditingItem(null);
              }}
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-md transition-all duration-200"
              title="Close Configuration"
            >
              <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="space-y-1">
              <label className="flex text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 items-center">
                <FontAwesomeIcon icon={faChartBar} className="w-4 h-4 mr-2 text-primary" />
                Chart Title
              </label>
              <input
                type="text"
                value={item.config.title || ''}
                onChange={(e) => {
                  console.log('Title changed:', e.target.value);
                  handleItemConfig(item.id, { title: e.target.value });
                }}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all duration-200"
                placeholder="Enter a descriptive title for your chart"
              />
            </div>

            {item.type === 'pie' ? (
              <div className="space-y-1">
                <label className="flex text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 items-center">
                  <FontAwesomeIcon icon={faChartPie} className="w-4 h-4 mr-2 text-primary" />
                  Data Field
                </label>
                <select
                  value={item.config.yField || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    console.log('Pie chart field changed:', value);
                    handleItemConfig(item.id, {
                      yField: value,
                      xField: value // For pie charts, x and y are the same field
                    });
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all duration-200"
                >
                  <option value="">Select data field for pie chart</option>
                  {getAvailableFields().map(field => (
                    <option key={field.value} value={field.value}>
                      {field.label} ({field.type})
                    </option>
                  ))}
                </select>
                {item.config.yField && (
                  <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      <FontAwesomeIcon icon={faChartPie} className="w-3 h-3 mr-1" />
                      {getAvailableFields().find(f => f.value === item.config.yField)?.description}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="flex text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 items-center">
                    <FontAwesomeIcon icon={faChartLine} className="w-4 h-4 mr-2 text-primary" />
                    X-Axis Field
                  </label>
                  <select
                    value={item.config.xField || ''}
                    onChange={(e) => {
                      console.log('X-axis field changed:', e.target.value);
                      handleItemConfig(item.id, { xField: e.target.value });
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all duration-200"
                  >
                    <option value="">Select X-axis field</option>
                    {getAvailableFields().map(field => (
                      <option key={field.value} value={field.value}>
                        {field.label} ({field.type})
                      </option>
                    ))}
                  </select>
                  {item.config.xField && (
                    <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600">
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        <FontAwesomeIcon icon={faChartLine} className="w-3 h-3 mr-1" />
                        {getAvailableFields().find(f => f.value === item.config.xField)?.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* X-axis Range Filters */}
                {item.config.xField && (
                  <div className="space-y-1">
                    <label className="flex text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 items-center">
                      <FontAwesomeIcon icon={faChartLine} className="w-4 h-4 mr-2 text-primary" />
                      X-Axis Range
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Min</label>
                        <input
                          type={item.config.xField === 'ScheduledDate' ? 'date' : 'number'}
                          value={item.config.xMin || ''}
                          onChange={(e) => handleItemConfig(item.id, { xMin: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          placeholder={item.config.xField === 'ScheduledDate' ? 'YYYY-MM-DD' : 'Min value'}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Max</label>
                        <input
                          type={item.config.xField === 'ScheduledDate' ? 'date' : 'number'}
                          value={item.config.xMax || ''}
                          onChange={(e) => handleItemConfig(item.id, { xMax: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          placeholder={item.config.xField === 'ScheduledDate' ? 'YYYY-MM-DD' : 'Max value'}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Only data within this range will be shown.</p>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="flex text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 items-center">
                    <FontAwesomeIcon icon={faChartBar} className="w-4 h-4 mr-2 text-primary" />
                    Y-Axis Fields
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    💡 Select any field for Y-axis values
                  </p>
                  
                  {/* Multi-select for Y-axis fields */}
                  <div className="space-y-2">
                    {/* Quick action buttons */}
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allFields = getAvailableYFields().map(f => f.value);
                          console.log('Select all Y-axis fields');
                          handleItemConfig(item.id, { 
                            yFields: allFields,
                            yField: null
                          });
                        }}
                        className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          console.log('Clear all Y-axis fields');
                          handleItemConfig(item.id, { 
                            yFields: [],
                            yField: null
                          });
                        }}
                        className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                    
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-md p-2 bg-slate-50 dark:bg-slate-700">
                  {getAvailableYFields().map(field => {
                        const isSelected = item.config.yFields?.includes(field.value) || 
                                         (item.config.yField === field.value && !item.config.yFields);
                        return (
                          <label key={field.value} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const currentYFields = item.config.yFields || (item.config.yField ? [item.config.yField] : []);
                                let newYFields;
                                
                                if (e.target.checked) {
                                  // Add field to selection
                                  newYFields = [...currentYFields, field.value];
                                } else {
                                  // Remove field from selection
                                  newYFields = currentYFields.filter(f => f !== field.value);
                                }
                                
                                console.log('Y-axis fields changed:', newYFields);
                                handleItemConfig(item.id, { 
                                  yFields: newYFields,
                                  yField: newYFields.length === 1 ? newYFields[0] : null // Keep single yField for backward compatibility
                                });
                              }}
                              className="rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            <span className="text-slate-700 dark:text-slate-300">
                              {field.label} <span className="text-slate-500 dark:text-slate-400">({field.type})</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    
                    {/* Aggregation selector for bar charts */}
                    {item.type === 'bar' && (
                      <div className="space-y-1 mt-4">
                        <label className="flex text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 items-center">
                          <FontAwesomeIcon icon={faChartBar} className="w-4 h-4 mr-2 text-primary" />
                          Aggregation
                        </label>
                        <select
                          value={item.config.aggregation || 'sum'}
                          onChange={(e) => {
                            console.log('Aggregation changed:', e.target.value);
                            handleItemConfig(item.id, { aggregation: e.target.value });
                          }}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all duration-200"
                        >
                          <option value="sum">Sum</option>
                          <option value="avg">Average</option>
                          <option value="count">Count</option>
                          <option value="max">Maximum</option>
                          <option value="min">Minimum</option>
                        </select>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          How to aggregate values when multiple data points share the same X-axis category
                        </p>
                      </div>
                    )}
                    
                    {/* Selected fields display */}
                    {(item.config.yFields?.length > 0 || item.config.yField) && (
                      <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                          <FontAwesomeIcon icon={faChartBar} className="w-3 h-3 mr-1" />
                          Selected Y-axis fields:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {(item.config.yFields || (item.config.yField ? [item.config.yField] : [])).map(fieldValue => {
                            const field = getAvailableYFields().find(f => f.value === fieldValue);
                            return (
                              <span key={fieldValue} className="inline-flex items-center px-2 py-1 text-xs bg-primary/10 text-primary rounded-md">
                                {field?.label}
                              </span>
                            );
                          })}
                        </div>
                        {(item.config.yFields?.length > 1 || (item.config.yFields?.length > 0 && item.config.yFields?.length > 1)) && (
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                            💡 Multiple fields will be displayed with different colors
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}


            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-600">
              <button
                onClick={async () => {
                  console.log('Save Changes button clicked');
                  
                  // Fetch new chart data if fields are configured
                  const { xField, yField, yFields, type } = item.config;
                  const isPieChartReady = type === 'pie' && yField;
                  const isOtherChartReady = type !== 'pie' && xField && (yField || yFields);
                  
                  if (isPieChartReady || isOtherChartReady) {
                    try {
                      console.log(`Fetching updated data for ${item.id}: xField=${xField}, yField=${yField}, yFields=${yFields}, type=${type}`);
                      const isMultiValue = yFields && yFields.length > 1;
                      const filters = { 
                        xMin: item.config.xMin, 
                        xMax: item.config.xMax,
                        ...(dateTimeColumn && dateFrom ? { dateFrom } : {}),
                        ...(dateTimeColumn && dateTo ? { dateTo } : {})
                      };
                      const data = isMultiValue ? 
                        await apiService.getMultiValueChartData(xField, yFields, type, null, filters, selectedTable) :
                        await apiService.getChartData(xField, yField, type, null, filters, selectedTable);
                      setChartData(prev => ({
                        ...prev,
                        [item.id]: data
                      }));
                      console.log(`✅ Updated chart data: ${data.data ? data.data.length : data.length} records`);
                    } catch (error) {
                      console.error('❌ Error fetching updated chart data:', error);
                    }
                  }
                  
                  setEditingItem(null);
                }}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-all duration-200 hover:shadow-md font-medium flex items-center space-x-2"
              >
                <FontAwesomeIcon icon={faBolt} className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="flex-1 bg-dashboard-bg overflow-auto min-h-0 pb-8">
      {/* Table Selector and Date Range Filter */}
      {tables.length > 0 && (
        <div className="sticky top-0 z-10 bg-dashboard-surface border-b border-slate-200 dark:border-slate-700 px-4 py-2">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-foreground">Table:</label>
              <select
                value={selectedTable || ''}
                onChange={(e) => {
                  setSelectedTable(e.target.value);
                  // Clear chart data and date filters when table changes
                  setChartData({});
                  setDateFrom('');
                  setDateTo('');
                }}
                className="px-3 py-1.5 bg-background border border-slate-300 dark:border-slate-600 rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {tables.map(table => (
                  <option key={table} value={table}>{table}</option>
                ))}
              </select>
              <span className="text-xs text-muted-foreground">
                ({availableColumns.length} columns)
              </span>
            </div>
            
            {/* Date Range Filter - only show if view has dateTime column */}
            {dateTimeColumn && (
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-foreground">
                  Date Range ({dateTimeColumn}):
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    // Chart refresh will be handled by useEffect
                  }}
                  className="px-3 py-1.5 bg-background border border-slate-300 dark:border-slate-600 rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="From Date"
                />
                <span className="text-muted-foreground">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    // Chart refresh will be handled by useEffect
                  }}
                  className="px-3 py-1.5 bg-background border border-slate-300 dark:border-slate-600 rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="To Date"
                />
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                      // Chart refresh will be handled by useEffect
                    }}
                    className="px-2 py-1 text-xs bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                    title="Clear date filter"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div
        className={`w-full relative transition-smooth ${
          dragOver ? "bg-primary/5 border-2 border-dashed border-primary" : ""
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          ...getGridLayout(),
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      >
        {items.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center pt-32">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
                <svg className="w-10 h-10 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Start Building Your Dashboard
              </h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop components from the sidebar to create your perfect dashboard
              </p>
              <span className="px-3 py-1 bg-gradient-primary text-primary-foreground text-sm font-medium rounded-full">
                {mode === "design" ? "Design Mode" : "View Mode"}
              </span>
            </div>
          </div>
        ) : (
          <>
            {items.map(renderItem)}
            {dragOver && (
              <div className=" bg-primary/10 flex items-center justify-center pointer-events-none">
                <div className="bg-dashboard-surface rounded-lg p-6 shadow-lg border border-primary">
                  <svg className="w-8 h-8 text-primary mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-sm font-medium text-foreground">Drop component here</p>
                </div>
              </div>
            )}
           
          </>
        )}
      </div>

      {/* Fullscreen Overlay */}
      {fullscreenItem && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full h-full max-w-7xl max-h-5xl flex flex-col">
            {/* Fullscreen Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={iconMap[fullscreenItem.type]} className="text-2xl text-slate-600 dark:text-slate-400" />
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {fullscreenItem.config.title || mockData[fullscreenItem.type]?.value}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {mockData[fullscreenItem.type]?.subtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFullscreenItem(null)}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Close Fullscreen"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Fullscreen Chart Content */}
            <div className="flex-1 p-6 overflow-hidden flex items-center justify-center">
              <div className="w-full h-full flex items-center justify-center">
                {fullscreenItem.type === 'pie' ? (
                  <div className="w-full h-full max-w-4xl max-h-4xl flex items-center justify-center p-8">
                    <div className="w-full h-full flex items-center justify-center">
                      {renderChart(fullscreenItem, true)}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full">
                    {renderChart(fullscreenItem, true)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <>
          {console.log('Rendering edit modal for:', editingItem)}
          {renderEditModal()}
        </>
      )}
    </main>
  );
});

export default DashboardCanvas;