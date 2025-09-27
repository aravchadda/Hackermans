import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PredictiveForecastingDisplay = ({ onClose }) => {
  const [forecastingData, setForecastingData] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('flow_rate_forecast');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [businessInsights, setBusinessInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);

  useEffect(() => {
    loadForecastingData();
  }, []);

  // Cleanup chart on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  const loadForecastingData = async () => {
    try {
      console.log('Loading forecasting data...');
      const response = await fetch('/comprehensive_forecasting_charts.json');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Get text first to handle NaN values
      const text = await response.text();
      console.log('Raw response text length:', text.length);
      
      // Replace NaN values with null for valid JSON
      const cleanedText = text.replace(/NaN/g, 'null');
      console.log('Cleaned text length:', cleanedText.length);
      
      const data = JSON.parse(cleanedText);
      console.log('Forecasting data loaded:', data);
      setForecastingData(data.comprehensive_forecasting_charts);
      generateBusinessInsights(data.comprehensive_forecasting_charts);
      setLoading(false);
    } catch (error) {
      console.error('Error loading forecasting data:', error);
      setLoading(false);
    }
  };

  const generateBusinessInsights = (data) => {
    const insights = [];
    
    // Analyze flow rate trends
    if (data.general_forecasts?.flow_rate_forecast) {
      const flowData = data.general_forecasts.flow_rate_forecast;
      const historicalData = flowData.data.datasets[0]?.data || [];
      const forecastData = flowData.data.datasets[1]?.data || [];
      
      const recentHistorical = historicalData.slice(-30).filter(d => d !== null && d !== undefined);
      const upcomingForecast = forecastData.slice(-7).filter(d => d !== null && d !== undefined);
      
      if (recentHistorical.length > 0 && upcomingForecast.length > 0) {
        const avgHistorical = recentHistorical.reduce((a, b) => a + b, 0) / recentHistorical.length;
        const avgForecast = upcomingForecast.reduce((a, b) => a + b, 0) / upcomingForecast.length;
        const changePercent = ((avgForecast - avgHistorical) / avgHistorical) * 100;
        
        insights.push({
          type: 'trend',
          title: 'Flow Rate Trend Analysis',
          impact: changePercent > 10 ? 'high' : changePercent > 5 ? 'medium' : 'low',
          message: `Flow rate is ${changePercent > 0 ? 'increasing' : 'decreasing'} by ${Math.abs(changePercent).toFixed(1)}%`,
          recommendation: changePercent > 10 ? 'Consider scaling up operations' : 
                        changePercent < -10 ? 'Review capacity planning' : 'Monitor closely'
        });
      }
    }

    // Analyze gross quantity trends
    if (data.general_forecasts?.gross_quantity_forecast) {
      const quantityData = data.general_forecasts.gross_quantity_forecast;
      const historicalData = quantityData.data.datasets[0]?.data || [];
      const forecastData = quantityData.data.datasets[1]?.data || [];
      
      const recentHistorical = historicalData.slice(-30).filter(d => d !== null && d !== undefined);
      const upcomingForecast = forecastData.slice(-7).filter(d => d !== null && d !== undefined);
      
      if (recentHistorical.length > 0 && upcomingForecast.length > 0) {
        const totalHistorical = recentHistorical.reduce((a, b) => a + b, 0);
        const totalForecast = upcomingForecast.reduce((a, b) => a + b, 0);
        const projectedIncrease = ((totalForecast - totalHistorical) / totalHistorical) * 100;
        
        insights.push({
          type: 'volume',
          title: 'Volume Projection',
          impact: projectedIncrease > 20 ? 'high' : projectedIncrease > 10 ? 'medium' : 'low',
          message: `Projected volume ${projectedIncrease > 0 ? 'increase' : 'decrease'} of ${Math.abs(projectedIncrease).toFixed(1)}%`,
          recommendation: projectedIncrease > 20 ? 'Prepare for increased demand' : 
                        projectedIncrease < -20 ? 'Review inventory management' : 'Maintain current levels'
        });
      }
    }

    setBusinessInsights(insights);
  };

  const getChartData = () => {
    if (!forecastingData) {
      console.log('No forecasting data available');
      return null;
    }

    let chartData;
    if (selectedProduct && forecastingData.individual_product_forecasts) {
      chartData = forecastingData.individual_product_forecasts[`product_${selectedProduct}_flow_rate`];
    } else {
      chartData = forecastingData.general_forecasts?.[selectedMetric];
    }

    console.log('Chart data:', chartData);
    if (!chartData) {
      console.log('No chart data found for metric:', selectedMetric);
      return null;
    }

    return {
      labels: chartData.data.labels, // Keep as strings for now
      datasets: chartData.data.datasets.map((dataset, index) => ({
        ...dataset,
        data: dataset.data.map(value => value === null ? null : value), // Ensure null values are handled
        borderWidth: index === 0 ? 2 : 3,
        pointRadius: index === 0 ? 2 : 0,
        pointHoverRadius: index === 0 ? 4 : 2,
        tension: index === 0 ? 0.1 : 0.3,
        fill: index === 2 ? '+1' : false,
        backgroundColor: index === 2 ? 'rgba(99, 102, 241, 0.1)' : undefined
      }))
    };
  };

  const getChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      aspectRatio: 1.8, // Wider aspect ratio for better spread
      layout: {
        padding: {
          top: 20,
          bottom: 20,
          left: 20,
          right: 20
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 10,
            font: {
              size: 10,
              weight: '500'
            }
          }
        },
        title: {
          display: true,
          text: selectedProduct ? 
            `Product ${selectedProduct} Flow Rate Forecast` : 
            'Flow Rate Forecast with 95% Confidence Interval',
          font: {
            size: 12,
            weight: 'bold'
          },
          padding: 10
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          callbacks: {
            title: function(context) {
              const date = new Date(context[0].label);
              return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              });
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Date',
            font: {
              weight: 'bold',
              size: 11
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
            drawBorder: true
          },
          ticks: {
            maxTicksLimit: 15, // More ticks for better spread
            font: {
              size: 9
            },
            maxRotation: 45, // Rotate labels for better readability
            minRotation: 0,
            callback: function(value, index, ticks) {
              const label = this.getLabelForValue(value);
              const date = new Date(label);
              return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              });
            }
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Units/Hour',
            font: {
              weight: 'bold',
              size: 11
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
            drawBorder: true
          },
          ticks: {
            font: {
              size: 9
            }
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    };
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImpactIcon = (impact) => {
    switch (impact) {
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return '✅';
      default: return '📊';
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading forecasting data...</p>
        </div>
      </div>
    );
  }

  if (!forecastingData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Forecasting Data Unavailable
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Unable to load predictive forecasting data. Please check the data source.
          </p>
          <button 
            onClick={loadForecastingData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Loading Data
          </button>
        </div>
      </div>
    );
  }

  const chartData = getChartData();

  return (
    <div className="h-full bg-white dark:bg-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Predictive Forecasting Analytics
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              AI-driven future trend analysis and business impact assessment
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Live Analysis</span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Business Insights Panel */}
      {businessInsights.length > 0 && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Business Impact Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {businessInsights.map((insight, index) => (
              <div key={index} className={`p-3 rounded-lg border ${getImpactColor(insight.impact)}`}>
                <div className="flex items-start gap-2">
                  <span className="text-xl">{getImpactIcon(insight.impact)}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1 text-sm">{insight.title}</h4>
                    <p className="text-xs mb-1">{insight.message}</p>
                    <p className="text-xs font-medium opacity-80">{insight.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Metric:</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="flow_rate_forecast">Flow Rate</option>
              <option value="gross_quantity_forecast">Gross Quantity</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Product:</label>
            <select
              value={selectedProduct || ''}
              onChange={(e) => setSelectedProduct(e.target.value || null)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="">All Products</option>
              <option value="210403">Product 210403</option>
              <option value="231245">Product 231245</option>
              <option value="210404">Product 210404</option>
              <option value="231231">Product 231231</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 p-4">
        {chartData ? (
          <div className="h-full w-full" style={{ minHeight: '500px' }}>
            <Line 
              key={`${selectedMetric}-${selectedProduct}`}
              ref={chartRef}
              data={chartData} 
              options={getChartOptions()} 
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-slate-400 text-6xl mb-4">📈</div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                No Data Available
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Select a different metric or product to view forecasting data.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer with Key Metrics */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {(() => {
                const value = forecastingData?.general_forecasts?.flow_rate_forecast?.data?.datasets?.[1]?.data?.slice(-1)[0];
                return value !== null && value !== undefined ? value.toFixed(2) : 'N/A';
              })()}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Current Flow Rate (units/hr)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {(() => {
                const value = forecastingData?.general_forecasts?.gross_quantity_forecast?.data?.datasets?.[1]?.data?.slice(-1)[0];
                return value !== null && value !== undefined ? value.toFixed(0) : 'N/A';
              })()}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Projected Volume (units)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {businessInsights.length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Active Insights</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictiveForecastingDisplay;
