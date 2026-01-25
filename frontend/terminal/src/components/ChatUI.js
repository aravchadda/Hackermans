import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import ChartBubble from './ChartBubble';
import './ChatUI.css';

const ChatUI = ({ messages, onSendMessage, isLoading, error, messagesEndRef }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-ui">
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>Welcome to Hybrid Chart Generator</h3>
            <p>Upload your data and start asking for charts!</p>
            <div className="example-queries">
              <h4>Try asking:</h4>
              <ul>
                <li>"Show me sales trends over time"</li>
                <li>"Compare revenue by region"</li>
                <li>"Create a pie chart of market share"</li>
                <li>"Plot the correlation between price and sales"</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.type}`}>
                {message.type === 'user' && (
                  <div className="message-content">
                    <div className="message-avatar user-avatar">U</div>
                    <div className="message-bubble user-bubble">
                      <p>{message.content}</p>
                      <span className="message-time">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                )}
                
                {message.type === 'bot' && (
                  <div className="message-content">
                    <div className="message-avatar bot-avatar">🤖</div>
                    <div className="message-bubble bot-bubble">
                      <p>{message.content}</p>
                      {message.chartSpec && (
                        <ChartBubble 
                          spec={message.chartSpec}
                          method={message.method}
                          confidence={message.confidence}
                        />
                      )}
                      <span className="message-time">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                )}
                
                {message.type === 'system' && (
                  <div className="message-content">
                    <div className="message-avatar system-avatar">ℹ️</div>
                    <div className="message-bubble system-bubble">
                      <p>{message.content}</p>
                      <span className="message-time">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                )}
                
                {message.type === 'error' && (
                  <div className="message-content">
                    <div className="message-avatar error-avatar">⚠️</div>
                    <div className="message-bubble error-bubble">
                      <p>{message.content}</p>
                      <span className="message-time">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="message loading">
                <div className="message-content">
                  <div className="message-avatar bot-avatar">🤖</div>
                  <div className="message-bubble bot-bubble">
                    <div className="loading-content">
                      <Loader2 className="loading-spinner" />
                      <span>Generating chart...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
        </div>
      )}

      <form className="input-form" onSubmit={handleSubmit}>
        <div className="input-container">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to create a chart from your data..."
            className="message-input"
            rows="1"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="send-button"
            disabled={!inputValue.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="button-spinner" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatUI;
