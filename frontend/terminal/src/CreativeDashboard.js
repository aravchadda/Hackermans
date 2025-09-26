import React, { useState } from 'react';
import DashboardHeader from './components/DashboardHeader';
import ChartSidebar from './components/ChartSidebar';
import DashboardCanvas from './components/DashboardCanvas';
import ChatBox from './components/ChatBox';

const CreativeDashboard = ({ mode: initialMode = "view", userRole = "operator" }) => {
  const [mode, setMode] = useState(initialMode);
  const [showChat, setShowChat] = useState(true);

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 flex flex-col overflow-hidden">
      <DashboardHeader 
        mode={mode} 
        onModeChange={setMode} 
        showChat={showChat}
        onToggleChat={() => setShowChat(!showChat)}
        userRole={userRole}
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
