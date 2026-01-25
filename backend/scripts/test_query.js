/**
 * Script to test a specific SQL query
 * Usage: node scripts/test_query.js
 */

require('dotenv').config();
const { connectDatabase, runQuery, closeDatabase } = require('../core/database/index');

async function testQuery() {
    try {
        console.log('🔌 Connecting to database...');
        await connectDatabase();
        console.log('✅ Connected to database\n');
        
        const query = `
            SELECT
                ShipmentStatus as x_value, 
                ShipmentStatus as y_value_0       
            FROM [vwGateToGate]
            WHERE UpdatedTime IS NOT NULL 
                AND CONVERT(DATE, UpdatedTime) >= CONVERT(DATE, '2016-11-24') 
                AND CONVERT(DATE, UpdatedTime) <= CONVERT(DATE, '2017-07-24')
            ORDER BY (SELECT NULL)
        `;
        
        console.log('📝 Executing query:');
        console.log(query);
        console.log('\n');
        
        const startTime = Date.now();
        const results = await runQuery(query);
        const endTime = Date.now();
        
        console.log(`\n✅ Query executed successfully in ${endTime - startTime}ms`);
        console.log(`📊 Total records returned: ${results.length}\n`);
        
        if (results.length > 0) {
            console.log('📋 First 10 records:');
            console.log('='.repeat(80));
            results.slice(0, 10).forEach((row, index) => {
                console.log(`Row ${index + 1}:`, JSON.stringify(row, null, 2));
            });
            
            if (results.length > 10) {
                console.log(`\n... and ${results.length - 10} more records`);
            }
            
            // Show unique values
            const uniqueValues = [...new Set(results.map(r => r.x_value))];
            console.log(`\n📈 Unique ShipmentStatus values: ${uniqueValues.length}`);
            uniqueValues.forEach((val, idx) => {
                const count = results.filter(r => r.x_value === val).length;
                console.log(`  ${idx + 1}. ${val}: ${count} records`);
            });
        } else {
            console.log('⚠️  No records found matching the criteria');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await closeDatabase();
        console.log('\n🔌 Database connection closed');
    }
}

// Run the test
testQuery();

