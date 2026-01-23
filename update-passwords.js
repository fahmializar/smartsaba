require('dotenv').config();
const { Pool } = require('pg');
const bcryptjs = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function updatePasswords() {
    try {
        // Hash the passwords
        const adminHash = await bcryptjs.hash('admin123', 10);
        const repHash = await bcryptjs.hash('berhias', 10);
        
        console.log('Updating admin password...');
        await pool.query(
            'UPDATE users SET password_hash = $1 WHERE username = $2',
            [adminHash, 'admin']
        );
        console.log('✓ Admin password updated');
        
        console.log('Updating representative passwords...');
        // Update all representatives (users with role='class_leader' or class names)
        await pool.query(
            'UPDATE users SET password_hash = $1 WHERE role = $2',
            [repHash, 'class_leader']
        );
        console.log('✓ Representative passwords updated');
        
        // Verify
        const adminCheck = await pool.query(
            'SELECT username FROM users WHERE username = $1',
            ['admin']
        );
        console.log('✓ Admin user found:', adminCheck.rows[0]?.username);
        
        const repCheck = await pool.query(
            'SELECT COUNT(*) as count FROM users WHERE role = $1',
            ['class_leader']
        );
        console.log('✓ Updated', repCheck.rows[0].count, 'representative users');
        
        pool.end();
    } catch (err) {
        console.error('Error:', err.message);
        pool.end();
        process.exit(1);
    }
}

updatePasswords();
