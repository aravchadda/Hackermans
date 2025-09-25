const express = require('express');
const cors = require('cors');
const { connectDatabase, runQuery, runQueryFirst, runQueryCount } = require('./database');

const app = express();
app.use(cors());
require('dotenv').config();

const PORT = process.env.PORT || 5000;
app.use(express.json());

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

// Initialize database and start server
const startServer = async () => {
    try {
        // Connect to DuckDB
        await connectDatabase();
        console.log('✅ DuckDB connected successfully');
        
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 DuckDB API: http://localhost:${PORT}/api/data`);
            console.log(`📈 Stats API: http://localhost:${PORT}/api/data/stats`);
            console.log(`🔍 Categories API: http://localhost:${PORT}/api/data/categories`);
            console.log(`💾 Query API: http://localhost:${PORT}/api/data/query`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
    