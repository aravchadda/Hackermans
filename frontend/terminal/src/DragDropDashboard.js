import React, { useState, useRef } from 'react';
import { BarChart, LineChart, PieChart, ScatterChart } from './charts';
import { sampleDataSource, sampleFields } from './sampleData';
import { useTheme } from './ThemeContext';

const DragDropDashboard = () => {
    const [dashboardCharts, setDashboardCharts] = useState([]);
    const [draggedItem, setDraggedItem] = useState(null);
    const [editingChart, setEditingChart] = useState(null);
    const dropZoneRef = useRef(null);
    const { isDark } = useTheme();

    // Available chart types for dragging
    const chartTypes = [
        { id: 'bar', name: 'Bar Chart', icon: '📊', component: BarChart },
        { id: 'line', name: 'Line Chart', icon: '📈', component: LineChart },
        { id: 'pie', name: 'Pie Chart', icon: '🥧', component: PieChart },
        { id: 'scatter', name: 'Scatter Plot', icon: '⚪', component: ScatterChart },
    ];

    // Handle drag start
    const handleDragStart = (e, chartType) => {
        setDraggedItem(chartType);
        e.dataTransfer.effectAllowed = 'move';
    };

    // Handle drag over
    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    // Handle drop
    const handleDrop = (e) => {
        e.preventDefault();
        if (draggedItem) {
            const newChart = {
                id: Date.now(),
                type: draggedItem.id,
                name: draggedItem.name,
                icon: draggedItem.icon,
                component: draggedItem.component,
                position: { x: 0, y: 0 },
                size: { width: 1, height: 1 },
                config: {
                    xField: '',
                    yField: '',
                    title: `${draggedItem.name} ${dashboardCharts.length + 1}`,
                    height: 300
                }
            };
            setDashboardCharts(prev => [...prev, newChart]);
            setEditingChart(newChart.id);
            setDraggedItem(null);
        }
    };

    // Handle chart configuration
    const handleChartConfig = (chartId, config) => {
        setDashboardCharts(prev => 
            prev.map(chart => 
                chart.id === chartId 
                    ? { ...chart, config: { ...chart.config, ...config } }
                    : chart
            )
        );
    };

    // Remove chart
    const removeChart = (chartId) => {
        setDashboardCharts(prev => prev.filter(chart => chart.id !== chartId));
        if (editingChart === chartId) {
            setEditingChart(null);
        }
    };

    // Get available fields for selection
    const getAvailableFields = () => {
        return sampleFields.map(field => ({
            value: field.name,
            label: `${field.name} (${field.type})`,
            type: field.type
        }));
    };

    // Render chart component
    const renderChart = (chart) => {
        const ChartComponent = chart.component;
        const { xField, yField, title, height } = chart.config;
        
        if (!xField || !yField) {
            return (
                <div className="flex items-center justify-center h-full bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                    <div className="text-center text-slate-500 dark:text-slate-400">
                        <div className="text-2xl mb-2">{chart.icon}</div>
                        <p className="text-sm">Configure variables</p>
                    </div>
                </div>
            );
        }

        return (
            <ChartComponent
                data={sampleDataSource}
                xField={xField}
                yField={yField}
                title=""
                height={height}
            />
        );
    };

    return (
        <div className="h-full flex bg-slate-50 dark:bg-slate-900 transition-colors">
            {/* Chart Palette */}
            <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Chart Components</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Drag charts to the dashboard</p>
                
                <div className="space-y-2">
                    {chartTypes.map((chartType) => (
                        <div
                            key={chartType.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, chartType)}
                            className="flex items-center p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg cursor-move hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                        >
                            <span className="text-xl mr-3">{chartType.icon}</span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{chartType.name}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-6">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Dashboard Actions</h4>
                    <button
                        onClick={() => setDashboardCharts([])}
                        className="w-full px-3 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                        Clear Dashboard
                    </button>
                </div>
            </div>

            {/* Dashboard Area */}
            <div className="flex-1 flex flex-col">
                <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Dashboard Builder</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Drag charts from the left panel to build your dashboard</p>
                </div>

                <div
                    ref={dropZoneRef}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="flex-1 p-4 min-h-[500px]"
                >
                    {dashboardCharts.length === 0 ? (
                        <div className="flex items-center justify-center h-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800">
                            <div className="text-center text-slate-500 dark:text-slate-400">
                                <div className="text-4xl mb-4"></div>
                                <h3 className="text-lg font-medium mb-2">Empty Dashboard</h3>
                                <p>Drag chart components here to start building</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 ">
                            {dashboardCharts.map((chart) => (
                                <div
                                    key={chart.id}
                                    className="bg-white dark:bg-slate-800 rounded-lg mb-50 shadow-sm border border-slate-200 dark:border-slate-700 "
                                >
                                    {/* Chart Header */}
                                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{chart.icon}</span>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{chart.name}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setEditingChart(editingChart === chart.id ? null : chart.id)}
                                                className="p-1 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                                title="Configure"
                                            >
                                                ⚙️
                                            </button>
                                            <button
                                                onClick={() => removeChart(chart.id)}
                                                className="p-1 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                title="Remove"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>

                                    {/* Chart Content */}
                                    <div className="p-4">
                                        {renderChart(chart)}
                                    </div>

                                    {/* Configuration Panel */}
                                    {editingChart === chart.id && (
                                        <div className="border-t border-slate-200 dark:border-slate-600 p-4 bg-slate-50 dark:bg-slate-700">
                                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">Chart Configuration</h4>
                                            
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Title</label>
                                                    <input
                                                        type="text"
                                                        value={chart.config.title}
                                                        onChange={(e) => handleChartConfig(chart.id, { title: e.target.value })}
                                                        className="w-full px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">X-Axis Field</label>
                                                    <select
                                                        value={chart.config.xField}
                                                        onChange={(e) => handleChartConfig(chart.id, { xField: e.target.value })}
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
                                                        value={chart.config.yField}
                                                        onChange={(e) => handleChartConfig(chart.id, { yField: e.target.value })}
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
                                                        value={chart.config.height}
                                                        onChange={(e) => handleChartConfig(chart.id, { height: parseInt(e.target.value) || 300 })}
                                                        className="w-full px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                                        min="200"
                                                        max="600"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DragDropDashboard;
