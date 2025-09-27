import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 100000, // 100 seconds to match backend timeout
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
      return response.data.success ? response.data : { data: [], isMultiValue: false, yAxes: [] };
    } catch (error) {
      console.error('Error fetching chart data:', error);
      return { data: [], isMultiValue: false, yAxes: [] };
    }
  },

  // Get chart data with multiple y-axis fields
  async getMultiValueChartData(xAxis, yAxes, chartType, limit = 1000, filters = {}) {
    try {
      const params = {
        xAxis,
        yAxes: Array.isArray(yAxes) ? yAxes.join(',') : yAxes,
        limit
      };
      
      // Add range filters if provided
      if (filters.xMin !== undefined && filters.xMin !== '') params.xMin = filters.xMin;
      if (filters.xMax !== undefined && filters.xMax !== '') params.xMax = filters.xMax;
      if (filters.yMin !== undefined && filters.yMin !== '') params.yMin = filters.yMin;
      if (filters.yMax !== undefined && filters.yMax !== '') params.yMax = filters.yMax;
      
      const response = await apiClient.get('/shipments/chart-data', { params });
      return response.data.success ? response.data : { data: [], isMultiValue: false, yAxes: [] };
    } catch (error) {
      console.error('Error fetching multi-value chart data:', error);
      return { data: [], isMultiValue: false, yAxes: [] };
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

  // Get existing charts from layout
  async getExistingCharts() {
    try {
      const response = await apiClient.get('/layout');
      if (response.data.success && response.data.layout) {
        // Extract chart titles from layout items
        const chartTitles = response.data.layout
          .filter(item => item.config && item.config.title)
          .map(item => item.config.title);
        console.log('📊 Fetched existing charts from layout:', chartTitles);
        // Return as slash-separated string
        return chartTitles.join('/');
      }
      return '';
    } catch (error) {
      console.error('Error fetching existing charts:', error);
      return '';
    }
  },

  // Chatbot query endpoint
  async sendChatbotQuery(query, existingGraphs = '') {
    try {
      console.log('Making chatbot API request to:', '/chatbot/query');
      console.log('Request payload:', { query, existingGraphs });
      
      const response = await apiClient.post('/chatbot/query', {
        query: query,
        existingGraphs: existingGraphs // Send as string directly
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
  },

  // Analytics insights queries endpoint
  async getInsightsQueries() {
    try {
      console.log('🔄 Fetching insights queries from:', '/insights/queries');
      const response = await apiClient.get('/insights/queries');
      console.log('📡 Insights queries API response:', response.data);
      
      if (response.data && response.data.success) {
        console.log('✅ Successfully fetched insights queries:', response.data.queries);
        return response.data;
      } else {
        console.error('❌ API returned success: false', response.data);
        return null;
      }
    } catch (error) {
      console.error('💥 Error fetching insights queries:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  },

  // Execute insights query endpoint
  async executeInsightsQuery(query) {
    try {
      console.log('🚀 Executing insights query:', query);
      
      const payload = {
        query: query
      };
      
      console.log('📤 Sending payload:', payload);
      const response = await apiClient.post('/insights/execute', payload);
      console.log('📡 Execute query API response:', response.data);
      
      if (response.data && response.data.success) {
        console.log('✅ Query executed successfully:', response.data);
        return response.data;
      } else {
        console.error('❌ API returned success: false', response.data);
        return null;
      }
    } catch (error) {
      console.error('💥 Error executing insights query:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  }
};
