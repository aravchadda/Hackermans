import React, { useState } from 'react';

const CSVImportModal = ({ isOpen, onClose, onImport }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [tableName, setTableName] = useState('shipments');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setError('');
    } else {
      setError('Please select a valid CSV file');
      setSelectedFile(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Please select a CSV file');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('csvFile', selectedFile);
      formData.append('tableName', tableName);

      const response = await fetch('http://localhost:4000/api/import/csv', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(`Successfully imported ${result.recordCount} records to ${result.tableName} table`);
        setShowSuccessAnimation(true);
        onImport(result);
        
        // Reset form after animation
        setTimeout(() => {
          setSelectedFile(null);
          setTableName('shipments');
          setShowSuccessAnimation(false);
        }, 3000);
        
        // Close modal after showing success
        setTimeout(() => {
          onClose();
        }, 4000);
      } else {
        setError(result.error || 'Import failed');
      }
    } catch (error) {
      setError('Failed to import CSV: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setTableName('shipments');
    setError('');
    setSuccess('');
    setShowSuccessAnimation(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes progressBar {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}
      </style>
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Import CSV File
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Table Name Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Target Table
            </label>
            <select
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="shipments">Shipments</option>
              <option value="sample_data">Sample Data</option>
            </select>
          </div>

          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
            </div>
          )}

          {/* Success Animation */}
          {showSuccessAnimation && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative">
                {/* Animated Checkmark */}
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                  <svg 
                    className="w-8 h-8 text-white animate-bounce" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={3} 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                </div>
                
                {/* Ripple Effect */}
                <div className="absolute inset-0 w-16 h-16 bg-green-500 rounded-full animate-ping opacity-20"></div>
                <div className="absolute inset-0 w-16 h-16 bg-green-500 rounded-full animate-ping opacity-10" style={{animationDelay: '0.5s'}}></div>
                
                {/* Confetti Effect */}
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="absolute -top-1 -right-2 w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                <div className="absolute -bottom-2 -left-1 w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.6s'}}></div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.8s'}}></div>
              </div>
              
              {/* Success Text with Animation */}
              <div className="mt-4 text-center">
                <h3 
                  className="text-lg font-semibold text-green-700 dark:text-green-300"
                  style={{
                    animation: 'fadeIn 0.6s ease-out forwards',
                    opacity: 0,
                    transform: 'translateY(10px)'
                  }}
                >
                  Upload Successful!
                </h3>
                <p 
                  className="text-sm text-green-600 dark:text-green-400 mt-1"
                  style={{
                    animation: 'fadeIn 0.6s ease-out 0.3s forwards',
                    opacity: 0,
                    transform: 'translateY(10px)'
                  }}
                >
                  Your data has been imported to the database
                </p>
              </div>
              
              {/* Progress Bar Animation */}
              <div className="w-full max-w-xs mt-4">
                <div className="h-2 bg-green-200 dark:bg-green-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{
                      animation: 'progressBar 2s ease-out forwards',
                      width: '0%'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!selectedFile || isLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed rounded-md transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importing...
                </>
              ) : (
                'Import CSV'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default CSVImportModal;
