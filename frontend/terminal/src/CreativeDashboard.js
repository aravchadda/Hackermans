import React, { useState } from 'react';
import DashboardHeader from './components/DashboardHeader';
import ChartSidebar from './components/ChartSidebar';
import DashboardCanvas from './components/DashboardCanvas';

const CreativeDashboard = () => {
  const [mode, setMode] = useState("design");

  return (
    <div className="h-screen bg-dashboard-bg flex flex-col overflow-hidden">
      <DashboardHeader mode={mode} onModeChange={setMode} />
      <div className="flex-1 flex overflow-hidden">
        <ChartSidebar isVisible={mode === "design"} />
        <DashboardCanvas mode={mode} />
      </div>
    </div>
  );
};

export default CreativeDashboard;
