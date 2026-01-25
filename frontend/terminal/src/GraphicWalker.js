import React, { useState, useEffect, useMemo } from 'react';
import ChartRenderer from './ChartRenderer';
import { useTheme } from './ThemeContext';

// Professional GraphicWalker component with Kanaries-style design
const GraphicWalker = ({ 
    dataSource = [], 
    rawFields = [], 
    spec = {}, 
    i18nLang = 'en',
    onChartChange,
    onDataChange 
}) => {
    const [selectedFields, setSelectedFields] = useState([]);
    const [chartType, setChartType] = useState('bar');
    const [filters, setFilters] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('fields');
    const [draggedField, setDraggedField] = useState(null);
    const { isDark } = useTheme();

    // Process data based on selected fields
    const processedData = useMemo(() => {
        if (!dataSource || dataSource.length === 0) return [];
        
        return dataSource.map((row, index) => ({
            ...row,
            id: index
        }));
    }, [dataSource]);

    // Handle field selection with drag and drop
    const handleFieldSelect = (field) => {
        setSelectedFields(prev => {
            if (prev.includes(field)) {
                return prev.filter(f => f !== field);
            } else {
                return [...prev, field];
            }
        });
    };

    // Handle drag start
    const handleDragStart = (e, field) => {
        setDraggedField(field);
        e.dataTransfer.effectAllowed = 'move';
    };

    // Handle drag over
    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    // Handle drop
    const handleDrop = (e, targetField) => {
        e.preventDefault();
        if (draggedField && draggedField !== targetField) {
            handleFieldSelect(draggedField);
        }
        setDraggedField(null);
    };

    // Handle chart type change
    const handleChartTypeChange = (type) => {
        setChartType(type);
        if (onChartChange) {
            onChartChange(type);
        }
    };

    // Handle filter change
    const handleFilterChange = (field, value) => {
        setFilters(prev => {
            const newFilters = prev.filter(f => f.field !== field);
            if (value !== null && value !== undefined && value !== '') {
                newFilters.push({ field, value });
            }
            return newFilters;
        });
    };

    // Apply filters to data
    const filteredData = useMemo(() => {
        if (filters.length === 0) return processedData;
        
        return processedData.filter(row => {
            return filters.every(filter => {
                const fieldValue = row[filter.field];
                if (typeof fieldValue === 'string') {
                    return fieldValue.toLowerCase().includes(filter.value.toLowerCase());
                }
                return fieldValue === filter.value;
            });
        });
    }, [processedData, filters]);

    // Render modern chart visualization with real charts
    const renderChart = () => {
        if (filteredData.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-10 text-slate-500">
                    <div className="text-6xl mb-5">📊</div>
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">No Data Available</h3>
                    <p>Select fields and configure your visualization</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col bg-white m-5 rounded-xl shadow-sm overflow-hidden">
                <div className="flex justify-between items-center px-6 py-5 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-slate-800">{spec.chart?.title || 'Data Visualization'}</h3>
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded uppercase tracking-wide">
                            {chartType}
                        </span>
                    </div>
                    <div className="flex gap-4 text-sm text-slate-600">
                        <span><strong className="text-slate-800">{filteredData.length}</strong> records</span>
                        <span><strong className="text-slate-800">{selectedFields.length}</strong> fields</span>
                    </div>
                </div>
                
                <div className="flex-1 p-5 min-h-[400px]">
                    <ChartRenderer 
                        data={filteredData}
                        chartType={chartType}
                        selectedFields={selectedFields}
                        rawFields={rawFields}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Graphic Walker</h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Interactive Data Visualization</p>
                </div>
                <div className="flex gap-4">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300">
                        {dataSource.length} records
                    </span>
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300">
                        {rawFields.length} fields
                    </span>
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <div className="w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
                    <div className="flex border-b border-slate-200 dark:border-slate-700">
                        <button 
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                                activeTab === 'fields' 
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                            onClick={() => setActiveTab('fields')}
                        >
                            📊 Fields
                        </button>
                        <button 
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                                activeTab === 'filters' 
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                            onClick={() => setActiveTab('filters')}
                        >
                            🔍 Filters
                        </button>
                        <button 
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                                activeTab === 'settings' 
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                            onClick={() => setActiveTab('settings')}
                        >
                            ⚙️ Settings
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5">
                        {activeTab === 'fields' && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-lg font-semibold text-slate-800">Data Fields</h4>
                                    <span className="px-2 py-1 bg-slate-100 rounded-full text-xs text-slate-600">
                                        {rawFields.length} available
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {rawFields.map((field, index) => (
                                        <div 
                                            key={index} 
                                            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                                                selectedFields.includes(field.name || field) 
                                                    ? 'border-blue-500 bg-blue-50' 
                                                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                                            }`}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, field.name || field)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, field.name || field)}
                                            onClick={() => handleFieldSelect(field.name || field)}
                                        >
                                            <div className="text-lg mr-3">
                                                {field.type === 'quantitative' ? '🔢' : 
                                                 field.type === 'nominal' ? '🏷️' : 
                                                 field.type === 'temporal' ? '📅' : '📊'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium text-slate-800">{field.name || field}</div>
                                                <div className="text-xs text-slate-500 uppercase tracking-wide">{field.type || 'unknown'}</div>
                                            </div>
                                            <div>
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4"
                                                    checked={selectedFields.includes(field.name || field)}
                                                    onChange={() => handleFieldSelect(field.name || field)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'filters' && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-lg font-semibold text-slate-800">Data Filters</h4>
                                    <span className="px-2 py-1 bg-slate-100 rounded-full text-xs text-slate-600">
                                        {filters.length} active
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    {rawFields.map((field, index) => (
                                        <div key={index} className="space-y-2">
                                            <label className="flex justify-between items-center font-medium text-slate-800">
                                                {field.name || field}
                                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs uppercase">
                                                    {field.type}
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder={`Filter by ${field.name || field}`}
                                                onChange={(e) => handleFilterChange(field.name || field, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div>
                                <div className="mb-4">
                                    <h4 className="text-lg font-semibold text-slate-800">Chart Settings</h4>
                                </div>
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="font-medium text-slate-800">Chart Type</label>
                                        <select 
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={chartType} 
                                            onChange={(e) => handleChartTypeChange(e.target.value)}
                                        >
                                            <option value="bar">📊 Bar Chart</option>
                                            <option value="line">📈 Line Chart</option>
                                            <option value="pie">🥧 Pie Chart</option>
                                            <option value="doughnut">🍩 Doughnut Chart</option>
                                            <option value="scatter">⚪ Scatter Plot</option>
                                        </select>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="font-medium text-slate-800">Theme</label>
                                        <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                            <option value="light">☀️ Light</option>
                                            <option value="dark">🌙 Dark</option>
                                            <option value="auto">🔄 Auto</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Chart Area */}
                <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
                    {renderChart()}
                </div>
            </div>
        </div>
    );
};

export default GraphicWalker;
