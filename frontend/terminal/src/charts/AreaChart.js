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
import { useDarkMode } from '../hooks/useDarkMode';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const AreaChart = ({ 
    data, 
    xField, 
    yField, 
    xFieldLabel,
    yFieldLabel,
    title = "Area Chart",
    height = 300,
    showLegend = true,
    fillOpacity = 0.3,
    // Multi-valued support
    yFields = null, // Array of Y field names for multiple series
    seriesLabels = null, // Array of labels for each series
    multiValue = false, // Enable multi-valued mode
    isMultiValue = false // Backend indicates multi-value data
}) => {
    // Use custom dark mode hook for reactive theme detection
    const isDarkMode = useDarkMode();

    const chartData = useMemo(() => {
        console.log('📈 AreaChart - Received data:', { 
            dataLength: data?.length, 
            isMultiValue, 
            multiValue, 
            yFields, 
            seriesLabels,
            firstDataItem: data?.[0]
        });
        
        if (!data || data.length === 0) return null;

        // Bright and vibrant color palette for multi-value area charts
        const lineColors = [
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

        const fillColors = [
            'rgba(255, 99, 132, 0.1)',   // Bright Pink
            'rgba(54, 162, 235, 0.1)',   // Bright Blue
            'rgba(255, 205, 86, 0.1)',   // Bright Yellow
            'rgba(75, 192, 192, 0.1)',  // Bright Teal
            'rgba(153, 102, 255, 0.1)',  // Bright Purple
            'rgba(255, 159, 64, 0.1)',   // Bright Orange
            'rgba(199, 199, 199, 0.1)',  // Bright Gray
            'rgba(83, 102, 255, 0.1)',   // Bright Indigo
            'rgba(255, 99, 255, 0.1)',   // Bright Magenta
            'rgba(99, 255, 132, 0.1)',   // Bright Green
            'rgba(255, 132, 99, 0.1)',   // Bright Coral
            'rgba(132, 99, 255, 0.1)',   // Bright Violet
            'rgba(255, 192, 99, 0.1)',   // Bright Peach
            'rgba(99, 192, 255, 0.1)',   // Bright Sky Blue
            'rgba(255, 99, 192, 0.1)',   // Bright Rose
        ];

        // Check if this is backend multi-value data (has y_value_* fields)
        const firstItem = data[0];
        const hasBackendMultiValueFields = firstItem && Object.keys(firstItem).some(key => key.startsWith('y_value_'));
        
        if (hasBackendMultiValueFields) {
            console.log('📈 AreaChart - Backend multi-value mode detected:', { 
                firstDataItem: data[0],
                dataLength: data.length 
            });
            
            // Handle backend multi-value data format (y_value_0, y_value_1, etc.)
            const datasets = [];
            
            // Find all y_value_* fields in the first data item
            const yValueFields = Object.keys(firstItem).filter(key => key.startsWith('y_value_'));
            console.log('📈 AreaChart - Found y_value fields:', yValueFields);
            
            yValueFields.forEach((fieldName, index) => {
                const values = data.map(item => parseFloat(item[fieldName]) || 0);
                const fieldLabel = seriesLabels && seriesLabels[index] ? seriesLabels[index] : `Series ${index + 1}`;
                
                console.log(`📈 AreaChart - Processing backend field ${fieldName}:`, { 
                    fieldName, 
                    fieldLabel,
                    values: values.slice(0, 5), // Show first 5 for debugging
                    totalValues: values.length
                });

                datasets.push({
                    label: fieldLabel,
                    data: values,
                    borderColor: lineColors[index % lineColors.length],
                    backgroundColor: fillColors[index % fillColors.length],
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    pointBackgroundColor: lineColors[index % lineColors.length],
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: lineColors[index % lineColors.length],
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 3,
                });
            });

            // Use x_value for labels
            const labels = data.map(item => item['x_value'] || 'Unknown');
            console.log('📈 AreaChart - Labels:', labels.slice(0, 5));

            const chartData = {
                labels,
                datasets
            };
            console.log('📈 AreaChart - Final backend chart data:', chartData);
            return chartData;
        } else if ((multiValue || isMultiValue) && yFields && yFields.length > 0) {
            console.log('📈 AreaChart - Frontend multi-value mode:', { yFields, seriesLabels });
            
            // Frontend multi-value mode
            const datasets = [];
            
            // Create labels from x-axis data
            const labels = data.map((item, index) => {
                const xValue = item[xField] || item.x_value;
                return xValue ? String(xValue) : `Point ${index + 1}`;
            });

            yFields.forEach((fieldName, index) => {
                const values = data.map(item => parseFloat(item[fieldName]) || 0);
                const fieldLabel = seriesLabels && seriesLabels[index] ? seriesLabels[index] : fieldName;

                datasets.push({
                    label: fieldLabel,
                    data: values,
                    borderColor: lineColors[index % lineColors.length],
                    backgroundColor: fillColors[index % fillColors.length],
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    pointBackgroundColor: lineColors[index % lineColors.length],
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: lineColors[index % lineColors.length],
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 3,
                });
            });

            return {
                labels,
                datasets
            };
        } else {
            // Single value mode
            const labels = data.map((item, index) => {
                const xValue = item[xField] || item.x_value;
                return xValue ? String(xValue) : `Point ${index + 1}`;
            });

            const values = data.map(item => parseFloat(item[yField]) || 0);

            return {
                labels,
                datasets: [{
                    label: yFieldLabel || yField || 'Value',
                    data: values,
                    borderColor: lineColors[0],
                    backgroundColor: fillColors[0],
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    pointBackgroundColor: lineColors[0],
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: lineColors[0],
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 3,
                }]
            };
        }
    }, [data, xField, yField, yFields, seriesLabels, isMultiValue, multiValue, xFieldLabel, yFieldLabel]);

    const chartOptions = useMemo(() => {
        const baseOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: showLegend,
                    position: 'top',
                    labels: {
                        color: isDarkMode ? '#e5e7eb' : '#374151',
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                title: {
                    display: true,
                    text: title,
                    color: isDarkMode ? '#f9fafb' : '#111827',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: isDarkMode ? '#f9fafb' : '#111827',
                    bodyColor: isDarkMode ? '#e5e7eb' : '#374151',
                    borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        title: function(context) {
                            return `${xFieldLabel || xField || 'X'}: ${context[0].label}`;
                        },
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: xFieldLabel || xField || 'X Axis',
                        color: isDarkMode ? '#e5e7eb' : '#374151',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                        font: {
                            size: 11
                        },
                        maxRotation: 45,
                        minRotation: 0
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.3)',
                        drawBorder: false
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: yFieldLabel || yField || 'Y Axis',
                        color: isDarkMode ? '#e5e7eb' : '#374151',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                        font: {
                            size: 11
                        },
                        beginAtZero: true
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.3)',
                        drawBorder: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            elements: {
                point: {
                    hoverBackgroundColor: '#ffffff',
                    hoverBorderWidth: 3
                }
            }
        };

        return baseOptions;
    }, [title, showLegend, isDarkMode, xField, yField, xFieldLabel, yFieldLabel]);

    if (!chartData) {
        return (
            <div className="chart-empty" style={{ height: height }}>
                <div className="empty-icon">📈</div>
                <h3>No Data to Display</h3>
                <p>Select fields to create your area chart</p>
            </div>
        );
    }

    return (
        <div style={{ height: height, width: '100%' }}>
            <Line data={chartData} options={chartOptions} />
        </div>
    );
};

export default AreaChart;
