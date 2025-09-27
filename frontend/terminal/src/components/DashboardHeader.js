import React from 'react';

const DashboardHeader = ({ mode, onModeChange, showChat, onToggleChat, userRole = 'admin', onClearScreen }) => {
  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Dashboard Builder</h1>
      </div>
      
      <div className="flex items-center gap-3">
        {userRole === 'admin' ? (
          <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => onModeChange("design")}
              className={`h-8 px-3 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                mode === "design" 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Design
            </button>
            <button
              onClick={() => onModeChange("view")}
              className={`h-8 px-3 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                mode === "view" 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="h-8 px-3 text-sm font-medium rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Only
            </div>
          </div>
        )}
        
        {/* Analytics Button */}
       
        
        {/* Chat Button */}
        {mode !== "analytics" && (
          <button 
            onClick={onToggleChat}
            className={`h-8 px-3 text-sm font-medium border border-slate-200 dark:border-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 flex items-center gap-1.5 text-slate-700 dark:text-slate-300 ${
              showChat ? 'bg-primary/10 dark:bg-primary/20 text-primary border-primary/30 dark:border-primary/50' : ''
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Chat
          </button>
        )}
         <button
          onClick={() => onModeChange("analytics")}
          className={`h-8 px-3 text-sm font-medium border border-slate-200 dark:border-slate-600 rounded-md transition-all duration-1000 ease-in-out flex items-center gap-1.5 relative ${
            mode === "analytics" 
              ? "bg-red-600 text-white shadow-lg shadow-red-500/25 transform scale-105" 
              : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-105"
          }`}
        >
          {/* Golden light animation */}
          <div className="absolute inset-0 rounded-md overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-amber-400/30 to-yellow-400/20 animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300/40 to-transparent animate-ping"></div>
          </div>
          <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="relative z-10">Analytics</span>
        </button>
        
        {/* Clear Screen Button */}
        {mode === "design" && (
          <button
            onClick={onClearScreen}
            className="h-8 px-3 text-sm font-medium border border-red-200 dark:border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 flex items-center gap-1.5 text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200"
            title="Clear all widgets from the dashboard"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear Screen
          </button>
        )}
      </div>
    </header>
  );
};

export default DashboardHeader;
