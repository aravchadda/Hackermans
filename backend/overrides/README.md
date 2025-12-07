# Overrides Directory

This directory allows you to override any backend function without modifying the original code in the `core/` directory.

## How It Works

The override system automatically checks for files in this directory before loading the original implementation. If an override exists, it will be used instead of the core implementation.

## Directory Structure

```
overrides/
├── routes/          # Override route handlers
├── middleware/      # Override middleware functions
├── utils/           # Override utility functions
└── database/        # Override database functions
```

## Example: Overriding a Route Handler

To override the shipments route, create a file at:

```
overrides/routes/shipments.js
```

Example override:

```javascript
/**
 * Custom Shipments Routes Override
 * This file overrides the core/routes/shipments.js implementation
 */

const registerShipmentsRoutes = (app, { runQuery, runQueryCount }) => {
    // Override the GET /api/shipments endpoint
    app.get('/api/shipments', async (req, res) => {
        try {
            const { limit = 50, offset = 0 } = req.query; // Changed default limit
            
            // Add custom filtering logic
            const data = await runQuery(`
                SELECT * FROM shipments 
                WHERE GrossQuantity > 100  -- Custom filter
                ORDER BY CreatedTime DESC 
                OFFSET ${parseInt(offset)} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY
            `);
            
            res.json({ 
                success: true, 
                data, 
                count: data.length,
                customField: 'This is from an override!' 
            });
        } catch (error) {
            console.error('Error fetching shipments:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // You can also add new routes here
    app.get('/api/shipments/custom', async (req, res) => {
        res.json({ message: 'This is a custom route added via override' });
    });
};

module.exports = { registerShipmentsRoutes };
```

## Example: Overriding Database Functions

To override database functions, create:

```
overrides/database/index.js
```

Example:

```javascript
// Load the core database module to extend it
const coreDb = require('../../core/database/index');

// Override specific functions
const runQuery = async (query, params = []) => {
    // Add custom logging
    console.log(`[CUSTOM] Executing query: ${query.substring(0, 100)}...`);
    
    // Call the original function
    return await coreDb.runQuery(query, params);
};

// Export all functions, overriding only what you need
module.exports = {
    ...coreDb,
    runQuery  // This overrides the original runQuery
};
```

## Example: Overriding Utility Functions

To override helper functions:

```
overrides/utils/helpers.js
```

Example:

```javascript
// Override the exprForColumn function
const exprForColumn = (col) => {
    // Custom logic for specific columns
    if (col === 'CustomDate') {
        return 'CONVERT(varchar(10), TRY_CONVERT(date, CustomDate), 23)';
    }
    // For other columns, use default behavior
    return col;
};

module.exports = {
    exprForColumn
};
```

## Best Practices

1. **Only override what you need**: You don't need to copy the entire file, just override the specific functions you want to change.

2. **Extend, don't replace**: When possible, call the original function and add your custom logic around it.

3. **Document your overrides**: Add comments explaining why you're overriding and what changes you made.

4. **Test thoroughly**: Make sure your overrides work correctly and don't break existing functionality.

5. **Keep overrides simple**: If you need major changes, consider contributing to the core codebase instead.

## Notes

- Override files must export the same function names as the core files
- The override system uses Node.js `require()` caching, so changes require a server restart
- Overrides are loaded at server startup, so you'll see a log message when an override is active
- Files in the `overrides/` directory are typically gitignored, so your customizations won't be committed

