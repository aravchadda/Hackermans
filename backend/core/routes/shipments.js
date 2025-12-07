/**
 * Shipments API Routes
 * Can be overridden in overrides/routes/shipments.js
 */

const registerShipmentsRoutes = (app, { runQuery }) => {
    // Shipment data routes
    app.get('/api/shipments', async (req, res) => {
        try {
            const { limit = 100, offset = 0 } = req.query;
            const data = await runQuery(`
                SELECT * FROM shipments 
                ORDER BY CreatedTime DESC 
                OFFSET ${parseInt(offset)} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY
            `);
            res.json({ success: true, data, count: data.length });
        } catch (error) {
            console.error('Error fetching shipments:', error);
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
                OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY
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
            
            const { exprForColumn } = require('../utils/helpers');
            const xAggExpr = exprForColumn(xAxis);
            const yAggExpr = exprForColumn(yAxis);
            const query = `
                SELECT 
                    ${xAggExpr} as x_value,
                    ${aggregation.toUpperCase()}(${yAggExpr}) as y_value
                FROM shipments 
                WHERE ${xAggExpr} IS NOT NULL AND ${yAggExpr} IS NOT NULL
                GROUP BY ${xAggExpr}
                ORDER BY y_value DESC
                OFFSET 0 ROWS FETCH NEXT 100 ROWS ONLY
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
};

module.exports = { registerShipmentsRoutes };

