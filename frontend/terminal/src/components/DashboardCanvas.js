import React, { useState } from 'react';
import { BarChart, LineChart, PieChart, ScatterChart } from '../charts';
import { sampleDataSource, sampleFields } from '../sampleData';

const iconMap = {
  bar: "📊",
  line: "📈", 
  pie: "🥧",
  area: "📈",
  activity: "⚡",
  kpi: "🎯",
  users: "👥",
  revenue: "💰",
};

const chartComponentMap = {
  bar: BarChart,
  line: LineChart,
  pie: PieChart,
  area: LineChart, // Use LineChart for area charts
  activity: null, // Widget components
  kpi: null,
  users: null,
  revenue: null,
};

const mockData = {
  bar: { value: "Sales by Month", subtitle: "Last 6 months performance" },
  line: { value: "User Growth", subtitle: "Monthly active users" },
  pie: { value: "Traffic Sources", subtitle: "Website analytics" },
  area: { value: "Revenue Trend", subtitle: "Quarterly revenue" },
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

  // Get available fields for configuration
  const getAvailableFields = () => {
    return sampleFields.map(field => ({
      value: field.name,
      label: field.name.charAt(0).toUpperCase() + field.name.slice(1)
    }));
  };

  // Handle chart configuration updates
  const handleItemConfig = (itemId, config) => {
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

  // Grid-based layout - no need for position calculation
  const getGridLayout = () => {
    return {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px',
      padding: '20px',
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
            <span className="text-4xl mb-2 block">{iconMap[item.type]}</span>
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
            <span className="text-4xl mb-2 block">{iconMap[item.type]}</span>
            <p className="text-sm">Configure variables to see chart</p>
          </div>
        </div>
      );
    }

    const chartProps = {
      data: sampleDataSource,
      xField: xField,
      yField: yField,
      title: title,
      height:height, // Account for header and padding
      ...(item.type === 'pie' && {
        labelField: item.config.labelField || xField,
        valueField: item.config.valueField || yField
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
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
          <div className="flex items-center gap-2 ">
            <span className="text-lg">{icon}</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.config.title || data?.value}</span>
          </div>
          {mode === "design" && (
            <div className="flex gap-1">
              <button
                onClick={() => setEditingItem(editingItem === item.id ? null : item.id)}
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                title="Configure"
              >
                ⚙️
              </button>
              <button
                onClick={() => removeItem(item.id)}
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                title="Remove"
              >
                🗑️
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
          <div className="border-t border-slate-200 dark:border-slate-600 p-4 bg-slate-50 dark:bg-slate-700">
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
                      {field.label}
                    </option>
                  ))}
                </select>
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
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Height (px)</label>
                <input
                  type="number"
                  value={item.config.height}
                  onChange={(e) => handleItemConfig(item.id, { height: parseInt(e.target.value) || 300 })}
                  className="w-full px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  min="200"
                  max="600"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="flex-1 bg-dashboard-bg overflow-auto min-h-0">
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
              <div className="absolute inset-0 bg-primary/10 flex items-center justify-center pointer-events-none">
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
                <span className="text-2xl">{iconMap[fullscreenItem.type]}</span>
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
            <div className="flex-1 p-6 overflow-hidden">
              <div className="w-full h-full">
                {renderChart(fullscreenItem)}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default DashboardCanvas;
