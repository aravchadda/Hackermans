const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { connectDatabase, runQuery, runQueryFirst, runQueryCount } = require('./database');

const app = express();

// Configure CORS with specific options
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

require('dotenv').config();

const PORT = process.env.PORT || 4000;
app.use(express.json());

// Handle preflight requests
app.options('*', cors());

// DuckDB API Routes
app.get('/api/data', async (req, res) => {
    try {
        const data = await runQuery('SELECT * FROM sample_data ORDER BY value DESC');
        res.json({
            success: true,
            data: data,
            count: data.length
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/data/stats', async (req, res) => {
    try {
        const stats = await runQuery(`
            SELECT 
                COUNT(*) as total_records,
                AVG(value) as average_value,
                MIN(value) as min_value,
                MAX(value) as max_value,
                SUM(value) as total_value
            FROM sample_data
        `);
        
        const categoryStats = await runQuery(`
            SELECT 
                category,
                COUNT(*) as count,
                AVG(value) as avg_value,
                SUM(value) as total_value
            FROM sample_data 
            GROUP BY category
            ORDER BY total_value DESC
        `);
        
        res.json({
            success: true,
            overall_stats: stats[0],
            category_stats: categoryStats
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/data/categories', async (req, res) => {
    try {
        const categories = await runQuery(`
            SELECT DISTINCT category 
            FROM sample_data 
            ORDER BY category
        `);
        res.json({
            success: true,
            categories: categories.map(row => row.category)
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/data/query', async (req, res) => {
    try {
        const { query } = req.body;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query is required'
            });
        }
        
        // Basic SQL injection protection - only allow SELECT statements
        const trimmedQuery = query.trim().toLowerCase();
        if (!trimmedQuery.startsWith('select')) {
            return res.status(400).json({
                success: false,
                error: 'Only SELECT queries are allowed'
            });
        }
        
        // Limit result size for performance
        const limitedQuery = query.includes('LIMIT') ? query : `${query} LIMIT 1000`;
        
        const results = await runQuery(limitedQuery);
        
        res.json({
            success: true,
            data: results,
            count: results.length,
            query: limitedQuery
        });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Shipment data routes
app.get('/api/shipments', async (req, res) => {
    try {
        const { limit = 100, offset = 0 } = req.query;
        const data = await runQuery(`
            SELECT * FROM shipments 
            ORDER BY CreatedTime DESC 
            LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
        `);
        res.json({ success: true, data, count: data.length });
    } catch (error) {
        console.error('Error fetching shipments:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/shipments/count', async (req, res) => {
    try {
        const count = await runQueryCount('SELECT COUNT(*) as count FROM shipments');
        res.json({ success: true, count });
    } catch (error) {
        console.error('Error fetching shipments count:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/shipments/stats', async (req, res) => {
    try {
        const stats = await runQuery(`
            SELECT 
                COUNT(*) as total_shipments,
                SUM(GrossQuantity) as total_quantity,
                AVG(FlowRate) as avg_flow_rate,
                COUNT(DISTINCT BaseProductCode) as unique_products,
                COUNT(DISTINCT BayCode) as unique_bays
            FROM shipments
        `);
        res.json({ success: true, stats: stats[0] });
    } catch (error) {
        console.error('Error fetching shipment stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/shipments/by-product', async (req, res) => {
    try {
        const data = await runQuery(`
            SELECT 
                BaseProductCode,
                COUNT(*) as shipment_count,
                SUM(GrossQuantity) as total_quantity,
                AVG(FlowRate) as avg_flow_rate
            FROM shipments 
            GROUP BY BaseProductCode 
            ORDER BY shipment_count DESC
            LIMIT 20
        `);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching shipments by product:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/shipments/by-bay', async (req, res) => {
    try {
        const data = await runQuery(`
            SELECT 
                BayCode,
                COUNT(*) as shipment_count,
                SUM(GrossQuantity) as total_quantity,
                AVG(FlowRate) as avg_flow_rate
            FROM shipments 
            GROUP BY BayCode 
            ORDER BY shipment_count DESC
        `);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching shipments by bay:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Dynamic chart data endpoint
app.get('/api/shipments/chart-data', async (req, res) => {
    try {
        const { xAxis, yAxis, yAxes, limit = 1000, xMin, xMax, yMin, yMax } = req.query;
        
        if (!xAxis || (!yAxis && !yAxes)) {
            return res.status(400).json({
                success: false,
                error: 'Both xAxis and yAxis (or yAxes) parameters are required'
            });
        }
        
        // Validate column names to prevent SQL injection (exact match with CSV headers)
        const allowedColumns = [
            'GrossQuantity', 'FlowRate', 'ShipmentCompartmentID', 'BaseProductID', 
            'BaseProductCode', 'ShipmentID', 'ShipmentCode', 'ExitTime', 
            'BayCode', 'ScheduledDate', 'CreatedTime'
        ];
        
        // Allow all fields for Y-axis values - no restrictions
        const allowedYAxisColumns = allowedColumns;
        
        // Determine which y-axis fields to use
        let yAxisFields = [];
        if (yAxes) {
            // Multiple y-axis fields provided as comma-separated string
            yAxisFields = yAxes.split(',').map(field => field.trim());
        } else if (yAxis) {
            // Single y-axis field
            yAxisFields = [yAxis];
        }
        
        // Validate x-axis field
        if (!allowedColumns.includes(xAxis)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid xAxis column name. Allowed columns: ' + allowedColumns.join(', ')
            });
        }
        
        // Validate all y-axis fields
        for (const field of yAxisFields) {
            if (!allowedYAxisColumns.includes(field)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid yAxis column name: ${field}. Allowed columns: ` + allowedYAxisColumns.join(', ')
                });
            }
        }
        
        // Build WHERE conditions for range filters
        let whereConditions = [`${xAxis} IS NOT NULL`];
        
        // Add null checks for all y-axis fields
        yAxisFields.forEach(field => {
            whereConditions.push(`${field} IS NOT NULL`);
        });
        
        // Apply range filters to the actual selected columns
        if (xMin !== undefined && xMin !== '') {
            whereConditions.push(`${xAxis} >= ${parseFloat(xMin)}`);
        }
        if (xMax !== undefined && xMax !== '') {
            whereConditions.push(`${xAxis} <= ${parseFloat(xMax)}`);
        }
        if (yMin !== undefined && yMin !== '') {
            yAxisFields.forEach(field => {
                whereConditions.push(`${field} >= ${parseFloat(yMin)}`);
            });
        }
        if (yMax !== undefined && yMax !== '') {
            yAxisFields.forEach(field => {
                whereConditions.push(`${field} <= ${parseFloat(yMax)}`);
            });
        }
        
        const whereClause = whereConditions.join(' AND ');
        
        // Build SELECT clause with x-axis and all y-axis fields
        const selectFields = [xAxis + ' as x_value'];
        yAxisFields.forEach((field, index) => {
            selectFields.push(`${field} as y_value_${index}`);
        });
        
        const query = `
            SELECT 
                ${selectFields.join(', ')}
            FROM shipments 
            WHERE ${whereClause}
            ORDER BY CreatedTime DESC
            LIMIT ${parseInt(limit)}
        `;
        
        const data = await runQuery(query);
        
        res.json({
            success: true,
            data,
            count: data.length,
            xAxis,
            yAxis: yAxisFields.length === 1 ? yAxisFields[0] : null,
            yAxes: yAxisFields,
            isMultiValue: yAxisFields.length > 1
        });
    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Check Flask API health
        let flaskHealth = { status: 'unknown', error: null };
        try {
            const flaskResponse = await axios.get('http://localhost:5000/health', { timeout: 5000 });
            flaskHealth = { status: 'healthy', data: flaskResponse.data };
        } catch (flaskError) {
            flaskHealth = { status: 'unhealthy', error: flaskError.message };
        }
        
        res.json({
            success: true,
            nodejs: { status: 'healthy', port: PORT },
            flask: flaskHealth,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get available columns for chart axes
app.get('/api/shipments/columns', async (req, res) => {
    try {
        const columns = [
            { name: 'GrossQuantity', type: 'numeric', description: 'Gross quantity of items shipped' },
            { name: 'FlowRate', type: 'numeric', description: 'Flow rate measurement for shipment processing' },
            { name: 'ShipmentCompartmentID', type: 'categorical', description: 'Unique identifier for shipment compartment' },
            { name: 'BaseProductID', type: 'categorical', description: 'Unique identifier for base product' },
            { name: 'BaseProductCode', type: 'categorical', description: 'Product code identifier' },
            { name: 'ShipmentID', type: 'categorical', description: 'Unique identifier for shipment' },
            { name: 'ShipmentCode', type: 'categorical', description: 'Shipment code identifier' },
            { name: 'ExitTime', type: 'datetime', description: 'Timestamp when shipment exited the system' },
            { name: 'BayCode', type: 'categorical', description: 'Bay identifier where shipment was processed' },
            { name: 'ScheduledDate', type: 'datetime', description: 'Scheduled date for shipment processing' },
            { name: 'CreatedTime', type: 'datetime', description: 'Timestamp when shipment record was created' }
        ];
        
        res.json({ success: true, columns });
    } catch (error) {
        console.error('Error fetching columns:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Chatbot API endpoint - integrates with Flask Ollama API
app.post('/api/chatbot/query', async (req, res) => {
    try {
        const { query, existingGraphs } = req.body;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query parameter is required'
            });
        }
        
        console.log(`🤖 Processing chatbot query: "${query}"`);
        console.log(`📊 Existing graphs: ${existingGraphs || 'none'}`);
        
        // Call Flask Ollama API
        const flaskApiUrl = 'http://localhost:5000/generate-graph-json';
        
        try {
            const flaskResponse = await axios.post(flaskApiUrl, {
                query: query,
                existingGraphs: existingGraphs || ''
            }, {
                timeout: 1000000, // 30 second timeout
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (flaskResponse.data.success) {
                const graphOperation = flaskResponse.data.graphOperation;
                console.log('✅ Flask API response:', graphOperation);
                
                res.json({
                    success: true,
                    data: graphOperation,
                    query: query,
                    source: 'flask-ollama'
                });
            } else {
                console.error('❌ Flask API returned error:', flaskResponse.data.error);
                res.status(500).json({
                    success: false,
                    error: `Flask API error: ${flaskResponse.data.error}`,
                    query: query
                });
            }
        } catch (flaskError) {
            console.error('❌ Flask API call failed:', flaskError.message);
            
            // Fallback to dummy response if Flask API is unavailable
            console.log('🔄 Falling back to dummy response');
            const fallbackResponse = {
                plotName: "fallback_chart",
                operation: "create",
                plotType: "bar",
                size: "medium",
                xAxis: "BayCode",
                yAxis: "GrossQuantity"
            };
            
            res.json({
                success: true,
                data: fallbackResponse,
                query: query,
                source: 'fallback',
                warning: 'Flask API unavailable, using fallback response'
            });
        }
        
    } catch (error) {
        console.error('Error processing chatbot query:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get aggregated data for specific columns
app.get('/api/shipments/aggregated', async (req, res) => {
    try {
        const { xAxis, yAxis, aggregation = 'COUNT' } = req.query;
        
        if (!xAxis || !yAxis) {
            return res.status(400).json({
                success: false,
                error: 'Both xAxis and yAxis parameters are required'
            });
        }
        
        // Validate aggregation type
        const allowedAggregations = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];
        if (!allowedAggregations.includes(aggregation.toUpperCase())) {
            return res.status(400).json({
                success: false,
                error: 'Invalid aggregation. Allowed: ' + allowedAggregations.join(', ')
            });
        }
        
        const query = `
            SELECT 
                ${xAxis} as x_value,
                ${aggregation.toUpperCase()}(${yAxis}) as y_value
            FROM shipments 
            WHERE ${xAxis} IS NOT NULL AND ${yAxis} IS NOT NULL
            GROUP BY ${xAxis}
            ORDER BY y_value DESC
            LIMIT 100
        `;
        
        const data = await runQuery(query);
        
        res.json({
            success: true,
            data,
            count: data.length,
            xAxis,
            yAxis,
            aggregation: aggregation.toUpperCase()
        });
    } catch (error) {
        console.error('Error fetching aggregated data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Layout persistence endpoints
app.get('/api/layout', async (req, res) => {
    try {
        const layout = await runQuery('SELECT * FROM dashboard_layout ORDER BY created_at DESC LIMIT 1');
        
        if (layout.length > 0) {
            res.json({
                success: true,
                layout: JSON.parse(layout[0].layout_data),
                metadata: {
                    id: layout[0].id,
                    created_at: layout[0].created_at,
                    updated_at: layout[0].updated_at
                }
            });
        } else {
            res.json({
                success: true,
                layout: [],
                metadata: null
            });
        }
    } catch (error) {
        console.error('Error fetching layout:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/layout', async (req, res) => {
    try {
        const { layout } = req.body;
        
        if (!layout) {
            return res.status(400).json({
                success: false,
                error: 'Layout data is required'
            });
        }
        
        // Clear existing layout and insert new one
        await runQuery('DELETE FROM dashboard_layout');
        
        const query = `
            INSERT INTO dashboard_layout (id, layout_data, created_at, updated_at)
            VALUES (1, ?, NOW(), NOW())
        `;
        
        await runQuery(query, [JSON.stringify(layout)]);
        
        res.json({
            success: true,
            message: 'Layout saved successfully'
        });
    } catch (error) {
        console.error('Error saving layout:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/layout', async (req, res) => {
    try {
        await runQuery('DELETE FROM dashboard_layout');
        
        res.json({
            success: true,
            message: 'Layout cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing layout:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Initialize database and start server
const startServer = async () => {
    try {
        // Connect to DuckDB
        await connectDatabase();
        console.log('✅ DuckDB connected successfully');
        
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
            console.log(`🤖 Chatbot API: http://localhost:${PORT}/api/chatbot/query`);
            console.log(`📊 DuckDB API: http://localhost:${PORT}/api/data`);
            console.log(`📈 Stats API: http://localhost:${PORT}/api/data/stats`);
            console.log(`🔍 Categories API: http://localhost:${PORT}/api/data/categories`);
            console.log(`💾 Query API: http://localhost:${PORT}/api/data/query`);
            console.log(`📦 Shipments API: http://localhost:${PORT}/api/shipments`);
            console.log(`📊 Shipment Stats: http://localhost:${PORT}/api/shipments/stats`);
            console.log(`🏭 By Product: http://localhost:${PORT}/api/shipments/by-product`);
            console.log(`🏗️ By Bay: http://localhost:${PORT}/api/shipments/by-bay`);
            console.log(`📈 Chart Data: http://localhost:${PORT}/api/shipments/chart-data?xAxis=BayCode&yAxis=GrossQuantity`);
            console.log(`📋 Available Columns: http://localhost:${PORT}/api/shipments/columns`);
            console.log(`📊 Aggregated Data: http://localhost:${PORT}/api/shipments/aggregated?xAxis=BaseProductCode&yAxis=GrossQuantity&aggregation=SUM`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
    