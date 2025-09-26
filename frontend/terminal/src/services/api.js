import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making API request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  // Get available columns for chart axes

  // Get chart data based on x and y axes
  async getChartData(xAxis, yAxis, chartType, limit = 1000, filters = {}) {
    try {
      const params = {
        xAxis,
        yAxis,
        limit
      };
      
      // Add range filters if provided
      if (filters.xMin !== undefined && filters.xMin !== '') params.xMin = filters.xMin;
      if (filters.xMax !== undefined && filters.xMax !== '') params.xMax = filters.xMax;
      if (filters.yMin !== undefined && filters.yMin !== '') params.yMin = filters.yMin;
      if (filters.yMax !== undefined && filters.yMax !== '') params.yMax = filters.yMax;
      
      const response = await apiClient.get('/shipments/chart-data', { params });
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Error fetching chart data:', error);
      return [];
    }
  },

  // Get aggregated data
  async getAggregatedData(xAxis, yAxis, aggregation = 'COUNT') {
    try {
      const response = await apiClient.get('/shipments/aggregated', {
        params: { xAxis, yAxis, aggregation }
      });
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Error fetching aggregated data:', error);
      return [];
    }
  },

  // Get shipment statistics
  async getShipmentStats() {
    try {
      const response = await apiClient.get('/shipments/stats');
      return response.data.success ? response.data.stats : null;
    } catch (error) {
      console.error('Error fetching shipment stats:', error);
      return null;
    }
  },

  // Get shipments with pagination
  async getShipments(limit = 100, offset = 0) {
    try {
      const response = await apiClient.get('/shipments', {
        params: { limit, offset }
      });
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Error fetching shipments:', error);
      return [];
    }
  },

  // Get shipments by product
  async getShipmentsByProduct() {
    try {
      const response = await apiClient.get('/shipments/by-product');
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Error fetching shipments by product:', error);
      return [];
    }
  },

  // Get shipments by bay
  async getShipmentsByBay() {
    try {
      const response = await apiClient.get('/shipments/by-bay');
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Error fetching shipments by bay:', error);
      return [];
    }
  },

  // Chatbot query endpoint
  async sendChatbotQuery(query) {
    try {
      console.log('Making chatbot API request to:', '/chatbot/query');
      console.log('Request payload:', { query });
      
      const response = await apiClient.post('/chatbot/query', {
        query: query
      });
      
      console.log('Full API response:', response);
      console.log('Response data:', response.data);
      
      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        console.error('API returned success: false', response.data);
        return null;
      }
    } catch (error) {
      console.error('Error sending chatbot query:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      throw error; // Re-throw to let the component handle it
    }
  }
};
