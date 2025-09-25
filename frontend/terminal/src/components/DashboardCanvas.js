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

  // Get available fields for configuration
  const getAvailableFields = () => {
    return sampleFields.map(field => ({
      value: field.name,
      label: field.name.charAt(0).toUpperCase() + field.name.slice(1)
    }));
  };

  // Handle chart configuration updates
  const handleItemConfig = (itemId, config) => {
    setItems(items.map(item => 
      item.id === itemId 
        ? { ...item, config: { ...item.config, ...config } }
        : item
    ));
  };

  // Calculate next available position to avoid overlaps
  const getNextPosition = () => {
    const gridSize = 320; // Width + margin
    const rowHeight = 220; // Height + margin
    const cols = Math.floor(1200 / gridSize); // Approximate columns based on container width
    
    const row = Math.floor(items.length / cols);
    const col = items.length % cols;
    
    return {
      x: col * gridSize + 20, // 20px margin from left
      y: row * rowHeight + 20  // 20px margin from top
    };
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const chartType = e.dataTransfer.getData("text/plain");
    const position = getNextPosition();

    const newItem = {
      id: `${chartType}-${Date.now()}`,
      type: chartType,
      x: position.x,
      y: position.y,
      width: 300,
      height: 200,
      config: {
        title: mockData[chartType]?.value || 'New Chart',
        xField: '',
        yField: '',
        height: 200,
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
    const updatedItems = items.filter(item => item.id !== id);
    // Reorganize remaining items to maintain grid layout
    const reorganizedItems = updatedItems.map((item, index) => {
      const position = getNextPositionForIndex(index);
      return {
        ...item,
        x: position.x,
        y: position.y
      };
    });
    setItems(reorganizedItems);
  };

  // Calculate position for a specific index
  const getNextPositionForIndex = (index) => {
    const gridSize = 320; // Width + margin
    const rowHeight = 220; // Height + margin
    const cols = Math.floor(1200 / gridSize); // Approximate columns based on container width
    
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    return {
      x: col * gridSize + 20, // 20px margin from left
      y: row * rowHeight + 20  // 20px margin from top
    };
  };

  const renderChart = (item) => {
    const ChartComponent = chartComponentMap[item.type];
    const { xField, yField, title, height } = item.config;
    
    if (!ChartComponent) {
      // Render widget components
      const data = mockData[item.type];
      return (
        <div className="flex-1 bg-gradient-accent rounded-md flex items-center justify-center">
          <div className="text-center">
            <span className="text-3xl mb-2 opacity-40">{iconMap[item.type]}</span>
            <p className="text-xs text-muted-foreground">{data?.value}</p>
            <p className="text-xs text-muted-foreground">{data?.subtitle}</p>
          </div>
        </div>
      );
    }

    if (!xField || !yField) {
      return (
        <div className="flex-1 bg-gradient-accent rounded-md flex items-center justify-center">
          <div className="text-center">
            <span className="text-3xl mb-2 opacity-40">{iconMap[item.type]}</span>
            <p className="text-xs text-muted-foreground">Configure variables</p>
          </div>
        </div>
      );
    }

    const chartProps = {
      data: sampleDataSource,
      xField: xField,
      yField: yField,
      title: title,
      height: height || 200,
      ...(item.type === 'pie' && {
        labelField: item.config.labelField || xField,
        valueField: item.config.valueField || yField
      })
    };

    return (
      <div className="flex-1 bg-gradient-accent rounded-md p-2">
        <ChartComponent {...chartProps} />
      </div>
    );
  };

  const renderItem = (item) => {
    const icon = iconMap[item.type];
    const data = mockData[item.type];
    
    return (
      <div
        key={item.id}
        className={`absolute bg-dashboard-surface border border-dashboard-border shadow-md transition-smooth rounded-lg ${
          mode === "design" ? "cursor-move hover:shadow-lg" : ""
        }`}
        style={{
          left: item.x,
          top: item.y,
          width: item.width,
          height: item.height,
        }}
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground text-xs">{icon}</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">{item.config.title || data?.value}</h3>
                <p className="text-xs text-muted-foreground">{data?.subtitle}</p>
              </div>
            </div>
            {mode === "design" && (
              <div className="flex gap-1">
                <button 
                  onClick={() => setEditingItem(editingItem === item.id ? null : item.id)}
                  className="h-6 w-6 p-0 opacity-60 hover:opacity-100 flex items-center justify-center rounded hover:bg-muted transition-smooth"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  className="h-6 w-6 p-0 opacity-60 hover:opacity-100 hover:text-destructive flex items-center justify-center rounded hover:bg-muted transition-smooth"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          
          {renderChart(item)}
          
          {/* Configuration Panel */}
          {editingItem === item.id && mode === "design" && (
            <div className="border-t border-dashboard-border p-3 bg-muted/50">
              <h4 className="text-xs font-medium text-foreground mb-2">Chart Configuration</h4>
              
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
                  <input
                    type="text"
                    value={item.config.title}
                    onChange={(e) => handleItemConfig(item.id, { title: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring bg-background text-foreground"
                  />
                </div>

                {chartComponentMap[item.type] && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">X-Axis Field</label>
                      <select
                        value={item.config.xField}
                        onChange={(e) => handleItemConfig(item.id, { xField: e.target.value })}
                        className="w-full px-2 py-1 text-xs border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring bg-background text-foreground"
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
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Y-Axis Field</label>
                      <select
                        value={item.config.yField}
                        onChange={(e) => handleItemConfig(item.id, { yField: e.target.value })}
                        className="w-full px-2 py-1 text-xs border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring bg-background text-foreground"
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
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Height (px)</label>
                      <input
                        type="number"
                        value={item.config.height}
                        onChange={(e) => handleItemConfig(item.id, { height: parseInt(e.target.value) || 200 })}
                        className="w-full px-2 py-1 text-xs border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring bg-background text-foreground"
                        min="150"
                        max="400"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="flex-1 bg-dashboard-bg overflow-hidden">
      <div
        className={`h-full w-full relative transition-smooth ${
          dragOver ? "bg-primary/5 border-2 border-dashed border-primary" : ""
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
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
            {/* Show next position indicator in design mode */}
            {mode === "design" && (
              <div
                className="absolute border-2 border-dashed border-primary/50 bg-primary/5 rounded-lg flex items-center justify-center"
                style={{
                  left: getNextPosition().x,
                  top: getNextPosition().y,
                  width: 300,
                  height: 200,
                }}
              >
                <div className="text-center text-primary/70">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-xs font-medium">Next position</p>
                </div>
              </div>
            )}
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
    </main>
  );
};

export default DashboardCanvas;
