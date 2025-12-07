/**
 * Insights API Routes
 * Can be overridden in overrides/routes/insights.js
 */

const axios = require('axios');

const registerInsightsRoutes = (app, { runQuery }) => {
    app.get('/api/insights/queries', async (req, res) => {
        try {
            console.log('📋 Fetching available insights queries...');
            
            // Call Flask API to get available queries
            const flaskApiUrl = 'http://localhost:5000/insights/queries';
            
            try {
                const flaskResponse = await axios.get(flaskApiUrl, {
                    timeout: 10000, // 10 second timeout
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (flaskResponse.data.success) {
                    console.log('✅ Retrieved insights queries from Flask API');
                    res.json({
                        success: true,
                        queries: flaskResponse.data.queries,
                        total_count: flaskResponse.data.total_count,
                        source: 'flask-ollama'
                    });
                } else {
                    console.error('❌ Flask API returned error:', flaskResponse.data.error);
                    res.status(500).json({
                        success: false,
                        error: `Flask API error: ${flaskResponse.data.error}`
                    });
                }
            } catch (flaskError) {
                console.error('❌ Flask API call failed:', flaskError.message);
                res.status(500).json({
                    success: false,
                    error: `Flask API unavailable: ${flaskError.message}`
                });
            }
            
        } catch (error) {
            console.error('Error fetching insights queries:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    app.post('/api/insights/execute', async (req, res) => {
        try {
            const { query } = req.body;
            
            if (!query) {
                return res.status(400).json({
                    success: false,
                    error: 'Query is required'
                });
            }
            
            console.log(`🔍 Processing natural language query: "${query}"`);
            
            // Send the natural language query to Flask API to get SQL
            const flaskApiUrl = 'http://localhost:5000/insights/query';
            
            try {
                console.log('📡 Sending query to Flask API...');
                const flaskResponse = await axios.post(flaskApiUrl, {
                    query: query
                }, {
                    timeout: 300000, // 30 second timeout for LLM processing
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('📋 Flask API response:', flaskResponse.data);
                
                if (flaskResponse.data.success) {
                    const { sql_query, query_identifier, description } = flaskResponse.data;
                    console.log(`✅ Retrieved SQL query: ${sql_query.substring(0, 100)}...`);
                    
                    // Execute the SQL query using our database
                    try {
                        const queryResults = await runQuery(sql_query);
                        console.log(`✅ Query executed successfully, returned ${queryResults.length} rows`);
                        
                        res.json({
                            success: true,
                            original_query: query,
                            query_identifier: query_identifier,
                            sql_query: sql_query,
                            description: description,
                            data: queryResults,
                            count: queryResults.length,
                            source: 'flask-llm-execution'
                        });
                    } catch (dbError) {
                        console.error('❌ Database query execution failed:', dbError.message);
                        res.status(500).json({
                            success: false,
                            error: `Database query execution failed: ${dbError.message}`,
                            sql_query: sql_query,
                            query_identifier: query_identifier,
                            original_query: query
                        });
                    }
                } else {
                    console.error('❌ Flask API returned error:', flaskResponse.data.error);
                    res.status(500).json({
                        success: false,
                        error: `Flask API error: ${flaskResponse.data.error}`,
                        original_query: query
                    });
                }
            } catch (flaskError) {
                console.error('❌ Flask API call failed:', flaskError.message);
                res.status(500).json({
                    success: false,
                    error: `Flask API unavailable: ${flaskError.message}`,
                    original_query: query
                });
            }
            
        } catch (error) {
            console.error('Error executing insights query:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
};

module.exports = { registerInsightsRoutes };

