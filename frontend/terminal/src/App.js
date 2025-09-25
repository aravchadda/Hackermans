import React, { useState } from 'react';
import GraphicWalker from './GraphicWalker';
import Dashboard from './Dashboard';
import { graphicWalkerSpec } from './graphicWalkerSpec';
import langStore from './langStore';
import { sampleDataSource, sampleFields } from './sampleData';

const YourEmbeddingTableauStyleApp = (props) => {
    const { dataSource = sampleDataSource, fields = sampleFields } = props;
    const [viewMode, setViewMode] = useState('walker'); // 'walker' or 'dashboard'

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="flex justify-between items-center px-6 py-5 bg-white border-b border-slate-200 shadow-sm">
                <h1 className="text-2xl font-bold text-slate-800">📊 Data Visualization Suite</h1>
                <div className="flex gap-2">
                    <button 
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            viewMode === 'walker' 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                        onClick={() => setViewMode('walker')}
                    >
                        🔧 Graphic Walker
                    </button>
                    <button 
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            viewMode === 'dashboard' 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                        onClick={() => setViewMode('dashboard')}
                    >
                        📊 Dashboard
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
                ) : (
                    <Dashboard />
                )}
            </div>
        </div>
    );
}

export default YourEmbeddingTableauStyleApp;