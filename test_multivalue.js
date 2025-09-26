const axios = require('axios');

async function testMultiValueAPI() {
    try {
        console.log('🧪 Testing multi-value API endpoint...');
        
        // Test single y-axis (existing functionality)
        console.log('\n1. Testing single y-axis:');
        const singleResponse = await axios.get('http://localhost:4000/api/shipments/chart-data', {
            params: {
                xAxis: 'BayCode',
                yAxis: 'GrossQuantity',
                limit: 10
            }
        });
        console.log('✅ Single y-axis response:', {
            success: singleResponse.data.success,
            count: singleResponse.data.count,
            isMultiValue: singleResponse.data.isMultiValue,
            yAxes: singleResponse.data.yAxes
        });
        
        // Test multiple y-axis (new functionality)
        console.log('\n2. Testing multiple y-axis:');
        const multiResponse = await axios.get('http://localhost:4000/api/shipments/chart-data', {
            params: {
                xAxis: 'BayCode',
                yAxes: 'GrossQuantity,FlowRate',
                limit: 10
            }
        });
        console.log('✅ Multi y-axis response:', {
            success: multiResponse.data.success,
            count: multiResponse.data.count,
            isMultiValue: multiResponse.data.isMultiValue,
            yAxes: multiResponse.data.yAxes
        });
        
        // Show sample data structure
        if (multiResponse.data.data && multiResponse.data.data.length > 0) {
            console.log('\n📊 Sample multi-value data structure:');
            console.log('First record:', multiResponse.data.data[0]);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testMultiValueAPI();
