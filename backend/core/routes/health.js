/**
 * Health Check Routes
 * Can be overridden in overrides/routes/health.js
 */

const axios = require('axios');

const registerHealthRoutes = (app, PORT) => {
    // Health check endpoint
    app.get('/health', async (req, res) => {
        try {
            // Check Flask API health
            let flaskHealth = { status: 'unknown', error: null };
            try {
                const flaskResponse = await axios.get('http://localhost:5001/health', { timeout: 5000 });
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
};

module.exports = { registerHealthRoutes };

