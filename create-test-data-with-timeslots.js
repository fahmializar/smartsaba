// Create test attendance data with time slots
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function createTestDataWithTimeSlots() {
    try {
        console.log('🧪 Creating test attendance data with time slots...\n');
        
        // Sample test data with time slots
        const testData = [
            {
                class_name: 'X.1',
                report_date: '2026-02-01',
                subject: 'Matematika',
                teacher_name: 'Jajang Nurjaman, S.Pd.',
                status: 'hadir',
                period: 1,
                time_slot: 'Jam 1',
                start_time: '06:30',
                end_time: '07:15'
            },
            {
                class_name: 'X.1',
                report_date: '2026-02-01',
                subject: 'Bahasa Indonesia',
                teacher_name: 'Dadan Darsono, S.Pd.',
                status: 'hadir',
                period: 2,
                time_slot: 'Jam 2',
                start_time: '07:15',
                end_time: '08:00'
            },
            {
                class_name: 'X.1',
                report_date: '2026-02-01',
                subject: 'Bahasa Inggris',
                teacher_name: 'Mela Herna Melani, S.Pd.I.',
                status: 'tugas',
                period: 3,
                time_slot: 'Jam 3',
                start_time: '08:00',
                end_time: '08:45'
            },
            {
                class_name: 'XI.MIPA.1',
                report_date: '2026-02-01',
                subject: 'Fisika',
                teacher_name: 'Rudi, S.Si',
                status: 'hadir',
                period: 4,
                time_slot: 'Jam 4',
                start_time: '08:45',
                end_time: '09:30'
            },
            {
                class_name: 'XI.MIPA.1',
                report_date: '2026-02-01',
                subject: 'Kimia',
                teacher_name: 'Mela Siti Padliah, S.Pd.',
                status: 'hadir',
                period: 5,
                time_slot: 'Jam 5',
                start_time: '09:45',
                end_time: '10:30'
            }
        ];
        
        console.log(`📝 Inserting ${testData.length} test records with time slots...`);
        
        for (const data of testData) {
            await pool.query(`
                INSERT INTO attendance (
                    class_name, report_date, subject, teacher_name, status, 
                    period, time_slot, start_time, end_time, timestamp
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            `, [
                data.class_name, data.report_date, data.subject, data.teacher_name, 
                data.status, data.period, data.time_slot, data.start_time, data.end_time
            ]);
            
            console.log(`✅ Added: ${data.class_name} - ${data.subject} - ${data.time_slot}`);
        }
        
        console.log('\n🔍 Verifying test data...');
        const result = await pool.query(`
            SELECT class_name, subject, teacher_name, time_slot, period, start_time, end_time, status
            FROM attendance 
            WHERE report_date = '2026-02-01'
            ORDER BY period
        `);
        
        console.log('\n📊 Test data created:');
        result.rows.forEach((row, idx) => {
            console.log(`  ${idx + 1}. ${row.class_name} - ${row.subject}`);
            console.log(`     Teacher: ${row.teacher_name}`);
            console.log(`     Time Slot: ${row.time_slot} (${row.start_time}-${row.end_time})`);
            console.log(`     Status: ${row.status.toUpperCase()}`);
            console.log('');
        });
        
        console.log('✅ Test data with time slots created successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Go to Admin Dashboard → Analitik');
        console.log('2. Set filter: Year = 2026, Month = February');
        console.log('3. Download Excel/CSV');
        console.log('4. Check "Jam Pelajaran" column - should show proper time slots');
        
    } catch (error) {
        console.error('❌ Error creating test data:', error);
    } finally {
        await pool.end();
    }
}

createTestDataWithTimeSlots();