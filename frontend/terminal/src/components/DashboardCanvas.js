import React, { useState, useEffect } from 'react';
import { BarChart, LineChart, PieChart, ScatterChart } from '../charts';
import { apiService } from '../services/api';
import { shipmentFields } from '../sampleData';
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
  faTrash
} from '@fortawesome/free-solid-svg-icons';

const iconMap = {
  bar: faChartBar,
  line: faChartLine, 
  pie: faChartPie,
  scatter: faCircle,
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

const DashboardCanvas = ({ mode, onCreateChart, onDeleteChart, onUpdateChart }) => {
  const [items, setItems] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [fullscreenItem, setFullscreenItem] = useState(null);
  const [chartData, setChartData] = useState({});
  const [loading, setLoading] = useState(false);
  const [rangeFilters, setRangeFilters] = useState({});

  // Debug: Log when items array changes
  useEffect(() => {
    console.log('DashboardCanvas: Items array updated:', items.length, 'items');
    console.log('DashboardCanvas: Items content:', items);
  }, [items]);

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
        const { xField, yField, type } = chartConfig.config;
        if (xField && yField) {
          fetchChartData(xField, yField, type, {})
            .then(data => {
              setChartData(prev => ({
                ...prev,
                [chartConfig.id]: data
              }));
              console.log(`✅ Fetched data for new chart: ${data.length} records`);
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

  // Load saved layout on component mount
  useEffect(() => {
    const loadLayout = async () => {
      try {
        console.log('DashboardCanvas: Loading layout from API...');
        
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
            const { xField, yField, type } = item.config;
            
            // Check if chart has required fields configured
            const isPieChartReady = type === 'pie' && yField;
            const isOtherChartReady = type !== 'pie' && xField && yField;
            
            if (isPieChartReady || isOtherChartReady) {
              try {
                console.log(`Fetching data for ${item.id}: xField=${xField}, yField=${yField}, type=${type}`);
                const data = await fetchChartData(xField, yField, type, {});
                setChartData(prev => ({
                  ...prev,
                  [item.id]: data
                }));
                console.log(`✅ Fetched data for ${item.id}:`, data.length, 'records');
              } catch (error) {
                console.error(`❌ Error fetching data for ${item.id}:`, error);
              }
            } else {
              console.log(`⏭️ Skipping ${item.id}: missing required fields (xField=${xField}, yField=${yField})`);
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
              const { xField, yField, type } = item.config;
              
              // Check if chart has required fields configured
              const isPieChartReady = type === 'pie' && yField;
              const isOtherChartReady = type !== 'pie' && xField && yField;
              
              if (isPieChartReady || isOtherChartReady) {
                try {
                  console.log(`Fetching data for ${item.id}: xField=${xField}, yField=${yField}, type=${type}`);
                  const data = await fetchChartData(xField, yField, type, {});
                  setChartData(prev => ({
                    ...prev,
                    [item.id]: data
                  }));
                  console.log(`✅ Fetched data for ${item.id}:`, data.length, 'records');
                } catch (error) {
                  console.error(`❌ Error fetching data for ${item.id}:`, error);
                }
              } else {
                console.log(`⏭️ Skipping ${item.id}: missing required fields (xField=${xField}, yField=${yField})`);
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
  }, []);

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

  // Use shipment fields directly from frontend
  const availableColumns = shipmentFields;


  // Fetch chart data from backend
  const fetchChartData = async (xAxis, yAxis, chartType, filters = {}) => {
    try {
      setLoading(true);
      const data = await apiService.getChartData(xAxis, yAxis, chartType, 1000, filters);
      return data;
    } catch (error) {
      console.error('Error fetching chart data:', error);
      return [];
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



  // Simple height calculation - no complex logic
  const getDynamicHeight = () => {
    const baseHeight = 200;
    const minHeight = 150;
    
    // Simple adjustment based on number of items
    if (items.length <= 2) return Math.max(minHeight, baseHeight + 50);
    if (items.length <= 4) return baseHeight;
    if (items.length <= 6) return Math.max(minHeight, baseHeight - 20);
    return Math.max(minHeight, baseHeight - 40);
  };

  // Grid-based layout with resizable items
  const getGridLayout = () => {
    return {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gridAutoRows: 'minmax(200px, auto)',
      gap: '20px',
      padding: '20px',
      paddingBottom: '100px',
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
        const newHeight = chartConfig.size === 'small' ? 200 : chartConfig.size === 'large' ? 400 : 300;
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
      const needsDataRefresh = chartConfig.xAxis || chartConfig.yAxis;
      if (needsDataRefresh && updatedChart.config.xField && updatedChart.config.yField) {
        try {
          const data = await fetchChartData(updatedChart.config.xField, updatedChart.config.yField, updatedChart.type, {});
          setChartData(prev => ({
            ...prev,
            [chartToUpdate.id]: data
          }));
          console.log(`Fetched new data for updated chart:`, data.length, 'records');
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


  const renderChart = (item) => {
    const ChartComponent = chartComponentMap[item.type];
    const { xField, yField, title, height } = item.config;
    
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

    if (!xField || !yField) {
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
    const data = chartData[item.id] || [];
    
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

    const chartProps = {
      data: data,
      xField: 'x_value',
      yField: 'y_value',
      xFieldLabel: xField,  // Use actual field name for axis label
      yFieldLabel: yField,  // Use actual field name for axis label
      title: title,
      height: height,
      ...(item.type === 'pie' && {
        labelField: 'x_value',
        valueField: 'y_value',
        labelFieldLabel: xField,  // Use actual field name for pie chart labels
        valueFieldLabel: yField   // Use actual field name for pie chart values
      })
    };

    return <ChartComponent {...chartProps} />;
  };

  const renderItem = (item) => {
    const icon = iconMap[item.type];
    const data = mockData[item.type];
    
    return (
      <div
        key={item.id}
        className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col ${
          mode === "design" ? "cursor-move hover:shadow-lg" : "cursor-pointer hover:shadow-lg"
        }`}
        style={{
          minHeight: getDynamicHeight(),
        }}
        onClick={() => mode === "view" && setFullscreenItem(item)}
      >
        {/* Chart Header */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 border-b  border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-2 ">
                <FontAwesomeIcon icon={icon} className="text-lg text-slate-600 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.config.title || data?.value}</span>
              </div>
          {mode === "design" && (
            <div className="flex gap-1">
              <button
                onClick={() => setEditingItem(editingItem === item.id ? null : item.id)}
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
        <div className="p-4 flex-1">
          {renderChart(item)}
        </div>

        {/* Configuration Panel */}
        {mode === "design" && editingItem === item.id && (
          <div className="border-t border-slate-200 dark:border-slate-600 p-4    bg-slate-50 dark:bg-slate-700">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">Chart Configuration</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  value={item.config.title}
                  onChange={(e) => handleItemConfig(item.id, { title: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

                  {item.type === 'pie' ? (
                    /* Single field selection for pie charts */
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Data Field</label>
                      <select
                        value={item.config.yField}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleItemConfig(item.id, { 
                            yField: value,
                            xField: value // For pie charts, x and y are the same field
                          });
                        }}
                        className="w-full px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      >
                        <option value="">Select data field</option>
                        {getAvailableFields().map(field => (
                          <option key={field.value} value={field.value}>
                            {field.label} ({field.type})
                          </option>
                        ))}
                      </select>
                      {item.config.yField && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {getAvailableFields().find(f => f.value === item.config.yField)?.description}
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Two field selection for other chart types */
                    <>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">X-Axis Field</label>
                        <select
                          value={item.config.xField}
                          onChange={(e) => handleItemConfig(item.id, { xField: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        >
                          <option value="">Select X-axis field</option>
                          {getAvailableFields().map(field => (
                            <option key={field.value} value={field.value}>
                              {field.label} ({field.type})
                            </option>
                          ))}
                        </select>
                        {item.config.xField && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {getAvailableFields().find(f => f.value === item.config.xField)?.description}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Y-Axis Field</label>
                        <select
                          value={item.config.yField}
                          onChange={(e) => handleItemConfig(item.id, { yField: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        >
                          <option value="">Select Y-axis field</option>
                          {getAvailableFields().map(field => (
                            <option key={field.value} value={field.value}>
                              {field.label} ({field.type})
                            </option>
                          ))}
                        </select>
                        {item.config.yField && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {getAvailableFields().find(f => f.value === item.config.yField)?.description}
                          </p>
                        )}
                      </div>
                    </>
                  )}


              {/* Range Filters */}
              {((item.type === 'pie' && item.config.yField) || (item.type !== 'pie' && item.config.xField && item.config.yField)) && (
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-600">
                  <h5 className="text-sm font-medium text-slate-700 dark:text-slate-200">Range Filters</h5>
                  
                  {item.type === 'pie' ? (
                    /* Single field range for pie charts */
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        {item.config.yField} Range (Value Filter)
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          placeholder="Min"
                          value={rangeFilters[item.id]?.yMin || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                            setRangeFilters(prev => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], yMin: value }
                            }));
                          }}
                          className="w-20 px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                        <span className="text-xs text-slate-500">to</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={rangeFilters[item.id]?.yMax || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                            setRangeFilters(prev => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], yMax: value }
                            }));
                          }}
                          className="w-20 px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Two field ranges for other chart types */
                    <>
                      {/* X-Axis Range */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          {item.config.xField} Range
                        </label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            placeholder="Min"
                            value={rangeFilters[item.id]?.xMin || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                          setRangeFilters(prev => ({
                            ...prev,
                            [item.id]: { ...prev[item.id], xMin: value }
                          }));
                        }}
                            className="w-20 px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          />
                          <span className="text-xs text-slate-500">to</span>
                          <input
                            type="number"
                            placeholder="Max"
                            value={rangeFilters[item.id]?.xMax || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                              setRangeFilters(prev => ({
                                ...prev,
                                [item.id]: { ...prev[item.id], xMax: value }
                              }));
                            }}
                            className="w-20 px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      {/* Y-Axis Range */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          {item.config.yField} Range
                        </label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            placeholder="Min"
                            value={rangeFilters[item.id]?.yMin || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                              setRangeFilters(prev => ({
                                ...prev,
                                [item.id]: { ...prev[item.id], yMin: value }
                              }));
                            }}
                            className="w-20 px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          />
                          <span className="text-xs text-slate-500">to</span>
                          <input
                            type="number"
                            placeholder="Max"
                            value={rangeFilters[item.id]?.yMax || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                              setRangeFilters(prev => ({
                                ...prev,
                                [item.id]: { ...prev[item.id], yMax: value }
                              }));
                            }}
                            className="w-20 px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Fetch Data Button */}
              {((item.type === 'pie' && item.config.yField) || (item.type !== 'pie' && item.config.xField && item.config.yField)) && (
                <div className="pt-2">
                  <button
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const filters = rangeFilters[item.id] || {};
                        const data = await fetchChartData(item.config.xField, item.config.yField, item.type, filters);
                        setChartData(prev => ({
                          ...prev,
                          [item.id]: data
                        }));
                        console.log(`✅ Manually fetched data for ${item.id}:`, data.length, 'records');
                      } catch (error) {
                        console.error(`❌ Error manually fetching data for ${item.id}:`, error);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Fetching...
                      </>
                    ) : (
                      <>
                        📊 Fetch Data
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        
      </div>
     
    );
    
  };

  return (
    <main className="flex-1 bg-dashboard-bg overflow-auto min-h-0 pb-8">
      <div
        className={`w-full transition-smooth ${
          dragOver ? "bg-primary/5 border-2 border-dashed border-primary" : ""
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          ...getGridLayout(),
          backgroundImage: mode === "design" ? `
            linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
          ` : 'none',
          backgroundSize: '20px 20px'
        }}
      >
        {items.length === 0 ? (
          <div className="h-full flex items-center justify-center">
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
              <div className="w-full h-full max-w-4xl max-h-4xl flex items-center justify-center">
                {fullscreenItem.type === 'pie' ? (
                  <div className="w-96 h-96">
                    {renderChart(fullscreenItem)}
                  </div>
                ) : (
                  <div className="w-full h-full">
                    {renderChart(fullscreenItem)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default DashboardCanvas;
