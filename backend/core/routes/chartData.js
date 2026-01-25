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
            let { tableName, xAxis, yAxis, yAxes, limit, xMin, xMax, yMin, yMax, dateFrom, dateTo } = req.query;
            // Remove default limit - return all records unless explicitly specified
            limit = limit ? parseInt(limit) : null;
            
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
            let dateTimeColumn = null;
            
            // First, check if this is a custom view and get base_view_name and dateTime if it exists
            const customView = await runQuery(`
                SELECT base_view_name, dateTime
                FROM custom_views
                WHERE view_name = '${tableName.replace(/'/g, "''")}'
            `);
            
            if (customView.length > 0) {
                if (customView[0].base_view_name) {
                    // It's a custom view, use the base_view_name (the actual database view it references)
                    actualTableName = customView[0].base_view_name;
                }
                // Get the dateTime column for date filtering
                dateTimeColumn = customView[0].dateTime;
            }
            
            if (customView.length === 0) {
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
            
            // Apply date range filter using the dateTime column from custom_views
            const quote = (v) => `'${String(v).replace(/'/g, "''")}'`;
            if (dateTimeColumn && (dateFrom || dateTo)) {
                // For datetime columns, we need to convert the date string to datetime for proper comparison
                let dateExpr = exprForColumn(dateTimeColumn);
                
                console.log(`📅 Applying date filter on column: ${dateTimeColumn}, dateFrom: ${dateFrom}, dateTo: ${dateTo}`);
                
                // First, ensure the column is not NULL
                whereConditions.push(`${dateExpr} IS NOT NULL`);
                
                // If dateFrom is provided, convert it to datetime for comparison
                if (dateFrom) {
                    // Use CONVERT to handle date string conversion - SQL Server format 23 is YYYY-MM-DD
                    // Compare dates by converting the column to DATE and comparing with the date string
                    whereConditions.push(`CONVERT(DATE, ${dateExpr}) >= CONVERT(DATE, ${quote(dateFrom)})`);
                    console.log(`📅 Added dateFrom filter: CONVERT(DATE, ${dateExpr}) >= CONVERT(DATE, '${dateFrom}')`);
                }
                
                if (dateTo) {
                    // Use CONVERT to handle date string conversion
                    whereConditions.push(`CONVERT(DATE, ${dateExpr}) <= CONVERT(DATE, ${quote(dateTo)})`);
                    console.log(`📅 Added dateTo filter: CONVERT(DATE, ${dateExpr}) <= CONVERT(DATE, '${dateTo}')`);
                }
            }
            
            // Apply range filters to the actual selected columns
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
            
            // Check data types for xAxis and yAxis fields to determine if they need datetime conversion
            let xAxisDataType = null;
            let yAxisDataTypes = {};
            
            try {
                const columnInfo = await runQuery(`
                    SELECT COLUMN_NAME, DATA_TYPE
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = '${actualTableName.replace(/'/g, "''")}'
                    AND COLUMN_NAME IN ('${xAxis.replace(/'/g, "''")}', ${yAxisFields.map(f => `'${f.replace(/'/g, "''")}'`).join(', ')})
                `);
                
                columnInfo.forEach(col => {
                    if (col.COLUMN_NAME === xAxis) {
                        xAxisDataType = col.DATA_TYPE?.toLowerCase();
                    }
                    yAxisFields.forEach((field, index) => {
                        if (col.COLUMN_NAME === field) {
                            yAxisDataTypes[field] = col.DATA_TYPE?.toLowerCase();
                        }
                    });
                });
            } catch (err) {
                console.warn('Could not fetch column data types:', err.message);
            }
            
            // Helper function to format datetime columns to date-only format (YYYY-MM-DD)
            const formatColumn = (colName, dataType) => {
                const datetimeTypes = ['datetime', 'datetime2', 'datetimeoffset', 'smalldatetime', 'timestamp', 'date'];
                
                // If we have data type info and it's a datetime/date type, convert to date-only format
                if (dataType && datetimeTypes.includes(dataType.toLowerCase())) {
                    // Convert to date-only format: YYYY-MM-DD
                    // Format 23 is ISO date format (YYYY-MM-DD) in SQL Server
                    return `CONVERT(varchar(10), TRY_CONVERT(date, ${colName}), 23)`;
                }
                
                // Fallback: Check common datetime column name patterns
                const datetimeColumnNames = [
                    'CreatedTime', 'UpdatedTime', 'StartTime', 'EndTime', 'ExitTime',
                    'NotifiedDate', 'CreatedDate', 'UpdatedDate', 'Time', 'Timestamp', 'Date'
                ];
                if (datetimeColumnNames.some(dtName => colName === dtName || colName.includes(dtName))) {
                    // Try converting to date-only format (will work if it's actually a datetime/date column)
                    return `CONVERT(varchar(10), TRY_CONVERT(date, ${colName}), 23)`;
                }
                
                return exprForColumn(colName);
            };
            
            // Build SELECT clause with x-axis and all y-axis fields
            const selectFields = [formatColumn(xAxis, xAxisDataType) + ' as x_value'];
            yAxisFields.forEach((field, index) => {
                selectFields.push(`${formatColumn(field, yAxisDataTypes[field])} as y_value_${index}`);
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
                // Build query with optional limit
                let limitClause = '';
                if (limit && limit > 0) {
                    limitClause = `OFFSET 0 ROWS FETCH NEXT ${limit} ROWS ONLY`;
                }
                query = `
                    SELECT 
                        ${selectFields.join(', ')}
                    FROM [${actualTableName.replace(/\]/g, ']]')}]
                    WHERE ${whereClause}
                    ORDER BY (SELECT NULL)
                    ${limitClause}
                `;
            }
            
            console.log('Executing query:', query);
            console.log('Query parameters:', { tableName, actualTableName, xAxis, yAxis, yAxes, whereClause });
            
            let data;
            try {
                data = await runQuery(query);
                console.log(`Query returned ${data.length} records`);
            } catch (queryError) {
                console.error('❌ Query execution error:', queryError.message);
                console.error('❌ Full query:', query);
                // If date filter causes error, try without it
                if (dateTimeColumn && (dateFrom || dateTo) && queryError.message.includes('CreatedTime')) {
                    console.log('⚠️ Retrying query without date filter due to error...');
                    const whereWithoutDate = whereConditions.filter(c => !c.includes('CreatedTime') && !c.includes('CONVERT') && !c.includes('CAST'));
                    const fallbackWhereClause = whereWithoutDate.length > 0 ? whereWithoutDate.join(' AND ') : '1=1';
                    const fallbackQuery = query.replace(/WHERE\s+.*?(?=ORDER|OFFSET|$)/i, `WHERE ${fallbackWhereClause} `);
                    console.log('🔄 Fallback query:', fallbackQuery);
                    data = await runQuery(fallbackQuery);
                    console.log(`✅ Fallback query returned ${data.length} records`);
                } else {
                    throw queryError;
                }
            }
            
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
                    
                    // If date filtering is applied, check if there are records with CreatedTime in the range
                    if (dateTimeColumn && (dateFrom || dateTo)) {
                        console.log(`🔍 Checking date filter issue for column: ${dateTimeColumn}`);
                        
                        // Check if CreatedTime has any non-null values
                        const nullCheckQuery = `SELECT COUNT(*) as total, COUNT(${dateTimeColumn}) as non_null_count FROM [${actualTableName.replace(/\]/g, ']]')}]`;
                        const nullCheck = await runQuery(nullCheckQuery);
                        console.log(`📊 CreatedTime stats - Total: ${nullCheck[0]?.total}, Non-null: ${nullCheck[0]?.non_null_count}`);
                        
                        // Check min/max CreatedTime values
                        const dateRangeQuery = `SELECT MIN(CAST(${dateTimeColumn} AS DATE)) as min_date, MAX(CAST(${dateTimeColumn} AS DATE)) as max_date FROM [${actualTableName.replace(/\]/g, ']]')}] WHERE ${dateTimeColumn} IS NOT NULL`;
                        const dateRange = await runQuery(dateRangeQuery);
                        console.log(`📅 CreatedTime date range - Min: ${dateRange[0]?.min_date}, Max: ${dateRange[0]?.max_date}`);
                        
                        // Test the date filter directly
                        const testDateFilter = whereConditions.filter(c => c.includes('CAST') && c.includes('DATE'));
                        if (testDateFilter.length > 0) {
                            const testQuery = `SELECT COUNT(*) as count FROM [${actualTableName.replace(/\]/g, ']]')}] WHERE ${testDateFilter.join(' AND ')}`;
                            console.log(`🧪 Testing date filter query: ${testQuery}`);
                            const testResult = await runQuery(testQuery);
                            console.log(`🧪 Date filter test result: ${testResult[0]?.count || 0} records`);
                        }
                    }
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

