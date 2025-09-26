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
import { useDarkMode } from '../hooks/useDarkMode';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BarChart = ({ 
    data, 
    xField, 
    yField, 
    xFieldLabel,
    yFieldLabel,
    title = "Bar Chart",
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
        console.log('📊 BarChart - Received data:', { 
            dataLength: data?.length, 
            isMultiValue, 
            multiValue, 
            yFields, 
            seriesLabels,
            firstDataItem: data?.[0]
        });
        
        if (!data || data.length === 0) return null;

        // Bright and vibrant color palette for multi-value charts
        const colors = [
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

        // Check if this is backend multi-value data (has y_value_* fields)
        const firstItem = data[0];
        const hasBackendMultiValueFields = firstItem && Object.keys(firstItem).some(key => key.startsWith('y_value_'));
        
        if (hasBackendMultiValueFields) {
            console.log('📊 BarChart - Backend multi-value mode detected:', { 
                firstDataItem: data[0],
                dataLength: data.length 
            });
            // Handle backend multi-value data format (y_value_0, y_value_1, etc.)
            const datasets = [];
            
            // Find all y_value_* fields in the first data item
            const yValueFields = Object.keys(firstItem).filter(key => key.startsWith('y_value_'));
            console.log('📊 BarChart - Found y_value fields:', yValueFields);
            
            // Group data by X-axis categories and aggregate Y-axis values
            const groupedData = {};
            data.forEach(item => {
                const xValue = item['x_value'] || 'Unknown';
                if (!groupedData[xValue]) {
                    groupedData[xValue] = {};
                }
                
                yValueFields.forEach((fieldName, index) => {
                    const yValue = parseFloat(item[fieldName]) || 0;
                    if (!groupedData[xValue][fieldName]) {
                        groupedData[xValue][fieldName] = 0;
                    }
                    groupedData[xValue][fieldName] += yValue; // Sum values for same category
                });
            });

            // Get unique X-axis labels
            const labels = Object.keys(groupedData);
            console.log('📊 BarChart - Grouped X-axis labels:', labels.slice(0, 5));

            yValueFields.forEach((fieldName, index) => {
                const values = labels.map(label => groupedData[label][fieldName] || 0);
                const fieldLabel = seriesLabels && seriesLabels[index] ? seriesLabels[index] : `Series ${index + 1}`;
                console.log(`📊 BarChart - Processing grouped field ${fieldName}:`, { 
                    fieldName, 
                    fieldLabel,
                    values: values, // Show all values
                    totalValues: values.length,
                    sampleValues: values.slice(0, 10) // Show first 10 for debugging
                });

                datasets.push({
                    label: fieldLabel,
                    data: values,
                    backgroundColor: colors[index % colors.length],
                    borderColor: borderColors[index % borderColors.length],
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false,
                });
            });
            
            const chartData = {
                labels,
                datasets
            };
            console.log('📊 BarChart - Final backend chart data:', chartData);
            return chartData;
        } else if ((multiValue || isMultiValue) && yFields && yFields.length > 0) {
            console.log('📊 BarChart - Frontend multi-value mode:', { yFields, seriesLabels });
            // Multi-valued mode: multiple Y-axis fields with proper category grouping
            const datasets = [];
            
            // Group data by X-axis categories and aggregate Y-axis values
            const groupedData = {};
            data.forEach(item => {
                const xValue = item[xField] || 'Unknown';
                if (!groupedData[xValue]) {
                    groupedData[xValue] = {};
                }
                
                yFields.forEach((yFieldName, index) => {
                    const yValue = parseFloat(item[yFieldName]) || 0;
                    if (!groupedData[xValue][yFieldName]) {
                        groupedData[xValue][yFieldName] = 0;
                    }
                    groupedData[xValue][yFieldName] += yValue; // Sum values for same category
                });
            });

            // Get unique X-axis labels
            const labels = Object.keys(groupedData);
            console.log('📊 BarChart - Grouped frontend X-axis labels:', labels.slice(0, 5));

            // For multi-valued mode, we need to create multiple datasets
            // Each Y field becomes a separate dataset
            yFields.forEach((yFieldName, index) => {
                // Create a dataset for this Y field with grouped data
                const values = labels.map(label => groupedData[label][yFieldName] || 0);
                console.log(`📊 BarChart - Processing grouped field ${yFieldName}:`, { 
                    fieldName: yFieldName, 
                    values: values, // Show all values
                    totalValues: values.length,
                    sampleValues: values.slice(0, 10) // Show first 10 for debugging
                });

                datasets.push({
                    label: seriesLabels && seriesLabels[index] ? seriesLabels[index] : yFieldName,
                    data: values,
                    backgroundColor: colors[index % colors.length],
                    borderColor: borderColors[index % borderColors.length],
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false,
                });
            });
            
            const chartData = {
                labels,
                datasets
            };
            console.log('📊 BarChart - Final frontend chart data:', chartData);
            return chartData;
        } else {
            // Single-valued mode: original behavior
            const groupedData = {};
            data.forEach(item => {
                const category = item['x_value'] || 'Unknown';
                const value = parseFloat(item['y_value']) || 0;
                
                if (groupedData[category]) {
                    groupedData[category] += value; // Sum values for same category
                } else {
                    groupedData[category] = value;
                }
            });

            const labels = Object.keys(groupedData);
            const values = Object.values(groupedData);

            return {
                labels,
                datasets: [{
                    label: yFieldLabel || yField,
                    data: values,
                    backgroundColor: colors[0],
                    borderColor: borderColors[0],
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            };
        }
    }, [data, xField, yField, yFieldLabel, isDarkMode, multiValue, isMultiValue, yFields, seriesLabels]);

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
                    pointStyle: 'rect',
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
            <Bar data={chartData} options={options} />
        </div>
    );
};

export default BarChart;
