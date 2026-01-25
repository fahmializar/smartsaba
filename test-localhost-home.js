// Test localhost home page
const http = require('http');

function testHomePage() {
    return new Promise((resolve) => {
        console.log('🏠 Testing localhost home page...');
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/',
            method: 'GET',
            timeout: 10000
        };

        const req = http.request(options, (res) => {
            console.log(`Status: ${res.statusCode}`);
            
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ Home page loads successfully');
                    
                    // Check for key elements
                    const checks = [
                        { name: 'Mobile menu toggle', pattern: /mobile-menu-toggle.*onclick.*toggleMobileMenu/i },
                        { name: 'Navigation menu ID', pattern: /nav-menu.*id.*navMenu/i },
                        { name: 'Dokumen Digital link', pattern: /curriculum-documents\.html.*Dokumen Digital/i },
                        { name: 'Toggle function in script', pattern: /function toggleMobileMenu/i },
                        { name: 'Script.js included', pattern: /<script src="script\.js"><\/script>/i }
                    ];
                    
                    checks.forEach(check => {
                        if (check.pattern.test(body)) {
                            console.log(`✅ ${check.name}: Found`);
                        } else {
                            console.log(`❌ ${check.name}: Missing`);
                        }
                    });
                    
                    // Check the exact link
                    const linkMatch = body.match(/href="([^"]*)"[^>]*>Dokumen Digital</i);
                    if (linkMatch) {
                        console.log(`🔗 Dokumen Digital link: "${linkMatch[1]}"`);
                    } else {
                        console.log('❌ Could not find Dokumen Digital link');
                    }
                    
                } else {
                    console.log(`❌ Home page failed to load: ${res.statusCode}`);
                }
                resolve();
            });
        });

        req.on('error', (error) => {
            console.log(`❌ Request failed: ${error.message}`);
            console.log('Make sure server is running: node server.js');
            resolve();
        });

        req.on('timeout', () => {
            console.log(`❌ Request timeout`);
            req.destroy();
            resolve();
        });

        req.end();
    });
}

function testScriptJS() {
    return new Promise((resolve) => {
        console.log('\n📜 Testing script.js file...');
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/script.js',
            method: 'GET',
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            console.log(`Status: ${res.statusCode}`);
            
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ script.js loads successfully');
                    
                    if (body.includes('function toggleMobileMenu')) {
                        console.log('✅ toggleMobileMenu function found in script.js');
                    } else {
                        console.log('❌ toggleMobileMenu function missing from script.js');
                    }
                    
                } else {
                    console.log(`❌ script.js failed to load: ${res.statusCode}`);
                }
                resolve();
            });
        });

        req.on('error', (error) => {
            console.log(`❌ script.js request failed: ${error.message}`);
            resolve();
        });

        req.on('timeout', () => {
            console.log(`❌ script.js request timeout`);
            req.destroy();
            resolve();
        });

        req.end();
    });
}

function testCurriculumPage() {
    return new Promise((resolve) => {
        console.log('\n📚 Testing curriculum-documents.html accessibility...');
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/curriculum-documents.html',
            method: 'GET',
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            console.log(`Status: ${res.statusCode}`);
            
            if (res.statusCode === 200) {
                console.log('✅ curriculum-documents.html is accessible');
            } else {
                console.log(`❌ curriculum-documents.html failed: ${res.statusCode}`);
            }
            resolve();
        });

        req.on('error', (error) => {
            console.log(`❌ curriculum-documents.html request failed: ${error.message}`);
            resolve();
        });

        req.on('timeout', () => {
            console.log(`❌ curriculum-documents.html request timeout`);
            req.destroy();
            resolve();
        });

        req.end();
    });
}

async function main() {
    console.log('🚀 Testing Localhost Home Page Navigation');
    console.log('='.repeat(60));
    
    await testHomePage();
    await testScriptJS();
    await testCurriculumPage();
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 Manual Test Steps:');
    console.log('1. Open: http://localhost:3000/');
    console.log('2. Press F12 → Device Toolbar (mobile view)');
    console.log('3. Look for hamburger menu (☰) in top-right');
    console.log('4. Click hamburger menu');
    console.log('5. Click "Dokumen Digital" in the menu');
    console.log('6. Check browser console for JavaScript errors');
}

main();