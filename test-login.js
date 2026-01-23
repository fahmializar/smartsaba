// Test script to check login
const http = require('http');

const data = JSON.stringify({
    username: 'admin',
    password: 'admin123'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    },
    timeout: 5000
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });
    
    res.on('end', () => {
        console.log('Body:', body);
        process.exit(0);
    });
});

req.on('error', (error) => {
    console.error('Request Error:', error.message);
    console.error('Error code:', error.code);
    process.exit(1);
});

req.on('timeout', () => {
    console.error('Request timeout');
    req.destroy();
    process.exit(1);
});

req.write(data);
req.end();

