require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.query(
    'SELECT id, username, role, password_hash FROM users WHERE username = $1',
    ['admin'],
    (err, res) => {
        if (err) {
            console.error('Query Error:', err.message);
        } else {
            console.log('Admin user:');
            console.log(JSON.stringify(res.rows, null, 2));
        }
        pool.end();
    }
);
