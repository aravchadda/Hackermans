/**
 * Schema API Routes
 * Can be overridden in overrides/routes/schema.js
 */

const registerSchemaRoutes = (app, { runQuery }) => {
    // Database Schema API - Get all views and columns dynamically
    app.get('/api/schema', async (req, res) => {
        try {
            // Get all custom views from our metadata table
            const customViews = await runQuery(`
                SELECT view_name, base_view_name, description
                FROM custom_views
                ORDER BY view_name
            `);

            // Get columns for each view with data types and descriptions
            const schema = {};
            
            for (const view of customViews) {
                const viewName = view.view_name;
                const baseViewName = view.base_view_name || viewName; // Use base_view_name if available, otherwise use view_name
                
                // Get actual columns from the view (use base_view_name if it exists)
                // Handle views with broken dependencies gracefully
                let columns = [];
                let hasBindingErrors = false;
                
                try {
                    // Try using sys.columns first (more tolerant of binding errors)
                    const sysColumns = await runQuery(`
                        SELECT 
                            c.name as name,
                            t.name as dataType,
                            c.is_nullable as isNullable,
                            c.max_length as maxLength,
                            c.precision as precision,
                            c.scale as scale
                        FROM sys.columns c
                        INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
                        INNER JOIN sys.views v ON c.object_id = v.object_id
                        WHERE v.name = '${baseViewName.replace(/'/g, "''")}'
                        ORDER BY c.column_id
                    `);
                    
                    if (sysColumns.length > 0) {
                        columns = sysColumns.map(col => ({
                            name: col.name,
                            dataType: col.dataType,
                            isNullable: col.isNullable === 1 ? 'YES' : 'NO',
                            maxLength: col.maxLength === -1 ? null : col.maxLength,
                            precision: col.precision,
                            scale: col.scale
                        }));
                    } else {
                        // Fallback to INFORMATION_SCHEMA
                        try {
                            columns = await runQuery(`
                                SELECT 
                                    COLUMN_NAME as name,
                                    DATA_TYPE as dataType,
                                    IS_NULLABLE as isNullable,
                                    CHARACTER_MAXIMUM_LENGTH as maxLength,
                                    NUMERIC_PRECISION as precision,
                                    NUMERIC_SCALE as scale
                                FROM INFORMATION_SCHEMA.COLUMNS
                                WHERE TABLE_NAME = '${baseViewName.replace(/'/g, "''")}'
                                ORDER BY ORDINAL_POSITION
                            `);
                        } catch (infoSchemaErr) {
                            const errorMsg = infoSchemaErr.message || '';
                            if (errorMsg.includes('binding errors') || errorMsg.includes('Could not use view or function')) {
                                hasBindingErrors = true;
                                console.warn(`View '${baseViewName}' has binding errors, skipping column fetch`);
                            }
                            throw infoSchemaErr;
                        }
                    }
                } catch (err) {
                    const errorMsg = err.message || '';
                    if (errorMsg.includes('binding errors') || errorMsg.includes('Could not use view or function')) {
                        hasBindingErrors = true;
                        console.warn(`View '${baseViewName}' (custom name: '${viewName}') has binding errors:`, err.message);
                    } else {
                        console.warn(`Could not fetch columns for view ${baseViewName}:`, err.message);
                    }
                    // Continue with empty columns - will use metadata only if available
                }
                
                // Skip views with binding errors to prevent schema loading failures
                if (hasBindingErrors) {
                    console.warn(`Skipping custom view '${viewName}' because base view '${baseViewName}' has binding errors`);
                    continue; // Skip this view and continue with the next one
                }

                // Get column descriptions from metadata
                const columnMetadata = await runQuery(`
                    SELECT column_name, column_description, data_type
                    FROM view_columns
                    WHERE view_name = '${viewName.replace(/'/g, "''")}'
                `);
                
                const metadataMap = {};
                columnMetadata.forEach(m => {
                    metadataMap[m.column_name] = {
                        description: m.column_description,
                        dataType: m.data_type
                    };
                });

                // If we have no columns from the view but have metadata, use metadata
                if (columns.length === 0 && columnMetadata.length > 0) {
                    columns = columnMetadata.map(m => ({
                        name: m.column_name,
                        dataType: m.data_type || 'unknown',
                        isNullable: 'YES',
                        maxLength: null,
                        precision: null,
                        scale: null
                    }));
                }

                // Map SQL Server data types to frontend types
                const mappedColumns = columns.map(col => {
                    let type = 'nominal'; // default
                    const dataType = col.dataType?.toLowerCase() || '';
                    
                    // Determine field type based on SQL Server data type
                    if (['int', 'bigint', 'smallint', 'tinyint', 'decimal', 'numeric', 'float', 'real', 'money', 'smallmoney'].includes(dataType)) {
                        type = 'quantitative';
                    } else if (['date', 'datetime', 'datetime2', 'datetimeoffset', 'smalldatetime', 'time', 'timestamp'].includes(dataType)) {
                        type = 'temporal';
                    } else if (['bit'].includes(dataType)) {
                        type = 'nominal'; // boolean as nominal
                    } else {
                        type = 'nominal'; // varchar, nvarchar, char, text, etc.
                    }

                    const metadata = metadataMap[col.name];
                    return {
                        name: col.name,
                        type: type,
                        description: metadata?.description || `${col.name} (${col.dataType})`,
                        dataType: col.dataType || metadata?.dataType,
                        isNullable: col.isNullable === 'YES',
                        maxLength: col.maxLength,
                        precision: col.precision,
                        scale: col.scale
                    };
                });

                schema[viewName] = {
                    tableName: viewName,
                    baseViewName: baseViewName, // Include base_view_name so frontend knows which actual view to query
                    schemaName: null,
                    fullTableName: `[${viewName}]`,
                    description: view.description,
                    columns: mappedColumns
                };
            }

            res.json({
                success: true,
                schema: schema,
                tables: Object.keys(schema) // Keep 'tables' key for backward compatibility, but it contains views
            });
        } catch (error) {
            console.error('Error fetching schema:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Get columns for a specific view
    app.get('/api/schema/:tableName', async (req, res) => {
        try {
            const { tableName } = req.params;
            
            // Check if this is a custom view and get base_view_name if it exists
            const customView = await runQuery(`
                SELECT base_view_name
                FROM custom_views
                WHERE view_name = '${tableName.replace(/'/g, "''")}'
            `);
            
            const actualViewName = customView.length > 0 && customView[0].base_view_name 
                ? customView[0].base_view_name 
                : tableName;
            
            // Get actual columns from the view (use base_view_name if it exists)
            const columns = await runQuery(`
                SELECT 
                    COLUMN_NAME as name,
                    DATA_TYPE as dataType,
                    IS_NULLABLE as isNullable,
                    CHARACTER_MAXIMUM_LENGTH as maxLength,
                    NUMERIC_PRECISION as precision,
                    NUMERIC_SCALE as scale
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = '${actualViewName.replace(/'/g, "''")}'
                ORDER BY ORDINAL_POSITION
            `);

            // Get column descriptions from metadata
            const columnMetadata = await runQuery(`
                SELECT column_name, column_description
                FROM view_columns
                WHERE view_name = '${tableName.replace(/'/g, "''")}'
            `);
            
            const metadataMap = {};
            columnMetadata.forEach(m => {
                metadataMap[m.column_name] = m.column_description;
            });

            // Map SQL Server data types to frontend types
            const mappedColumns = columns.map(col => {
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
                    description: metadataMap[col.name] || `${col.name} (${col.dataType})`,
                    dataType: col.dataType,
                    isNullable: col.isNullable === 'YES',
                    maxLength: col.maxLength,
                    precision: col.precision,
                    scale: col.scale
                };
            });

            res.json({
                success: true,
                tableName: tableName,
                columns: mappedColumns
            });
        } catch (error) {
            console.error('Error fetching view schema:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
};

module.exports = { registerSchemaRoutes };

