require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    ORDER BY ordinal_position
`, (err, res) => {
    if(err) {
        console.error('ERROR:', err.message);
        console.error('Full error:', err);
    } else {
        console.log('Users table columns:');
        console.log(JSON.stringify(res.rows, null, 2));
    }
    pool.end();
});
