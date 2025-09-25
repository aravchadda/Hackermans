import React, { useState } from 'react';
import GraphicWalker from './GraphicWalker';
import Dashboard from './Dashboard';
import DragDropDashboard from './DragDropDashboard';
import CreativeDashboard from './CreativeDashboard';
import { ThemeProvider, useTheme } from './ThemeContext';
import { graphicWalkerSpec } from './graphicWalkerSpec';
import langStore from './langStore';
import { sampleDataSource, sampleFields } from './sampleData';

const AppContent = (props) => {
    const { dataSource = sampleDataSource, fields = sampleFields } = props;
    const [viewMode, setViewMode] = useState('creative'); // 'walker', 'dashboard', 'builder', or 'creative'
    const { theme, toggleTheme, isDark } = useTheme();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
            <div className="flex justify-between items-center px-6 py-5 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">📊 Data Visualization Suite</h1>
                <div className="flex gap-2">
                    <button 
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            viewMode === 'walker' 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                        onClick={() => setViewMode('walker')}
                    >
                        🔧 Graphic Walker
                    </button>
                    <button 
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            viewMode === 'dashboard' 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                        onClick={() => setViewMode('dashboard')}
                    >
                        📊 Dashboard
                    </button>
                        <button 
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                viewMode === 'builder' 
                                    ? 'bg-blue-600 text-white border-blue-600' 
                                    : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                            onClick={() => setViewMode('builder')}
                        >
                            🎨 Dashboard Builder
                        </button>
                        <button 
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                viewMode === 'creative' 
                                    ? 'bg-blue-600 text-white border-blue-600' 
                                    : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                            onClick={() => setViewMode('creative')}
                        >
                            ✨ Creative Dashboard
                        </button>
                    <button
                        onClick={toggleTheme}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                    >
                        {isDark ? '☀️' : '🌙'}
                    </button>
                </div>
            </div>

            <div className="h-[calc(100vh-80px)] overflow-hidden">
                {viewMode === 'walker' ? (
                    <GraphicWalker
                        dataSource={dataSource}
                        rawFields={fields}
                        spec={graphicWalkerSpec}
                        i18nLang={langStore.lang}
                    />
                ) : viewMode === 'dashboard' ? (
                    <Dashboard />
                ) : viewMode === 'builder' ? (
                    <DragDropDashboard />
                ) : (
                    <CreativeDashboard />
                )}
            </div>
        </div>
    );
}

const YourEmbeddingTableauStyleApp = (props) => {
    return (
        <ThemeProvider>
            <AppContent {...props} />
        </ThemeProvider>
    );
}

export default YourEmbeddingTableauStyleApp;