/**
 * Helper utility functions
 * These can be overridden in overrides/utils/helpers.js
 */

// Helper to map a column name to SQL expression (SQL Server)
const exprForColumn = (col) => {
    if (col === 'ScheduledDate') return 'CONVERT(varchar(10), TRY_CONVERT(date, ScheduledDate), 23)';
    return col;
};

module.exports = {
    exprForColumn
};

