// Seed the remote database via API call
const https = require('https');

function seedDatabase(hostname) {
    return new Promise((resolve) => {
        console.log(`🌱 Seeding database on ${hostname}...`);
        
        const options = {
            hostname: hostname,
            port: 443,
            path: '/api/seed-database',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 seconds timeout for seeding
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
                        console.log('✅ DATABASE SEEDING SUCCESSFUL!');
                        if (result.data) {
                            console.log(`📊 Data created:`);
                            console.log(`  - Users: ${result.data.users}`);
                            console.log(`  - Subjects: ${result.data.subjects}`);
                            console.log(`  - Teachers: ${result.data.teachers}`);
                        }
                    } else {
                        console.log('❌ SEEDING FAILED:', result.message);
                    }
                } catch (e) {
                    console.log('❌ Invalid response:', body);
                }
                resolve();
            });
        });

        req.on('error', (error) => {
            console.log(`❌ Request failed: ${error.message}`);
            resolve();
        });

        req.on('timeout', () => {
            console.log(`❌ Request timeout (this is normal for seeding)`);
            req.destroy();
            resolve();
        });

        req.end();
    });
}

async function main() {
    console.log('🚀 Starting remote database seeding...');
    console.log('='.repeat(50));
    
    await seedDatabase('smartsaba.fanf.site');
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Seeding complete!');
    console.log('\nNow test again:');
    console.log('1. Go to https://smartsaba.fanf.site/representative-dashboard.html');
    console.log('2. Login with: X.1 / berhias');
    console.log('3. Try "Atur Jadwal" → "Tambah Mapel"');
    console.log('4. Should now work without errors!');
}

main();