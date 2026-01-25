/**
 * Import API Routes
 * Can be overridden in overrides/routes/import.js
 */

const fs = require('fs');

const registerImportRoutes = (app, { runQuery, runQueryCount }, upload) => {
    // CSV Import endpoint
    app.post('/api/import/csv', upload.single('csvFile'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No CSV file provided'
                });
            }

            const filePath = req.file.path;
            const tableName = req.body.tableName || 'shipments';
            
            console.log(`Importing CSV file: ${filePath} to table: ${tableName}`);

            // Clear existing data from the table
            await runQuery(`DELETE FROM ${tableName}`);
            
            // CSV auto-import was DuckDB-specific; not implemented for MySQL in this endpoint
            // TODO: Implement streaming CSV import into MySQL if needed
            throw new Error('CSV auto-import not implemented for MySQL');

            // Get the count of imported records
            const count = await runQueryCount(`SELECT COUNT(*) as count FROM ${tableName}`);
            
            // Clean up the uploaded file
            fs.unlinkSync(filePath);

            res.json({
                success: true,
                message: `Successfully imported ${count} records from CSV`,
                recordCount: count,
                tableName: tableName
            });

        } catch (error) {
            console.error('Error importing CSV:', error);
            
            // Clean up file if it exists
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
};

module.exports = { registerImportRoutes };

