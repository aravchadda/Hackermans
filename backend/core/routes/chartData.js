/**
 * Chart Data API Routes
 * Can be overridden in overrides/routes/chartData.js
 */

const registerChartDataRoutes = (app, { runQuery }) => {
    const { exprForColumn } = require('../utils/helpers');

    // Dynamic chart data endpoint - works with any table
    app.get('/api/chart-data', async (req, res) => {
        console.log('📥 /api/chart-data route called');
        console.log('📥 Request query params:', req.query);
        console.log('📥 Request URL:', req.url);
        console.log('📥 Request method:', req.method);
        
        try {
            let { tableName, xAxis, yAxis, yAxes, limit = 1000, xMin, xMax, yMin, yMax } = req.query;
            
            // Require tableName parameter - use the selected view/table name
            if (!tableName) {
                return res.status(400).json({
                    success: false,
                    error: 'tableName parameter is required. Please specify which view or table to query.'
                });
            }
            
            if (!xAxis || (!yAxis && !yAxes)) {
                return res.status(400).json({
                    success: false,
                    error: 'Both xAxis and yAxis (or yAxes) parameters are required'
                });
            }
            
            // Determine the actual table/view to query from
            // The tableName parameter should be the selected view/table name from the frontend
            let actualTableName = tableName;
            
            // First, check if this is a custom view and get base_view_name if it exists
            const customView = await runQuery(`
                SELECT base_view_name
                FROM custom_views
                WHERE view_name = '${tableName.replace(/'/g, "''")}'
            `);
            
            if (customView.length > 0 && customView[0].base_view_name) {
                // It's a custom view, use the base_view_name (the actual database view it references)
                actualTableName = customView[0].base_view_name;
            } else {
                // Check if tableName is a database view (not a table)
                // If it's a view, use it directly; if it's a table, also use it directly
                // The key is: use whatever was selected, don't default to a fixed table
                const isView = await runQuery(`
                    SELECT TABLE_NAME
                    FROM INFORMATION_SCHEMA.VIEWS
                    WHERE TABLE_NAME = '${tableName.replace(/'/g, "''")}'
                `);
                
                if (isView.length > 0) {
                    // It's a database view, use it directly
                    actualTableName = tableName;
                } else {
                    // Check if it's a table
                    const isTable = await runQuery(`
                        SELECT TABLE_NAME
                        FROM INFORMATION_SCHEMA.TABLES
                        WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME = '${tableName.replace(/'/g, "''")}'
                    `);
                    
                    if (isTable.length > 0) {
                        // It's a table, use it directly
                        actualTableName = tableName;
                    } else {
                        // Not found as view or table, but use it anyway (will error if invalid, which is expected)
                        actualTableName = tableName;
                    }
                }
            }
            
            // Use the selected view/table name - don't default to a fixed table
            // The actualTableName is now set to whatever was selected (view or table)
            
            console.log(`Querying from view/table: ${actualTableName} (requested: ${tableName})`);
            
            // Note: We no longer validate columns since we removed those constraints
            // The SQL query will naturally fail if columns don't exist, which is the expected behavior
            
            // Determine which y-axis fields to use
            let yAxisFields = [];
            if (yAxes) {
                // Multiple y-axis fields provided as comma-separated string
                yAxisFields = yAxes.split(',').map(field => field.trim());
            } else if (yAxis) {
                // Single y-axis field
                yAxisFields = [yAxis];
            }
            
            // Build WHERE conditions for range filters
            const xExpr = exprForColumn(xAxis);
            let whereConditions = [];
            
            // Only add IS NOT NULL checks if we want to filter out nulls
            // For now, make it optional - comment out to allow nulls
            // whereConditions.push(`${xExpr} IS NOT NULL`);
            
            // Add null checks for all y-axis fields (optional - can be removed if causing issues)
            // yAxisFields.forEach(field => {
            //     const fExpr = exprForColumn(field);
            //     whereConditions.push(`${fExpr} IS NOT NULL`);
            // });
            
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
            
            // Build WHERE clause - use 1=1 if no conditions to ensure valid SQL
            const whereClause = whereConditions.length > 0 
                ? whereConditions.join(' AND ') 
                : '1=1';
            
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
                    FROM [${actualTableName.replace(/\]/g, ']]')}]
                    WHERE ${whereClause}
                    GROUP BY ${xExpr}
                    ORDER BY x_value ASC
                `;
            } else {
                query = `
                    SELECT 
                        ${selectFields.join(', ')}
                    FROM [${actualTableName.replace(/\]/g, ']]')}]
                    WHERE ${whereClause}
                    ORDER BY (SELECT NULL)
                    OFFSET 0 ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY
                `;
            }
            
            console.log('Executing query:', query);
            console.log('Query parameters:', { tableName, actualTableName, xAxis, yAxis, yAxes, whereClause });
            
            const data = await runQuery(query);
            
            console.log(`Query returned ${data.length} records`);
            
            // If no data returned, try a simpler query to check if the view/table has any data
            if (data.length === 0) {
                try {
                    const countQuery = `SELECT COUNT(*) as total FROM [${actualTableName.replace(/\]/g, ']]')}]`;
                    const countResult = await runQuery(countQuery);
                    console.log(`Total records in ${actualTableName}:`, countResult[0]?.total || 0);
                    
                    // Also check if columns exist
                    const columnCheck = await runQuery(`
                        SELECT COLUMN_NAME 
                        FROM INFORMATION_SCHEMA.COLUMNS 
                        WHERE TABLE_NAME = '${actualTableName.replace(/'/g, "''")}'
                        AND COLUMN_NAME IN ('${xAxis.replace(/'/g, "''")}', ${yAxisFields.map(f => `'${f.replace(/'/g, "''")}'`).join(', ')})
                    `);
                    console.log('Available columns matching requested fields:', columnCheck.map(c => c.COLUMN_NAME));
                } catch (checkError) {
                    console.error('Error checking table/view:', checkError.message);
                }
            }
            
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

