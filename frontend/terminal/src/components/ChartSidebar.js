import React, { useState } from 'react';

const chartTypes = [
  { id: "bar", name: "Bar Chart", icon: "📊", category: "Charts", description: "Compare values across categories" },
  { id: "line", name: "Line Chart", icon: "📈", category: "Charts", description: "Show trends over time" },
  { id: "pie", name: "Pie Chart", icon: "🥧", category: "Charts", description: "Display parts of a whole" },
  { id: "area", name: "Area Chart", icon: "📊", category: "Charts", description: "Show cumulative data over time" },
  { id: "activity", name: "Activity Feed", icon: "⚡", category: "Widgets", description: "Real-time activity updates" },
  { id: "kpi", name: "KPI Card", icon: "🎯", category: "Widgets", description: "Key performance indicators" },
  { id: "users", name: "User Stats", icon: "👥", category: "Widgets", description: "User engagement metrics" },
  { id: "revenue", name: "Revenue Card", icon: "💰", category: "Widgets", description: "Financial performance data" },
];

const ChartSidebar = ({ isVisible }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedItem, setDraggedItem] = useState(null);

  const filteredCharts = chartTypes.filter(chart =>
    chart.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDragStart = (e, chartId) => {
    setDraggedItem(chartId);
    e.dataTransfer.setData("text/plain", chartId);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  if (!isVisible) return null;

  return (
    <aside className="w-80 bg-dashboard-surface border-r border-dashboard-border flex flex-col shadow-lg">
      <div className="p-4 border-b border-dashboard-border">
        <h2 className="text-lg font-semibold text-foreground mb-3">Components</h2>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 h-9 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {["Charts", "Widgets"].map(category => {
          const categoryItems = filteredCharts.filter(chart => chart.category === category);
          if (categoryItems.length === 0) return null;

          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <h3 className="text-sm font-medium text-foreground">{category}</h3>
                <span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-full">
                  {categoryItems.length}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {categoryItems.map((chart) => (
                  <div
                    key={chart.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, chart.id)}
                    onDragEnd={handleDragEnd}
                    className={`p-3 cursor-grab transition-smooth hover:shadow-md hover:scale-105 border border-dashboard-border bg-gradient-surface group rounded-lg ${
                      draggedItem === chart.id ? "opacity-50 scale-95" : ""
                    }`}
                    title={chart.description}
                  >
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center group-hover:shadow-glow transition-smooth">
                        <span className="text-primary-foreground text-sm">{chart.icon}</span>
                      </div>
                      <span className="text-xs font-medium text-foreground leading-tight">
                        {chart.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default ChartSidebar;
