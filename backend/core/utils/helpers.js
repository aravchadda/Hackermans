/**
 * Helper utility functions
 * These can be overridden in overrides/utils/helpers.js
 */

// Helper to map a column name to SQL expression (SQL Server)
const exprForColumn = (col) => {
    // Convert ScheduledDate to date-only format
    if (col === 'ScheduledDate') {
        return 'CONVERT(varchar(10), TRY_CONVERT(date, ScheduledDate), 23)';
    }
    
    // Note: Datetime columns are now handled dynamically in chartData.js
    // based on actual column data types from INFORMATION_SCHEMA
    // This ensures all datetime columns are converted to ISO 8601 format
    
    return col;
};

module.exports = {
    exprForColumn
};

