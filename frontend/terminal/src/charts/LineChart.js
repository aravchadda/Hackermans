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

        // Use unified approach: only render multiple lines when explicitly multi-value
        if (data && data.length > 0) {
            console.log('📈 LineChart - Processing data:', { 
                firstDataItem: data[0],
                dataLength: data.length 
            });
            
            // For very large datasets (>10k points), sample the data for better performance
            let processedData = data;
            if (data.length > 10000) {
                console.log(`📈 LineChart - Large dataset (${data.length} points), sampling to 10000 points for performance`);
                // Sample evenly across the dataset
                const sampleRate = Math.ceil(data.length / 10000);
                processedData = data.filter((_, index) => index % sampleRate === 0);
                console.log(`📈 LineChart - Sampled to ${processedData.length} points`);
            }
            
            // Determine fields present
            const firstItem = processedData[0];
            const yValueFields = Object.keys(firstItem).filter(key => key.startsWith('y_value_'));
            
            // Helper function to parse date values - backend now sends date-only format (YYYY-MM-DD)
            const parseDate = (value) => {
                if (!value) return null;
                // If it's already a Date object
                if (value instanceof Date) return value;
                // If it's a date string
                if (typeof value === 'string') {
                    let dateStr = value.trim();
                    
                    // Backend sends date-only format (YYYY-MM-DD), parse directly
                    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        const date = new Date(dateStr + 'T00:00:00');
                        if (!isNaN(date.getTime())) {
                            return date;
                        }
                    }
                    // If it has time component, extract just the date part
                    else if (dateStr.includes('T') || dateStr.includes(' ')) {
                        const dateOnly = dateStr.split('T')[0].split(' ')[0];
                        if (dateOnly.match(/^\d{4}-\d{2}-\d{2}$/)) {
                            const date = new Date(dateOnly + 'T00:00:00');
                            if (!isNaN(date.getTime())) {
                                return date;
                            }
                        }
                    }
                    // Try parsing as-is
                    else {
                        const date = new Date(dateStr);
                        if (!isNaN(date.getTime())) {
                            return date;
                        }
                    }
                }
                return null;
            };

            // Check if x_value is a date/datetime field (for time scale)
            // Backend now sends all datetime columns as date-only format (YYYY-MM-DD)
            const firstXValue = processedData[0]?.['x_value'];
            const isTimeScale = firstXValue && (
                firstXValue.match(/^\d{4}-\d{2}-\d{2}/) || // Date format (YYYY-MM-DD)
                firstXValue.includes('T') ||  // ISO datetime format
                firstXValue.includes(' ') ||  // SQL Server format
                firstXValue instanceof Date
            );

            // If explicitly multi-value and we truly have multiple series, build multiple datasets
            if ((multiValue || isMultiValue) && yValueFields.length > 1) {
                console.log('📈 LineChart - Multi-series mode with fields:', yValueFields);
                const datasets = yValueFields.map((fieldName, index) => {
                    // For time scale, use {x, y} pairs; otherwise use separate arrays
                    let dataPoints;
                    if (isTimeScale) {
                        dataPoints = processedData
                            .map(item => {
                                const xVal = parseDate(item['x_value']);
                                const yVal = parseFloat(item[fieldName]) || 0;
                                if (xVal === null) return null;
                                return { x: xVal, y: yVal };
                            })
                            .filter(point => point !== null)
                            .sort((a, b) => a.x.getTime() - b.x.getTime()); // Sort by x value for time scale
                    } else {
                        dataPoints = processedData.map(item => parseFloat(item[fieldName]) || 0);
                    }
                    
                    const labels = isTimeScale ? undefined : processedData.map(item => {
                        const xVal = item['x_value'];
                        return xVal || 'Unknown';
                    });
                    
                    const fieldLabel = seriesLabels && seriesLabels[index] ? seriesLabels[index] : `Series ${index + 1}`;
                    return {
                        label: fieldLabel,
                        data: dataPoints,
                        borderColor: lineColors[index % lineColors.length],
                        backgroundColor: fillArea ? fillColors[index % fillColors.length] : 'transparent',
                        borderWidth: 3,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        pointBackgroundColor: 'transparent',
                        pointBorderColor: 'transparent',
                        pointBorderWidth: 0,
                        fill: fillArea,
                        tension: 0.4,
                    };
                });
                return { labels: isTimeScale ? undefined : processedData.map(item => item['x_value'] || 'Unknown'), datasets };
            }

            // Otherwise force single-series: prefer y_value, fallback to y_value_0
            const valueField = firstItem.hasOwnProperty('y_value') ? 'y_value' : 'y_value_0';
            
            // For time scale, use {x, y} pairs; otherwise use separate arrays
            let dataPoints;
            if (isTimeScale) {
                dataPoints = processedData
                    .map(item => {
                        const xVal = parseDate(item['x_value']);
                        const yVal = parseFloat(item[valueField]) || 0;
                        if (xVal === null) return null;
                        return { x: xVal, y: yVal };
                    })
                    .filter(point => point !== null)
                    .sort((a, b) => a.x.getTime() - b.x.getTime()); // Sort by x value for time scale
                console.log('📈 LineChart - Time scale data points:', dataPoints.length, 'First point:', dataPoints[0]);
            } else {
                dataPoints = processedData.map(item => parseFloat(item[valueField]) || 0);
            }
            
            const labels = isTimeScale ? undefined : processedData.map(item => {
                const xVal = item['x_value'];
                return xVal || 'Unknown';
            });
            
            const dataset = {
                label: yFieldLabel || yField || 'Series',
                data: dataPoints,
                borderColor: lineColors[0],
                backgroundColor: fillArea ? fillColors[0] : 'transparent',
                borderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 0,
                pointBackgroundColor: 'transparent',
                pointBorderColor: 'transparent',
                pointBorderWidth: 0,
                fill: fillArea,
                tension: 0.4,
            };
            return { labels, datasets: [dataset] };
        }
    }, [data, xField, yField, yFieldLabel, fillArea, isDarkMode, multiValue, isMultiValue, yFields, seriesLabels]);

    // Derive labels and intelligent axis settings to avoid overlap
    const xLabels = useMemo(() => {
        if (!data || !Array.isArray(data) || data.length === 0) return [];
        // Extract x_value from data items
        return data.map(d => d?.x_value).filter(Boolean);
    }, [data]);
    
    const spanDays = useMemo(() => {
        if (xLabels.length < 2) return 0;
        const parse = (s) => {
            // Handle both date-only and datetime strings
            if (!s) return 0;
            // If it's already a Date object
            if (s instanceof Date) return s.getTime();
            // If it's already a datetime string, parse it directly
            if (typeof s === 'string' && (s.includes('T') || s.includes(' '))) {
                return new Date(s).getTime();
            }
            // If it's date-only, append time
            if (typeof s === 'string' && s.match(/^\d{4}-\d{2}-\d{2}/)) {
                return new Date(s + 'T00:00:00Z').getTime();
            }
            return 0;
        };
        const first = parse(xLabels[0]);
        const last = parse(xLabels[xLabels.length - 1]);
        return Math.max(0, Math.round((last - first) / 86400000));
    }, [xLabels]);
    const timeUnit = useMemo(() => {
        if (spanDays > 365) return 'month';
        if (spanDays > 90) return 'week';
        return 'day';
    }, [spanDays]);
    const xMaxTicks = useMemo(() => {
        const n = xLabels.length;
        if (n <= 8) return n;
        if (n <= 20) return 10;
        if (n <= 60) return 12;
        if (n <= 180) return 14;
        return 16;
    }, [xLabels]);

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
                    // Backend now sends all datetime columns as date-only format (YYYY-MM-DD)
                    parser: function(value) {
                        if (!value) return null;
                        // If it's already a Date object
                        if (value instanceof Date) return value;
                        
                        if (typeof value === 'string') {
                            let dateStr = value.trim();
                            
                            // Handle date-only format (YYYY-MM-DD) - primary format from backend
                            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                const date = new Date(dateStr + 'T00:00:00');
                                if (!isNaN(date.getTime())) {
                                    return date;
                                }
                            }
                            // If it has time component, extract just the date part
                            else if (dateStr.includes('T') || dateStr.includes(' ')) {
                                const dateOnly = dateStr.split('T')[0].split(' ')[0];
                                if (dateOnly.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                    const date = new Date(dateOnly + 'T00:00:00');
                                    if (!isNaN(date.getTime())) {
                                        return date;
                                    }
                                }
                            }
                            // Try parsing as-is
                            else {
                                const date = new Date(dateStr);
                                if (!isNaN(date.getTime())) {
                                    return date;
                                }
                            }
                        }
                        return null;
                    },
                    tooltipFormat: 'MMM d, yyyy', // Date-only format, no time
                    unit: timeUnit,
                    displayFormats: {
                        day: 'MMM d, yyyy',
                        week: 'MMM d, yyyy',
                        month: 'MMM yyyy',
                        year: 'yyyy'
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
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                    autoSkip: true,
                    autoSkipPadding: 16,
                    maxRotation: 0,
                    minRotation: 0,
                    maxTicksLimit: xMaxTicks,
                    sampleSize: xMaxTicks
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

    console.log('📈 LineChart - Final chartData structure:', {
        labels: chartData.labels?.length || 0,
        datasets: chartData.datasets?.length || 0,
        firstDataset: chartData.datasets?.[0],
        firstDataPoint: chartData.datasets?.[0]?.data?.[0],
        firstDataPointType: typeof chartData.datasets?.[0]?.data?.[0]
    });

    return (
        <div style={{ height: '100%', width: '100%', minHeight: height }}>
            <Line data={chartData} options={options} />
        </div>
    );
};

export default LineChart;
