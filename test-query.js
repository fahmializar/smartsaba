require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Test the actual login query
const username = 'admin';
const password = 'admin123';

pool.query(
    'SELECT id, username, role FROM users WHERE username = $1 AND password_hash = $2',
    [username, password],
    (err, res) => {
        if (err) {
            console.error('Query Error:', err.message);
            console.error('Error Code:', err.code);
        } else {
            console.log('Query Result:');
            console.log('Rows found:', res.rows.length);
            console.log('Data:', JSON.stringify(res.rows, null, 2));
        }
        pool.end();
    }
);
