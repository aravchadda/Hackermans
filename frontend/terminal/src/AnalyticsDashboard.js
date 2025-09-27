import React, { useState, useEffect } from 'react';
import AnomalyDetectionDisplay from './components/AnomalyDetectionDisplay';
import PredictiveForecastingDisplay from './components/PredictiveForecastingDisplay';
import DelayAnalysisDisplay from './components/DelayAnalysisDisplay';
import AnalyticsChatbot from './components/AnalyticsChatbot';

const AnalyticsDashboard = () => {
  const [expandedBox, setExpandedBox] = useState(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentPresetIndex, setCurrentPresetIndex] = useState(0);

  const analyticsBoxes = [
    {
      id: 1,
      title: "ANOMALY DETECTION",
      subtitle: "Advanced pattern recognition and outlier identification",
      description: "Machine learning algorithms to detect unusual patterns and anomalies in real-time data streams",
      color: "bg-black",
      content: "Sophisticated anomaly detection system using statistical analysis, machine learning models, and real-time monitoring to identify deviations from normal patterns across all operational metrics."
    },
    {
      id: 2,
      title: "PREDICTIVE FORECASTING",
      subtitle: "AI-driven future trend analysis and predictions",
      description: "Advanced forecasting models to predict future outcomes and trends",
      color: "bg-black",
      content: "Cutting-edge predictive analytics leveraging time series analysis, regression models, and deep learning to forecast future trends and outcomes with high accuracy."
    },
    {
      id: 3,
      title: "DELAY TIME ANALYSIS",
      subtitle: "Comprehensive delay pattern recognition and optimization",
      description: "Deep analysis of delay patterns and bottleneck identification",
      color: "bg-black",
      content: "Comprehensive delay analysis framework that identifies bottlenecks, analyzes delay patterns, and provides actionable insights for process optimization and efficiency improvements."
    }
  ];

  useEffect(() => {
    // Trigger explosive animation on mount
    setIsFullScreen(true);
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 800); // Faster animation
    return () => clearTimeout(timer);
  }, []);

  const handleBoxClick = (boxId) => {
    if (expandedBox === boxId) {
      setExpandedBox(null);
    } else {
      setExpandedBox(boxId);
    }
  };

  const handlePresetNavigation = (direction) => {
    if (direction === 'next') {
      setCurrentPresetIndex((prev) => (prev + 1) % analyticsBoxes.length);
    } else {
      setCurrentPresetIndex((prev) => (prev - 1 + analyticsBoxes.length) % analyticsBoxes.length);
    }
  };

  return (
    <div className={`h-full w-full bg-slate-50 dark:bg-slate-900 flex flex-col overflow-hidden transition-all duration-500 ${isFullScreen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`} style={{ height: 'calc(100vh - 64px)' }}>
      {/* Animation Overlay */}
      {isAnimating && (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 z-50 flex items-center justify-center animate-in fade-in duration-500">
        </div>
      )}
      
      {/* Main Content - Split Layout */}
      <div className="flex-1 w-full flex" style={{ height: 'calc(100% - 0px)' }}>
        {/* Left Half - Preset Analytics */}
        <div className="w-1/2 h-full flex flex-col p-4" style={{ height: 'calc(100vh - 64px)' }}>
          <div className="h-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col shadow-sm" style={{ height: 'calc(100vh - 96px)' }}>
            {expandedBox ? (
              // Fullscreen Popup Overlay with gaps
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-8">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-full h-full flex flex-col animate-in fade-in duration-500 shadow-2xl">
                  {expandedBox === 1 ? (
                    // Anomaly Detection Display
                    <div className="h-full">
                      <AnomalyDetectionDisplay onClose={() => setExpandedBox(null)} />
                    </div>
                  ) : expandedBox === 2 ? (
                    // Predictive Forecasting Display
                    <div className="h-full">
                      <PredictiveForecastingDisplay onClose={() => setExpandedBox(null)} />
                    </div>
                  ) : expandedBox === 3 ? (
                    // Delay Analysis Display
                    <div className="h-full">
                      <DelayAnalysisDisplay onClose={() => setExpandedBox(null)} />
                    </div>
                  ) : (
                    // Default expanded view for other modules
                    <>
                      <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                        <button
                          onClick={() => setExpandedBox(null)}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Close
                        </button>
                        <div className="text-slate-900 dark:text-slate-100 text-lg font-semibold">
                          {analyticsBoxes.find(box => box.id === expandedBox)?.title}
                        </div>
                      </div>
                      
                      <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 m-6 rounded-xl p-12">
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center max-w-4xl">
                            <h2 className="text-6xl font-bold text-slate-900 dark:text-slate-100 mb-6">
                              {analyticsBoxes.find(box => box.id === expandedBox)?.title}
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 text-xl mb-6 font-medium leading-relaxed">
                              {analyticsBoxes.find(box => box.id === expandedBox)?.subtitle}
                            </p>
                            <p className="text-slate-500 dark:text-slate-500 text-lg leading-relaxed mb-8">
                              {analyticsBoxes.find(box => box.id === expandedBox)?.content}
                            </p>
                            <div className="inline-flex items-center gap-4 px-8 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-slate-700 dark:text-slate-300 font-medium text-lg">Real-time Processing</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              // Preset Analytics Modules - Stacked Layout
              <div className="h-full flex flex-col p-6 pt-12">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Preset Analytics</h2>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Pre-configured analytics modules</p>
                </div>
                
                {/* Stacked Analytics Modules */}
                <div className="flex-1 space-y-4">
                  {analyticsBoxes.map((box, index) => (
                    <div
                      key={box.id}
                      onClick={() => box.title && handleBoxClick(box.id)}
                      className={`group relative bg-slate-100 dark:bg-slate-700 cursor-pointer transform transition-all duration-500 hover:scale-105 border border-slate-200 dark:border-slate-600 flex flex-col justify-center items-center p-6 rounded-xl h-32 ${!box.title ? 'opacity-50 cursor-default' : ''}`}
                    >
                      {/* Content */}
                      <div className="relative z-10 w-full flex flex-col justify-center items-center text-slate-900 dark:text-slate-100 text-center">
                        {box.title && (
                          <>
                            <h3 className="text-xl font-semibold mb-2 leading-tight">{box.title}</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-xs mb-2 font-medium leading-relaxed">{box.subtitle}</p>
                            <p className="text-slate-500 dark:text-slate-500 text-xs leading-relaxed line-clamp-2">{box.description}</p>
                            
                            <div className="mt-3 flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-slate-700 dark:text-slate-300 text-xs font-medium">Active</span>
                            </div>
                          </>
                        )}
                        {!box.title && (
                          <div className="text-slate-400 dark:text-slate-500 text-sm font-light">
                            Reserved
                          </div>
                        )}
                      </div>
                      
                      {/* Hover Effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-200/20 dark:from-slate-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Half - Custom Analytics (Chatbot) */}
        <div className="w-1/2 h-full" style={{ height: 'calc(100vh - 64px)' }}>
          <AnalyticsChatbot />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
