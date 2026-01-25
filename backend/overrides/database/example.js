/**
 * EXAMPLE: How to override database functions
 * 
 * To override database functions:
 * 1. Copy this file to: overrides/database/index.js
 * 2. Modify the functions you want to override
 * 3. Restart the server
 */

// Load the core database module
const coreDb = require('../../core/database/index');

// Example: Override runQuery to add custom logging
const runQuery = async (query, params = []) => {
    console.log(`[CUSTOM DB] Executing query: ${query.substring(0, 100)}...`);
    const startTime = Date.now();
    
    try {
        // Call the original function
        const result = await coreDb.runQuery(query, params);
        const duration = Date.now() - startTime;
        console.log(`[CUSTOM DB] Query completed in ${duration}ms`);
        return result;
    } catch (error) {
        console.error(`[CUSTOM DB] Query failed: ${error.message}`);
        throw error;
    }
};

// Export all database functions, overriding only what you need
module.exports = {
    ...coreDb,  // Include all original functions
    runQuery    // Override this specific function
};

