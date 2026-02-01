// Add missing time slot columns to attendance table
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function addTimeSlotColumns() {
    try {
        console.log('🔧 Adding missing time slot columns to attendance table...\n');
        
        // Check current columns
        console.log('📋 Current attendance table columns:');
        const currentColumns = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'attendance' 
            ORDER BY ordinal_position
        `);
        
        const existingColumns = currentColumns.rows.map(row => row.column_name);
        console.log('Existing columns:', existingColumns.join(', '));
        
        // Add missing columns
        const columnsToAdd = [
            { name: 'time_slot', type: 'VARCHAR(50)' },
            { name: 'start_time', type: 'VARCHAR(10)' },
            { name: 'end_time', type: 'VARCHAR(10)' }
        ];
        
        for (const column of columnsToAdd) {
            if (!existingColumns.includes(column.name)) {
                console.log(`\n➕ Adding column: ${column.name} (${column.type})`);
                await pool.query(`ALTER TABLE attendance ADD COLUMN ${column.name} ${column.type}`);
                console.log(`✅ Added ${column.name} column`);
            } else {
                console.log(`✅ Column ${column.name} already exists`);
            }
        }
        
        // Verify the changes
        console.log('\n📋 Updated attendance table columns:');
        const updatedColumns = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'attendance' 
            ORDER BY ordinal_position
        `);
        
        updatedColumns.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
        
        console.log('\n✅ Time slot columns added successfully!');
        console.log('\n📝 Note: Existing attendance records will show "N/A" for time slots.');
        console.log('   New attendance reports will include time slot information.');
        
    } catch (error) {
        console.error('❌ Error adding columns:', error);
    } finally {
        await pool.end();
    }
}

addTimeSlotColumns();