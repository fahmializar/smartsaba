// Test if the API endpoints are working on deployed site
const https = require('https');

function testEndpoint(hostname, path, description) {
    return new Promise((resolve) => {
        console.log(`\n🔍 Testing: ${description}`);
        console.log(`URL: https://${hostname}${path}`);
        
        const options = {
            hostname: hostname,
            port: 443,
            path: path,
            method: 'GET',
            timeout: 10000
        };

        const req = https.request(options, (res) => {
            console.log(`Status: ${res.statusCode}`);
            
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    if (Array.isArray(data)) {
                        console.log(`✅ SUCCESS: Found ${data.length} items`);
                        if (data.length > 0) {
                            console.log(`Sample: ${JSON.stringify(data[0], null, 2)}`);
                        }
                    } else {
                        console.log(`✅ SUCCESS: ${JSON.stringify(data, null, 2)}`);
                    }
                } catch (e) {
                    console.log(`❌ INVALID JSON: ${body.substring(0, 200)}...`);
                }
                resolve();
            });
        });

        req.on('error', (error) => {
            console.log(`❌ ERROR: ${error.message}`);
            resolve();
        });

        req.on('timeout', () => {
            console.log(`❌ TIMEOUT`);
            req.destroy();
            resolve();
        });

        req.end();
    });
}

async function runTests() {
    const hostname = 'smartsaba.fanf.site';
    
    console.log(`🚀 Testing API endpoints on ${hostname}`);
    console.log('='.repeat(60));
    
    // Test subjects endpoint
    await testEndpoint(hostname, '/api/subjects', 'Subjects API');
    
    // Test teachers endpoint  
    await testEndpoint(hostname, '/api/teachers', 'Teachers API');
    
    // Test classes endpoint
    await testEndpoint(hostname, '/api/classes', 'Classes API');
    
    console.log('\n' + '='.repeat(60));
    console.log('🏁 Test Complete');
    console.log('\nIf any endpoint shows 0 items or errors:');
    console.log('1. The database needs to be seeded');
    console.log('2. Run: POST https://smartsaba.fanf.site/api/seed-database');
}

runTests();