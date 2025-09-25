import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const LineChart = ({ 
    data, 
    xField, 
    yField, 
    title = "Line Chart",
    height = 300,
    showLegend = true,
    fillArea = false 
}) => {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return null;

        const labels = data.map((item, index) => item[xField] || `Point ${index + 1}`);
        const values = data.map(item => parseFloat(item[yField]) || 0);

        return {
            labels,
            datasets: [{
                label: yField,
                data: values,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: fillArea ? 'rgba(75, 192, 192, 0.2)' : 'transparent',
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: fillArea
            }]
        };
    }, [data, xField, yField, fillArea]);

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
            <Line data={chartData} options={options} />
        </div>
    );
};

export default LineChart;
