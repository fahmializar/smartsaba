// Simple login test for deployed site
const https = require('https');

function testLogin(hostname, username, password) {
    return new Promise((resolve) => {
        console.log(`\n🔐 Testing login: ${username} on ${hostname}`);
        
        const data = JSON.stringify({
            username: username,
            password: password
        });

        const options = {
            hostname: hostname,
            port: 443,
            path: '/api/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            },
            timeout: 10000
        };

        const req = https.request(options, (res) => {
            console.log(`Status: ${res.statusCode}`);
            
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                console.log('Response:', body);
                try {
                    const result = JSON.parse(body);
                    if (result.success) {
                        console.log('✅ LOGIN SUCCESS');
                        console.log(`Role: ${result.role}`);
                    } else {
                        console.log('❌ LOGIN FAILED');
                        console.log(`Message: ${result.message}`);
                    }
                } catch (e) {
                    console.log('❌ Invalid JSON response');
                }
                resolve();
            });
        });

        req.on('error', (error) => {
            console.log(`❌ Request failed: ${error.message}`);
            resolve();
        });

        req.on('timeout', () => {
            console.log(`❌ Request timeout`);
            req.destroy();
            resolve();
        });

        req.write(data);
        req.end();
    });
}

async function main() {
    console.log('🚀 Testing login on deployed site...');
    console.log('='.repeat(50));
    
    // Test admin login
    await testLogin('smartsaba.fanf.site', 'admin', 'admin123');
    
    // Test class representative login
    await testLogin('smartsaba.fanf.site', 'X.1', 'berhias');
    
    console.log('\n' + '='.repeat(50));
    console.log('If login fails, the database is empty and needs seeding.');
}

main();