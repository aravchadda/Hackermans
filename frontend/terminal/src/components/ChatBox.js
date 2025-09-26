import React, { useState } from 'react';
import { apiService } from '../services/api';

const ChatBox = ({ isVisible, onClose, onCreateChart }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI assistant. How can I help you with your dashboard today?",
      sender: "ai",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: "user",
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // Call chatbot API
    setIsLoading(true);
    try {
      console.log('Sending chatbot query:', inputText);
      const response = await apiService.sendChatbotQuery(inputText);
      console.log('Chatbot API response:', response);
      
      if (response) {
        // Create the chart using the response data
        if (onCreateChart && response.operation === 'create') {
          const chartConfig = {
            id: `chart_${Date.now()}`,
            type: response.plotType,
            config: {
              xField: response.xAxis,
              yField: response.yAxis,
              title: response.plotName,
              height: response.size === 'small' ? 200 : response.size === 'large' ? 400 : 300
            }
          };
          
          onCreateChart(chartConfig);
        }
        
        const aiResponse = {
          id: messages.length + 2,
          text: `I've created a ${response.plotType} chart named "${response.plotName}" with ${response.xAxis} on X-axis and ${response.yAxis} on Y-axis. Size: ${response.size}`,
          sender: "ai",
          timestamp: new Date().toLocaleTimeString(),
          chartData: response // Store the chart configuration
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        const errorResponse = {
          id: messages.length + 2,
          text: "Sorry, I couldn't process your request. Please try again.",
          sender: "ai",
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, errorResponse]);
      }
    } catch (error) {
      console.error('Error calling chatbot API:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Check if it's a network error (backend not running)
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error') || error.message.includes('fetch')) {
        const errorResponse = {
          id: messages.length + 2,
          text: "Backend server is not running. Please start the backend server on port 4000 and try again.",
          sender: "ai",
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, errorResponse]);
      } else {
        const errorResponse = {
          id: messages.length + 2,
          text: `Sorry, there was an error processing your request: ${error.message}. Please try again.`,
          sender: "ai",
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, errorResponse]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMessages = messages.filter(message =>
    message.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isVisible) return null;

  return (
    <div className="w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-sm">🤖</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">AI Assistant</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Online</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            title="Close Chat"
          >
            ✕
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {filteredMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-3 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              isLoading 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isLoading ? 'Creating...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;
