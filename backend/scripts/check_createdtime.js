/**
 * Script to check CreatedTime column in vwBayUtilization
 */

require('dotenv').config();
const { connectDatabase, runQuery, closeDatabase } = require('../core/database/index');

async function checkCreatedTime() {
    try {
        console.log('🔌 Connecting to database...');
        await connectDatabase();
        console.log('✅ Connected\n');
        
        // Check CreatedTime column directly
        const checkQuery = `
            SELECT TOP 10
                CreatedTime,
                StartTime,
                EndTime,
                ExitTime,
                CASE WHEN CreatedTime IS NULL THEN 'NULL' ELSE 'NOT NULL' END as CreatedTimeStatus
            FROM vwBayUtilization
        `;
        
        console.log('📊 Checking CreatedTime values...\n');
        const results = await runQuery(checkQuery);
        
        console.log('Sample records:');
        results.forEach((row, idx) => {
            console.log(`${idx + 1}. CreatedTime: ${row.CreatedTime}, StartTime: ${row.StartTime}, EndTime: ${row.EndTime}, Status: ${row.CreatedTimeStatus}`);
        });
        
        // Check NULL count
        const nullCheck = await runQuery(`
            SELECT 
                COUNT(*) as total,
                COUNT(CreatedTime) as non_null_count,
                COUNT(StartTime) as start_time_count,
                COUNT(EndTime) as end_time_count,
                COUNT(ExitTime) as exit_time_count
            FROM vwBayUtilization
        `);
        
        console.log('\n📊 Column NULL counts:');
        console.log(`Total records: ${nullCheck[0].total}`);
        console.log(`CreatedTime non-null: ${nullCheck[0].non_null_count}`);
        console.log(`StartTime non-null: ${nullCheck[0].start_time_count}`);
        console.log(`EndTime non-null: ${nullCheck[0].end_time_count}`);
        console.log(`ExitTime non-null: ${nullCheck[0].exit_time_count}`);
        
        // Check date ranges for all time columns
        const dateRanges = await runQuery(`
            SELECT 
                'CreatedTime' as column_name,
                MIN(CONVERT(DATE, CreatedTime)) as min_date,
                MAX(CONVERT(DATE, CreatedTime)) as max_date
            FROM vwBayUtilization
            WHERE CreatedTime IS NOT NULL
            UNION ALL
            SELECT 
                'StartTime' as column_name,
                MIN(CONVERT(DATE, StartTime)) as min_date,
                MAX(CONVERT(DATE, StartTime)) as max_date
            FROM vwBayUtilization
            WHERE StartTime IS NOT NULL
            UNION ALL
            SELECT 
                'EndTime' as column_name,
                MIN(CONVERT(DATE, EndTime)) as min_date,
                MAX(CONVERT(DATE, EndTime)) as max_date
            FROM vwBayUtilization
            WHERE EndTime IS NOT NULL
        `);
        
        console.log('\n📅 Date ranges for time columns:');
        dateRanges.forEach(range => {
            console.log(`${range.column_name}: ${range.min_date} to ${range.max_date}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await closeDatabase();
    }
}

checkCreatedTime();

