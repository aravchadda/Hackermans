const axios = require('axios');

// Configuration
const NODE_BACKEND_URL = 'http://localhost:4000';

// All available insights queries
const INSIGHTS_QUERIES = [
    {
        name: "DAILY_THROUGHPUT_ANALYSIS",
        naturalQuery: "Show me daily throughput trends",
        description: "Track overall terminal productivity, identify peak/low activity periods, and monitor capacity utilization trends"
    },
    {
        name: "BAY_PERFORMANCE_COMPARISON", 
        naturalQuery: "Which bays are performing best?",
        description: "Identify high-performing vs. underperforming bays, optimize resource allocation, and detect equipment maintenance needs"
    },
    {
        name: "FLOW_RATE_PERFORMANCE_ANALYSIS",
        naturalQuery: "What are the flow rate issues?",
        description: "Optimize equipment efficiency, identify technical issues, and benchmark performance across different product types and bays"
    },
    {
        name: "SCHEDULE_ADHERENCE_ANALYSIS",
        naturalQuery: "How are we doing with schedule adherence?",
        description: "Monitor operational efficiency, identify scheduling bottlenecks, and improve customer service by reducing delays"
    },
    {
        name: "PRODUCT_PORTFOLIO_PERFORMANCE",
        naturalQuery: "Which products are most profitable?",
        description: "Analyze product mix profitability, identify high-volume vs. specialty products, and optimize terminal configuration"
    },
    {
        name: "OPERATIONAL_TIME_PATTERNS",
        naturalQuery: "What are the peak operating hours?",
        description: "Identify optimal operating hours, plan staffing schedules, and discover seasonal or weekly trends for capacity planning"
    }
];

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(80));
    log(title, 'bright');
    console.log('='.repeat(80));
}

function logStep(step, message) {
    log(`\n[${step}] ${message}`, 'cyan');
}

async function testHealthCheck() {
    logSection('🏥 HEALTH CHECK');
    
    try {
        const response = await axios.get(`${NODE_BACKEND_URL}/health`, { timeout: 5000 });
        if (response.data.success) {
            log('✅ Node.js backend is healthy', 'green');
            if (response.data.flask) {
                log(`✅ Flask backend: ${response.data.flask.status}`, 'green');
            }
            return true;
        } else {
            log('❌ Health check failed', 'red');
            return false;
        }
    } catch (error) {
        log(`❌ Health check failed: ${error.message}`, 'red');
        return false;
    }
}

