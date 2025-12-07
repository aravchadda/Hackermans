/**
 * Layout API Routes
 * Can be overridden in overrides/routes/layout.js
 */

const registerLayoutRoutes = (app, { runQuery }) => {
    // Layout persistence endpoints
    app.get('/api/layout', async (req, res) => {
        try {
            const layout = await runQuery('SELECT TOP 1 * FROM dashboard_layout ORDER BY created_at DESC');
            
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
                VALUES (1, ?, GETDATE(), GETDATE())
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
};

module.exports = { registerLayoutRoutes };

