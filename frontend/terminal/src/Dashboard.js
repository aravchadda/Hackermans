import React from 'react';
import BarChart from './charts/BarChart';
import LineChart from './charts/LineChart';
import PieChart from './charts/PieChart';
import ScatterChart from './charts/ScatterChart';
import { sampleDataSource } from './sampleData';

const Dashboard = () => {
    return (
        <div className="p-5 bg-slate-50 min-h-screen">
            <div className="text-center mb-8 p-5 bg-white rounded-xl shadow-sm">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">📊 Data Analytics Dashboard</h1>
                <p className="text-slate-600">Interactive charts and visualizations</p>
            </div>

            <div className="flex flex-col gap-5">
                {/* Row 1: Bar Chart and Line Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
                        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
                            <h3 className="text-lg font-semibold text-slate-800 mb-1">📊 Salary by Department</h3>
                            <p className="text-slate-600 text-sm">Average salary distribution across departments</p>
                        </div>
                        <div className="p-5">
                            <BarChart 
                                data={sampleDataSource}
                                xField="department"
                                yField="salary"
                                title=""
                                height={300}
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
                        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
                            <h3 className="text-lg font-semibold text-slate-800 mb-1">📈 Experience Trends</h3>
                            <p className="text-slate-600 text-sm">Employee experience over time</p>
                        </div>
                        <div className="p-5">
                            <LineChart 
                                data={sampleDataSource}
                                xField="name"
                                yField="experience"
                                title=""
                                height={300}
                                fillArea={true}
                            />
                        </div>
                    </div>
                </div>

                {/* Row 2: Pie Chart and Scatter Plot */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
                        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
                            <h3 className="text-lg font-semibold text-slate-800 mb-1">🥧 Department Distribution</h3>
                            <p className="text-slate-600 text-sm">Employee count by department</p>
                        </div>
                        <div className="p-5">
                            <PieChart 
                                data={sampleDataSource}
                                labelField="department"
                                valueField="name"
                                title=""
                                height={300}
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
                        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
                            <h3 className="text-lg font-semibold text-slate-800 mb-1">⚪ Salary vs Experience</h3>
                            <p className="text-slate-600 text-sm">Correlation between salary and experience</p>
                        </div>
                        <div className="p-5">
                            <ScatterChart 
                                data={sampleDataSource}
                                xField="experience"
                                yField="salary"
                                title=""
                                height={300}
                            />
                        </div>
                    </div>
                </div>

                {/* Row 3: Full-width charts */}
                <div className="grid grid-cols-1 gap-5">
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
                        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
                            <h3 className="text-lg font-semibold text-slate-800 mb-1">📊 Age Distribution</h3>
                            <p className="text-slate-600 text-sm">Employee age analysis</p>
                        </div>
                        <div className="p-5">
                            <BarChart 
                                data={sampleDataSource}
                                xField="name"
                                yField="age"
                                title=""
                                height={250}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
