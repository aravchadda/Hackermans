import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    Title
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { useDarkMode } from '../hooks/useDarkMode';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const PieChart = ({ 
    data, 
    labelField, 
    valueField, 
    labelFieldLabel,
    valueFieldLabel,
    title = "Pie Chart",
    height = 300,
    showLegend = true 
}) => {
    // Use custom dark mode hook for reactive theme detection
    const isDarkMode = useDarkMode();

    const chartData = useMemo(() => {
        if (!data || data.length === 0) return null;

        // Count occurrences for categorical data
        const counts = {};
        data.forEach(item => {
            const value = item[labelField];
            counts[value] = (counts[value] || 0) + 1;
        });

        // Honeywell industrial color palette for pie charts
        const colors = [
            '#DC2626', // Honeywell Red (Primary)
            '#1F2937', // Honeywell Dark Gray
            '#374151', // Honeywell Medium Gray
            '#6B7280', // Honeywell Light Gray
            '#1E40AF', // Industrial Blue
            '#059669', // Professional Green
            '#7C3AED', // Corporate Purple
            '#EA580C', // Safety Orange
            '#0891B2', // Technical Cyan
            '#BE185D', // Industrial Pink
            '#4338CA', // Deep Blue
            '#047857', // Forest Green
            '#7C2D12', // Brown
            '#9CA3AF', // Lighter Gray
            '#D1D5DB', // Lightest Gray
            '#F3F4F6', // Very Light Gray
        ];

        return {
            labels: Object.keys(counts),
            datasets: [{
                data: Object.values(counts),
                backgroundColor: colors.slice(0, Object.keys(counts).length),
                borderColor: isDarkMode ? '#ffffff' : '#000000',
                borderWidth: 3,
                hoverBorderWidth: 4,
                hoverBorderColor: isDarkMode ? '#ffffff' : '#000000',
                hoverOffset: 8,
            }]
        };
    }, [data, labelField, isDarkMode]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                top: 5,
                bottom: 5,
                left: 5,
                right: 5
            }
        },
        plugins: {
            title: {
                display: !!title,
                text: title,
                font: { size: 14, weight: 'bold' },
                color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                padding: { top: 5, bottom: 10 }
            },
            legend: {
                display: showLegend,
                position: 'right',
                labels: {
                    padding: 8,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    font: { size: 11 },
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'
                }
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
        <div style={{ height: '100%', width: '100%', minHeight: height }}>
            <Pie data={chartData} options={options} />
        </div>
    );
};

export default PieChart;
