import React, { useState } from 'react';
import DashboardHeader from './components/DashboardHeader';
import ChartSidebar from './components/ChartSidebar';
import DashboardCanvas from './components/DashboardCanvas';
import ChatBox from './components/ChatBox';

const CreativeDashboard = () => {
  const [mode, setMode] = useState("design");
  const [showChat, setShowChat] = useState(true);

  return (
    <div className="h-screen bg-dashboard-bg flex flex-col overflow-hidden">
      <DashboardHeader 
        mode={mode} 
        onModeChange={setMode} 
        showChat={showChat}
        onToggleChat={() => setShowChat(!showChat)}
      />
      <div className="flex-1 flex min-h-0">
        <ChartSidebar isVisible={mode === "design"} />
        <DashboardCanvas mode={mode} />
        <ChatBox isVisible={showChat} onClose={() => setShowChat(false)} />
      </div>
    </div>
  );
};

export default CreativeDashboard;
