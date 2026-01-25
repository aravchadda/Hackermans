/**
 * Script to delete all views from the database
 * Usage: node scripts/delete_all_views.js
 */

require('dotenv').config();
const path = require('path');

// Load database functions
const { connectDatabase, runQuery, closeDatabase } = require('../core/database/index');

async function deleteAllViews() {
    try {
        console.log('🔌 Connecting to database...');
        await connectDatabase();
        console.log('✅ Connected to database');
        
        // Get all database views from INFORMATION_SCHEMA
        console.log('📋 Fetching all database views...');
        const allViews = await runQuery(`
            SELECT TABLE_NAME as view_name
            FROM INFORMATION_SCHEMA.VIEWS
            WHERE TABLE_SCHEMA = SCHEMA_NAME()
            ORDER BY TABLE_NAME
        `);
        
        if (allViews.length === 0) {
            console.log('ℹ️  No database views found.');
            
            // Also clean up any orphaned metadata
            console.log('🧹 Cleaning up orphaned metadata...');
            const orphanedMetadata = await runQuery(`SELECT view_name FROM custom_views`);
            if (orphanedMetadata.length > 0) {
                await runQuery(`DELETE FROM custom_views`);
                console.log(`   ✅ Deleted ${orphanedMetadata.length} orphaned metadata entries`);
            }
            
            process.exit(0);
        }
        
        console.log(`📊 Found ${allViews.length} database view(s) to delete:`);
        allViews.forEach((view, index) => {
            console.log(`   ${index + 1}. ${view.view_name}`);
        });
        
        const results = {
            deleted: [],
            errors: []
        };
        
        // Delete each database view
        console.log('\n🗑️  Deleting database views...');
        for (const view of allViews) {
            try {
                const viewName = view.view_name;
                
                // Drop the database view
                try {
                    await runQuery(`DROP VIEW [${viewName.replace(/\]/g, ']]')}]`);
                    console.log(`   ✅ Dropped database view: ${viewName}`);
                    results.deleted.push(viewName);
                } catch (err) {
                    console.error(`   ❌ Error dropping view '${viewName}':`, err.message);
                    results.errors.push({
                        view: viewName,
                        error: err.message
                    });
                }
            } catch (error) {
                console.error(`   ❌ Error processing view '${view.view_name}':`, error.message);
                results.errors.push({
                    view: view.view_name,
                    error: error.message
                });
            }
        }
        
        // Clean up metadata for deleted views
        console.log('\n🧹 Cleaning up metadata...');
        try {
            const deletedCount = await runQuery(`DELETE FROM custom_views`);
            console.log(`   ✅ Cleaned up metadata entries`);
        } catch (error) {
            console.log(`   ⚠️  Could not clean up metadata: ${error.message}`);
        }
        
        console.log('\n📊 Summary:');
        console.log(`   ✅ Successfully deleted: ${results.deleted.length} view(s)`);
        if (results.errors.length > 0) {
            console.log(`   ❌ Errors: ${results.errors.length} view(s)`);
            results.errors.forEach(err => {
                console.log(`      - ${err.view}: ${err.error}`);
            });
        }
        
        console.log('\n✅ All views deletion completed!');
        
        // Close database connection
        await closeDatabase();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        try {
            await closeDatabase();
        } catch (closeError) {
            // Ignore close errors
        }
        process.exit(1);
    }
}

// Run the script
deleteAllViews();

