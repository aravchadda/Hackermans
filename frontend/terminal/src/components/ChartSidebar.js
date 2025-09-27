import React, { useState } from 'react';
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
  faSearch,
  faChartArea,
  faChartColumn,
  faFire
} from '@fortawesome/free-solid-svg-icons';

const chartTypes = [
  { id: "bar", name: "Bar Chart", icon: faChartBar, category: "Charts", description: "Compare values across categories" },
  { id: "line", name: "Line Chart", icon: faChartLine, category: "Charts", description: "Show trends over time" },
  { id: "pie", name: "Pie Chart", icon: faChartPie, category: "Charts", description: "Display parts of a whole" },
  { id: "scatter", name: "Scatter Plot", icon: faCircle, category: "Charts", description: "Show relationships between two variables" },
  { id: "area", name: "Area Chart", icon: faChartArea, category: "Charts", description: "Show trends with filled areas" },
  { id: "histogram", name: "Histogram", icon: faChartColumn, category: "Charts", description: "Show data distribution" },
  { id: "heatmap", name: "Heatmap", icon: faFire, category: "Charts", description: "Show data intensity with colors" },
  { id: "activity", name: "Activity Feed", icon: faBolt, category: "Widgets", description: "Real-time activity updates" },
  { id: "kpi", name: "KPI Card", icon: faBullseye, category: "Widgets", description: "Key performance indicators" },
  { id: "users", name: "User Stats", icon: faUsers, category: "Widgets", description: "User engagement metrics" },
  { id: "revenue", name: "Revenue Card", icon: faDollarSign, category: "Widgets", description: "Financial performance data" },
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
    <aside className="w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col shadow-lg">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Components</h2>
        <div className="relative">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 w-4 h-4" />
          <input
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 h-9 text-sm border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">{category}</h3>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-full">
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
                    className={`p-3 cursor-grab transition-all duration-200 hover:shadow-md hover:scale-105 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 group rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 ${
                      draggedItem === chart.id ? "opacity-50 scale-95" : ""
                    }`}
                    title={chart.description}
                  >
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:shadow-lg transition-all duration-200">
                        <FontAwesomeIcon icon={chart.icon} className="text-primary-foreground text-sm" />
                      </div>
                      <span className="text-xs font-medium text-slate-900 dark:text-slate-100 leading-tight">
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
