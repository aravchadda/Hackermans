/**
 * Chatbot API Routes
 * Can be overridden in overrides/routes/chatbot.js
 */

const axios = require('axios');

const registerChatbotRoutes = (app) => {
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
            const flaskApiUrl = 'http://localhost:5001/generate-graph-json';
            
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
};

module.exports = { registerChatbotRoutes };

