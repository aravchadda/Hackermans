import React, { useState } from 'react';
import { Vega } from 'react-vega';
import { Info, BarChart3, Brain, AlertCircle } from 'lucide-react';
import './ChartBubble.css';

const ChartBubble = ({ spec, method, confidence }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getMethodIcon = () => {
    switch (method) {
      case 'rule-based':
        return <BarChart3 size={16} />;
      case 'llm-fallback':
        return <Brain size={16} />;
      case 'fallback':
        return <AlertCircle size={16} />;
      default:
        return <BarChart3 size={16} />;
    }
  };

  const getMethodLabel = () => {
    switch (method) {
      case 'rule-based':
        return 'Rule-based';
      case 'llm-fallback':
        return 'AI Generated';
      case 'fallback':
        return 'Fallback';
      default:
        return 'Generated';
    }
  };

  const getConfidenceColor = (conf) => {
    if (conf >= 0.8) return '#10b981';
    if (conf >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  const getConfidenceLabel = (conf) => {
    if (conf >= 0.8) return 'High';
    if (conf >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="chart-bubble">
      <div className="chart-container">
        <Vega 
          spec={spec}
          renderer="svg"
          actions={false}
        />
      </div>
      
      <div className="chart-metadata">
        <div className="metadata-row">
          <div className="method-info">
            {getMethodIcon()}
            <span className="method-label">{getMethodLabel()}</span>
          </div>
          
          <div className="confidence-info">
            <div 
              className="confidence-indicator"
              style={{ backgroundColor: getConfidenceColor(confidence) }}
            />
            <span className="confidence-label">
              {getConfidenceLabel(confidence)} ({Math.round(confidence * 100)}%)
            </span>
          </div>
        </div>
        
        <button 
          className="details-toggle"
          onClick={() => setShowDetails(!showDetails)}
        >
          <Info size={14} />
          <span>{showDetails ? 'Hide' : 'Show'} Details</span>
        </button>
      </div>
      
      {showDetails && (
        <div className="chart-details">
          <div className="details-section">
            <h4>Chart Specification</h4>
            <pre className="spec-json">
              {JSON.stringify(spec, null, 2)}
            </pre>
          </div>
          
          <div className="details-section">
            <h4>Generation Method</h4>
            <p>
              {method === 'rule-based' && 
                'This chart was generated using predefined rules and pattern matching. This method is fast and reliable for common chart types.'
              }
              {method === 'llm-fallback' && 
                'This chart was generated using AI language model analysis. The model analyzed your request and data to create this visualization.'
              }
              {method === 'fallback' && 
                'This is a basic fallback chart generated when other methods failed. It may not perfectly match your request.'
              }
            </p>
          </div>
          
          <div className="details-section">
            <h4>Confidence Score</h4>
            <p>
              Confidence: {Math.round(confidence * 100)}% - {
                confidence >= 0.8 ? 'High confidence in the result' :
                confidence >= 0.6 ? 'Medium confidence, result may need review' :
                'Low confidence, result may not be optimal'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartBubble;
