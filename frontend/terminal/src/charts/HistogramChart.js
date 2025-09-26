import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useDarkMode } from '../hooks/useDarkMode';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const HistogramChart = ({ 
    data, 
    xField, 
    yField, 
    xFieldLabel,
    yFieldLabel,
    title = "Histogram",
    height = 300,
    showLegend = true,
    bins = 10, // Number of bins for histogram
    // Multi-valued support
    yFields = null, // Array of Y field names for multiple series
    seriesLabels = null, // Array of labels for each series
    multiValue = false, // Enable multi-valued mode
    isMultiValue = false // Backend indicates multi-value data
}) => {
    // Use custom dark mode hook for reactive theme detection
    const isDarkMode = useDarkMode();

    const chartData = useMemo(() => {
        console.log('📊 HistogramChart - Received data:', { 
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

        // Function to create histogram bins
        const createHistogram = (values, numBins) => {
            const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
            if (numericValues.length === 0) return { labels: [], counts: [] };

            const min = Math.min(...numericValues);
            const max = Math.max(...numericValues);
            const binWidth = (max - min) / numBins;

            const bins = Array(numBins).fill(0);
            const labels = [];

            // Create bin labels
            for (let i = 0; i < numBins; i++) {
                const binStart = min + (i * binWidth);
                const binEnd = min + ((i + 1) * binWidth);
                labels.push(`${binStart.toFixed(1)}-${binEnd.toFixed(1)}`);
            }

            // Count values in each bin
            numericValues.forEach(value => {
                const binIndex = Math.min(Math.floor((value - min) / binWidth), numBins - 1);
                bins[binIndex]++;
            });

            return { labels, counts: bins };
        };

        // Check if this is backend multi-value data (has y_value_* fields)
        const firstItem = data[0];
        const hasBackendMultiValueFields = firstItem && Object.keys(firstItem).some(key => key.startsWith('y_value_'));
        
        if (hasBackendMultiValueFields) {
            console.log('📊 HistogramChart - Backend multi-value mode detected:', { 
                firstDataItem: data[0],
                dataLength: data.length 
            });
            
            // Handle backend multi-value data format (y_value_0, y_value_1, etc.)
            const datasets = [];
            
            // Find all y_value_* fields in the first data item
            const yValueFields = Object.keys(firstItem).filter(key => key.startsWith('y_value_'));
            console.log('📊 HistogramChart - Found y_value fields:', yValueFields);
            
            yValueFields.forEach((fieldName, index) => {
                const values = data.map(item => parseFloat(item[fieldName]) || 0);
                const histogram = createHistogram(values, bins);
                const fieldLabel = seriesLabels && seriesLabels[index] ? seriesLabels[index] : `Series ${index + 1}`;
                
                console.log(`📊 HistogramChart - Processing backend field ${fieldName}:`, { 
                    fieldName, 
                    fieldLabel,
                    histogramBins: histogram.labels.length,
                    totalValues: values.length
                });

                datasets.push({
                    label: fieldLabel,
                    data: histogram.counts,
                    backgroundColor: colors[index % colors.length],
                    borderColor: borderColors[index % borderColors.length],
                    borderWidth: 1,
                    barThickness: 'flex',
                    maxBarThickness: 50,
                });
            });

            // Use the first histogram's labels (they should all be the same)
            const firstValues = data.map(item => parseFloat(item[yValueFields[0]]) || 0);
            const firstHistogram = createHistogram(firstValues, bins);

            const chartData = {
                labels: firstHistogram.labels,
                datasets
            };
            console.log('📊 HistogramChart - Final backend chart data:', chartData);
            return chartData;
        } else if ((multiValue || isMultiValue) && yFields && yFields.length > 0) {
            console.log('📊 HistogramChart - Frontend multi-value mode:', { yFields, seriesLabels });
            
            // Frontend multi-value mode
            const datasets = [];
            
            yFields.forEach((fieldName, index) => {
                const values = data.map(item => parseFloat(item[fieldName]) || 0);
                const histogram = createHistogram(values, bins);
                const fieldLabel = seriesLabels && seriesLabels[index] ? seriesLabels[index] : fieldName;

                datasets.push({
                    label: fieldLabel,
                    data: histogram.counts,
                    backgroundColor: colors[index % colors.length],
                    borderColor: borderColors[index % borderColors.length],
                    borderWidth: 1,
                    barThickness: 'flex',
                    maxBarThickness: 50,
                });
            });

            // Use the first histogram's labels
            const firstValues = data.map(item => parseFloat(item[yFields[0]]) || 0);
            const firstHistogram = createHistogram(firstValues, bins);

            return {
                labels: firstHistogram.labels,
                datasets
            };
        } else {
            // Single value mode
            const values = data.map(item => parseFloat(item[yField]) || 0);
            const histogram = createHistogram(values, bins);

            return {
                labels: histogram.labels,
                datasets: [{
                    label: yFieldLabel || yField || 'Frequency',
                    data: histogram.counts,
                    backgroundColor: colors[0],
                    borderColor: borderColors[0],
                    borderWidth: 1,
                    barThickness: 'flex',
                    maxBarThickness: 50,
                }]
            };
        }
    }, [data, xField, yField, yFields, seriesLabels, isMultiValue, multiValue, bins, xFieldLabel, yFieldLabel]);

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
                            return `Range: ${context[0].label}`;
                        },
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y} items`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: xFieldLabel || xField || 'Value Range',
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
                        text: yFieldLabel || 'Frequency',
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
                        beginAtZero: true,
                        precision: 0
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
                <div className="empty-icon">📊</div>
                <h3>No Data to Display</h3>
                <p>Select fields to create your histogram</p>
            </div>
        );
    }

    return (
        <div style={{ height: height, width: '100%' }}>
            <Bar data={chartData} options={chartOptions} />
        </div>
    );
};

export default HistogramChart;
