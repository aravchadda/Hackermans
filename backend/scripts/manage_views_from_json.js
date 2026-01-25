/**
 * Script to upload views from individual JSON files to the database
 * 
 * This script reads all JSON files from backend/data/views/ directory
 * and creates/updates views in the database based on the configuration.
 * 
 * Usage:
 *   node scripts/manage_views_from_json.js          # Run once
 *   node scripts/manage_views_from_json.js --watch  # Watch for changes
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');

// Load database functions
const { connectDatabase, runQuery, runQueryFirst, closeDatabase } = require('../core/database/index');

const VIEWS_DIR = path.join(__dirname, '../data/views');
const WATCH_MODE = process.argv.includes('--watch') || process.argv.includes('-w');

function getAllViewFiles() {
    if (!fs.existsSync(VIEWS_DIR)) {
        throw new Error(`Views directory not found at ${VIEWS_DIR}`);
    }
    
    const files = fs.readdirSync(VIEWS_DIR)
        .filter(file => file.endsWith('.json') && !file.startsWith('_'))
        .map(file => path.join(VIEWS_DIR, file));
    
    return files;
}

async function loadViewFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
}

async function uploadViews(specificFile = null) {
    try {
        if (!WATCH_MODE) {
            console.log('🔌 Connecting to database...');
            await connectDatabase();
            console.log('✅ Connected to database');
        }
        
        const viewFiles = specificFile 
            ? [specificFile] 
            : getAllViewFiles();
        
        if (viewFiles.length === 0) {
            console.log('ℹ️  No view JSON files found in data/views/ directory');
            return;
        }
        
        console.log(`\n📋 Processing ${viewFiles.length} view file(s) from data/views/...\n`);
        
        const results = {
            success: [],
            errors: []
        };
        
        for (const filePath of viewFiles) {
            const fileName = path.basename(filePath);
            console.log(`📄 Processing: ${fileName}`);
            
            try {
                const viewConfig = await loadViewFile(filePath);
                const { view_name, sql_query, custom_name, view_description, columns, dateTime } = viewConfig;
                
                if (!view_name || !sql_query) {
                    console.log(`   ⚠️  Skipping: missing view_name or sql_query`);
                    results.errors.push({
                        file: fileName,
                        error: 'Missing view_name or sql_query'
                    });
                    continue;
                }
                
                // Check if view already exists
                const existing = await runQueryFirst(`
                    SELECT TABLE_NAME
                    FROM INFORMATION_SCHEMA.VIEWS
                    WHERE TABLE_NAME = '${view_name.replace(/'/g, "''")}'
                `);
                
                if (existing) {
                    console.log(`   ⚠️  View '${view_name}' already exists, dropping it first...`);
                    try {
                        await runQuery(`DROP VIEW [${view_name.replace(/\]/g, ']]')}]`);
                        console.log(`   ✅ Dropped existing view`);
                    } catch (dropError) {
                        console.log(`   ⚠️  Could not drop view: ${dropError.message}`);
                    }
                }
                
                // Create the view
                console.log(`   📝 Creating view: ${view_name}`);
                await runQuery(sql_query);
                console.log(`   ✅ View created successfully`);
                
                // Fetch columns from the created view to get data types
                console.log(`   📊 Fetching column information...`);
                const dbColumns = await runQuery(`
                    SELECT 
                        COLUMN_NAME as column_name,
                        DATA_TYPE as data_type,
                        IS_NULLABLE as is_nullable
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = '${view_name.replace(/'/g, "''")}'
                    ORDER BY ORDINAL_POSITION
                `);
                
                console.log(`   ✅ Found ${dbColumns.length} column(s)`);
                
                // Update or insert metadata in custom_views table
                const existingMetadata = await runQueryFirst(`
                    SELECT view_name FROM custom_views WHERE view_name = '${view_name.replace(/'/g, "''")}'
                `);
                
                const finalCustomName = custom_name || view_name;
                const finalDescription = view_description || null;
                const finalDateTime = dateTime || null;
                
                if (existingMetadata) {
                    // Update existing metadata
                    await runQuery(`
                        UPDATE custom_views 
                        SET sql_query = ?, custom_name = ?, description = ?, dateTime = ?, updated_at = GETDATE()
                        WHERE view_name = ?
                    `, [sql_query, finalCustomName, finalDescription, finalDateTime, view_name]);
                } else {
                    // Insert new metadata
                    await runQuery(`
                        INSERT INTO custom_views (view_name, custom_name, sql_query, description, dateTime, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, GETDATE(), GETDATE())
                    `, [view_name, finalCustomName, sql_query, finalDescription, finalDateTime]);
                }
                
                // Update view_columns table
                // Delete existing column metadata
                await runQuery(`DELETE FROM view_columns WHERE view_name = ?`, [view_name]);
                
                // Insert column metadata
                // Match JSON columns with database columns to get data types
                for (const jsonCol of columns || []) {
                    const dbCol = dbColumns.find(dc => dc.column_name === jsonCol.column_name);
                    
                    if (dbCol) {
                        await runQuery(`
                            INSERT INTO view_columns (view_name, column_name, column_description, data_type, created_at)
                            VALUES (?, ?, ?, ?, GETDATE())
                        `, [
                            view_name,
                            jsonCol.column_name,
                            jsonCol.column_description || `${jsonCol.column_name} (${dbCol.data_type})`,
                            dbCol.data_type
                        ]);
                    } else {
                        // Column in JSON but not in database - still insert with description
                        await runQuery(`
                            INSERT INTO view_columns (view_name, column_name, column_description, data_type, created_at)
                            VALUES (?, ?, ?, ?, GETDATE())
                        `, [
                            view_name,
                            jsonCol.column_name,
                            jsonCol.column_description || jsonCol.column_name,
                            null
                        ]);
                    }
                }
                
                // Also add any database columns that weren't in the JSON
                for (const dbCol of dbColumns) {
                    const jsonCol = columns?.find(jc => jc.column_name === dbCol.column_name);
                    if (!jsonCol) {
                        await runQuery(`
                            INSERT INTO view_columns (view_name, column_name, column_description, data_type, created_at)
                            VALUES (?, ?, ?, ?, GETDATE())
                        `, [
                            view_name,
                            dbCol.column_name,
                            `${dbCol.column_name} (${dbCol.data_type})`,
                            dbCol.data_type
                        ]);
                    }
                }
                
                console.log(`   ✅ Metadata updated in database\n`);
                results.success.push({
                    file: fileName,
                    view: view_name
                });
                
            } catch (error) {
                console.error(`   ❌ Error processing ${fileName}:`, error.message);
                console.log('');
                results.errors.push({
                    file: fileName,
                    error: error.message
                });
            }
        }
        
        console.log('\n📊 Summary:');
        console.log(`   ✅ Successfully processed: ${results.success.length} view(s)`);
        if (results.errors.length > 0) {
            console.log(`   ❌ Errors: ${results.errors.length} view(s)`);
            results.errors.forEach(err => {
                console.log(`      - ${err.file}: ${err.error}`);
            });
        }
        console.log('\n✅ Upload completed!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

function watchViewsDirectory() {
    console.log('👀 Watching for changes in views directory...');
    console.log(`📁 Directory: ${VIEWS_DIR}\n`);
    
    // Ensure directory exists
    if (!fs.existsSync(VIEWS_DIR)) {
        fs.mkdirSync(VIEWS_DIR, { recursive: true });
        console.log(`✅ Created views directory: ${VIEWS_DIR}\n`);
    }
    
    // Debounce timer to avoid multiple rapid executions
    let debounceTimer = null;
    const DEBOUNCE_DELAY = 500; // 500ms delay
    
    // Track which files are being processed to avoid duplicate processing
    const processingFiles = new Set();
    
    const processFileChange = async (filePath) => {
        const fileName = path.basename(filePath);
        
        // Skip template files and non-JSON files
        if (fileName.startsWith('_') || !fileName.endsWith('.json')) {
            return;
        }
        
        // Skip if already processing
        if (processingFiles.has(filePath)) {
            return;
        }
        
        // Check if file exists (might be a delete event)
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  File deleted: ${fileName} (skipping)\n`);
            return;
        }
        
        processingFiles.add(filePath);
        
        try {
            console.log(`\n🔄 Change detected: ${fileName}`);
            await uploadViews(filePath);
        } catch (error) {
            console.error(`❌ Error processing ${fileName}:`, error.message);
        } finally {
            processingFiles.delete(filePath);
        }
    };
    
    // Watch the directory
    const watcher = fs.watch(VIEWS_DIR, { recursive: false }, (eventType, filename) => {
        if (!filename) return;
        
        const filePath = path.join(VIEWS_DIR, filename);
        
        // Clear existing debounce timer
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        
        // Set new debounce timer
        debounceTimer = setTimeout(() => {
            if (eventType === 'rename' || eventType === 'change') {
                processFileChange(filePath);
            }
        }, DEBOUNCE_DELAY);
    });
    
    // Handle process termination
    process.on('SIGINT', async () => {
        console.log('\n\n🛑 Stopping watcher...');
        watcher.close();
        await closeDatabase();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n\n🛑 Stopping watcher...');
        watcher.close();
        await closeDatabase();
        process.exit(0);
    });
    
    // Initial upload of all views
    console.log('🚀 Performing initial upload of all views...\n');
    uploadViews().catch(error => {
        console.error('❌ Error in initial upload:', error.message);
    });
}

async function main() {
    try {
        if (WATCH_MODE) {
            // Connect to database once for watch mode
            console.log('🔌 Connecting to database...');
            await connectDatabase();
            console.log('✅ Connected to database\n');
            
            // Start watching
            watchViewsDirectory();
        } else {
            // One-time execution
            await uploadViews();
            await closeDatabase();
        }
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    }
}

// Run the script
main();
