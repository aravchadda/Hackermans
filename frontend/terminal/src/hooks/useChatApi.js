import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const useChatApi = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Test connection on mount
  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 5000
      });
      setIsConnected(response.status === 200);
    } catch (error) {
      console.warn('Backend connection failed:', error.message);
      setIsConnected(false);
    }
  };

  const generateChart = async (query, dataSchema, sampleData) => {
    setIsLoading(true);
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/generate-chart`,
        {
          query,
          dataSchema,
          sampleData
        },
        {
          timeout: 120000, // 120 second timeout to match backend
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Chart generation failed');
      }

      return {
        explanation: response.data.explanation,
        spec: response.data.spec,
        method: response.data.method,
        confidence: response.data.confidence
      };

    } catch (error) {
      console.error('Chart generation error:', error);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. The chart generation is taking too long.');
      }
      
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message || 
                           error.response.data?.error || 
                           `Server error: ${error.response.status}`;
        throw new Error(errorMessage);
      }
      
      if (error.request) {
        // Network error
        throw new Error('Cannot connect to the chart generation service. Please check your connection and try again.');
      }
      
      // Other error
      throw new Error(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const testBackendHealth = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 5000
      });
      return {
        healthy: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  };

  return {
    generateChart,
    testConnection,
    testBackendHealth,
    isConnected,
    isLoading
  };
};
