import React, { useState } from 'react';
import { BarChart, LineChart, PieChart, ScatterChart } from '../charts';
import { apiService } from '../services/api';
import { shipmentFields } from '../sampleData';
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

const DashboardCanvas = ({ mode }) => {
  const [items, setItems] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [fullscreenItem, setFullscreenItem] = useState(null);
  const [chartData, setChartData] = useState({});
  const [loading, setLoading] = useState(false);
  const [rangeFilters, setRangeFilters] = useState({});

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
    setItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              config: { ...item.config, ...config },
              // Update item height when config height changes
              ...(config.height && { height: config.height })
            }
          : item
      )
    );
    
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


  const handleDrop = (e) => {
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

    setItems([...items, newItem]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
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
      title: title,
      height: height,
      ...(item.type === 'pie' && {
        labelField: 'x_value',
        valueField: 'y_value'
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
                      const filters = rangeFilters[item.id] || {};
                      const data = await fetchChartData(item.config.xField, item.config.yField, item.type, filters);
                      setChartData(prev => ({
                        ...prev,
                        [item.id]: data
                      }));
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
