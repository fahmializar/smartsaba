require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.query(
    'SELECT id, username, role FROM users LIMIT 10',
    (err, res) => {
        if (err) {
            console.error('Query Error:', err.message);
        } else {
            console.log('Users in database:');
            console.log(JSON.stringify(res.rows, null, 2));
        }
        pool.end();
    }
);
