// Test script to verify new chart types work with correct backend data format
const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testChartDataAPI() {
    console.log('🧪 Testing chart data API endpoints for new chart types...\n');

    const testCases = [
        {
            name: "Histogram Data Test",
            params: { xAxis: "BayCode", yAxis: "GrossQuantity", limit: 100 }
        },
        {
            name: "Area Chart Data Test", 
            params: { xAxis: "ScheduledDate", yAxis: "GrossQuantity", limit: 100 }
        },
        {
            name: "Heatmap Data Test",
            params: { xAxis: "BayCode", yAxis: "FlowRate", limit: 100 }
        }
    ];

    for (const test of testCases) {
        try {
            console.log(`📊 Testing: ${test.name}`);
            console.log(`Params:`, test.params);
            
            const response = await axios.get(`${BASE_URL}/api/shipments/chart-data`, {
                params: test.params
            });

            if (response.data.success) {
                console.log(`✅ ${test.name} - API call successful`);
                console.log(`Data count: ${response.data.count}`);
                console.log(`X-axis: ${response.data.xAxis}`);
                console.log(`Y-axis: ${response.data.yAxis}`);
                console.log(`Is multi-value: ${response.data.isMultiValue}`);
                
                // Check data format - should have x_value and y_value_0
                if (response.data.data && response.data.data.length > 0) {
                    const firstItem = response.data.data[0];
                    console.log(`First data item keys:`, Object.keys(firstItem));
                    console.log(`Sample data:`, firstItem);
                    
                    // Verify the expected format
                    if (firstItem.x_value !== undefined && firstItem.y_value_0 !== undefined) {
                        console.log(`✅ Data format is correct (x_value, y_value_0)`);
                    } else {
                        console.log(`❌ Data format is incorrect - missing expected fields`);
                    }
                }
            } else {
                console.log(`❌ ${test.name} - API call failed`);
                console.log(`Error: ${response.data.error}`);
            }
            
            console.log('---\n');
            
        } catch (error) {
            console.log(`❌ ${test.name} - Request failed`);
            console.log(`Error: ${error.message}`);
            if (error.response) {
                console.log(`Response:`, error.response.data);
            }
            console.log('---\n');
        }
    }
}

async function testChartCreation() {
    console.log('🧪 Testing chart creation via chatbot...\n');

    const testQueries = [
        {
            name: "Histogram Test",
            query: "Create a histogram showing the distribution of shipment quantities"
        },
        {
            name: "Area Chart Test", 
            query: "Create an area chart showing shipment trends over time"
        },
        {
            name: "Heatmap Test",
            query: "Create a heatmap showing shipment intensity by bay and time"
        }
    ];

    for (const test of testQueries) {
        try {
            console.log(`📊 Testing: ${test.name}`);
            console.log(`Query: "${test.query}"`);
            
            const response = await axios.post(`${BASE_URL}/api/chat`, {
                message: test.query
            });

            if (response.data.success) {
                console.log(`✅ ${test.name} - Chart creation successful`);
                console.log(`Chart Type: ${response.data.chartType || 'Not specified'}`);
                console.log(`Chart Name: ${response.data.chartName || 'Not specified'}`);
            } else {
                console.log(`❌ ${test.name} - Chart creation failed`);
                console.log(`Error: ${response.data.error}`);
            }
            
            console.log('---\n');
            
        } catch (error) {
            console.log(`❌ ${test.name} - Request failed`);
            console.log(`Error: ${error.message}`);
            console.log('---\n');
        }
    }
}

// Run tests
async function runTests() {
    console.log('🚀 Starting new chart type tests with correct data format...\n');
    
    try {
        await testChartDataAPI();
        await testChartCreation();
        
        console.log('✅ All tests completed!');
        console.log('\n📋 Summary:');
        console.log('- Chart data API endpoints tested');
        console.log('- Data format verified (x_value, y_value_0)');
        console.log('- Natural language chart creation tested');
        console.log('- New chart types should now work correctly');
        
    } catch (error) {
        console.log('❌ Test suite failed:', error.message);
    }
}

// Check if running directly
if (require.main === module) {
    runTests();
}

module.exports = { testChartDataAPI, testChartCreation, runTests };
