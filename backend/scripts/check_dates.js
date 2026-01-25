/**
 * Script to check the date range in vwGateToGate
 * Usage: node scripts/check_dates.js
 */

require('dotenv').config();
const { connectDatabase, runQuery, closeDatabase } = require('../core/database/index');

async function checkDates() {
    try {
        console.log('🔌 Connecting to database...');
        await connectDatabase();
        console.log('✅ Connected to database\n');
        
        // Check date range
        const dateRangeQuery = `
            SELECT 
                MIN(CONVERT(DATE, UpdatedTime)) as min_date,
                MAX(CONVERT(DATE, UpdatedTime)) as max_date,
                COUNT(*) as total_records,
                COUNT(UpdatedTime) as non_null_records
            FROM [vwGateToGate]
            WHERE UpdatedTime IS NOT NULL
        `;
        
        console.log('📅 Checking date range in vwGateToGate...\n');
        const dateRange = await runQuery(dateRangeQuery);
        
        if (dateRange.length > 0) {
            console.log('📊 Date Range Results:');
            console.log('='.repeat(80));
            console.log(`Min Date: ${dateRange[0].min_date}`);
            console.log(`Max Date: ${dateRange[0].max_date}`);
            console.log(`Total Records: ${dateRange[0].total_records}`);
            console.log(`Non-Null UpdatedTime: ${dateRange[0].non_null_records}`);
            
            // Check sample records
            const sampleQuery = `
                SELECT TOP 10
                    ShipmentStatus,
                    UpdatedTime,
                    CONVERT(DATE, UpdatedTime) as UpdatedDate
                FROM [vwGateToGate]
                WHERE UpdatedTime IS NOT NULL
                ORDER BY UpdatedTime DESC
            `;
            
            console.log('\n📋 Sample records (most recent):');
            console.log('='.repeat(80));
            const samples = await runQuery(sampleQuery);
            samples.forEach((row, idx) => {
                console.log(`${idx + 1}. Status: ${row.ShipmentStatus}, Date: ${row.UpdatedDate}, Time: ${row.UpdatedTime}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await closeDatabase();
        console.log('\n🔌 Database connection closed');
    }
}

checkDates();

