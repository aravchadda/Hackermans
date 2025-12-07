/**
 * EXAMPLE: How to override a route handler
 * 
 * This is an example file showing how to override routes.
 * To use this, rename it to match the route file you want to override.
 * 
 * For example, to override shipments routes:
 * 1. Copy this file to: overrides/routes/shipments.js
 * 2. Modify the registerShipmentsRoutes function
 * 3. Restart the server
 * 
 * The override will automatically be loaded instead of the core implementation.
 */

// Example: Override shipments routes
const registerShipmentsRoutes = (app, { runQuery, runQueryCount }) => {
    // Override the GET /api/shipments endpoint
    app.get('/api/shipments', async (req, res) => {
        try {
            // Your custom implementation here
            const { limit = 100, offset = 0 } = req.query;
            const data = await runQuery(`
                SELECT * FROM shipments 
                ORDER BY CreatedTime DESC 
                OFFSET ${parseInt(offset)} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY
            `);
            
            res.json({ 
                success: true, 
                data, 
                count: data.length,
                note: 'This response is from an override!' 
            });
        } catch (error) {
            console.error('Error fetching shipments:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // You can also add completely new routes
    app.get('/api/shipments/custom-endpoint', async (req, res) => {
        res.json({ 
            message: 'This is a custom route added via override',
            timestamp: new Date().toISOString()
        });
    });
};

module.exports = { registerShipmentsRoutes };

