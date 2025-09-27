import React, { useState } from 'react';
import { apiService } from '../services/api';

const ChatBox = ({ isVisible, onClose, onCreateChart, onDeleteChart, onUpdateChart }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm Graphy AI bot. How can I help you with your dashboard today?",
      sender: "ai",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputText, setInputText] = useState('');
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
      
      // Fetch existing charts from layout API
      const existingCharts = await apiService.getExistingCharts();
      console.log('Existing graphs being sent:', existingCharts);
      
      const response = await apiService.sendChatbotQuery(inputText, existingCharts);
      console.log('Chatbot API response:', response);
      
      if (response) {
        // Handle different operations
        if (response.operation === 'create' && onCreateChart) {
          const chartConfig = {
            id: `chart_${Date.now()}`,
            type: response.plotType,
            config: {
              xField: response.xAxis,
              yField: response.yAxis,
              title: response.plotName,
              height: response.size === 'small' ? 300 : response.size === 'large' ? 400 : 350
            }
          };
          
          onCreateChart(chartConfig);
        } else if (response.operation === 'delete' && onDeleteChart) {
          // Delete the chart by name
          onDeleteChart(response.plotName);
        } else if (response.operation === 'update' && onUpdateChart) {
          // Update the chart with new configuration (only include provided fields)
          const chartConfig = {
            plotName: response.plotName
          };
          
          // Only add fields that are actually provided in the response
          if (response.plotType !== undefined && response.plotType !== null) {
            chartConfig.plotType = response.plotType;
          }
          if (response.xAxis !== undefined && response.xAxis !== null) {
            chartConfig.xAxis = response.xAxis;
          }
          if (response.yAxis !== undefined && response.yAxis !== null) {
            chartConfig.yAxis = response.yAxis;
          }
          if (response.size !== undefined && response.size !== null) {
            chartConfig.size = response.size;
          }
          
          console.log('Calling onUpdateChart with config:', chartConfig);
          console.log('Fields provided in update:', Object.keys(chartConfig));
          onUpdateChart(chartConfig);
        }
        
        // Create appropriate response message based on operation
        let responseText;
        if (response.operation === 'create') {
          responseText = `I've created a ${response.plotType} chart named "${response.plotName}" with ${response.xAxis} on X-axis and ${response.yAxis} on Y-axis. Size: ${response.size}`;
        } else if (response.operation === 'delete') {
          responseText = `I've deleted the chart named "${response.plotName}".`;
        } else if (response.operation === 'update') {
          // Build update message based on what fields were actually provided and updated
          const updateParts = [];
          if (response.plotType !== undefined && response.plotType !== null) {
            updateParts.push(`chart type to ${response.plotType}`);
          }
          if (response.xAxis !== undefined && response.xAxis !== null && response.yAxis !== undefined && response.yAxis !== null) {
            updateParts.push(`axes to ${response.xAxis} (X) and ${response.yAxis} (Y)`);
          } else if (response.xAxis !== undefined && response.xAxis !== null) {
            updateParts.push(`X-axis to ${response.xAxis}`);
          } else if (response.yAxis !== undefined && response.yAxis !== null) {
            updateParts.push(`Y-axis to ${response.yAxis}`);
          }
          if (response.size !== undefined && response.size !== null) {
            updateParts.push(`size to ${response.size}`);
          }
          
          if (updateParts.length > 0) {
            responseText = `I've updated the chart named "${response.plotName}" - changed ${updateParts.join(', ')}.`;
          } else {
            responseText = `I've updated the chart named "${response.plotName}" (no specific changes requested).`;
          }
        } else {
          responseText = `I've processed your request for the chart named "${response.plotName}".`;
        }
        
        const aiResponse = {
          id: messages.length + 2,
          text: responseText,
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


  if (!isVisible) return null;

  return (
    <div className="w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">🤖</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-900 dark:text-red-100">Graphy AI bot</h3>
              <p className="text-xs text-red-600 dark:text-red-400">Online</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-800/30 rounded"
            title="Close Chat"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((message) => (
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
      <div className="p-4 border-t border-red-200 dark:border-red-700">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 px-3 py-2 text-sm border border-red-200 dark:border-red-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              isLoading 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-red-500 text-white hover:bg-red-600'
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
