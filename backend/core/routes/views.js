/**
 * Views Management API Routes
 * Can be overridden in overrides/routes/views.js
 */

const registerViewsRoutes = (app, { runQuery, runQueryFirst }) => {
    // Get all custom views
    app.get('/api/views', async (req, res) => {
        try {
            const views = await runQuery(`
                SELECT 
                    view_name,
                    description,
                    created_at,
                    updated_at
                FROM custom_views
                ORDER BY view_name
            `);
            
            res.json({
                success: true,
                views: views
            });
        } catch (error) {
            console.error('Error fetching views:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Get a specific view with its columns and descriptions
    app.get('/api/views/:viewName', async (req, res) => {
        try {
            const { viewName } = req.params;
            
            // Get view metadata
            const view = await runQueryFirst(`
                SELECT 
                    view_name,
                    sql_query,
                    description,
                    created_at,
                    updated_at
                FROM custom_views
                WHERE view_name = '${viewName.replace(/'/g, "''")}'
            `);
            
            if (!view) {
                return res.status(404).json({
                    success: false,
                    error: 'View not found'
                });
            }
            
            // Get columns with descriptions from our metadata table
            const columnsMetadata = await runQuery(`
                SELECT 
                    column_name,
                    column_description,
                    data_type
                FROM view_columns
                WHERE view_name = '${viewName.replace(/'/g, "''")}'
                ORDER BY id
            `);
            
            // Also get actual columns from the view to get data types
            let actualColumns = [];
            try {
                actualColumns = await runQuery(`
                    SELECT 
                        COLUMN_NAME as name,
                        DATA_TYPE as dataType,
                        IS_NULLABLE as isNullable,
                        CHARACTER_MAXIMUM_LENGTH as maxLength,
                        NUMERIC_PRECISION as precision,
                        NUMERIC_SCALE as scale
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = '${viewName.replace(/'/g, "''")}'
                    ORDER BY ORDINAL_POSITION
                `);
            } catch (err) {
                console.warn('Could not fetch actual columns from view:', err.message);
            }
            
            // Merge metadata with actual column info
            const mergedColumns = actualColumns.map(col => {
                const metadata = columnsMetadata.find(m => m.column_name === col.name);
                let type = 'nominal';
                const dataType = col.dataType?.toLowerCase() || '';
                
                if (['int', 'bigint', 'smallint', 'tinyint', 'decimal', 'numeric', 'float', 'real', 'money', 'smallmoney'].includes(dataType)) {
                    type = 'quantitative';
                } else if (['date', 'datetime', 'datetime2', 'datetimeoffset', 'smalldatetime', 'time', 'timestamp'].includes(dataType)) {
                    type = 'temporal';
                } else {
                    type = 'nominal';
                }
                
                return {
                    name: col.name,
                    type: type,
                    description: metadata?.column_description || `${col.name} (${col.dataType})`,
                    dataType: col.dataType || metadata?.data_type,
                    isNullable: col.isNullable === 'YES',
                    maxLength: col.maxLength,
                    precision: col.precision,
                    scale: col.scale
                };
            });
            
            res.json({
                success: true,
                view: {
                    viewName: view.view_name,
                    description: view.description,
                    sqlQuery: view.sql_query,
                    columns: mergedColumns,
                    createdAt: view.created_at,
                    updatedAt: view.updated_at
                }
            });
        } catch (error) {
            console.error('Error fetching view:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Create a new view (admin only - for now, no auth check, but can be added)
    app.post('/api/views', async (req, res) => {
        try {
            const { viewName, sqlQuery, description, columns } = req.body;
            
            if (!viewName || !sqlQuery) {
                return res.status(400).json({
                    success: false,
                    error: 'viewName and sqlQuery are required'
                });
            }
            
            // Validate SQL query - must be a SELECT statement
            const trimmedQuery = sqlQuery.trim().toLowerCase();
            if (!trimmedQuery.startsWith('select')) {
                return res.status(400).json({
                    success: false,
                    error: 'SQL query must be a SELECT statement'
                });
            }
            
            // Check if view already exists
            const existing = await runQueryFirst(`
                SELECT view_name FROM custom_views WHERE view_name = '${viewName.replace(/'/g, "''")}'
            `);
            
            if (existing) {
                return res.status(400).json({
                    success: false,
                    error: 'View with this name already exists'
                });
            }
            
            // Create the view in the database
            const createViewQuery = `
                CREATE VIEW [${viewName.replace(/\]/g, ']]')}] AS ${sqlQuery}
            `;
            
            await runQuery(createViewQuery);
            
            // Get columns from the created view
            const viewColumns = await runQuery(`
                SELECT 
                    COLUMN_NAME as name,
                    DATA_TYPE as dataType
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = '${viewName.replace(/'/g, "''")}'
                ORDER BY ORDINAL_POSITION
            `);
            
            // Store view metadata
            await runQuery(`
                INSERT INTO custom_views (view_name, sql_query, description, created_at, updated_at)
                VALUES (?, ?, ?, GETDATE(), GETDATE())
            `, [viewName, sqlQuery, description || null]);
            
            // Store column descriptions
            if (columns && Array.isArray(columns)) {
                for (const col of columns) {
                    if (col.columnName && col.columnDescription) {
                        await runQuery(`
                            INSERT INTO view_columns (view_name, column_name, column_description, data_type, created_at)
                            VALUES (?, ?, ?, ?, GETDATE())
                        `, [
                            viewName,
                            col.columnName,
                            col.columnDescription,
                            col.dataType || null
                        ]);
                    }
                }
            } else {
                // If no columns provided, create entries with default descriptions
                for (const col of viewColumns) {
                    await runQuery(`
                        INSERT INTO view_columns (view_name, column_name, column_description, data_type, created_at)
                        VALUES (?, ?, ?, ?, GETDATE())
                    `, [
                        viewName,
                        col.name,
                        `${col.name} (${col.dataType})`,
                        col.dataType
                    ]);
                }
            }
            
            res.json({
                success: true,
                message: 'View created successfully',
                view: {
                    viewName: viewName,
                    columns: viewColumns
                }
            });
        } catch (error) {
            console.error('Error creating view:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Update view (admin only)
    app.put('/api/views/:viewName', async (req, res) => {
        try {
            const { viewName } = req.params;
            const { sqlQuery, description, columns } = req.body;
            
            // Check if view exists
            const existing = await runQueryFirst(`
                SELECT view_name FROM custom_views WHERE view_name = '${viewName.replace(/'/g, "''")}'
            `);
            
            if (!existing) {
                return res.status(404).json({
                    success: false,
                    error: 'View not found'
                });
            }
            
            // If SQL query is provided, recreate the view
            if (sqlQuery) {
                const trimmedQuery = sqlQuery.trim().toLowerCase();
                if (!trimmedQuery.startsWith('select')) {
                    return res.status(400).json({
                        success: false,
                        error: 'SQL query must be a SELECT statement'
                    });
                }
                
                // Drop existing view (SQL Server syntax)
                try {
                    await runQuery(`DROP VIEW [${viewName.replace(/\]/g, ']]')}]`);
                } catch (err) {
                    // View might not exist, ignore error
                    console.log('View does not exist or already dropped');
                }
                
                // Create new view
                await runQuery(`CREATE VIEW [${viewName.replace(/\]/g, ']]')}] AS ${sqlQuery}`);
                
                // Update SQL query in metadata
                await runQuery(`
                    UPDATE custom_views 
                    SET sql_query = ?, updated_at = GETDATE()
                    WHERE view_name = ?
                `, [sqlQuery, viewName]);
            }
            
            // Update description if provided
            if (description !== undefined) {
                await runQuery(`
                    UPDATE custom_views 
                    SET description = ?, updated_at = GETDATE()
                    WHERE view_name = ?
                `, [description, viewName]);
            }
            
            // Update column descriptions if provided
            if (columns && Array.isArray(columns)) {
                // Delete existing column metadata
                await runQuery(`DELETE FROM view_columns WHERE view_name = ?`, [viewName]);
                
                // Insert new column metadata
                for (const col of columns) {
                    if (col.columnName && col.columnDescription) {
                        await runQuery(`
                            INSERT INTO view_columns (view_name, column_name, column_description, data_type, created_at)
                            VALUES (?, ?, ?, ?, GETDATE())
                        `, [
                            viewName,
                            col.columnName,
                            col.columnDescription,
                            col.dataType || null
                        ]);
                    }
                }
            }
            
            res.json({
                success: true,
                message: 'View updated successfully'
            });
        } catch (error) {
            console.error('Error updating view:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Delete view (admin only)
    app.delete('/api/views/:viewName', async (req, res) => {
        try {
            const { viewName } = req.params;
            
            // Check if view exists
            const existing = await runQueryFirst(`
                SELECT view_name FROM custom_views WHERE view_name = '${viewName.replace(/'/g, "''")}'
            `);
            
            if (!existing) {
                return res.status(404).json({
                    success: false,
                    error: 'View not found'
                });
            }
            
            // Drop the view (this will cascade delete column metadata due to foreign key)
            try {
                await runQuery(`DROP VIEW [${viewName.replace(/\]/g, ']]')}]`);
            } catch (err) {
                // View might not exist, continue with metadata deletion
                console.log('View does not exist, deleting metadata only');
            }
            
            // Delete from metadata table (cascade should handle view_columns)
            await runQuery(`DELETE FROM custom_views WHERE view_name = ?`, [viewName]);
            
            res.json({
                success: true,
                message: 'View deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting view:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
};

module.exports = { registerViewsRoutes };

