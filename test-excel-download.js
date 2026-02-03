// Test script to verify Excel download date and time formatting
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function testAnalyticsAPI() {
    try {
        console.log('🧪 Testing Analytics API date handling...');
        
        // Test query with date filter for February 3, 2026
        const testDate = '2026-02-03';
        console.log(`📅 Testing with date: ${testDate}`);
        
        const query = 'SELECT *, report_date::text as report_date_text FROM attendance WHERE report_date = $1 ORDER BY report_date DESC LIMIT 5';
        const result = await pool.query(query, [testDate]);
        
        console.log(`📊 Found ${result.rows.length} records for ${testDate}`);
        
        if (result.rows.length > 0) {
            console.log('\n📋 Sample records:');
            result.rows.forEach((row, index) => {
                console.log(`${index + 1}. Date: ${row.report_date_text || row.report_date}`);
                console.log(`   Class: ${row.class_name}`);
                console.log(`   Subject: ${row.subject}`);
                console.log(`   Teacher: ${row.teacher_name}`);
                console.log(`   Status: ${row.status}`);
                console.log(`   Time: ${row.start_time}-${row.end_time} (Period ${row.period})`);
                console.log('   ---');
            });
        } else {
            console.log('❌ No records found for the test date');
            
            // Check what dates are available
            const availableDates = await pool.query('SELECT DISTINCT report_date::text as date_text FROM attendance ORDER BY report_date DESC LIMIT 10');
            console.log('\n📅 Available dates in database:');
            availableDates.rows.forEach(row => {
                console.log(`   - ${row.date_text}`);
            });
        }
        
        // Test time slot formatting
        console.log('\n🕐 Testing time slot formatting...');
        const timeSlotQuery = `
            SELECT 
                report_date::text as report_date_text,
                class_name,
                subject,
                teacher_name,
                status,
                start_time,
                end_time,
                period,
                time_slot
            FROM attendance 
            WHERE start_time IS NOT NULL AND end_time IS NOT NULL
            ORDER BY report_date DESC 
            LIMIT 5
        `;
        
        const timeSlotResult = await pool.query(timeSlotQuery);
        console.log(`📊 Found ${timeSlotResult.rows.length} records with time data`);
        
        timeSlotResult.rows.forEach((row, index) => {
            console.log(`${index + 1}. ${row.report_date_text} - ${row.subject}`);
            console.log(`   Time: ${row.start_time}-${row.end_time} (Period ${row.period})`);
            console.log(`   Time Slot: ${row.time_slot || 'N/A'}`);
        });
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await pool.end();
    }
}

testAnalyticsAPI();