import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DelayAnalysisDisplay = ({ onClose }) => {
  const [delayData, setDelayData] = useState(null);
  const [selectedView, setSelectedView] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDelayData();
  }, []);

  const loadDelayData = async () => {
    try {
      console.log('Loading delay analysis data...');
      const response = await fetch('/delay_analysis_results.json');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Delay analysis data loaded:', data);
      setDelayData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading delay analysis data:', error);
      setLoading(false);
    }
  };

  const getBayChartData = () => {
    if (!delayData?.bay_analysis) return null;

    const bays = Object.keys(delayData.bay_analysis);
    const avgDelays = bays.map(bay => delayData.bay_analysis[bay].avg_delay);
    const shipmentCounts = bays.map(bay => delayData.bay_analysis[bay].shipment_count);

    return {
      labels: bays,
      datasets: [
        {
          label: 'Average Delay (minutes)',
          data: avgDelays,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1
        },
        {
          label: 'Shipment Count',
          data: shipmentCounts,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
          yAxisID: 'y1'
        }
      ]
    };
  };

  const getProductChartData = () => {
    if (!delayData?.product_analysis) return null;

    const products = Object.keys(delayData.product_analysis).slice(0, 8); // Top 8 products
    const avgDelays = products.map(product => delayData.product_analysis[product].avg_delay);

    return {
      labels: products,
      datasets: [
        {
          label: 'Average Delay (minutes)',
          data: avgDelays,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  const getHourlyChartData = () => {
    if (!delayData?.time_pattern_analysis?.hourly) return null;

    const hours = Object.keys(delayData.time_pattern_analysis.hourly).sort((a, b) => parseInt(a) - parseInt(b));
    const avgDelays = hours.map(hour => delayData.time_pattern_analysis.hourly[hour].avg_delay);

    return {
      labels: hours.map(h => `${h}:00`),
      datasets: [
        {
          label: 'Average Delay (minutes)',
          data: avgDelays,
          backgroundColor: 'rgba(168, 85, 247, 0.8)',
          borderColor: 'rgba(168, 85, 247, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  const getChartOptions = (title, hasSecondaryAxis = false) => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: 11,
              weight: '500'
            }
          }
        },
        title: {
          display: true,
          text: title,
          font: {
            size: 14,
            weight: 'bold'
          },
          padding: 15
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: hasSecondaryAxis ? 'Bay' : 'Time/Product',
            font: {
              weight: 'bold',
              size: 12
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            font: {
              size: 10
            }
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Delay (minutes)',
            font: {
              weight: 'bold',
              size: 12
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            font: {
              size: 10
            }
          }
        },
        ...(hasSecondaryAxis && {
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Shipment Count',
              font: {
                weight: 'bold',
                size: 12
              }
            },
            grid: {
              drawOnChartArea: false,
            },
            ticks: {
              font: {
                size: 10
              }
            }
          }
        })
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    };
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'High': return '🔴';
      case 'Medium': return '🟡';
      case 'Low': return '🟢';
      default: return '📊';
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading delay analysis data...</p>
        </div>
      </div>
    );
  }

  if (!delayData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⏱️</div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Delay Analysis Data Unavailable
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Unable to load delay analysis data. Please check the data source.
          </p>
          <button 
            onClick={loadDelayData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Loading Data
          </button>
        </div>
      </div>
    );
  }

  const bayChartData = getBayChartData();
  const productChartData = getProductChartData();
  const hourlyChartData = getHourlyChartData();

  return (
    <div className="h-full bg-white dark:bg-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Terminal Delay Analysis
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Comprehensive analysis of fuel terminal delays and bottlenecks
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Critical Analysis</span>
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

      {/* Key Metrics */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {delayData.overall_statistics?.overall_stats?.average_delay_minutes?.toFixed(1) || 'N/A'}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Avg Delay (min)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {delayData.overall_statistics?.overall_stats?.total_shipments?.toLocaleString() || 'N/A'}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Total Shipments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {delayData.overall_statistics?.overall_stats?.on_time_percentage === 0 ? '0%' : 
               (delayData.overall_statistics?.overall_stats?.on_time_percentage * 100).toFixed(1) + '%'}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">On-Time Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {delayData.summary?.total_delay_hours?.toFixed(0) || 'N/A'}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Total Delay Hours</div>
          </div>
        </div>
      </div>

      {/* View Controls */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Analysis View:</label>
            <select
              value={selectedView}
              onChange={(e) => setSelectedView(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="overview">Overview</option>
              <option value="bay">Bay Analysis</option>
              <option value="product">Product Analysis</option>
              <option value="hourly">Hourly Patterns</option>
            </select>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="flex-1 p-4 overflow-auto">
        {selectedView === 'overview' && (
          <div className="h-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              <div className="h-96">
                {bayChartData && (
                  <Bar data={bayChartData} options={getChartOptions('Bay Performance Analysis', true)} />
                )}
              </div>
              <div className="h-96">
                {hourlyChartData && (
                  <Bar data={hourlyChartData} options={getChartOptions('Hourly Delay Patterns')} />
                )}
              </div>
            </div>
          </div>
        )}

        {selectedView === 'bay' && bayChartData && (
          <div className="h-full">
            <div className="h-96">
              <Bar data={bayChartData} options={getChartOptions('Bay Performance Analysis', true)} />
            </div>
          </div>
        )}

        {selectedView === 'product' && productChartData && (
          <div className="h-full">
            <div className="h-96">
              <Bar data={productChartData} options={getChartOptions('Product Delay Analysis')} />
            </div>
          </div>
        )}

        {selectedView === 'hourly' && hourlyChartData && (
          <div className="h-full">
            <div className="h-96">
              <Bar data={hourlyChartData} options={getChartOptions('Hourly Delay Patterns')} />
            </div>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {delayData.recommendations && delayData.recommendations.length > 0 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Key Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {delayData.recommendations.map((rec, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getPriorityIcon(rec.priority)}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{rec.category}</h4>
                    <p className="text-sm mb-2">{rec.recommendation}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded">
                        {rec.priority} Priority
                      </span>
                      <span className="text-xs font-medium px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded">
                        {rec.impact} Impact
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              {delayData.summary?.worst_performing_bay || 'N/A'}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Worst Bay</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {delayData.summary?.worst_performing_product || 'N/A'}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Worst Product</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
              {delayData.summary?.worst_performing_hour || 'N/A'}:00
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Worst Hour</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {delayData.summary?.worst_performing_day || 'N/A'}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Worst Day</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DelayAnalysisDisplay;
