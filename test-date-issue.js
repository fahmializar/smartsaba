// Test script to debug date issues
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function testDateIssue() {
    try {
        console.log('🔍 Testing date storage and retrieval...');
        
        // Test date: February 6, 2026
        const testDate = '2026-02-06';
        const testClass = 'TEST_CLASS';
        
        console.log(`📅 Input date: ${testDate}`);
        
        // First, clean up any existing test data
        await pool.query('DELETE FROM attendance WHERE class_name = $1', [testClass]);
        
        // Insert test record
        console.log('📝 Inserting test record...');
        const insertResult = await pool.query(
            'INSERT INTO attendance (class_name, report_date, subject, teacher_name, status) VALUES ($1, $2::date, $3, $4, $5) RETURNING report_date, report_date::text as date_string',
            [testClass, testDate, 'Test Subject', 'Test Teacher', 'hadir']
        );
        
        const storedDate = insertResult.rows[0].report_date;
        const storedDateString = insertResult.rows[0].date_string;
        
        console.log(`📅 Stored date object: ${storedDate}`);
        console.log(`📅 Stored date string: ${storedDateString}`);
        console.log(`📅 ISO string: ${storedDate.toISOString()}`);
        console.log(`📅 Date only: ${storedDate.toISOString().split('T')[0]}`);
        
        // Retrieve the record
        console.log('📋 Retrieving test record...');
        const selectResult = await pool.query(
            'SELECT report_date, report_date::text as date_string FROM attendance WHERE class_name = $1',
            [testClass]
        );
        
        const retrievedDate = selectResult.rows[0].report_date;
        const retrievedDateString = selectResult.rows[0].date_string;
        
        console.log(`📅 Retrieved date object: ${retrievedDate}`);
        console.log(`📅 Retrieved date string: ${retrievedDateString}`);
        console.log(`📅 ISO string: ${retrievedDate.toISOString()}`);
        console.log(`📅 Date only: ${retrievedDate.toISOString().split('T')[0]}`);
        
        // Check for mismatch
        const inputDateStr = testDate;
        const outputDateStr = retrievedDate.toISOString().split('T')[0];
        
        if (inputDateStr !== outputDateStr) {
            console.error(`❌ DATE MISMATCH! Input: ${inputDateStr}, Output: ${outputDateStr}`);
        } else {
            console.log(`✅ Dates match! Input: ${inputDateStr}, Output: ${outputDateStr}`);
        }
        
        // Check timezone
        const timezoneResult = await pool.query('SHOW timezone');
        console.log(`🌍 Database timezone: ${timezoneResult.rows[0].TimeZone}`);
        
        // Clean up
        await pool.query('DELETE FROM attendance WHERE class_name = $1', [testClass]);
        
    } catch (error) {
        console.error('❌ Error testing dates:', error);
    } finally {
        await pool.end();
    }
}

testDateIssue();