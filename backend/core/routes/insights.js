/**
 * Insights API Routes
 * Can be overridden in overrides/routes/insights.js
 */

// Use built-in fetch (Node 18+) to avoid bundling axios
const fetchJson = async (url, { method = 'GET', body, timeout = 10000, headers = {} } = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const err = new Error(data?.error || `Request failed with status ${res.status}`);
            err.response = { status: res.status, data };
            throw err;
        }
        return data;
    } finally {
        clearTimeout(timer);
    }
};

const registerInsightsRoutes = (app, { runQuery }) => {
    app.get('/api/insights/queries', async (req, res) => {
        try {
            console.log('📋 Fetching available insights queries...');
            
            // Call Flask API to get available queries
            const flaskApiUrl = 'http://localhost:5001/insights/queries';
            
            try {
                const flaskResponse = await fetchJson(flaskApiUrl, { timeout: 10000 });
                
                if (flaskResponse.success) {
                    console.log('✅ Retrieved insights queries from Flask API');
                    res.json({
                        success: true,
                        queries: flaskResponse.queries,
                        total_count: flaskResponse.total_count,
                        source: 'flask-ollama'
                    });
                } else {
                    console.error('❌ Flask API returned error:', flaskResponse.error);
                    res.status(500).json({
                        success: false,
                        error: `Flask API error: ${flaskResponse.error}`
                    });
                }
            } catch (flaskError) {
                console.error('❌ Flask API call failed:', flaskError.message);
                res.status(500).json({
                    success: false,
                    error: `Flask API unavailable: ${flaskError.message}`
                });
            }
            
        } catch (error) {
            console.error('Error fetching insights queries:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    app.post('/api/insights/execute', async (req, res) => {
        try {
            const { query, tableName, page = 1 } = req.body;
            
            if (!query) {
                return res.status(400).json({
                    success: false,
                    error: 'Query is required'
                });
            }

            // Calculate offset: page 1 = offset 0, page 2 = offset 10, etc.
            const pageNumber = parseInt(page, 10) || 1;
            const limit = 10;
            const offset = (pageNumber - 1) * limit;

            // If a view/table is provided, gather column details from view_columns for context
            let columnDescriptions = '';
            if (tableName) {
                try {
                    let columnDetails = await runQuery(
                        `
                        SELECT 
                            column_name AS name,
                            column_description AS description,
                            data_type AS dataType
                        FROM view_columns
                        WHERE view_name = ?
                        ORDER BY column_name
                        `,
                        [tableName]
                    );
                    
                    // Fallback: if no metadata rows, pull column names/types from INFORMATION_SCHEMA
                    if (!columnDetails || columnDetails.length === 0) {
                        const inferred = await runQuery(`
                            SELECT 
                                COLUMN_NAME AS name,
                                NULL AS description,
                                DATA_TYPE AS dataType
                            FROM INFORMATION_SCHEMA.COLUMNS
                            WHERE TABLE_NAME = '${tableName.replace(/'/g, "''")}'
                            ORDER BY ORDINAL_POSITION
                        `);
                        columnDetails = inferred || [];
                    }
                    
                    // Format column details as a string for the Flask API
                    if (columnDetails && columnDetails.length > 0) {
                        columnDescriptions = columnDetails.map(col => {
                            const desc = col.description || col.name;
                            const type = col.dataType || '';
                            return `${col.name} (${type}): ${desc}`;
                        }).join('\n');
                    }
                } catch (colErr) {
                    console.warn(`Could not load column details for view ${tableName}:`, colErr.message);
                }
            }
            
            console.log(`🔍 Processing natural language query: "${query}"`);
            
            // Send the natural language query to Flask API to get SQL
            const flaskApiUrl = 'http://localhost:5001/insights/query';
            
            try {
                console.log('📡 Sending query to Flask API...');
                const flaskResponse = await fetchJson(flaskApiUrl, {
                    method: 'POST',
                    body: { 
                        query,
                        tableName: tableName || 'shipments', // send table/view name
                        Column_descriptions: columnDescriptions // send column descriptions for the selected view
                    },
                    timeout: 300000 // 30 second timeout for LLM processing
                });
                
                console.log('📋 Flask API response:', flaskResponse);
                
                if (flaskResponse.success) {
                    let { sql_query, query_identifier, description } = flaskResponse;
                    console.log(`✅ Retrieved SQL query: ${sql_query.substring(0, 100)}...`);
                    
                    // Execute the SQL query using our database with pagination
                    try {
                        // Helper function to remove trailing semicolons and trim
                        const cleanQuery = (q) => q.trim().replace(/;+\s*$/, '').trim();
                        
                        // First, get total count by wrapping the query in a COUNT subquery
                        // Remove ORDER BY from inner query for COUNT (ORDER BY not allowed in subqueries)
                        let queryForCount = cleanQuery(sql_query);
                        const upperQueryForCount = queryForCount.toUpperCase();
                        
                        // Remove ORDER BY clause for count query (using regex to match ORDER BY ... up to end)
                        queryForCount = queryForCount.replace(/\s+ORDER\s+BY\s+[^;]+(;?)$/gi, '');
                        queryForCount = cleanQuery(queryForCount); // Remove any trailing semicolon
                        
                        let countQuery = `SELECT COUNT(*) AS total_count FROM (${queryForCount}) AS count_subquery`;
                        let countResult = await runQuery(countQuery);
                        const totalCount = countResult && countResult[0] ? parseInt(countResult[0].total_count, 10) : 0;
                        
                        // For pagination, always wrap the original query in an outer SELECT
                        // This ensures ORDER BY and OFFSET/FETCH are properly placed
                        let paginatedQuery = cleanQuery(sql_query);
                        
                        // Remove any existing OFFSET/FETCH clauses (case-insensitive regex)
                        paginatedQuery = paginatedQuery.replace(/\s+OFFSET\s+\d+\s+ROWS\s+FETCH\s+NEXT\s+\d+\s+ROWS\s+ONLY/gi, '');
                        paginatedQuery = paginatedQuery.replace(/\s+OFFSET\s+\d+\s+ROWS/gi, '');
                        paginatedQuery = cleanQuery(paginatedQuery);
                        
                        // Remove ORDER BY from inner query (we'll add it to outer query)
                        // Match ORDER BY that might be at the end, possibly with semicolon
                        paginatedQuery = paginatedQuery.replace(/\s+ORDER\s+BY\s+[^;]+(;?)$/gi, '$1');
                        paginatedQuery = cleanQuery(paginatedQuery);
                        
                        // Always wrap in outer SELECT with ORDER BY and OFFSET/FETCH
                        // This ensures proper syntax regardless of the original query structure
                        paginatedQuery = `SELECT * FROM (${paginatedQuery}) AS paginated_subquery ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
                        
                        console.log(`📄 Executing paginated query (page ${pageNumber}, offset ${offset}, limit ${limit})`);
                        console.log(`📄 Paginated query preview: ${paginatedQuery.substring(0, 200)}...`);
                        const queryResults = await runQuery(paginatedQuery);
                        console.log(`✅ Query executed successfully, returned ${queryResults.length} rows (total: ${totalCount})`);
                        
                        res.json({
                            success: true,
                            original_query: query,
                            query_identifier: query_identifier,
                            sql_query: sql_query,
                            description: description,
                            data: queryResults,
                            count: queryResults.length,
                            totalCount: totalCount,
                            page: pageNumber,
                            limit: limit,
                            source: 'flask-llm-execution'
                        });
                    } catch (dbError) {
                        console.error('❌ Database query execution failed:', dbError.message);
                        res.status(500).json({
                            success: false,
                            error: `Database query execution failed: ${dbError.message}`,
                            sql_query: sql_query,
                            query_identifier: query_identifier,
                            original_query: query
                        });
                    }
                } else {
                    console.error('❌ Flask API returned error:', flaskResponse.error);
                    res.status(500).json({
                        success: false,
                        error: `Flask API error: ${flaskResponse.error}`,
                        original_query: query
                    });
                }
            } catch (flaskError) {
                console.error('❌ Flask API call failed:', flaskError.message);
                res.status(500).json({
                    success: false,
                    error: `Flask API unavailable: ${flaskError.message}`,
                    original_query: query
                });
            }
            
        } catch (error) {
            console.error('Error executing insights query:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // New endpoint: Execute SQL query directly with pagination (no Flask call)
    app.post('/api/insights/execute-sql', async (req, res) => {
        try {
            const { sqlQuery, page = 1 } = req.body;
            
            if (!sqlQuery) {
                return res.status(400).json({
                    success: false,
                    error: 'SQL query is required'
                });
            }

            // Calculate offset: page 1 = offset 0, page 2 = offset 10, etc.
            const pageNumber = parseInt(page, 10) || 1;
            const limit = 10;
            const offset = (pageNumber - 1) * limit;

            try {
                // Helper function to remove trailing semicolons and trim
                const cleanQuery = (q) => q.trim().replace(/;+\s*$/, '').trim();
                
                // First, get total count by wrapping the query in a COUNT subquery
                let queryForCount = cleanQuery(sqlQuery);
                
                // Remove ORDER BY clause for count query
                queryForCount = queryForCount.replace(/\s+ORDER\s+BY\s+[^;]+(;?)$/gi, '');
                queryForCount = cleanQuery(queryForCount);
                
                let countQuery = `SELECT COUNT(*) AS total_count FROM (${queryForCount}) AS count_subquery`;
                let countResult = await runQuery(countQuery);
                const totalCount = countResult && countResult[0] ? parseInt(countResult[0].total_count, 10) : 0;
                
                // For pagination, always wrap the original query in an outer SELECT
                let paginatedQuery = cleanQuery(sqlQuery);
                
                // Remove any existing OFFSET/FETCH clauses
                paginatedQuery = paginatedQuery.replace(/\s+OFFSET\s+\d+\s+ROWS\s+FETCH\s+NEXT\s+\d+\s+ROWS\s+ONLY/gi, '');
                paginatedQuery = paginatedQuery.replace(/\s+OFFSET\s+\d+\s+ROWS/gi, '');
                paginatedQuery = cleanQuery(paginatedQuery);
                
                // Remove ORDER BY from inner query
                paginatedQuery = paginatedQuery.replace(/\s+ORDER\s+BY\s+[^;]+(;?)$/gi, '$1');
                paginatedQuery = cleanQuery(paginatedQuery);
                
                // Always wrap in outer SELECT with ORDER BY and OFFSET/FETCH
                paginatedQuery = `SELECT * FROM (${paginatedQuery}) AS paginated_subquery ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
                
                console.log(`📄 Executing SQL query with pagination (page ${pageNumber}, offset ${offset}, limit ${limit})`);
                const queryResults = await runQuery(paginatedQuery);
                console.log(`✅ SQL query executed successfully, returned ${queryResults.length} rows (total: ${totalCount})`);
                
                res.json({
                    success: true,
                    sql_query: sqlQuery,
                    data: queryResults,
                    count: queryResults.length,
                    totalCount: totalCount,
                    page: pageNumber,
                    limit: limit,
                    source: 'direct-sql-execution'
                });
            } catch (dbError) {
                console.error('❌ Database query execution failed:', dbError.message);
                res.status(500).json({
                    success: false,
                    error: `Database query execution failed: ${dbError.message}`,
                    sql_query: sqlQuery
                });
            }
        } catch (error) {
            console.error('Error executing SQL query:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
};

module.exports = { registerInsightsRoutes };

