import React, { useState, useRef } from 'react';
import DashboardHeader from './components/DashboardHeader';
import ChartSidebar from './components/ChartSidebar';
import DashboardCanvas from './components/DashboardCanvas';
import ChatBox from './components/ChatBox';
import AnalyticsDashboard from './AnalyticsDashboard';

const CreativeDashboard = ({ mode: initialMode = "view", userRole = "operator" }) => {
  const [mode, setMode] = useState(initialMode);
  const [showChat, setShowChat] = useState(true);
  const dashboardCanvasRef = useRef(null);

  const handleCreateChart = (chartConfig) => {
    // This will be passed to DashboardCanvas to create the chart
    console.log('Creating chart from chatbot:', chartConfig);
    
    // Call the global function to create the chart
    if (window.createChartFromChatbot) {
      window.createChartFromChatbot(chartConfig);
    }
  };

  const handleDeleteChart = (chartName) => {
    // This will be passed to DashboardCanvas to delete the chart
    console.log('Deleting chart from chatbot:', chartName);
    
    // Call the global function to delete the chart
    if (window.deleteChartFromChatbot) {
      window.deleteChartFromChatbot(chartName);
    }
  };

  const handleUpdateChart = (chartConfig) => {
    // This will be passed to DashboardCanvas to update the chart
    console.log('CreativeDashboard: Updating chart from chatbot:', chartConfig);
    
    // Call the global function to update the chart
    if (window.updateChartFromChatbot) {
      console.log('CreativeDashboard: Calling window.updateChartFromChatbot');
      window.updateChartFromChatbot(chartConfig);
    } else {
      console.error('CreativeDashboard: window.updateChartFromChatbot not found!');
    }
  };

  const handleClearScreen = () => {
    if (dashboardCanvasRef.current && dashboardCanvasRef.current.clearLayout) {
      dashboardCanvasRef.current.clearLayout();
    }
  };

  // Handle analytics mode with special styling
  if (mode === "analytics") {
    return (
      <div className="h-screen bg-slate-50 dark:bg-slate-900 flex flex-col overflow-hidden">
        <DashboardHeader 
          mode={mode} 
          onModeChange={setMode} 
          showChat={showChat}
          onToggleChat={() => setShowChat(!showChat)}
          userRole={userRole}
          onClearScreen={handleClearScreen}
        />
        <div className="flex-1 flex min-h-0">
          <AnalyticsDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 flex flex-col overflow-hidden">
      <DashboardHeader 
        mode={mode} 
        onModeChange={setMode} 
        showChat={showChat}
        onToggleChat={() => setShowChat(!showChat)}
        userRole={userRole}
        onClearScreen={handleClearScreen}
      />
      <div className="flex-1 flex min-h-0">
        <ChartSidebar isVisible={mode === "design"} />
        <DashboardCanvas 
          ref={dashboardCanvasRef}
          mode={mode} 
          showChat={showChat}
          onCreateChart={handleCreateChart} 
          onDeleteChart={handleDeleteChart} 
          onUpdateChart={handleUpdateChart} 
        />
        <ChatBox 
          isVisible={showChat} 
          onClose={() => setShowChat(false)} 
          onCreateChart={handleCreateChart}
          onDeleteChart={handleDeleteChart}
          onUpdateChart={handleUpdateChart}
        />
      </div>
    </div>
  );
};

export default CreativeDashboard;
