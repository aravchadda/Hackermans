# Custom Views Feature

The backend now supports custom views instead of displaying raw database tables. Admins can create views using SQL queries, and these views will be used for chart generation.

## Database Tables

### `custom_views`
Stores view metadata:
- `id` - Primary key
- `view_name` - Unique view name
- `sql_query` - SQL SELECT query that defines the view
- `description` - Optional description of the view
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### `view_columns`
Stores column descriptions for each view:
- `id` - Primary key
- `view_name` - Foreign key to `custom_views`
- `column_name` - Column name in the view
- `column_description` - Human-readable description of the column
- `data_type` - Data type of the column
- `created_at` - Creation timestamp

## API Endpoints

### Get All Views
```
GET /api/views
```
Returns list of all custom views with their descriptions.

**Response:**
```json
{
  "success": true,
  "views": [
    {
      "view_name": "sales_summary",
      "description": "Monthly sales summary",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Get View Details
```
GET /api/views/:viewName
```
Returns detailed information about a specific view including columns with descriptions.

**Response:**
```json
{
  "success": true,
  "view": {
    "viewName": "sales_summary",
    "description": "Monthly sales summary",
    "sqlQuery": "SELECT ...",
    "columns": [
      {
        "name": "month",
        "type": "temporal",
        "description": "The month of the sale",
        "dataType": "date",
        "isNullable": false
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Create View (Admin)
```
POST /api/views
```
Creates a new view from a SQL query.

**Request Body:**
```json
{
  "viewName": "sales_summary",
  "sqlQuery": "SELECT MONTH(ScheduledDate) as month, SUM(GrossQuantity) as total FROM shipments GROUP BY MONTH(ScheduledDate)",
  "description": "Monthly sales summary",
  "columns": [
    {
      "columnName": "month",
      "columnDescription": "The month of the sale",
      "dataType": "int"
    },
    {
      "columnName": "total",
      "columnDescription": "Total quantity sold",
      "dataType": "decimal"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "View created successfully",
  "view": {
    "viewName": "sales_summary",
    "columns": [...]
  }
}
```

### Update View (Admin)
```
PUT /api/views/:viewName
```
Updates an existing view's SQL query, description, or column descriptions.

**Request Body:**
```json
{
  "sqlQuery": "SELECT ...",  // Optional
  "description": "Updated description",  // Optional
  "columns": [...]  // Optional
}
```

### Delete View (Admin)
```
DELETE /api/views/:viewName
```
Deletes a view and all its metadata.

## Schema API Changes

The `/api/schema` endpoint now returns views instead of tables:

```
GET /api/schema
```

Returns all custom views with their columns and descriptions. The response format remains the same for backward compatibility, but now contains views instead of tables.

## Chart Generation

The `/api/chart-data` endpoint works seamlessly with views. Simply use the view name as the `tableName` parameter:

```
GET /api/chart-data?tableName=sales_summary&xAxis=month&yAxis=total
```

## Security Notes

- Only SELECT queries are allowed when creating views
- SQL injection protection is in place
- View names are sanitized before use
- Consider adding authentication/authorization for admin endpoints (POST, PUT, DELETE)

## Example Usage

1. **Create a view:**
```bash
curl -X POST http://localhost:4000/api/views \
  -H "Content-Type: application/json" \
  -d '{
    "viewName": "product_sales",
    "sqlQuery": "SELECT BaseProductCode, SUM(GrossQuantity) as total FROM shipments GROUP BY BaseProductCode",
    "description": "Total sales by product",
    "columns": [
      {"columnName": "BaseProductCode", "columnDescription": "Product code", "dataType": "varchar"},
      {"columnName": "total", "columnDescription": "Total quantity sold", "dataType": "decimal"}
    ]
  }'
```

2. **Get all views:**
```bash
curl http://localhost:4000/api/views
```

3. **Generate chart from view:**
```bash
curl "http://localhost:4000/api/chart-data?tableName=product_sales&xAxis=BaseProductCode&yAxis=total"
```

