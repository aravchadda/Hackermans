import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const ChartRenderer = ({ 
    data, 
    chartType, 
    selectedFields, 
    rawFields 
}) => {
    // Process data for different chart types
    const chartData = useMemo(() => {
        if (!data || data.length === 0 || selectedFields.length === 0) {
            return null;
        }

        const fieldNames = selectedFields;
        const fieldTypes = rawFields.reduce((acc, field) => {
            acc[field.name || field] = field.type;
            return acc;
        }, {});

        // For bar and line charts
        if (chartType === 'bar' || chartType === 'line') {
            const labels = data.map((_, index) => `Item ${index + 1}`);
            const datasets = fieldNames.map((fieldName, index) => {
                const fieldType = fieldTypes[fieldName];
                const isNumeric = fieldType === 'quantitative';
                
                return {
                    label: fieldName,
                    data: data.map(item => {
                        const value = item[fieldName];
                        return isNumeric ? parseFloat(value) || 0 : index + 1;
                    }),
                    backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
                    borderColor: `hsl(${(index * 137.5) % 360}, 70%, 40%)`,
                    borderWidth: 2,
                    fill: chartType === 'line' && index === 0
                };
            });

            return {
                labels,
                datasets
            };
        }

        // For pie and doughnut charts
        if (chartType === 'pie' || chartType === 'doughnut') {
            const fieldName = fieldNames[0];
            const fieldType = fieldTypes[fieldName];
            
            if (fieldType === 'nominal') {
                // Count occurrences for categorical data
                const counts = {};
                data.forEach(item => {
                    const value = item[fieldName];
                    counts[value] = (counts[value] || 0) + 1;
                });

                return {
                    labels: Object.keys(counts),
                    datasets: [{
                        data: Object.values(counts),
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                };
            } else {
                // For numeric data, create ranges
                const values = data.map(item => parseFloat(item[fieldName]) || 0);
                const min = Math.min(...values);
                const max = Math.max(...values);
                const range = max - min;
                const step = range / 5;
                
                const ranges = [];
                for (let i = 0; i < 5; i++) {
                    const start = min + (i * step);
                    const end = min + ((i + 1) * step);
                    ranges.push(`${start.toFixed(1)}-${end.toFixed(1)}`);
                }

                const rangeCounts = new Array(5).fill(0);
                values.forEach(value => {
                    const rangeIndex = Math.min(Math.floor((value - min) / step), 4);
                    rangeCounts[rangeIndex]++;
                });

                return {
                    labels: ranges,
                    datasets: [{
                        data: rangeCounts,
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                };
            }
        }

        // For scatter plot (using line chart with points)
        if (chartType === 'scatter') {
            if (fieldNames.length >= 2) {
                const xField = fieldNames[0];
                const yField = fieldNames[1];
                
                return {
                    labels: data.map((_, index) => `Point ${index + 1}`),
                    datasets: [{
                        label: `${xField} vs ${yField}`,
                        data: data.map(item => ({
                            x: parseFloat(item[xField]) || 0,
                            y: parseFloat(item[yField]) || 0
                        })),
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }]
                };
            }
        }

        return null;
    }, [data, chartType, selectedFields, rawFields]);

    // Chart options
    const chartOptions = useMemo(() => {
        const baseOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1
                }
            },
            scales: chartType === 'scatter' ? {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: selectedFields[0] || 'X Axis'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: selectedFields[1] || 'Y Axis'
                    }
                }
            } : {
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        };

        return baseOptions;
    }, [chartType, selectedFields]);

    // Render appropriate chart based on type
    const renderChart = () => {
        if (!chartData) {
            return (
                <div className="chart-empty">
                    <div className="empty-icon">📊</div>
                    <h3>No Data to Display</h3>
                    <p>Select fields to create your visualization</p>
                </div>
            );
        }

        const chartProps = {
            data: chartData,
            options: chartOptions
        };

        switch (chartType) {
            case 'bar':
                return <Bar {...chartProps} />;
            case 'line':
                return <Line {...chartProps} />;
            case 'pie':
                return <Pie {...chartProps} />;
            case 'doughnut':
                return <Doughnut {...chartProps} />;
            case 'scatter':
                return <Line {...chartProps} />;
            default:
                return <Bar {...chartProps} />;
        }
    };

    return (
        <div className="chart-container">
            <div className="chart-wrapper">
                {renderChart()}
            </div>
            
            <style jsx>{`
                .chart-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }

                .chart-wrapper {
                    width: 100%;
                    height: 400px;
                    position: relative;
                }

                .chart-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #718096;
                    text-align: center;
                }

                .empty-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }

                .chart-empty h3 {
                    margin: 0 0 8px 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: #4a5568;
                }

                .chart-empty p {
                    margin: 0;
                    font-size: 14px;
                }
            `}</style>
        </div>
    );
};

export default ChartRenderer;
