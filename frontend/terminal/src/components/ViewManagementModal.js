import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const ViewManagementModal = ({ isOpen, onClose, onViewCreated }) => {
  const [views, setViews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedView, setSelectedView] = useState(null);
  const [editingCustomName, setEditingCustomName] = useState('');
  const [isEditingCustomName, setIsEditingCustomName] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadViews();
    }
  }, [isOpen]);

  const loadViews = async () => {
    setIsLoading(true);
    try {
      const viewsList = await apiService.getViews();
      setViews(viewsList);
    } catch (error) {
      setError('Failed to load views: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };


  const handleDeleteView = async (viewName) => {
    if (!window.confirm(`Are you sure you want to delete the view "${viewName}"?`)) {
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const result = await apiService.deleteView(viewName);
      if (result.success) {
        setSuccess('View deleted successfully!');
        await loadViews();
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(result.error || 'Failed to delete view');
      }
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Failed to delete view');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewClick = async (viewName) => {
    try {
      const view = await apiService.getView(viewName);
      setSelectedView(view);
      setEditingCustomName(view.customName || view.viewName);
      setIsEditingCustomName(false);
    } catch (error) {
      setError('Failed to load view details: ' + error.message);
    }
  };

  const handleUpdateCustomName = async () => {
    if (!selectedView) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await apiService.updateView(selectedView.viewName, {
        customName: editingCustomName.trim() || selectedView.viewName
      });
      
      if (result.success) {
        setSuccess('Custom name updated successfully!');
        // Reload the view
        await handleViewClick(selectedView.viewName);
        await loadViews();
        setIsEditingCustomName(false);
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(result.error || 'Failed to update custom name');
      }
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Failed to update custom name');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSuccess('');
    setSelectedView(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Manage Views
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && views.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-slate-600 dark:text-slate-400">Loading views...</p>
            </div>
          ) : views.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400">No views available.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {views.map((view) => (
                <div
                  key={view.view_name}
                  className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        {view.custom_name || view.view_name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        View: {view.view_name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                        Created: {new Date(view.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewClick(view.view_name)}
                        className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleDeleteView(view.view_name)}
                        className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
            </div>
          )}

          {/* View Details Modal */}
          {selectedView && (
            <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">{selectedView.viewName}</h3>
                  <button onClick={() => setSelectedView(null)} className="text-slate-400 hover:text-slate-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Custom Name</label>
                    {isEditingCustomName ? (
                      <div className="flex gap-2 items-center mt-2">
                        <input
                          type="text"
                          value={editingCustomName}
                          onChange={(e) => setEditingCustomName(e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateCustomName();
                            } else if (e.key === 'Escape') {
                              setIsEditingCustomName(false);
                              setEditingCustomName(selectedView.customName || selectedView.viewName);
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={handleUpdateCustomName}
                          disabled={isLoading}
                          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-400"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingCustomName(false);
                            setEditingCustomName(selectedView.customName || selectedView.viewName);
                          }}
                          className="px-3 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-2">
                        <p className="text-slate-900 dark:text-slate-100 flex-1">{selectedView.customName || selectedView.viewName}</p>
                        <button
                          onClick={() => setIsEditingCustomName(true)}
                          className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">SQL Query</label>
                    <pre className="bg-slate-100 dark:bg-slate-700 p-3 rounded text-sm overflow-x-auto">{selectedView.sqlQuery}</pre>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Columns</label>
                    <div className="space-y-2 mt-2">
                      {selectedView.columns.map((col, idx) => (
                        <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded p-2">
                          <div className="font-medium">{col.name}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">{col.description}</div>
                          <div className="text-xs text-slate-500">{col.dataType} ({col.type})</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewManagementModal;

