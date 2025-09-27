import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    TimeScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';
import { useTheme } from '../ThemeContext';

ChartJS.register(CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const LineChart = ({ 
    data, 
    xField, 
    yField, 
    xFieldLabel,
    yFieldLabel,
    title = "Line Chart",
    height = 300,
    showLegend = true,
    fillArea = false,
    // Multi-valued support
    yFields = null, // Array of Y field names for multiple series
    seriesLabels = null, // Array of labels for each series
    multiValue = false, // Enable multi-valued mode
    isMultiValue = false // Backend indicates multi-value data
}) => {
    // Use theme context for reactive theme detection
    const { isDark: isDarkMode } = useTheme();

    const chartData = useMemo(() => {
        console.log('📈 LineChart - Received data:', { 
            dataLength: data?.length, 
            isMultiValue, 
            multiValue, 
            yFields, 
            seriesLabels,
            firstDataItem: data?.[0]
        });
        
        // Log the first few data items to see the structure
        if (data && data.length > 0) {
            console.log('📈 LineChart - First 3 data items:', data.slice(0, 3));
        }
        
        if (!data || data.length === 0) return null;

        // Backend provides x_value and y_value_* fields

        // Bright and vibrant color palette for multi-value line charts
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

        // Use unified multi-value approach for both single and multi-value data
        if (data && data.length > 0) {
            console.log('📈 LineChart - Processing data:', { 
                firstDataItem: data[0],
                dataLength: data.length 
            });
            
            // Handle backend data format (y_value_0, y_value_1, etc.)
            const datasets = [];
            
            // Find all y_value_* fields in the first data item
            const firstItem = data[0];
            const yValueFields = Object.keys(firstItem).filter(key => key.startsWith('y_value_'));
            console.log('📈 LineChart - Found y_value fields:', yValueFields);
            console.log('📈 LineChart - First item keys:', Object.keys(firstItem));
            console.log('📈 LineChart - First item values:', firstItem);
            
            yValueFields.forEach((fieldName, index) => {
                // Log raw data first
                console.log(`📈 LineChart - Raw data for ${fieldName}:`, data.slice(0, 3).map(item => ({ 
                    [fieldName]: item[fieldName], 
                    type: typeof item[fieldName] 
                })));
                
                const values = data.map(item => parseFloat(item[fieldName]) || 0);
                const fieldLabel = seriesLabels && seriesLabels[index] ? seriesLabels[index] : `Series ${index + 1}`;
                console.log(`📈 LineChart - Processing backend field ${fieldName}:`, { 
                    fieldName, 
                    fieldLabel,
                    values: values, // Show all values
                    totalValues: values.length,
                    sampleValues: values.slice(0, 10) // Show first 10 for debugging
                });

                datasets.push({
                    label: fieldLabel,
                    data: values,
                    borderColor: lineColors[index % lineColors.length],
                    backgroundColor: fillArea ? fillColors[index % fillColors.length] : 'transparent',
                    borderWidth: 3,
                    pointRadius: 0, // Remove dots for all lines
                    pointHoverRadius: 0, // Remove hover dots
                    pointBackgroundColor: 'transparent',
                    pointBorderColor: 'transparent',
                    pointBorderWidth: 0,
                    fill: fillArea,
                    tension: 0.4, // Smooth curves
                });
            });

            // Use x_value for labels
            const labels = data.map(item => item['x_value'] || 'Unknown');
            console.log('📈 LineChart - Labels:', labels.slice(0, 5));

            const chartData = {
                labels,
                datasets
            };
            console.log('📈 LineChart - Final chart data:', chartData);
            return chartData;
        }
    }, [data, xField, yField, yFieldLabel, fillArea, isDarkMode, multiValue, isMultiValue, yFields, seriesLabels]);

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
                position: 'top',
                labels: {
                    padding: 10,
                    usePointStyle: true,
                    pointStyle: 'line',
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
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
            },
            x: {
                type: 'time',
                time: {
                    parser: 'M/d/yyyy H:mm:ss', // Parser for format like '1/1/2017 15:20:00'
                    tooltipFormat: 'MMM d, yyyy, h:mm a',
                    displayFormats: {
                        day: 'MMM d',
                        hour: 'MMM d HH:mm',
                        minute: 'MMM d HH:mm'
                    }
                },
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
            <Line data={chartData} options={options} />
        </div>
    );
};

export default LineChart;
