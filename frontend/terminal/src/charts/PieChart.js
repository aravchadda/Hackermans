import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    Title
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const PieChart = ({ 
    data, 
    labelField, 
    valueField, 
    title = "Pie Chart",
    height = 300,
    showLegend = true 
}) => {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return null;

        // Count occurrences for categorical data
        const counts = {};
        data.forEach(item => {
            const value = item[labelField];
            counts[value] = (counts[value] || 0) + 1;
        });

        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
            '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56'
        ];

        return {
            labels: Object.keys(counts),
            datasets: [{
                data: Object.values(counts),
                backgroundColor: colors.slice(0, Object.keys(counts).length),
                borderColor: '#fff',
                borderWidth: 2
            }]
        };
    }, [data, labelField]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: !!title,
                text: title,
                font: { size: 16, weight: 'bold' }
            },
            legend: {
                display: showLegend,
                position: 'right'
            }
        }
    };

    if (!chartData) {
        return (
            <div className="flex items-center justify-center text-slate-500 dark:text-slate-400" style={{ height }}>
                <p>No data available</p>
            </div>
        );
    }

    return (
        <div style={{ height }}>
            <Pie data={chartData} options={options} />
        </div>
    );
};

export default PieChart;
