/**
 * EXAMPLE: How to override utility functions
 * 
 * To override utility functions:
 * 1. Copy this file to: overrides/utils/helpers.js
 * 2. Modify the functions you want to override
 * 3. Restart the server
 */

// Example: Override exprForColumn to add custom column handling
const exprForColumn = (col) => {
    // Add custom handling for specific columns
    if (col === 'ScheduledDate') {
        return 'CONVERT(varchar(10), TRY_CONVERT(date, ScheduledDate), 23)';
    }
    
    // Add custom handling for another column
    if (col === 'CustomDate') {
        return 'CONVERT(varchar(10), TRY_CONVERT(date, CustomDate), 23)';
    }
    
    // Default behavior for other columns
    return col;
};

module.exports = {
    exprForColumn
};

