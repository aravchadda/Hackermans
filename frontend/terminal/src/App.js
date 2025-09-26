import React, { useState, useEffect } from 'react';
import GraphicWalker from './GraphicWalker';
import Dashboard from './Dashboard';
import DragDropDashboard from './DragDropDashboard';
import CreativeDashboard from './CreativeDashboard';
import LoginPage from './components/LoginPage';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider, useAuth } from './AuthContext';
import { graphicWalkerSpec } from './graphicWalkerSpec';
import langStore from './langStore';
import { sampleDataSource, sampleFields } from './sampleData';

const AppContent = (props) => {
    const { dataSource = sampleDataSource, fields = sampleFields } = props;
    const { user, loading, logout, canDesign } = useAuth();
    const [viewMode, setViewMode] = useState('view'); // 'walker', 'dashboard', 'builder', or 'creative'

    // Force viewers to view mode
    useEffect(() => {
        if (user && !canDesign()) {
            setViewMode('view');
        }
    }, [user, canDesign]);

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    // Show login page if not authenticated
    if (!user) {
        return <LoginPage />;
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
            {/* User Info Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                            Dashboard
                        </h1>
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">
                            {user.name} ({user.role})
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                      
                        <button
                            onClick={logout}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="h-screen overflow-hidden">
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
                ) : viewMode === 'view' ? (
                    <CreativeDashboard mode="view" userRole={user.role} />
                ) : (
                    <CreativeDashboard mode="design" userRole={user.role} />
                )}
            </div>
        </div>
    );
}

const YourEmbeddingTableauStyleApp = (props) => {
    return (
        <AuthProvider>
            <ThemeProvider>
                <AppContent {...props} />
            </ThemeProvider>
        </AuthProvider>
    );
}
 
export default YourEmbeddingTableauStyleApp;