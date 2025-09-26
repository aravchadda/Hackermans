import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';

ChartJS.register(LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ScatterChart = ({ 
    data, 
    xField, 
    yField, 
    title = "Scatter Plot",
    height = 300,
    showLegend = true 
}) => {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return null;

        const points = data.map(item => ({
            x: parseFloat(item[xField]) || 0,
            y: parseFloat(item[yField]) || 0
        }));

        return {
            datasets: [{
                label: `${xField} vs ${yField}`,
                data: points,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                pointRadius: 6,
                pointHoverRadius: 8
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
            x: {
                type: 'linear',
                position: 'bottom',
                grid: { color: 'rgba(0, 0, 0, 0.1)' }
            },
            y: {
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
            <Scatter data={chartData} options={options} />
        </div>
    );
};

export default ScatterChart;
