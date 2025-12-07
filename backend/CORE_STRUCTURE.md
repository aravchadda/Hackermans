# Backend Modular Structure

The backend has been refactored into a modular structure that allows easy customization through overrides without modifying the original code.

## Directory Structure

```
backend/
├── core/                    # Original code (DO NOT MODIFY)
│   ├── routes/             # Route handlers
│   │   ├── schema.js
│   │   ├── data.js
│   │   ├── shipments.js
│   │   ├── chartData.js
│   │   ├── chatbot.js
│   │   ├── insights.js
│   │   ├── layout.js
│   │   ├── import.js
│   │   └── health.js
│   ├── database/           # Database functions
│   │   └── index.js
│   ├── middleware/         # Middleware functions
│   └── utils/              # Utility functions
│       ├── overrideLoader.js
│       └── helpers.js
│
├── overrides/              # User customizations (OVERRIDE HERE)
│   ├── routes/            # Override route handlers
│   ├── database/          # Override database functions
│   ├── middleware/       # Override middleware
│   ├── utils/             # Override utilities
│   └── README.md          # Detailed override documentation
│
├── scripts/                # Utility scripts
├── index.js               # Main server file (uses override system)
└── package.json
```

## How It Works

1. **Core Directory**: Contains all original, unmodified code
2. **Overrides Directory**: Contains user customizations that override core functionality
3. **Override Loader**: Automatically checks for overrides and uses them if available

## Usage

### To Override a Route

1. Create a file in `overrides/routes/` with the same name as the core route file
2. Export the same function names
3. Restart the server

Example: To override shipments routes, create `overrides/routes/shipments.js`

### To Override Database Functions

1. Create `overrides/database/index.js`
2. Export the functions you want to override
3. You can extend the core functions or replace them entirely

### To Override Utilities

1. Create `overrides/utils/helpers.js`
2. Export the utility functions you want to override

## Example Override

See `overrides/README.md` for detailed examples and best practices.

## Migration Notes

- The original `database.js` has been moved to `core/database/index.js`
- All route handlers have been extracted into separate modules in `core/routes/`
- Scripts have been updated to use the new database location
- The main `index.js` now uses the override loader system

## Benefits

1. **No Core Code Modification**: Original code remains untouched
2. **Easy Updates**: Core code can be updated without losing customizations
3. **Version Control**: Overrides are typically gitignored, keeping customizations separate
4. **Flexibility**: Override any function, route, or utility
5. **Maintainability**: Clear separation between core and custom code

