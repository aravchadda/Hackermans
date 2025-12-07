import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const ViewManagementModal = ({ isOpen, onClose, onViewCreated }) => {
  const [views, setViews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'create'
  const [selectedView, setSelectedView] = useState(null);
  
  // Create form state
  const [viewName, setViewName] = useState('');
  const [sqlQuery, setSqlQuery] = useState('');
  const [description, setDescription] = useState('');
  const [columns, setColumns] = useState([{ columnName: '', columnDescription: '', dataType: '' }]);

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

  const handleCreateView = async () => {
    if (!viewName.trim() || !sqlQuery.trim()) {
      setError('View name and SQL query are required');
      return;
    }

    // Validate SQL query
    const trimmedQuery = sqlQuery.trim().toLowerCase();
    if (!trimmedQuery.startsWith('select')) {
      setError('SQL query must be a SELECT statement');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const viewData = {
        viewName: viewName.trim(),
        sqlQuery: sqlQuery.trim(),
        description: description.trim() || null,
        columns: columns.filter(col => col.columnName.trim())
      };

      const result = await apiService.createView(viewData);
      
      if (result.success) {
        setSuccess('View created successfully!');
        setViewName('');
        setSqlQuery('');
        setDescription('');
        setColumns([{ columnName: '', columnDescription: '', dataType: '' }]);
        
        // Reload views list
        await loadViews();
        
        // Notify parent component
        if (onViewCreated) {
          onViewCreated(result.view);
        }
        
        // Switch to list tab after a delay
        setTimeout(() => {
          setActiveTab('list');
          setSuccess('');
        }, 2000);
      } else {
        setError(result.error || 'Failed to create view');
      }
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Failed to create view');
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
    } catch (error) {
      setError('Failed to load view details: ' + error.message);
    }
  };

  const addColumn = () => {
    setColumns([...columns, { columnName: '', columnDescription: '', dataType: '' }]);
  };

  const removeColumn = (index) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const updateColumn = (index, field, value) => {
    const updated = [...columns];
    updated[index][field] = value;
    setColumns(updated);
  };

  const handleClose = () => {
    setViewName('');
    setSqlQuery('');
    setDescription('');
    setColumns([{ columnName: '', columnDescription: '', dataType: '' }]);
    setError('');
    setSuccess('');
    setActiveTab('list');
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

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'list'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            View List
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'create'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Create View
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'list' ? (
            <div>
              {isLoading && views.length === 0 ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-slate-600 dark:text-slate-400">Loading views...</p>
                </div>
              ) : views.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-600 dark:text-slate-400">No views created yet.</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Your First View
                  </button>
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
                            {view.view_name}
                          </h3>
                          {view.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {view.description}
                            </p>
                          )}
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
            </div>
          ) : (
            <div className="space-y-4">
              {/* View Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  View Name *
                </label>
                <input
                  type="text"
                  value={viewName}
                  onChange={(e) => setViewName(e.target.value)}
                  placeholder="e.g., monthly_sales"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the view"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* SQL Query */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  SQL Query (SELECT only) *
                </label>
                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  placeholder="SELECT column1, column2 FROM table WHERE condition"
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              {/* Column Descriptions */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Column Descriptions (Optional)
                </label>
                <div className="space-y-2">
                  {columns.map((col, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Column name"
                        value={col.columnName}
                        onChange={(e) => updateColumn(index, 'columnName', e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        value={col.columnDescription}
                        onChange={(e) => updateColumn(index, 'columnDescription', e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Data type"
                        value={col.dataType}
                        onChange={(e) => updateColumn(index, 'dataType', e.target.value)}
                        className="w-32 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {columns.length > 1 && (
                        <button
                          onClick={() => removeColumn(index)}
                          className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addColumn}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    + Add Column Description
                  </button>
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
                </div>
              )}
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
                    <label className="text-sm font-medium text-slate-600">Description</label>
                    <p className="text-slate-900 dark:text-slate-100">{selectedView.description || 'No description'}</p>
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
          {activeTab === 'create' && (
            <button
              onClick={handleCreateView}
              disabled={!viewName.trim() || !sqlQuery.trim() || isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              {isLoading ? 'Creating...' : 'Create View'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewManagementModal;

