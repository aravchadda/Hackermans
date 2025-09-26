import React, { useState, useEffect, useRef } from 'react';
import { Send, Upload, Download, Trash2, BarChart3, MessageSquare } from 'lucide-react';
import ChatUI from './components/ChatUI';
import DataUpload from './components/DataUpload';
import ChartBubble from './components/ChartBubble';
import { useChatApi } from './hooks/useChatApi';
import { detectSchema, parseDataFile } from './utils/dataUtils';
import './ChatApp.css';

const ChatApp = () => {
  const [messages, setMessages] = useState([]);
  const [currentData, setCurrentData] = useState(null);
  const [dataSchema, setDataSchema] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  
  const { generateChart, isConnected } = useChatApi();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleDataUpload = async (file) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await parseDataFile(file);
      const schema = detectSchema(data);
      
      setCurrentData(data);
      setDataSchema(schema);
      
      // Add system message about data upload
      const systemMessage = {
        id: Date.now(),
        type: 'system',
        content: `Data uploaded successfully! Found ${data.length} rows with ${schema.length} fields. You can now ask me to create charts from this data.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, systemMessage]);
      
    } catch (err) {
      setError(`Failed to upload data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    
    try {
      if (!currentData || !dataSchema) {
        throw new Error('Please upload data first before requesting charts');
      }
      
      const result = await generateChart(message, dataSchema, currentData.slice(0, 100)); // Send sample
      
      // Add bot response
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: result.explanation,
        chartSpec: result.spec,
        method: result.method,
        confidence: result.confidence,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      
    } catch (err) {
      setError(`Failed to generate chart: ${err.message}`);
      
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: `Sorry, I couldn't generate that chart. ${err.message}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  const clearData = () => {
    setCurrentData(null);
    setDataSchema(null);
    setMessages([]);
    setError(null);
  };

  const exportData = () => {
    if (!currentData) return;
    
    const dataStr = JSON.stringify(currentData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="chat-app">
      <div className="chat-header">
        <div className="header-content">
          <div className="header-left">
            <BarChart3 className="header-icon" />
            <h1>Hybrid Chart Generator</h1>
          </div>
          <div className="header-right">
            <div className="connection-status">
              <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="chat-container">
        <div className="sidebar">
          <div className="sidebar-section">
            <h3>Data Management</h3>
            <DataUpload 
              onDataUpload={handleDataUpload}
              isLoading={isLoading}
              currentData={currentData}
            />
            
            {currentData && (
              <div className="data-info">
                <h4>Current Dataset</h4>
                <p>Rows: {currentData.length}</p>
                <p>Fields: {dataSchema?.length}</p>
                <div className="data-actions">
                  <button onClick={exportData} className="btn-secondary">
                    <Download size={16} />
                    Export
                  </button>
                  <button onClick={clearData} className="btn-danger">
                    <Trash2 size={16} />
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="sidebar-section">
            <h3>Quick Actions</h3>
            <div className="quick-actions">
              <button onClick={clearChat} className="btn-secondary">
                <MessageSquare size={16} />
                Clear Chat
              </button>
            </div>
          </div>

          {dataSchema && (
            <div className="sidebar-section">
              <h3>Data Schema</h3>
              <div className="schema-list">
                {dataSchema.map((field, index) => (
                  <div key={index} className="schema-field">
                    <span className="field-name">{field.name}</span>
                    <span className={`field-type ${field.type}`}>{field.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="chat-main">
          <ChatUI 
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            error={error}
            messagesEndRef={messagesEndRef}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatApp;
