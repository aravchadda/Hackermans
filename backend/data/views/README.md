# Views Configuration Directory

This directory contains individual JSON configuration files for each database view.

## File Structure

Each view should have its own JSON file named after the view (e.g., `vwGateToGate.json`).

## JSON File Format

```json
{
  "view_name": "vwGateToGate",
  "custom_name": "Gate to Gate View",
  "view_description": "Description of what this view provides",
  "sql_query": "CREATE VIEW vwGateToGate AS SELECT ...",
  "dateTime": "UpdatedTime",
  "columns": [
    {
      "column_name": "ShipmentCode",
      "column_description": "Description of the column"
    }
  ]
}
```

## Fields

- **view_name** (required): The name of the database view
- **custom_name** (optional): Display name for the view (defaults to view_name)
- **view_description** (optional): Description of what the view provides
- **sql_query** (required): The CREATE VIEW SQL statement
- **dateTime** (optional): Name of the column to use as the date/time column for filtering and time-based operations
- **columns** (required): Array of column definitions
  - **column_name** (required): Name of the column
  - **column_description** (required): Human-readable description of the column

## Usage

1. **Create a new view file**: Add a new JSON file in this directory with the view configuration
2. **Run the upload script**: `node scripts/manage_views_from_json.js`
   - This will create/update the views in the database
   - Fetch column information automatically
   - Update metadata with descriptions

## Example Workflow

1. Create `myView.json` with view_name, sql_query, and columns with descriptions
2. Run `node scripts/manage_views_from_json.js`
3. The view is created and all metadata is updated in the database
