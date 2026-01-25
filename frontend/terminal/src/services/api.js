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
    console.log(`🌐 Making API request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    console.log(`🌐 Request params:`, config.params);
    console.log(`🌐 Full URL:`, `${config.baseURL}${config.url}?${new URLSearchParams(config.params || {}).toString()}`);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
      status: error.response?.status,
      data: error.response?.data,
      code: error.code
    });
    return Promise.reject(error);
  }
);

export const apiService = {
  // Get database schema (all tables and columns)
  async getSchema() {
    try {
      const response = await apiClient.get('/schema');
      if (response.data && response.data.success) {
        return response.data;
      }
      return { schema: {}, tables: [] };
    } catch (error) {
      console.error('Error fetching schema:', error);
      return { schema: {}, tables: [] };
    }
  },

  // Get columns for a specific table
  async getTableColumns(tableName) {
    try {
      const response = await apiClient.get(`/schema/${tableName}`);
      if (response.data && response.data.success) {
        return response.data.columns;
      }
      return [];
    } catch (error) {
      console.error(`Error fetching columns for table ${tableName}:`, error);
      return [];
    }
  },

  // Get available columns for chart axes

  // Get chart data based on x and y axes - now supports any table
  async getChartData(xAxis, yAxis, chartType, limit = null, filters = {}, tableName, aggregateFunction = 'sum') {
    try {
      console.log('getChartData called with:', { xAxis, yAxis, chartType, limit, filters, tableName, aggregateFunction });
      
      if (!tableName) {
        console.error('getChartData: tableName is required but was not provided');
        return { data: [], isMultiValue: false, yAxes: [] };
      }
      
      if (!xAxis || !yAxis) {
        console.error('getChartData: xAxis and yAxis are required', { xAxis, yAxis });
        return { data: [], isMultiValue: false, yAxes: [] };
      }
      
      console.log('getChartData: Making API call with tableName:', tableName);
      const params = {
        tableName,
        xAxis,
        yAxis,
        aggregateFunction: aggregateFunction || 'sum'
      };
      
      // Only add limit if explicitly provided
      if (limit && limit > 0) {
        params.limit = limit;
      }
      
      // Add range filters if provided
      if (filters.xMin !== undefined && filters.xMin !== '') params.xMin = filters.xMin;
      if (filters.xMax !== undefined && filters.xMax !== '') params.xMax = filters.xMax;
      if (filters.yMin !== undefined && filters.yMin !== '') params.yMin = filters.yMin;
      if (filters.yMax !== undefined && filters.yMax !== '') params.yMax = filters.yMax;
      // Add date range filters if provided
      if (filters.dateFrom !== undefined && filters.dateFrom !== '') params.dateFrom = filters.dateFrom;
      if (filters.dateTo !== undefined && filters.dateTo !== '') params.dateTo = filters.dateTo;
      
      console.log('getChartData: Request params:', params);
      console.log('getChartData: Full URL will be:', `${API_BASE_URL}/chart-data?${new URLSearchParams(params).toString()}`);
      
      const response = await apiClient.get('/chart-data', { params });
      console.log('getChartData: Response received:', { success: response.data.success, count: response.data.count });
      return response.data.success ? response.data : { data: [], isMultiValue: false, yAxes: [] };
    } catch (error) {
      console.error('Error fetching chart data:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      return { data: [], isMultiValue: false, yAxes: [] };
    }
  },

  // Get chart data with multiple y-axis fields - now supports any table
  async getMultiValueChartData(xAxis, yAxes, chartType, limit = null, filters = {}, tableName) {
    try {
      if (!tableName) {
        console.error('getMultiValueChartData: tableName is required');
        return { data: [], isMultiValue: false, yAxes: [] };
      }
      console.log('getMultiValueChartData: Using tableName:', tableName);
      const params = {
        tableName,
        xAxis,
        yAxes: Array.isArray(yAxes) ? yAxes.join(',') : yAxes
      };
      
      // Only add limit if explicitly provided
      if (limit && limit > 0) {
        params.limit = limit;
      }
      
      // Add range filters if provided
      if (filters.xMin !== undefined && filters.xMin !== '') params.xMin = filters.xMin;
      if (filters.xMax !== undefined && filters.xMax !== '') params.xMax = filters.xMax;
      if (filters.yMin !== undefined && filters.yMin !== '') params.yMin = filters.yMin;
      if (filters.yMax !== undefined && filters.yMax !== '') params.yMax = filters.yMax;
      // Add date range filters if provided
      if (filters.dateFrom !== undefined && filters.dateFrom !== '') params.dateFrom = filters.dateFrom;
      if (filters.dateTo !== undefined && filters.dateTo !== '') params.dateTo = filters.dateTo;
      
      const response = await apiClient.get('/chart-data', { params });
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

  // Execute insights query endpoint (calls Flask to convert natural language to SQL)
  async executeInsightsQuery(query, tableName = null, page = 1) {
    try {
      console.log('🚀 Executing insights query:', query);
      if (tableName) {
        console.log('📊 Using view/table:', tableName);
      }
      console.log('📄 Page:', page);
      
      const payload = {
        query: query,
        page: page
      };
      
      if (tableName) {
        payload.tableName = tableName;
      }
      
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
  },

  // Execute SQL query directly with pagination (no Flask call)
  async executeSqlQuery(sqlQuery, page = 1) {
    try {
      console.log('📄 Executing SQL query directly (page', page, ')');
      
      const payload = {
        sqlQuery: sqlQuery,
        page: page
      };
      
      console.log('📤 Sending SQL query payload');
      const response = await apiClient.post('/insights/execute-sql', payload);
      console.log('📡 Execute SQL query API response:', response.data);
      
      if (response.data && response.data.success) {
        console.log('✅ SQL query executed successfully:', response.data);
        return response.data;
      } else {
        console.error('❌ API returned success: false', response.data);
        return null;
      }
    } catch (error) {
      console.error('💥 Error executing SQL query:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  },

  // Views Management API
  async getViews() {
    try {
      const response = await apiClient.get('/views');
      return response.data.success ? response.data.views : [];
    } catch (error) {
      console.error('Error fetching views:', error);
      return [];
    }
  },

  async getView(viewName) {
    try {
      const response = await apiClient.get(`/views/${viewName}`);
      return response.data.success ? response.data.view : null;
    } catch (error) {
      console.error('Error fetching view:', error);
      throw error;
    }
  },

  // Get all existing database views
  async getDatabaseViews() {
    try {
      const response = await apiClient.get('/database-views');
      return response.data.success ? response.data.views : [];
    } catch (error) {
      console.error('Error fetching database views:', error);
      return [];
    }
  },

  // Get columns from a database view
  async getDatabaseViewColumns(viewName) {
    try {
      const response = await apiClient.get(`/database-views/${viewName}/columns`);
      if (response.data.success) {
        return response.data.columns || [];
      } else {
        // If the API returns success: false, throw an error with the message
        const error = new Error(response.data.error || 'Failed to fetch columns');
        error.response = { data: response.data };
        throw error;
      }
    } catch (error) {
      console.error('Error fetching database view columns:', error);
      throw error;
    }
  },

  async createView(viewData) {
    try {
      const response = await apiClient.post('/views', viewData);
      return response.data;
    } catch (error) {
      console.error('Error creating view:', error);
      throw error;
    }
  },

  async updateView(viewName, viewData) {
    try {
      const response = await apiClient.put(`/views/${viewName}`, viewData);
      return response.data;
    } catch (error) {
      console.error('Error updating view:', error);
      throw error;
    }
  },

  async deleteView(viewName) {
    try {
      const response = await apiClient.delete(`/views/${viewName}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting view:', error);
      throw error;
    }
  }
};
