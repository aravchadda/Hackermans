import React from 'react';
import { BarChart, LineChart, PieChart, ScatterChart } from './charts';
import { sampleDataSource } from './sampleData';

// Example showing how to use individual charts
const ChartExamples = () => {
    return (
        <div className="p-5 bg-slate-50 dark:bg-slate-900 min-h-screen transition-colors">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">📊 Individual Chart Components</h2>
                <p className="text-slate-600 dark:text-slate-400">Use these charts anywhere in your application</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Bar Chart Example</h3>
                    <BarChart 
                        data={sampleDataSource}
                        xField="department"
                        yField="salary"
                        title="Salary by Department"
                        height={250}
                    />
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Line Chart Example</h3>
                    <LineChart 
                        data={sampleDataSource}
                        xField="name"
                        yField="experience"
                        title="Experience Trends"
                        height={250}
                        fillArea={true}
                    />
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Pie Chart Example</h3>
                    <PieChart 
                        data={sampleDataSource}
                        labelField="department"
                        valueField="name"
                        title="Department Distribution"
                        height={250}
                    />
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Scatter Plot Example</h3>
                    <ScatterChart 
                        data={sampleDataSource}
                        xField="experience"
                        yField="salary"
                        title="Salary vs Experience"
                        height={250}
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">💻 How to Use Individual Charts</h3>
                <pre className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg overflow-x-auto text-sm leading-relaxed text-slate-800 dark:text-slate-200">{`import { BarChart, LineChart, PieChart, ScatterChart } from './charts';

// Bar Chart
<BarChart 
    data={yourData}
    xField="category"
    yField="value"
    title="Your Chart Title"
    height={300}
/>

// Line Chart
<LineChart 
    data={yourData}
    xField="time"
    yField="measurement"
    title="Trend Analysis"
    height={300}
    fillArea={true}
/>

// Pie Chart
<PieChart 
    data={yourData}
    labelField="category"
    valueField="count"
    title="Distribution"
    height={300}
/>

// Scatter Plot
<ScatterChart 
    data={yourData}
    xField="xValue"
    yField="yValue"
    title="Correlation"
    height={300}
/>`}</pre>
            </div>
        </div>
    );
};

export default ChartExamples;
