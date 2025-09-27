import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useDarkMode } from '../hooks/useDarkMode';

ChartJS.register(CategoryScale, LinearScale, Title, Tooltip, Legend);

const HeatmapChart = ({ 
    data, 
    xField, 
    yField, 
    xFieldLabel,
    yFieldLabel,
    title = "Heatmap",
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
        console.log('🔥 HeatmapChart - Received data:', { 
            dataLength: data?.length, 
            isMultiValue, 
            multiValue, 
            yFields, 
            seriesLabels,
            firstDataItem: data?.[0]
        });
        
        if (!data || data.length === 0) return null;

        // Function to generate heatmap colors based on value intensity
        const getHeatmapColor = (value, min, max) => {
            if (max === min) return 'rgba(128, 128, 128, 0.8)'; // Gray for equal values
            
            const intensity = (value - min) / (max - min);
            
            // Color scale from blue (low) to red (high)
            if (intensity < 0.25) {
                // Blue to cyan
                const alpha = 0.3 + (intensity / 0.25) * 0.5;
                return `rgba(0, 100, 255, ${alpha})`;
            } else if (intensity < 0.5) {
                // Cyan to green
                const alpha = 0.5 + ((intensity - 0.25) / 0.25) * 0.3;
                return `rgba(0, 255, 150, ${alpha})`;
            } else if (intensity < 0.75) {
                // Green to yellow
                const alpha = 0.6 + ((intensity - 0.5) / 0.25) * 0.2;
                return `rgba(255, 255, 0, ${alpha})`;
            } else {
                // Yellow to red
                const alpha = 0.7 + ((intensity - 0.75) / 0.25) * 0.3;
                return `rgba(255, 100, 0, ${alpha})`;
            }
        };

        // Check if this is backend multi-value data (has y_value_* fields)
        const firstItem = data[0];
        const hasBackendMultiValueFields = firstItem && Object.keys(firstItem).some(key => key.startsWith('y_value_'));
        
        if (hasBackendMultiValueFields) {
            console.log('🔥 HeatmapChart - Backend multi-value mode detected:', { 
                firstDataItem: data[0],
                dataLength: data.length 
            });
            
            // Handle backend multi-value data format (y_value_0, y_value_1, etc.)
            const datasets = [];
            
            // Find all y_value_* fields in the first data item
            const yValueFields = Object.keys(firstItem).filter(key => key.startsWith('y_value_'));
            console.log('🔥 HeatmapChart - Found y_value fields:', yValueFields);
            
            // Get unique x values
            const xValues = [...new Set(data.map(item => String(item['x_value'] || 'Unknown')))];
            console.log('🔥 HeatmapChart - Unique X values:', xValues.slice(0, 5));

            yValueFields.forEach((fieldName, index) => {
                // Create datasets for each field
                const values = xValues.map(xVal => {
                    const item = data.find(d => String(d['x_value'] || 'Unknown') === xVal);
                    return item ? parseFloat(item[fieldName]) || 0 : 0;
                });

                // Calculate min/max for this field
                const validValues = values.filter(v => !isNaN(v));
                const min = validValues.length > 0 ? Math.min(...validValues) : 0;
                const max = validValues.length > 0 ? Math.max(...validValues) : 1;

                const fieldLabel = seriesLabels && seriesLabels[index] ? seriesLabels[index] : `Series ${index + 1}`;
                
                console.log(`🔥 HeatmapChart - Processing backend field ${fieldName}:`, { 
                    fieldName, 
                    fieldLabel,
                    values: values.slice(0, 5), // Show first 5 for debugging
                    min, max,
                    totalValues: values.length
                });

                datasets.push({
                    label: fieldLabel,
                    data: values,
                    backgroundColor: values.map(value => getHeatmapColor(value, min, max)),
                    borderColor: values.map(value => getHeatmapColor(value, min, max)),
                    borderWidth: 1,
                    barThickness: 'flex',
                    maxBarThickness: 50,
                });
            });

            const chartData = {
                labels: xValues,
                datasets
            };
            console.log('🔥 HeatmapChart - Final backend chart data:', chartData);
            return chartData;
        } else if ((multiValue || isMultiValue) && yFields && yFields.length > 0) {
            console.log('🔥 HeatmapChart - Frontend multi-value mode:', { yFields, seriesLabels });
            
            // Frontend multi-value mode - treat each yField as a separate heatmap row
            const fieldNames = yFields || [yField];
            const fieldLabels = seriesLabels || fieldNames.map(field => field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));

            // Get unique x values
            const xValues = [...new Set(data.map(item => String(item[xField] || item.x_value || 'Unknown')))];

            // Create datasets for each field
            const datasets = fieldNames.map((fieldName, fieldIndex) => {
                const values = xValues.map(xVal => {
                    const item = data.find(d => String(d[xField] || d.x_value || 'Unknown') === xVal);
                    return item ? parseFloat(item[fieldName]) || 0 : 0;
                });

                // Calculate min/max for this field
                const validValues = values.filter(v => !isNaN(v));
                const min = validValues.length > 0 ? Math.min(...validValues) : 0;
                const max = validValues.length > 0 ? Math.max(...validValues) : 1;

                return {
                    label: fieldLabels[fieldIndex] || fieldName,
                    data: values,
                    backgroundColor: values.map(value => getHeatmapColor(value, min, max)),
                    borderColor: values.map(value => getHeatmapColor(value, min, max)),
                    borderWidth: 1,
                    barThickness: 'flex',
                    maxBarThickness: 50,
                };
            });

            return {
                labels: xValues,
                datasets
            };
        } else {
            // Single value mode - create a 2D heatmap
            const xValues = [...new Set(data.map(item => String(item[xField] || item.x_value || 'Unknown')))];
            const yValues = [...new Set(data.map(item => String(item[yField] || 'Unknown')))];
            
            // Create a matrix for heatmap data
            const matrix = yValues.map(yVal => 
                xValues.map(xVal => {
                    const item = data.find(d => 
                        String(d[xField] || d.x_value || 'Unknown') === xVal && 
                        String(d[yField] || 'Unknown') === yVal
                    );
                    return item ? parseFloat(item[yField]) || 0 : 0;
                })
            );

            // Flatten matrix for Chart.js
            const flatData = matrix.flat();
            const allValues = flatData.filter(v => !isNaN(v));
            const min = Math.min(...allValues);
            const max = Math.max(...allValues);

            // Create datasets for each row (y-value)
            const datasets = yValues.map((yVal, yIndex) => ({
                label: yVal,
                data: matrix[yIndex],
                backgroundColor: matrix[yIndex].map(value => getHeatmapColor(value, min, max)),
                borderColor: matrix[yIndex].map(value => getHeatmapColor(value, min, max)),
                borderWidth: 1,
                barThickness: 'flex',
                maxBarThickness: 50,
            }));

            return {
                labels: xValues,
                datasets
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
                        }
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
                        }
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
            }
        };

        return baseOptions;
    }, [title, showLegend, isDarkMode, xField, yField, xFieldLabel, yFieldLabel]);

    if (!chartData) {
        return (
            <div className="chart-empty" style={{ height: height }}>
                <div className="empty-icon">🔥</div>
                <h3>No Data to Display</h3>
                <p>Select fields to create your heatmap</p>
            </div>
        );
    }

    return (
        <div style={{ height: height, width: '100%' }}>
            <Bar data={chartData} options={chartOptions} />
        </div>
    );
};

export default HeatmapChart;
