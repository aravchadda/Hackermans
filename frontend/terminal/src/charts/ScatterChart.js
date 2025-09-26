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
import { useDarkMode } from '../hooks/useDarkMode';

ChartJS.register(LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ScatterChart = ({ 
    data, 
    xField, 
    yField, 
    xFieldLabel,
    yFieldLabel,
    title = "Scatter Plot",
    height = 300,
    showLegend = true,
    // Multi-valued support
    yFields = null, // Array of Y field names for multiple series
    seriesLabels = null, // Array of labels for each series
    multiValue = false, // Enable multi-valued mode
    isMultiValue = false // Backend indicates multi-value data
}) => {
    // Use custom dark mode hook for reactive theme detection
    const isDarkMode = useDarkMode();

    const chartData = useMemo(() => {
        console.log('📊 ScatterChart - Received data:', { 
            dataLength: data?.length, 
            isMultiValue, 
            multiValue, 
            yFields, 
            seriesLabels,
            firstDataItem: data?.[0]
        });
        
        if (!data || data.length === 0) return null;

        // Bright and vibrant color palette for scatter points
        const scatterColors = [
            'rgba(255, 99, 132, 0.8)',   // Bright Pink
            'rgba(54, 162, 235, 0.8)',   // Bright Blue
            'rgba(255, 205, 86, 0.8)',   // Bright Yellow
            'rgba(75, 192, 192, 0.8)',  // Bright Teal
            'rgba(153, 102, 255, 0.8)',  // Bright Purple
            'rgba(255, 159, 64, 0.8)',   // Bright Orange
            'rgba(199, 199, 199, 0.8)',  // Bright Gray
            'rgba(83, 102, 255, 0.8)',   // Bright Indigo
            'rgba(255, 99, 255, 0.8)',   // Bright Magenta
            'rgba(99, 255, 132, 0.8)',   // Bright Green
            'rgba(255, 132, 99, 0.8)',   // Bright Coral
            'rgba(132, 99, 255, 0.8)',   // Bright Violet
            'rgba(255, 192, 99, 0.8)',   // Bright Peach
            'rgba(99, 192, 255, 0.8)',   // Bright Sky Blue
            'rgba(255, 99, 192, 0.8)',   // Bright Rose
        ];

        const borderColors = [
            'rgba(255, 99, 132, 1)',     // Bright Pink
            'rgba(54, 162, 235, 1)',     // Bright Blue
            'rgba(255, 205, 86, 1)',     // Bright Yellow
            'rgba(75, 192, 192, 1)',    // Bright Teal
            'rgba(153, 102, 255, 1)',    // Bright Purple
            'rgba(255, 159, 64, 1)',     // Bright Orange
            'rgba(199, 199, 199, 1)',    // Bright Gray
            'rgba(83, 102, 255, 1)',     // Bright Indigo
            'rgba(255, 99, 255, 1)',     // Bright Magenta
            'rgba(99, 255, 132, 1)',     // Bright Green
            'rgba(255, 132, 99, 1)',     // Bright Coral
            'rgba(132, 99, 255, 1)',     // Bright Violet
            'rgba(255, 192, 99, 1)',     // Bright Peach
            'rgba(99, 192, 255, 1)',     // Bright Sky Blue
            'rgba(255, 99, 192, 1)',     // Bright Rose
        ];

        // Use unified multi-value approach for both single and multi-value data
        if (data && data.length > 0) {
            console.log('📊 ScatterChart - Processing data:', { 
                firstDataItem: data[0],
                dataLength: data.length 
            });
            
            // Handle backend data format (y_value_0, y_value_1, etc.)
            const datasets = [];
            
            // Find all y_value_* fields in the first data item
            const firstItem = data[0];
            const yValueFields = Object.keys(firstItem).filter(key => key.startsWith('y_value_'));
            console.log('📊 ScatterChart - Found y_value fields:', yValueFields);
            
            yValueFields.forEach((fieldName, index) => {
                const points = data.map(item => ({
                    x: parseFloat(item['x_value']) || 0,
                    y: parseFloat(item[fieldName]) || 0
                }));
                
                const fieldLabel = seriesLabels && seriesLabels[index] ? seriesLabels[index] : `Series ${index + 1}`;
                console.log(`📊 ScatterChart - Processing field ${fieldName}:`, { 
                    fieldName, 
                    fieldLabel,
                    pointsCount: points.length,
                    samplePoints: points.slice(0, 3)
                });

                datasets.push({
                    label: fieldLabel,
                    data: points,
                    backgroundColor: scatterColors[index % scatterColors.length],
                    borderColor: borderColors[index % borderColors.length],
                    pointRadius: 7,
                    pointHoverRadius: 9,
                    pointBorderWidth: 2,
                    pointBorderColor: isDarkMode ? '#ffffff' : '#000000',
                    hoverBackgroundColor: scatterColors[index % scatterColors.length],
                    hoverBorderColor: borderColors[index % borderColors.length],
                    hoverBorderWidth: 3,
                });
            });

            const chartData = {
                datasets
            };
            console.log('📊 ScatterChart - Final chart data:', chartData);
            return chartData;
        }
    }, [data, xField, yField, xFieldLabel, yFieldLabel, isDarkMode, multiValue, isMultiValue, yFields, seriesLabels]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'nearest'
        },
        onHover: (event, activeElements) => {
            // Disable hover effects
            event.native.target.style.cursor = 'default';
        },
        plugins: {
            tooltip: {
                enabled: false
            }
        },
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
                position: 'top',
                labels: {
                    padding: 10,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'
                }
            }
        },
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                grid: { 
                    color: 'rgba(148, 163, 184, 0.15)',
                    drawBorder: false,
                    lineWidth: 1
                },
                ticks: {
                    padding: 8,
                    font: { size: 11, weight: '500' },
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'
                },
                title: {
                    display: true,
                    text: xFieldLabel || xField || 'X Axis',
                    font: { size: 12, weight: 'bold' },
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                    padding: { top: 5, bottom: 5 }
                }
            },
            y: {
                grid: { 
                    color: 'rgba(148, 163, 184, 0.15)',
                    drawBorder: false,
                    lineWidth: 1
                },
                ticks: {
                    padding: 8,
                    font: { size: 11, weight: '500' },
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'
                },
                title: {
                    display: true,
                    text: yFieldLabel || yField || 'Y Axis',
                    font: { size: 12, weight: 'bold' },
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                    padding: { top: 5, bottom: 5 }
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
            <Scatter data={chartData} options={options} />
        </div>
    );
};

export default ScatterChart;
