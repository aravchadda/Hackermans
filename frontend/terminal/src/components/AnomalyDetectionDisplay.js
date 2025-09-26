import React, { useState, useEffect } from 'react';

const AnomalyDetectionDisplay = () => {
  const [anomalyData, setAnomalyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('summary');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    // Load anomaly data from JSON file
    const loadAnomalyData = async () => {
      try {
        const response = await fetch('/anomaly_results.json');
        const data = await response.json();
        setAnomalyData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading anomaly data:', error);
        setLoading(false);
      }
    };

    loadAnomalyData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-stone-300">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black text-lg font-medium">Loading Anomaly Data...</p>
        </div>
      </div>
    );
  }

  if (!anomalyData) {
    return (
      <div className="h-full flex items-center justify-center bg-stone-300">
        <div className="text-center">
          <p className="text-red-600 text-lg font-medium">Failed to load anomaly data</p>
        </div>
      </div>
    );
  }

  const { summary, anomaly_patterns, anomaly_records } = anomalyData;
  const totalPages = Math.ceil(anomaly_records.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentRecords = anomaly_records.slice(startIndex, endIndex);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAnomalySeverity = (score) => {
    if (score < -0.05) return { level: 'High', color: 'text-red-600', bg: 'bg-red-100' };
    if (score < -0.02) return { level: 'Medium', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { level: 'Low', color: 'text-yellow-600', bg: 'bg-yellow-100' };
  };

  return (
    <div className="h-full bg-stone-300 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-black border-b-2 border-red-500 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white mb-2">ANOMALY DETECTION</h1>
            <p className="text-white/80 text-lg">Advanced pattern recognition and outlier identification</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-white/60 text-sm">Last Updated</p>
              <p className="text-white text-lg font-medium">{summary.detection_timestamp}</p>
            </div>
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-black border-b border-red-500">
        <div className="flex">
          {[
            { id: 'summary', label: 'Summary' },
            { id: 'patterns', label: 'Patterns' },
            { id: 'records', label: 'Anomaly Records' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedView(tab.id)}
              className={`px-6 py-4 text-sm font-medium transition-all duration-200 ${
                selectedView === tab.id
                  ? 'bg-red-500 text-white border-b-2 border-white'
                  : 'text-white/70 hover:text-white hover:bg-red-500/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6">
        {selectedView === 'summary' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Key Metrics */}
            <div className="bg-black border-2 border-red-500 rounded-xl p-6">
              <div className="text-center">
                <div className="text-4xl font-black text-white mb-2">{summary.total_records.toLocaleString()}</div>
                <div className="text-white/80 text-sm font-medium">Total Records</div>
              </div>
            </div>

            <div className="bg-black border-2 border-red-500 rounded-xl p-6">
              <div className="text-center">
                <div className="text-4xl font-black text-red-500 mb-2">{summary.anomaly_count.toLocaleString()}</div>
                <div className="text-white/80 text-sm font-medium">Anomalies Detected</div>
              </div>
            </div>

            <div className="bg-black border-2 border-red-500 rounded-xl p-6">
              <div className="text-center">
                <div className="text-4xl font-black text-orange-500 mb-2">{summary.anomaly_percentage}%</div>
                <div className="text-white/80 text-sm font-medium">Anomaly Rate</div>
              </div>
            </div>

            <div className="bg-black border-2 border-red-500 rounded-xl p-6">
              <div className="text-center">
                <div className="text-2xl font-black text-white mb-2">3.3 Years</div>
                <div className="text-white/80 text-sm font-medium">Analysis Period</div>
              </div>
            </div>

            {/* Date Range */}
            <div className="bg-black border-2 border-red-500 rounded-xl p-6 col-span-full">
              <h3 className="text-xl font-bold text-white mb-4">Analysis Period</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-white/60 text-sm">Start Date</p>
                  <p className="text-white text-lg font-medium">{formatDate(summary.date_range.start)}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">End Date</p>
                  <p className="text-white text-lg font-medium">{formatDate(summary.date_range.end)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'patterns' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Patterns */}
            <div className="bg-black border-2 border-red-500 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Hourly Anomaly Distribution</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(anomaly_patterns.hourly_frequency)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 10)
                  .map(([hour, count]) => (
                    <div key={hour} className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">{hour}:00</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-stone-600 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{ width: `${(count / 533) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-white text-sm font-medium w-12 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Daily Patterns */}
            <div className="bg-black border-2 border-red-500 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Daily Anomaly Distribution</h3>
              <div className="space-y-2">
                {Object.entries(anomaly_patterns.daily_frequency)
                  .sort(([,a], [,b]) => b - a)
                  .map(([day, count]) => (
                    <div key={day} className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">{day}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-stone-600 rounded-full h-2">
                          <div 
                            className="bg-orange-500 h-2 rounded-full" 
                            style={{ width: `${(count / 1704) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-white text-sm font-medium w-12 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Bay Patterns */}
            <div className="bg-black border-2 border-red-500 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Bay Anomaly Distribution</h3>
              <div className="space-y-2">
                {Object.entries(anomaly_patterns.bay_frequency)
                  .sort(([,a], [,b]) => b - a)
                  .map(([bay, count]) => (
                    <div key={bay} className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">{bay}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-stone-600 rounded-full h-2">
                          <div 
                            className="bg-yellow-500 h-2 rounded-full" 
                            style={{ width: `${(count / 3253) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-white text-sm font-medium w-12 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Product Patterns */}
            <div className="bg-black border-2 border-red-500 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Product Anomaly Distribution</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(anomaly_patterns.product_frequency)
                  .sort(([,a], [,b]) => b - a)
                  .map(([product, count]) => (
                    <div key={product} className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">{product}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-stone-600 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${(count / 2183) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-white text-sm font-medium w-12 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {selectedView === 'records' && (
          <div className="bg-black border-2 border-red-500 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Anomaly Records</h3>
              <div className="text-white/60 text-sm">
                Showing {startIndex + 1}-{Math.min(endIndex, anomaly_records.length)} of {anomaly_records.length}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-red-500">
                    <th className="text-left text-white/80 text-sm font-medium py-3 px-4">Shipment ID</th>
                    <th className="text-left text-white/80 text-sm font-medium py-3 px-4">Date</th>
                    <th className="text-left text-white/80 text-sm font-medium py-3 px-4">Bay</th>
                    <th className="text-left text-white/80 text-sm font-medium py-3 px-4">Product</th>
                    <th className="text-left text-white/80 text-sm font-medium py-3 px-4">Score</th>
                    <th className="text-left text-white/80 text-sm font-medium py-3 px-4">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.map((record, index) => {
                    const severity = getAnomalySeverity(record.anomaly_score);
                    return (
                      <tr key={index} className="border-b border-stone-600 hover:bg-stone-700/20">
                        <td className="py-3 px-4 text-white text-sm font-mono">
                          {record.shipment_id.substring(0, 8)}...
                        </td>
                        <td className="py-3 px-4 text-white/80 text-sm">
                          {formatDate(record.scheduled_date)}
                        </td>
                        <td className="py-3 px-4 text-white/80 text-sm">
                          {record.bay_code}
                        </td>
                        <td className="py-3 px-4 text-white/80 text-sm">
                          {record.base_product_code}
                        </td>
                        <td className="py-3 px-4 text-white/80 text-sm font-mono">
                          {record.anomaly_score.toFixed(4)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${severity.bg} ${severity.color}`}>
                            {severity.level}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-stone-600 disabled:text-stone-400 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-white/80 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-stone-600 disabled:text-stone-400 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnomalyDetectionDisplay;
