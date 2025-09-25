import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BarChart = ({ 
    data, 
    xField, 
    yField, 
    title = "Bar Chart",
    height = 300,
    showLegend = true 
}) => {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return null;

        const labels = data.map((item, index) => item[xField] || `Item ${index + 1}`);
        const values = data.map(item => parseFloat(item[yField]) || 0);

        return {
            labels,
            datasets: [{
                label: yField,
                data: values,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2
            }]
        };
    }, [data, xField, yField]);

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
                position: 'top'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0, 0, 0, 0.1)' }
            },
            x: {
                grid: { color: 'rgba(0, 0, 0, 0.1)' }
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
        <div style={{ height, width: '100%' }}>
            <Bar data={chartData} options={options} />
        </div>
    );
};

export default BarChart;
