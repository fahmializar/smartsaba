// Update existing schedules with period numbers based on time ranges
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Time slot mapping
const TIME_SLOTS = [
    { period: 1, start_time: "06:30", end_time: "07:15" },
    { period: 2, start_time: "07:15", end_time: "08:00" },
    { period: 3, start_time: "08:00", end_time: "08:45" },
    { period: 4, start_time: "08:45", end_time: "09:30" },
    { period: 5, start_time: "09:45", end_time: "10:30" },
    { period: 6, start_time: "10:30", end_time: "11:15" },
    { period: 7, start_time: "11:15", end_time: "12:00" },
    { period: 8, start_time: "12:45", end_time: "13:30" },
    { period: 9, start_time: "13:30", end_time: "14:15" },
    { period: 10, start_time: "14:15", end_time: "15:00" }
];

function findPeriodByTime(startTime) {
    const slot = TIME_SLOTS.find(s => s.start_time === startTime);
    return slot ? slot.period : null;
}

async function updateExistingSchedules() {
    try {
        console.log('🔧 Updating existing schedules with period numbers...\n');
        
        // Get all schedules without period numbers
        const schedules = await pool.query(`
            SELECT id, class_name, day, subject, teacher_name, start_time, end_time, period 
            FROM schedules 
            WHERE period IS NULL OR period = 0
            ORDER BY class_name, day, start_time
        `);
        
        console.log(`📋 Found ${schedules.rows.length} schedules to update`);
        
        if (schedules.rows.length === 0) {
            console.log('✅ All schedules already have period numbers');
            return;
        }
        
        let updated = 0;
        
        for (const schedule of schedules.rows) {
            const period = findPeriodByTime(schedule.start_time);
            
            if (period) {
                await pool.query(
                    'UPDATE schedules SET period = $1 WHERE id = $2',
                    [period, schedule.id]
                );
                
                console.log(`✅ Updated: ${schedule.class_name} - ${schedule.day} - ${schedule.subject}`);
                console.log(`   Time: ${schedule.start_time}-${schedule.end_time} → Period: ${period}`);
                updated++;
            } else {
                console.log(`⚠️  No matching period for: ${schedule.class_name} - ${schedule.subject} (${schedule.start_time})`);
            }
        }
        
        console.log(`\n✅ Updated ${updated} schedules with period numbers`);
        
        // Show sample updated schedules
        console.log('\n📅 Sample updated schedules:');
        const updatedSchedules = await pool.query(`
            SELECT class_name, day, subject, start_time, end_time, period 
            FROM schedules 
            WHERE period IS NOT NULL 
            ORDER BY class_name, day, period 
            LIMIT 5
        `);
        
        updatedSchedules.rows.forEach((row, idx) => {
            console.log(`  ${idx + 1}. ${row.class_name} - ${row.day} - ${row.subject}`);
            console.log(`     Time: ${row.start_time}-${row.end_time} (Period ${row.period})`);
        });
        
    } catch (error) {
        console.error('❌ Error updating schedules:', error);
    } finally {
        await pool.end();
    }
}

updateExistingSchedules();