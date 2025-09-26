import React, { useState, useRef, useEffect } from 'react';

const AnalyticsChatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Welcome to Custom Analytics. I can help you create custom analytics queries, analyze specific data patterns, explain anomaly detection results, and provide personalized insights for your analytics needs.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = generateBotResponse(inputValue);
      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        content: botResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateBotResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    if (input.includes('anomaly') || input.includes('detection')) {
      return "Anomaly detection uses machine learning algorithms to identify unusual patterns in your data. The system has detected 4,950 anomalies out of 98,998 total records, representing a 5.0% anomaly rate. Peak anomaly times are 22:00-23:00, with Sunday showing the highest frequency.";
    }
    
    if (input.includes('predictive') || input.includes('forecast')) {
      return "Predictive forecasting analyzes historical patterns to predict future trends. This module uses time series analysis and machine learning models to forecast outcomes with high accuracy. It can help you anticipate delays, optimize scheduling, and improve operational efficiency.";
    }
    
    if (input.includes('delay') || input.includes('time')) {
      return "Delay time analysis identifies bottlenecks and delay patterns in your operations. It analyzes factors like bay utilization, product flow rates, and scheduling conflicts to provide actionable insights for process optimization.";
    }
    
    if (input.includes('pattern') || input.includes('trend')) {
      return "Pattern analysis reveals hidden insights in your data. The system identifies recurring anomalies, seasonal trends, and operational patterns that can help optimize your processes and reduce inefficiencies.";
    }
    
    if (input.includes('help') || input.includes('what can you do')) {
      return "I can help you with:\n• Explaining anomaly detection results\n• Analyzing data patterns and trends\n• Interpreting predictive forecasting models\n• Understanding delay time analysis\n• Providing insights on operational optimization\n\nJust ask me about any aspect of your analytics!";
    }
    
    return "I understand you're asking about analytics. I can help explain anomaly detection results, predictive forecasting models, delay time analysis, or any other analytics-related questions. Could you be more specific about what you'd like to know?";
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl m-4 mt-12 flex flex-col shadow-sm" style={{ height: 'calc(100vh - 96px)' }}>
      {/* Header */}
      <div className="bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 p-4 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="text-slate-900 dark:text-slate-100 font-semibold text-2xl">Custom Analytics</h3>
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">AI-powered analytics insights & custom analysis</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
            placeholder="Create custom analytics queries, analyze data patterns..."
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