async function testInsightQuery(queryInfo) {
    logSection(`🧪 TESTING: ${queryInfo.name}`);
    log(`Description: ${queryInfo.description}`, 'yellow');
    log(`Natural Query: "${queryInfo.naturalQuery}"`, 'blue');
    
    try {
        logStep('1', 'Sending natural language query to Node.js backend...');
        
        const response = await axios.post(`${NODE_BACKEND_URL}/api/insights/query`, {
            query: queryInfo.naturalQuery
        }, {
            timeout: 100000, // 100 second timeout
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.data.success) {
            log('✅ Query executed successfully!', 'green');
            log(`   Query Identifier: ${response.data.query_identifier}`, 'blue');
            log(`   Results Count: ${response.data.count}`, 'green');
            log(`   Source: ${response.data.source}`, 'cyan');
            
            // Show sample results
            if (response.data.data && response.data.data.length > 0) {
                logStep('2', 'Sample results:');
                const sampleData = response.data.data.slice(0, 3);
                sampleData.forEach((row, index) => {
                    log(`   Row ${index + 1}: ${JSON.stringify(row)}`, 'yellow');
                });
                if (response.data.data.length > 3) {
                    log(`   ... and ${response.data.data.length - 3} more rows`, 'yellow');
                }
            } else {
                log('   No data returned', 'yellow');
            }
            
            return { success: true, data: response.data };
        } else {
            log(`❌ Query failed: ${response.data.error}`, 'red');
            return { success: false, error: response.data.error };
        }
        
    } catch (error) {
        log(`❌ Query failed with error: ${error.message}`, 'red');
        if (error.response && error.response.data) {
            log(`   Error details: ${JSON.stringify(error.response.data)}`, 'red');
        }
        return { success: false, error: error.message };
    }
}

async function testDirectExecution(queryIdentifier) {
    logSection(`⚡ DIRECT EXECUTION: ${queryIdentifier}`);
    
    try {
        logStep('1', `Executing query directly by identifier...`);
        
        const response = await axios.post(`${NODE_BACKEND_URL}/api/insights/execute`, {
            query_identifier: queryIdentifier
        }, {
            timeout: 30000,
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.data.success) {
            log('✅ Direct execution successful!', 'green');
            log(`   Results Count: ${response.data.count}`, 'green');
            log(`   Source: ${response.data.source}`, 'cyan');
            
            // Show sample results
            if (response.data.data && response.data.data.length > 0) {
                logStep('2', 'Sample results:');
                const sampleData = response.data.data.slice(0, 2);
                sampleData.forEach((row, index) => {
                    log(`   Row ${index + 1}: ${JSON.stringify(row)}`, 'yellow');
                });
            }
            
            return { success: true, data: response.data };
        } else {
            log(`❌ Direct execution failed: ${response.data.error}`, 'red');
            return { success: false, error: response.data.error };
        }
        
    } catch (error) {
        log(`❌ Direct execution failed: ${error.message}`, 'red');
        return { success: false, error: error.message };
    }
}

async function runAllTests() {
    logSection('🚀 COMPREHENSIVE INSIGHTS TESTING');
    log('Testing all 6 predefined insights queries', 'bright');
    
    // Health check first
    const healthOk = await testHealthCheck();
    if (!healthOk) {
        log('\n❌ Backend is not healthy. Please ensure both backends are running:', 'red');
        log('   Node.js: npm start (in backend directory)', 'yellow');
        log('   Flask: python flask-ollama-app.py (in aiml directory)', 'yellow');
        return;
    }
    
    const results = [];
    
    // Test each insight query
    for (let i = 0; i < INSIGHTS_QUERIES.length; i++) {
        const queryInfo = INSIGHTS_QUERIES[i];
        log(`\n--- Test ${i + 1}/${INSIGHTS_QUERIES.length} ---`, 'bright');
        
        // Test natural language query
        const naturalResult = await testInsightQuery(queryInfo);
        results.push({
            query: queryInfo.name,
            naturalQuery: queryInfo.naturalQuery,
            naturalResult: naturalResult
        });
        
        // Test direct execution if natural query succeeded
        if (naturalResult.success) {
            const directResult = await testDirectExecution(queryInfo.name);
            results[results.length - 1].directResult = directResult;
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    logSection('📊 TEST SUMMARY');
    
    let successCount = 0;
    let failureCount = 0;
    
    results.forEach((result, index) => {
        const status = result.naturalResult.success ? '✅' : '❌';
        const directStatus = result.directResult && result.directResult.success ? '✅' : '❌';
        
        log(`${status} ${result.query}`, result.naturalResult.success ? 'green' : 'red');
        log(`   Natural Query: ${result.naturalResult.success ? 'PASS' : 'FAIL'}`, result.naturalResult.success ? 'green' : 'red');
        log(`   Direct Execution: ${result.directResult && result.directResult.success ? 'PASS' : 'FAIL'}`, result.directResult && result.directResult.success ? 'green' : 'red');
        
        if (result.naturalResult.success) {
            successCount++;
        } else {
            failureCount++;
            log(`   Error: ${result.naturalResult.error}`, 'red');
        }
    });
    
    log(`\n📈 Results: ${successCount}/${INSIGHTS_QUERIES.length} queries passed`, successCount === INSIGHTS_QUERIES.length ? 'green' : 'yellow');
    
    if (failureCount > 0) {
        log(`❌ ${failureCount} queries failed`, 'red');
    } else {
        log('🎉 All tests passed!', 'green');
    }
    
    return results;
}

// Run the tests
if (require.main === module) {
    runAllTests().catch(error => {
        log(`\n❌ Test suite failed: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    });
}

module.exports = {
    testHealthCheck,
    testInsightQuery,
    testDirectExecution,
    runAllTests,
    INSIGHTS_QUERIES
};
