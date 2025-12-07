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
                SELECT view_name, description
                FROM custom_views
                ORDER BY view_name
            `);

            // Get columns for each view with data types and descriptions
            const schema = {};
            
            for (const view of customViews) {
                const viewName = view.view_name;
                
                // Get actual columns from the view
                const columns = await runQuery(`
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

                // Get column descriptions from metadata
                const columnMetadata = await runQuery(`
                    SELECT column_name, column_description
                    FROM view_columns
                    WHERE view_name = '${viewName.replace(/'/g, "''")}'
                `);
                
                const metadataMap = {};
                columnMetadata.forEach(m => {
                    metadataMap[m.column_name] = m.column_description;
                });

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

                schema[viewName] = {
                    tableName: viewName,
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
            
            // Get actual columns from the view
            const columns = await runQuery(`
                SELECT 
                    COLUMN_NAME as name,
                    DATA_TYPE as dataType,
                    IS_NULLABLE as isNullable,
                    CHARACTER_MAXIMUM_LENGTH as maxLength,
                    NUMERIC_PRECISION as precision,
                    NUMERIC_SCALE as scale
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = '${tableName.replace(/'/g, "''")}'
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

