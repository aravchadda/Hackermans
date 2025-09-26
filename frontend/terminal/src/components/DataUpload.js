import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import './DataUpload.css';

const DataUpload = ({ onDataUpload, isLoading, currentData }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    setUploadError(null);
    
    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls|json)$/i)) {
      setUploadError('Please upload a CSV, Excel, or JSON file');
      return;
    }
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }
    
    try {
      await onDataUpload(file);
    } catch (error) {
      setUploadError(`Upload failed: ${error.message}`);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const clearError = () => {
    setUploadError(null);
  };

  return (
    <div className="data-upload">
      <div className="upload-section">
        <h4>Upload Data</h4>
        
        {!currentData ? (
          <div
            className={`upload-area ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <div className="upload-content">
              <Upload size={32} className="upload-icon" />
              <div className="upload-text">
                <p className="upload-title">Drop your data file here</p>
                <p className="upload-subtitle">or click to browse</p>
              </div>
            </div>
            
            <div className="upload-formats">
              <span>Supported formats:</span>
              <div className="format-tags">
                <span className="format-tag">CSV</span>
                <span className="format-tag">Excel</span>
                <span className="format-tag">JSON</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="upload-success">
            <div className="success-content">
              <CheckCircle size={24} className="success-icon" />
              <div className="success-text">
                <p className="success-title">Data uploaded successfully!</p>
                <p className="success-subtitle">
                  {currentData.length} rows ready for visualization
                </p>
              </div>
            </div>
          </div>
        )}
        
        {uploadError && (
          <div className="upload-error">
            <div className="error-content">
              <AlertCircle size={20} className="error-icon" />
              <div className="error-text">
                <p className="error-title">Upload failed</p>
                <p className="error-message">{uploadError}</p>
              </div>
              <button onClick={clearError} className="error-close">
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.json"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={isLoading}
        />
        
        <div className="upload-tips">
          <h5>Tips for best results:</h5>
          <ul>
            <li>Include column headers in your data</li>
            <li>Use consistent date formats (YYYY-MM-DD)</li>
            <li>Ensure numeric columns contain only numbers</li>
            <li>Keep file size under 10MB for best performance</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DataUpload;
