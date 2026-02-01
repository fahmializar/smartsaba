// Check time slot data in database
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkTimeSlotData() {
    try {
        console.log('🔍 Checking time slot data in database...\n');
        
        // Check attendance table structure
        console.log('📋 Attendance table columns:');
        const columns = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'attendance' 
            ORDER BY ordinal_position
        `);
        columns.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
        
        console.log('\n📊 Sample attendance records:');
        const sampleData = await pool.query(`
            SELECT id, class_name, subject, teacher_name, time_slot, period, start_time, end_time, report_date 
            FROM attendance 
            ORDER BY timestamp DESC 
            LIMIT 5
        `);
        
        if (sampleData.rows.length === 0) {
            console.log('  ❌ No attendance records found');
        } else {
            sampleData.rows.forEach((row, idx) => {
                console.log(`  ${idx + 1}. ${row.class_name} - ${row.subject}`);
                console.log(`     Teacher: ${row.teacher_name || 'N/A'}`);
                console.log(`     Time Slot: ${row.time_slot || 'N/A'}`);
                console.log(`     Period: ${row.period || 'N/A'}`);
                console.log(`     Time: ${row.start_time || 'N/A'} - ${row.end_time || 'N/A'}`);
                console.log(`     Date: ${row.report_date}`);
                console.log('');
            });
        }
        
        // Check time slots table
        console.log('🕐 Time slots table:');
        const timeSlots = await pool.query('SELECT * FROM time_slots ORDER BY period');
        if (timeSlots.rows.length === 0) {
            console.log('  ❌ No time slots found');
        } else {
            timeSlots.rows.forEach(slot => {
                console.log(`  ${slot.period}. ${slot.label} (${slot.start_time} - ${slot.end_time})`);
            });
        }
        
        // Check schedules table
        console.log('\n📅 Sample schedules with time slots:');
        const schedules = await pool.query(`
            SELECT class_name, day, subject, teacher_name, start_time, end_time, period 
            FROM schedules 
            ORDER BY class_name, day, start_time 
            LIMIT 5
        `);
        
        if (schedules.rows.length === 0) {
            console.log('  ❌ No schedules found');
        } else {
            schedules.rows.forEach((row, idx) => {
                console.log(`  ${idx + 1}. ${row.class_name} - ${row.day} - ${row.subject}`);
                console.log(`     Teacher: ${row.teacher_name}`);
                console.log(`     Time: ${row.start_time} - ${row.end_time}`);
                console.log(`     Period: ${row.period || 'N/A'}`);
                console.log('');
            });
        }
        
        console.log('✅ Database check complete');
        
    } catch (error) {
        console.error('❌ Error checking database:', error);
    } finally {
        await pool.end();
    }
}

checkTimeSlotData();