/**
 * Chart Data API Routes
 * Can be overridden in overrides/routes/chartData.js
 */

const registerChartDataRoutes = (app, { runQuery }) => {
    const { exprForColumn } = require('../utils/helpers');

    // Dynamic chart data endpoint - works with any table
    app.get('/api/chart-data', async (req, res) => {
        try {
            const { tableName = 'Shipment', xAxis, yAxis, yAxes, limit = 1000, xMin, xMax, yMin, yMax } = req.query;
            
            if (!xAxis || (!yAxis && !yAxes)) {
                return res.status(400).json({
                    success: false,
                    error: 'Both xAxis and yAxis (or yAxes) parameters are required'
                });
            }
            
            // Get actual columns from database schema for the specified table
            const columns = await runQuery(`
                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = '${tableName}'
                ORDER BY ORDINAL_POSITION
            `);
            
            const allowedColumns = columns.map(col => col.COLUMN_NAME);
            
            if (allowedColumns.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: `View or table '${tableName}' not found or has no columns`
                });
            }
            
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
            const xExpr = exprForColumn(xAxis);
            let whereConditions = [`${xExpr} IS NOT NULL`];
            
            // Add null checks for all y-axis fields
            yAxisFields.forEach(field => {
                const fExpr = exprForColumn(field);
                whereConditions.push(`${fExpr} IS NOT NULL`);
            });
            
            // Apply range filters to the actual selected columns
            const quote = (v) => `'${String(v).replace(/'/g, "''")}'`;
            if (xMin !== undefined && xMin !== '') {
                if (xAxis === 'ScheduledDate') whereConditions.push(`${xExpr} >= ${quote(xMin)}`);
                else whereConditions.push(`${xAxis} >= ${parseFloat(xMin)}`);
            }
            if (xMax !== undefined && xMax !== '') {
                if (xAxis === 'ScheduledDate') whereConditions.push(`${xExpr} <= ${quote(xMax)}`);
                else whereConditions.push(`${xAxis} <= ${parseFloat(xMax)}`);
            }
            if (yMin !== undefined && yMin !== '') {
                yAxisFields.forEach(field => {
                    const fExpr = exprForColumn(field);
                    if (field === 'ScheduledDate') whereConditions.push(`${fExpr} >= ${quote(yMin)}`);
                    else whereConditions.push(`${fExpr} >= ${parseFloat(yMin)}`);
                });
            }
            if (yMax !== undefined && yMax !== '') {
                yAxisFields.forEach(field => {
                    const fExpr = exprForColumn(field);
                    if (field === 'ScheduledDate') whereConditions.push(`${fExpr} <= ${quote(yMax)}`);
                    else whereConditions.push(`${fExpr} <= ${parseFloat(yMax)}`);
                });
            }
            
            const whereClause = whereConditions.join(' AND ');
            
            // Build SELECT clause with x-axis and all y-axis fields
            const selectFields = [exprForColumn(xAxis) + ' as x_value'];
            yAxisFields.forEach((field, index) => {
                selectFields.push(`${exprForColumn(field)} as y_value_${index}`);
            });
            
            let query;
            // If x-axis is ScheduledDate, return one row per distinct date within range
            if (xAxis === 'ScheduledDate') {
                const xExpr = exprForColumn(xAxis);
                const aggSelects = [];
                if (yAxisFields.length > 0) {
                    yAxisFields.forEach((field, index) => {
                        const fExpr = exprForColumn(field);
                        aggSelects.push(`SUM(TRY_CONVERT(float, ${fExpr})) as y_value_${index}`);
                    });
                } else {
                    aggSelects.push('COUNT(1) as y_value');
                }
                query = `
                    SELECT 
                        ${xExpr} as x_value,
                        ${aggSelects.join(', ')}
                    FROM [${tableName}]
                    WHERE ${whereClause}
                    GROUP BY ${xExpr}
                    ORDER BY x_value ASC
                `;
            } else {
                query = `
                    SELECT 
                        ${selectFields.join(', ')}
                    FROM [${tableName}]
                    WHERE ${whereClause}
                    ORDER BY (SELECT NULL)
                    OFFSET 0 ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY
                `;
            }
            
            const data = await runQuery(query);
            
            res.json({
                success: true,
                data,
                count: data.length,
                tableName,
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

};

module.exports = { registerChartDataRoutes };

