import React, { useState, useRef, useEffect } from 'react';
import { apiService } from '../services/api';
import QueryResultTable from './QueryResultTable';

const AnalyticsChatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Welcome to Business Insights Bot! I can help you analyze your shipment data using natural language. Try asking:\n\n• "Show me shipment delays"\n• "Which bays have the highest utilization?"\n• "Find shipments with flow rate anomalies"\n• "What are the top performing products?"\n• "Show me average flow rates by bay"\n\nJust ask your question in plain English and I\'ll convert it to SQL and show you the results!',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [availableQueries, setAvailableQueries] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load available queries on component mount
  useEffect(() => {
    const loadAvailableQueries = async () => {
      try {
        console.log('🔄 Loading available queries...');
        const response = await apiService.getInsightsQueries();
        console.log('📡 API response:', response);
        
        if (response && response.queries) {
          setAvailableQueries(response.queries);
          console.log('✅ Loaded available queries:', response.queries);
        } else {
          console.log('❌ No queries found in response');
        }
      } catch (error) {
        console.error('💥 Error loading available queries:', error);
      }
    };
    
    loadAvailableQueries();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    console.log('🚀 Send button pressed! User input:', inputValue);
    console.log('📊 Available queries:', availableQueries);

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userQuery = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      console.log('🚀 Sending natural language query to API:', userQuery);
      
      // Send the natural language query to the insights API
      const result = await apiService.executeInsightsQuery(userQuery);
      console.log('📋 Query execution result:', result);
      
      if (result && result.success) {
        const botMessage = {
          id: messages.length + 2,
          type: 'bot',
          content: `Here are the results for your query: "${userQuery}"`,
          timestamp: new Date(),
          queryResults: result.data,
          sqlQuery: result.sql_query,
          description: result.description
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        const errorMessage = {
          id: messages.length + 2,
          type: 'bot',
          content: `I encountered an error executing your query: "${userQuery}". Please try rephrasing your question or check if the query is valid.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('💥 Error processing query:', error);
      const errorMessage = {
        id: messages.length + 2,
        type: 'bot',
        content: 'I encountered an error processing your request. Please try again or rephrase your question.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const findMatchingQuery = (userInput) => {
    const input = userInput.toLowerCase();
    console.log('🔍 Searching for query matching:', input);
    console.log('📋 Available queries for matching:', availableQueries);
    
    // Simple keyword matching - you can make this more sophisticated
    for (const query of availableQueries) {
      const description = query.description.toLowerCase();
      const keywords = query.keywords || [];
      
      console.log(`🔎 Checking query: ${query.identifier} - "${description}"`);
      
      // Check if any keywords match or if description contains user input
      if (keywords.some(keyword => input.includes(keyword.toLowerCase())) ||
          description.includes(input) ||
          input.includes(description.split(' ')[0])) {
        console.log(`✅ Found match: ${query.identifier}`);
        return query;
      }
    }
    
    console.log('❌ No matching query found');
    return null;
  };

  const generateBotResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    if (input.includes('help') || input.includes('what can you do')) {
      return `I can help you analyze your shipment data using natural language! Here are some examples:\n\n• "Show me shipment delays"\n• "Which bays have the highest utilization?"\n• "Find shipments with flow rate anomalies"\n• "What are the top performing products?"\n• "Show me average flow rates by bay"\n• "How many shipments were processed today?"\n\nJust ask your question in plain English and I'll convert it to SQL and show you the results!`;
    }
    
    if (input.includes('tables') || input.includes('schema') || input.includes('columns')) {
      return `The main table available is 'shipments' with columns like:\n• ShipmentID, ShipmentCode\n• BayCode, BaseProductID, BaseProductCode\n• GrossQuantity, FlowRate\n• ExitTime, ScheduledDate, CreatedTime\n• ShipmentCompartmentID\n\nTry asking questions like "Show me the first 5 shipments" or "What are the different bay codes?"`;
    }
    
    return `I can help you analyze your shipment data! Try asking questions like:\n\n• "Show me shipment delays"\n• "Which bays are most active?"\n• "Find high flow rate shipments"\n• "What products are being shipped?"\n\nType "help" to see more examples!`;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl m-4 mt-0 flex flex-col shadow-sm" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="bg-red-800 dark:bg-red-900 border-b border-red-600 dark:border-red-700 p-4 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold text-2xl">Business Insights Bot</h3>
        </div>
        <p className="text-red-100 text-sm mt-1">AI-powered analytics insights & custom analysis</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-lg px-4 py-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              
              {/* Display query results table if available */}
              {message.queryResults && (
                <div className="mt-3">
                  <QueryResultTable 
                    data={message.queryResults} 
                    title="Query Results"
                  />
                </div>
              )}
              
              <p className="text-xs opacity-60 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 dark:border-slate-600 p-4 rounded-b-xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your shipment data (e.g., Show me shipment delays)..."
            className="flex-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsChatbot;
