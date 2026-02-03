require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcryptjs = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const { google } = require('googleapis');

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(express.static(path.join(__dirname)));

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set!');
    console.error('Please set the DATABASE_URL environment variable on your hosting platform.');
    process.exit(1);
}

// 1. PostgreSQL Neon Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Set timezone to avoid date conversion issues
pool.on('connect', (client) => {
    console.log('✓ Terhubung ke PostgreSQL Neon');
    // Set timezone to UTC to ensure consistent date handling
    client.query('SET timezone = "UTC"');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

// 2. Initialize PostgreSQL Tables
async function initializeDatabase() {
    try {
        // Create tables only if they don't exist (preserve existing data)
        
        // Create fresh users table with correct schema
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL
            )
        `);
        console.log('✓ Users table created/verified');

        // Create classes table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS classes (
                id SERIAL PRIMARY KEY,
                class_name VARCHAR(255) UNIQUE NOT NULL,
                grade VARCHAR(50),
                section VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create teachers table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS teachers (
                id SERIAL PRIMARY KEY,
                teacher_name VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create subjects table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS subjects (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create schedules table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS schedules (
                id SERIAL PRIMARY KEY,
                class_name VARCHAR(255) NOT NULL,
                day VARCHAR(50) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                teacher_name VARCHAR(255) NOT NULL,
                start_time VARCHAR(50),
                end_time VARCHAR(50),
                period INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (class_name) REFERENCES classes(class_name) ON DELETE CASCADE
            )
        `);

        // Create time_slots table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS time_slots (
                id SERIAL PRIMARY KEY,
                period INTEGER UNIQUE NOT NULL,
                label VARCHAR(50),
                start_time VARCHAR(50),
                end_time VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create attendance table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS attendance (
                id SERIAL PRIMARY KEY,
                class_name VARCHAR(255) NOT NULL,
                report_date DATE NOT NULL,
                subject VARCHAR(255) NOT NULL,
                teacher_name VARCHAR(255),
                status VARCHAR(50),
                period INTEGER,
                time_slot VARCHAR(50),
                start_time VARCHAR(10),
                end_time VARCHAR(10),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (class_name) REFERENCES classes(class_name) ON DELETE CASCADE
            )
        `);

        console.log('✓ Database tables created/verified');

        // Seed initial data only if tables are empty
        await seedDatabaseIfEmpty();
    } catch (err) {
        console.error('Error initializing database:', err.message);
    }
}

// Seed initial data only if tables are empty
async function seedDatabaseIfEmpty() {
    try {
        // Check if users table has data
        const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
        const hasUsers = parseInt(userCount.rows[0].count) > 0;
        
        if (hasUsers) {
            console.log('✓ Database already has data, skipping seeding');
            return;
        }
        
        console.log('🌱 Database is empty, seeding initial data...');
        
        // Load school data from JSON file first, then fallback to embedded data
        let schoolData;
        try {
            const fs = require('fs');
            const path = require('path');
            const jsonPath = path.join(__dirname, 'data', 'school-data.json');
            if (fs.existsSync(jsonPath)) {
                const jsonData = fs.readFileSync(jsonPath, 'utf8');
                schoolData = JSON.parse(jsonData);
                console.log('✅ Loaded school data from JSON file');
            } else {
                throw new Error('JSON file not found');
            }
        } catch (error) {
            console.log('⚠️ Could not load JSON file, using embedded data:', error.message);
            // Fallback to embedded data
            schoolData = {
                "subjects": [
                    { "code": "PAIBP", "name": "Pendidikan Agama Islam dan Budi Pekerti" },
                    { "code": "PP", "name": "Pendidikan Pancasila" },
                    { "code": "IND", "name": "Bahasa Indonesia" },
                    { "code": "MAT", "name": "Matematika" },
                    { "code": "SEJ", "name": "Sejarah" },
                    { "code": "ING", "name": "Bahasa Inggris" },
                    { "code": "PJOK", "name": "Pendidikan Jasmani Olahraga dan Kesehatan" },
                    { "code": "INF", "name": "Informatika" },
                    { "code": "SB", "name": "Seni Budaya" },
                    { "code": "SUN", "name": "Bahasa Sunda" },
                    { "code": "BIO", "name": "Biologi" },
                    { "code": "FIS", "name": "Fisika" },
                    { "code": "KIM", "name": "Kimia" },
                    { "code": "EKO", "name": "Ekonomi" },
                    { "code": "GEO", "name": "Geografi" },
                    { "code": "SOS", "name": "Sosiologi" },
                    { "code": "MAT TL", "name": "Matematika Tingkat Lanjut" },
                    { "code": "BIO TL", "name": "Biologi Tingkat Lanjut" },
                    { "code": "FIS TL", "name": "Fisika Tingkat Lanjut" },
                    { "code": "KIM TL", "name": "Kimia Tingkat Lanjut" },
                    { "code": "EKO TL", "name": "Ekonomi Tingkat Lanjut" },
                    { "code": "GEO TL", "name": "Geografi Tingkat Lanjut" },
                    { "code": "SOS TL", "name": "Sosiologi Tingkat Lanjut" },
                    { "code": "SEJ TL", "name": "Sejarah Tingkat Lanjut" },
                    { "code": "ING TL", "name": "Bahasa Inggris Tingkat Lanjut" },
                    { "code": "PKWU", "name": "Prakarya dan Kewirausahaan" },
                    { "code": "BK", "name": "Bimbingan Konseling" }
                ],
                "teachers": [
                    "Deni Kusumawardani, S.Pd.",
                    "Gilang Cahya Gumilar, S.E.",
                    "Aam Amilasari, S.Pd.",
                    "Tuti Ella Maryati, S.Pd.",
                    "Yeti Sumiati, S.Pd.",
                    "Pepen Supendi, S.Pd., M.M.",
                    "Drs. Cucu Ansorulloh., M.Pd.",
                    "Eneng Hesti, S.Pd",
                    "Fahmi Alizar Nur Fachrudin, S.Pd.",
                    "Idvan Aprizal Bintara, S.Pd.",
                    "Leli Septiani, S.Pd",
                    "Mamat Rahmat, S.Pd",
                    "Nisha Hanifatul Fauziah, S.Pd",
                    "Novi Kartiani, S.Pd",
                    "Riska Meylia Eriani, S.Pd",
                    "Yakinthan Bathin R. S.Pd",
                    "Silmi Faris, S.Pd",
                    "Kartika Andriani, S.Pd.",
                    "Napiin Nurohman, S.Pd.",
                    "Muhammad Heru Haerudin, S.Pd",
                    "Susilawati S.Pd",
                    "Fuji Novia, S.Pd",
                    "Deny Rahman Samsyu, S.Pd",
                    "Nuryani, S.Pd.I",
                    "Virda Ayu Purwanti, S.Pd.",
                    "Dadan Darsono, S.Pd.",
                    "Fery Insan Firdaus, S.Pd.",
                    "Rudi, S.Si",
                    "Lulus Sri Rahayu, S.Pd",
                    "Deni Muhamad Ikbal, S.Pd",
                    "Nuni Nuraeni, S.Pd.I.",
                    "Iing Solihin, S.Pd",
                    "Deden Sugianto, S.Pd.",
                    "Muhammad Ulil Albab, S.Pd.",
                    "Yayan Aom Heryanto, S.Pd.",
                    "Maman Jayusman, S.E., M.M.",
                    "Chintia Wulan Sari, S.Pd.",
                    "Desi Novianti, S.Pd.",
                    "Diding Suyana, S.S.",
                    "Mela Herna Melani, S.Pd.I.",
                    "Revi Indika, S.Pd.",
                    "Juhum Humaidil Aripin, S. Ag",
                    "Dicky Nurdianzah, S.Pd.",
                    "Anneu Meilina Restu, S.Pd.",
                    "Iis Siti Aisyah, S.Pd.",
                    "Wida Sri Purnamasari, S.Pd.",
                    "Ria Puspitasari, S.Pd.",
                    "Mela Siti Padliah, S.Pd.",
                    "Aam Amaruloh, S.Pd.",
                    "Danny Muh. Ramadhani, M.Pd.",
                    "Jajang Nurjaman, S.Pd.",
                    "Yogi Faisal Fahmi, S.Pd."
                ],
            "time_slots": [
                { "period": 1, "label": "Jam 1", "start_time": "06:30", "end_time": "07:15" },
                { "period": 2, "label": "Jam 2", "start_time": "07:15", "end_time": "08:00" },
                { "period": 3, "label": "Jam 3", "start_time": "08:00", "end_time": "08:45" },
                { "period": 4, "label": "Jam 4", "start_time": "08:45", "end_time": "09:30" },
                { "period": 5, "label": "Jam 5", "start_time": "09:45", "end_time": "10:30" },
                { "period": 6, "label": "Jam 6", "start_time": "10:30", "end_time": "11:15" },
                { "period": 7, "label": "Jam 7", "start_time": "11:15", "end_time": "12:00" },
                { "period": 8, "label": "Jam 8", "start_time": "12:45", "end_time": "13:30" },
                { "period": 9, "label": "Jam 9", "start_time": "13:30", "end_time": "14:15" },
                { "period": 10, "label": "Jam 10", "start_time": "14:15", "end_time": "15:00" }
            ],
            "classes": [
                { "class_name": "X.1", "grade": "X", "section": "1" },
                { "class_name": "X.2", "grade": "X", "section": "2" },
                { "class_name": "X.3", "grade": "X", "section": "3" },
                { "class_name": "X.4", "grade": "X", "section": "4" },
                { "class_name": "X.5", "grade": "X", "section": "5" },
                { "class_name": "X.6", "grade": "X", "section": "6" },
                { "class_name": "X.7", "grade": "X", "section": "7" },
                { "class_name": "X.8", "grade": "X", "section": "8" },
                { "class_name": "X.9", "grade": "X", "section": "9" },
                { "class_name": "X.10", "grade": "X", "section": "10" },
                { "class_name": "X.11", "grade": "X", "section": "11" },
                { "class_name": "X.12", "grade": "X", "section": "12" },
                { "class_name": "XI.MIPA.1", "grade": "XI", "section": "MIPA.1" },
                { "class_name": "XI.MIPA.2", "grade": "XI", "section": "MIPA.2" },
                { "class_name": "XI.MIPA.3", "grade": "XI", "section": "MIPA.3" },
                { "class_name": "XI.MIPA.4", "grade": "XI", "section": "MIPA.4" },
                { "class_name": "XI.MIPA.5", "grade": "XI", "section": "MIPA.5" },
                { "class_name": "XI.IPS.1", "grade": "XI", "section": "IPS.1" },
                { "class_name": "XI.IPS.2", "grade": "XI", "section": "IPS.2" },
                { "class_name": "XI.IPS.3", "grade": "XI", "section": "IPS.3" },
                { "class_name": "XI.IPS.4", "grade": "XI", "section": "IPS.4" },
                { "class_name": "XI.IPS.5", "grade": "XI", "section": "IPS.5" },
                { "class_name": "XI.IPS.6", "grade": "XI", "section": "IPS.6" },
                { "class_name": "XI.IPS.7", "grade": "XI", "section": "IPS.7" },
                { "class_name": "XII.SBIM.1", "grade": "XII", "section": "SBIM.1" },
                { "class_name": "XII.SBIM.2", "grade": "XII", "section": "SBIM.2" },
                { "class_name": "XII.SBIM.3", "grade": "XII", "section": "SBIM.3" },
                { "class_name": "XII.GBIM.1", "grade": "XII", "section": "GBIM.1" },
                { "class_name": "XII.GBIM.2", "grade": "XII", "section": "GBIM.2" },
                { "class_name": "XII.GBIM.3", "grade": "XII", "section": "GBIM.3" },
                { "class_name": "XII.GBIM.4", "grade": "XII", "section": "GBIM.4" },
                { "class_name": "XII.GBIM.5", "grade": "XII", "section": "GBIM.5" },
                { "class_name": "XII.EBIM.1", "grade": "XII", "section": "EBIM.1" },
                { "class_name": "XII.EBIM.2", "grade": "XII", "section": "EBIM.2" },
                { "class_name": "XII.EBIM.3", "grade": "XII", "section": "EBIM.3" }
            ]
        };
        }
        
        // Check if admin exists
        const adminCheck = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
        
        if (adminCheck.rows.length === 0) {
            // Insert admin
            await pool.query(
                'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
                ['admin', 'admin123', 'admin']
            );
            console.log('✓ Admin user created');
        }

        // Always insert subjects (using ON CONFLICT DO NOTHING to avoid errors if already exists)
        for (const subject of schoolData.subjects) {
            await pool.query(
                'INSERT INTO subjects (code, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [subject.code, subject.name]
            );
        }
        console.log('✓ Subjects created/verified');

        // Always insert teachers
        for (const teacher of schoolData.teachers) {
            await pool.query(
                'INSERT INTO teachers (teacher_name) VALUES ($1) ON CONFLICT DO NOTHING',
                [teacher]
            );
        }
        console.log('✓ Teachers created/verified');

        // Always insert time slots
        for (const slot of schoolData.time_slots) {
            await pool.query(
                'INSERT INTO time_slots (period, label, start_time, end_time) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
                [slot.period, slot.label, slot.start_time, slot.end_time]
            );
        }
        console.log('✓ Time slots created/verified');

        // Always insert classes and create class representatives
        for (const cls of schoolData.classes) {
            await pool.query(
                'INSERT INTO classes (class_name, grade, section) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                [cls.class_name, cls.grade, cls.section]
            );
            await pool.query(
                'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                [cls.class_name, 'berhias', 'representative']
            );
        }
        console.log('✓ Classes and representatives created/verified');
    } catch (err) {
        console.error('Error seeding database:', err);
    }
}

// Initialize on startup
initializeDatabase();

// 3. API Login
app.post('/api/login', async (req, res) => {
    let client;
    try {
        const { username, password } = req.body;
        console.log(`[LOGIN] Attempting login for username: ${username}`);
        
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password required' });
        }
        
        // Get user from database - try to get all columns to check which password field exists
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );
        
        if (!result || !result.rows || result.rows.length === 0) {
            console.log(`[LOGIN] User not found: ${username}`);
            return res.status(401).json({ success: false, message: 'Username atau Password salah!' });
        }
        
        const user = result.rows[0];
        const storedPassword = user.password || user.password_hash;
        
        console.log(`[LOGIN] User found: ${username}, password stored: "${storedPassword}"`);
        console.log(`[LOGIN] Comparing with input: "${password}"`);
        
        // Direct string comparison for plaintext passwords
        let passwordMatch = (password === storedPassword);
        console.log(`[LOGIN] Password match result: ${passwordMatch}`);
        
        if (passwordMatch) {
            console.log(`[LOGIN] Success for user: ${username}, role: ${user.role}`);
            return res.json({ success: true, role: user.role, username: user.username });
        } else {
            console.log(`[LOGIN] Invalid password for user: ${username}`);
            return res.status(401).json({ success: false, message: 'Username atau Password salah!' });
        }
    } catch (err) {
        console.error('[LOGIN ERROR] Unexpected error:', err.message);
        console.error('[LOGIN ERROR STACK]:', err.stack);
        return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// 4. API Get All Classes
app.get('/api/classes', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM classes ORDER BY class_name');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching classes:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 5. API Get All Teachers
app.get('/api/teachers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM teachers ORDER BY teacher_name');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching teachers:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 6. API Get All Subjects
app.get('/api/subjects', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM subjects ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching subjects:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 6.1. API Get All Time Slots
app.get('/api/time-slots', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM time_slots ORDER BY period');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching time slots:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 7. API Get Class Schedules
app.get('/api/class-schedules/:className', async (req, res) => {
    try {
        const { className } = req.params;
        const result = await pool.query(
            'SELECT * FROM schedules WHERE class_name = $1 ORDER BY day, start_time',
            [className]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching schedules:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 8. API Save Schedule
app.post('/api/save-schedule', async (req, res) => {
    try {
        const { class_name, schedules } = req.body;
        if (!class_name || !schedules || schedules.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid data' });
        }

        const day = schedules[0].day;
        
        // Delete existing schedules for that class and day
        await pool.query(
            'DELETE FROM schedules WHERE class_name = $1 AND day = $2',
            [class_name, day]
        );

        // Insert new schedules
        for (const schedule of schedules) {
            await pool.query(
                'INSERT INTO schedules (class_name, day, subject, teacher_name, start_time, end_time, period) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [class_name, schedule.day, schedule.subject, schedule.teacher_name, schedule.start_time, schedule.end_time, schedule.period]
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Error saving schedule:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 8.5. API Check Existing Report (to prevent duplicates)
app.get('/api/check-existing-report', async (req, res) => {
    try {
        const { class_name, date } = req.query;
        
        if (!class_name || !date) {
            return res.status(400).json({ 
                success: false, 
                message: 'Class name and date are required' 
            });
        }

        console.log(`🔍 Checking existing reports for ${class_name} on ${date}`);
        
        // Check if there are existing reports for this class and date
        const result = await pool.query(
            'SELECT subject, teacher_name, status FROM attendance WHERE class_name = $1 AND report_date = $2',
            [class_name, date]
        );
        
        const exists = result.rows.length > 0;
        
        console.log(`📊 Found ${result.rows.length} existing reports`);
        
        res.json({
            success: true,
            exists: exists,
            subjects: result.rows,
            count: result.rows.length,
            message: exists ? 
                `Ditemukan ${result.rows.length} laporan untuk tanggal ${date}` : 
                'Tidak ada laporan untuk tanggal ini'
        });
        
    } catch (err) {
        console.error('Error checking existing report:', err);
        res.status(500).json({ 
            success: false, 
            message: err.message 
        });
    }
});

// 9. API Submit Attendance
app.post('/api/submit-attendance', async (req, res) => {
    try {
        const { class_name, date, attendance } = req.body;
        if (!class_name || !date || !attendance) {
            return res.status(400).json({ success: false, message: 'Invalid data' });
        }

        console.log(`📝 Submitting attendance for ${class_name} on ${date}`);
        console.log(`📅 Date received from client: "${date}" (type: ${typeof date})`);
        console.log(`📊 Subjects: ${attendance.length}`);

        // Validate and ensure date format is correct (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            console.error(`❌ Invalid date format received: ${date}`);
            return res.status(400).json({ success: false, message: 'Invalid date format. Expected YYYY-MM-DD' });
        }

        // Parse date components to ensure no timezone conversion
        const [year, month, day] = date.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day); // month is 0-indexed
        const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        
        console.log(`📅 Date validation: input="${date}", parsed="${formattedDate}", components=[${year}, ${month}, ${day}]`);
        
        if (date !== formattedDate) {
            console.warn(`⚠️ Date format corrected: ${date} → ${formattedDate}`);
        }

        // First, delete any existing reports for this class and date to prevent duplicates
        const deleteResult = await pool.query(
            'DELETE FROM attendance WHERE class_name = $1 AND report_date = $2',
            [class_name, date]
        );
        
        if (deleteResult.rowCount > 0) {
            console.log(`🗑️ Deleted ${deleteResult.rowCount} existing reports for ${class_name} on ${date}`);
        }

        // Then insert the new attendance data
        for (const item of attendance) {
            const subject = item.name || item.subject;
            const teacher = item.teacher || '';
            const status = item.attendance || item.status;
            const timeSlot = item.timeSlot || '';
            const startTime = item.startTime || '';
            const endTime = item.endTime || '';
            const period = item.period || null;
            
            console.log(`📝 Inserting: ${subject} for ${date} with status ${status}`);
            
            // Use explicit date casting to ensure PostgreSQL interprets it correctly
            const insertResult = await pool.query(
                'INSERT INTO attendance (class_name, report_date, subject, teacher_name, status, time_slot, start_time, end_time, period) VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8, $9) RETURNING report_date',
                [class_name, date, subject, teacher, status, timeSlot, startTime, endTime, period]
            );
            
            // Log what was actually stored in the database
            const storedDate = insertResult.rows[0].report_date;
            console.log(`📅 Stored in DB: ${storedDate} (original: ${date})`);
            
            // Check if there's a date mismatch
            const storedDateStr = storedDate.toISOString().split('T')[0];
            if (storedDateStr !== date) {
                console.warn(`⚠️ DATE MISMATCH! Input: ${date}, Stored: ${storedDateStr}`);
            }
        }

        console.log(`✅ Successfully submitted ${attendance.length} attendance records for ${class_name} on ${date}`);
        res.json({ 
            success: true, 
            message: `Laporan kehadiran berhasil disimpan untuk ${attendance.length} mata pelajaran`,
            replaced: deleteResult.rowCount > 0,
            date_stored: date
        });
        
    } catch (err) {
        console.error('Error submitting attendance:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 10. API Get Analytics Data with Filters
app.get('/api/analytics', async (req, res) => {
    try {
        const { teacher_name, class_name, period, date, month, year } = req.query;
        
        // Debug logging
        console.log('📊 Analytics API called with filters:');
        console.log('- teacher_name:', teacher_name);
        console.log('- class_name:', class_name);
        console.log('- period:', period);
        console.log('- date:', date);
        console.log('- month:', month);
        console.log('- year:', year);
        
        let query = 'SELECT *, report_date::text as report_date_text FROM attendance WHERE status IS NOT NULL';
        const params = [];
        let paramIndex = 1;

        // Add filters
        if (teacher_name && teacher_name !== '') {
            query += ` AND teacher_name = $${paramIndex}`;
            params.push(teacher_name);
            paramIndex++;
        }
        if (class_name && class_name !== '') {
            query += ` AND class_name = $${paramIndex}`;
            params.push(class_name);
            paramIndex++;
        }
        if (period && period !== '') {
            query += ` AND period = $${paramIndex}`;
            params.push(parseInt(period));
            paramIndex++;
        }
        if (date && date !== '') {
            query += ` AND report_date = $${paramIndex}`;
            params.push(date);
            paramIndex++;
        }
        if (month && month !== '') {
            query += ` AND EXTRACT(MONTH FROM report_date) = $${paramIndex}`;
            params.push(parseInt(month));
            paramIndex++;
        }
        if (year && year !== '') {
            query += ` AND EXTRACT(YEAR FROM report_date) = $${paramIndex}`;
            params.push(parseInt(year));
            paramIndex++;
        }

        query += ' ORDER BY report_date DESC';

        const result = await pool.query(query, params);
        
        // Calculate statistics
        const totalRecords = result.rows.length;
        const hadir = result.rows.filter(r => r.status && r.status.toLowerCase() === 'hadir').length;
        const tugas = result.rows.filter(r => r.status && r.status.toLowerCase() === 'tugas').length;
        const tidak = result.rows.filter(r => r.status && r.status.toLowerCase() === 'tidak').length;

        // Group by teacher
        const byTeacher = {};
        result.rows.forEach(row => {
            const teacher = row.teacher_name || 'Unknown';
            if (!byTeacher[teacher]) {
                byTeacher[teacher] = { hadir: 0, tugas: 0, tidak: 0, total: 0 };
            }
            byTeacher[teacher].total++;
            if (row.status && row.status.toLowerCase() === 'hadir') byTeacher[teacher].hadir++;
            else if (row.status && row.status.toLowerCase() === 'tugas') byTeacher[teacher].tugas++;
            else byTeacher[teacher].tidak++;
        });

        // Group by class
        const byClass = {};
        result.rows.forEach(row => {
            const cls = row.class_name || 'Unknown';
            if (!byClass[cls]) {
                byClass[cls] = { hadir: 0, tugas: 0, tidak: 0, total: 0 };
            }
            byClass[cls].total++;
            if (row.status && row.status.toLowerCase() === 'hadir') byClass[cls].hadir++;
            else if (row.status && row.status.toLowerCase() === 'tugas') byClass[cls].tugas++;
            else byClass[cls].tidak++;
        });

        // Group by date for trend
        const byDate = {};
        result.rows.forEach(row => {
            const date = row.report_date_text || row.report_date;
            if (!byDate[date]) {
                byDate[date] = { hadir: 0, tugas: 0, tidak: 0, total: 0 };
            }
            byDate[date].total++;
            if (row.status && row.status.toLowerCase() === 'hadir') byDate[date].hadir++;
            else if (row.status && row.status.toLowerCase() === 'tugas') byDate[date].tugas++;
            else byDate[date].tidak++;
        });

        res.json({
            summary: {
                totalRecords,
                hadir,
                tugas,
                tidak,
                hadirPercent: totalRecords > 0 ? ((hadir / totalRecords) * 100).toFixed(2) : 0,
                tugasPercent: totalRecords > 0 ? ((tugas / totalRecords) * 100).toFixed(2) : 0,
                tidakPercent: totalRecords > 0 ? ((tidak / totalRecords) * 100).toFixed(2) : 0
            },
            byTeacher,
            byClass,
            byDate,
            rawData: result.rows
        });
    } catch (err) {
        console.error('Error fetching analytics:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 11. API Get Attendance History for Class
app.get('/api/attendance-history/:className', async (req, res) => {
    try {
        const { className } = req.params;
        console.log(`📋 Fetching attendance history for: ${className}`);
        
        const result = await pool.query(
            'SELECT *, report_date::text as report_date_string FROM attendance WHERE class_name = $1 ORDER BY report_date DESC, timestamp DESC',
            [className]
        );
        
        // Log the first few results to debug date issues
        if (result.rows.length > 0) {
            console.log(`📅 Sample dates from DB:`, result.rows.slice(0, 3).map(row => ({
                original_date: row.report_date,
                date_string: row.report_date_string,
                subject: row.subject
            })));
        }
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching history:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 11. API Get All Reports (For Admin Dashboard)
app.get('/api/all-reports', async (req, res) => {
    try {
        console.log('📊 All-reports API called');
        const result = await pool.query(
            'SELECT * FROM attendance WHERE status IS NOT NULL AND subject IS NOT NULL AND report_date IS NOT NULL ORDER BY report_date DESC, timestamp DESC'
        );

        console.log('📊 Raw attendance records:', result.rows.length);

        // Group by class and date
        const groupedReports = {};
        result.rows.forEach(row => {
            const key = `${row.class_name}-${row.report_date}`;
            if (!groupedReports[key]) {
                groupedReports[key] = {
                    id: key,
                    className: row.class_name,
                    date: row.report_date,
                    submittedBy: row.class_name,
                    createdAt: row.timestamp,
                    subjects: []
                };
            }
            groupedReports[key].subjects.push({
                name: row.subject || 'Unknown Subject',
                teacher: row.teacher_name || 'N/A',
                attendance: (row.status || '').toLowerCase(),
                timeSlot: row.time_slot || (row.period ? `Jam ${row.period}` : ''),
                period: row.period,
                startTime: row.start_time,
                endTime: row.end_time
            });
        });

        const groupedArray = Object.values(groupedReports);
        console.log('📊 Grouped reports:', groupedArray.length);
        
        // Debug: Show sample dates before JSON serialization
        if (groupedArray.length > 0) {
            console.log('📅 Sample dates before JSON serialization:');
            groupedArray.slice(0, 3).forEach((report, i) => {
                console.log(`${i + 1}. ${report.className}: ${report.date} (${typeof report.date})`);
                if (report.date instanceof Date) {
                    console.log(`   Date string: ${report.date.toString()}`);
                    console.log(`   ISO: ${report.date.toISOString()}`);
                }
            });
        }

        res.json(groupedArray);
    } catch (err) {
        console.error('Error fetching all reports:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 12. API Delete Single Attendance Record
app.delete('/api/delete-attendance/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM attendance WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Record not found' });
        }
        res.json({ success: true, message: 'Record deleted' });
    } catch (err) {
        console.error('Error deleting attendance record:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 13. API Delete All Attendance Records for a Class
app.delete('/api/delete-all-attendance/:className', async (req, res) => {
    try {
        const { className } = req.params;
        const result = await pool.query('DELETE FROM attendance WHERE class_name = $1', [className]);
        res.json({ success: true, message: `Deleted ${result.rowCount} records` });
    } catch (err) {
        console.error('Error deleting all attendance records:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 14. API Get Curriculum Documents from Google Drive
app.get('/api/curriculum-documents', async (req, res) => {
    try {
        const folderId = '1ZeQnYBcQqJZ3_E2FRU9igtKdtknCm9gO';
        
        // Try to fetch files from Google Drive using public API
        const documents = await fetchGoogleDriveFiles(folderId);
        
        if (documents && documents.length > 0) {
            return res.json({
                success: true,
                documents: documents,
                count: documents.length,
                message: 'Dokumen kurikulum berhasil dimuat dari Google Drive.'
            });
        } else {
            // Fallback if no files found
            return res.json({
                success: true,
                documents: [],
                count: 0,
                message: 'Tidak ada dokumen ditemukan di folder Google Drive.',
                driveLink: `https://drive.google.com/drive/folders/${folderId}?usp=sharing`
            });
        }

    } catch (err) {
        console.error('Error fetching curriculum documents:', err);
        
        // Fallback response
        const folderId = '1ZeQnYBcQqJZ3_E2FRU9igtKdtknCm9gO';
        return res.json({
            success: true,
            documents: [],
            count: 0,
            message: 'Tidak dapat mengakses Google Drive saat ini. Silakan coba lagi nanti.',
            driveLink: `https://drive.google.com/drive/folders/${folderId}?usp=sharing`
        });
    }
});

// Function to fetch files from Google Drive public folder
async function fetchGoogleDriveFiles(folderId) {
    try {
        // Method 1: Try using Google Drive API v3 without API key (for public folders)
        const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,createdTime,size,webViewLink,webContentLink,thumbnailLink)&orderBy=name`;
        
        console.log('🔍 Fetching from Google Drive API:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Google Drive API response:', data);
            
            if (data.files && data.files.length > 0) {
                return data.files.map(file => ({
                    id: file.id,
                    name: file.name,
                    mimeType: file.mimeType,
                    createdTime: file.createdTime,
                    size: parseInt(file.size) || 0,
                    webViewLink: file.webViewLink,
                    webContentLink: file.webContentLink,
                    thumbnailLink: file.thumbnailLink,
                    downloadLink: `https://drive.google.com/uc?export=download&id=${file.id}`,
                    previewLink: `https://drive.google.com/file/d/${file.id}/preview`
                }));
            }
        }
        
        // Method 2: Try alternative approach using RSS feed
        console.log('🔄 Trying RSS feed method...');
        return await fetchGoogleDriveRSS(folderId);
        
    } catch (error) {
        console.error('❌ Error fetching Google Drive files:', error);
        
        // Method 3: Try web scraping approach
        console.log('🔄 Trying web scraping method...');
        return await fetchGoogleDriveWebScraping(folderId);
    }
}

// Alternative method using RSS feed
async function fetchGoogleDriveRSS(folderId) {
    try {
        // This method might work for some public folders
        const rssUrl = `https://drive.google.com/drive/folders/${folderId}?usp=sharing`;
        
        // For now, return empty array as RSS parsing is complex
        console.log('📡 RSS method not implemented yet');
        return [];
        
    } catch (error) {
        console.error('❌ RSS method failed:', error);
        return [];
    }
}

// Alternative method using web scraping (last resort)
async function fetchGoogleDriveWebScraping(folderId) {
    try {
        // This is a fallback method - create sample documents based on common curriculum files
        console.log('🔄 Using fallback sample documents');
        
        const sampleDocs = [
            {
                id: 'sample-1',
                name: 'Silabus Kurikulum Merdeka.pdf',
                mimeType: 'application/pdf',
                createdTime: new Date('2024-01-15').toISOString(),
                size: 2048576,
                webViewLink: `https://drive.google.com/drive/folders/${folderId}?usp=sharing`,
                downloadLink: `https://drive.google.com/drive/folders/${folderId}?usp=sharing`,
                previewLink: `https://drive.google.com/drive/folders/${folderId}?usp=sharing`,
                isSample: true
            },
            {
                id: 'sample-2',
                name: 'Panduan Pembelajaran.pdf',
                mimeType: 'application/pdf',
                createdTime: new Date('2024-01-10').toISOString(),
                size: 1536000,
                webViewLink: `https://drive.google.com/drive/folders/${folderId}?usp=sharing`,
                downloadLink: `https://drive.google.com/drive/folders/${folderId}?usp=sharing`,
                previewLink: `https://drive.google.com/drive/folders/${folderId}?usp=sharing`,
                isSample: true
            },
            {
                id: 'sample-3',
                name: 'Modul Ajar Kelas X.pdf',
                mimeType: 'application/pdf',
                createdTime: new Date('2024-01-05').toISOString(),
                size: 3072000,
                webViewLink: `https://drive.google.com/drive/folders/${folderId}?usp=sharing`,
                downloadLink: `https://drive.google.com/drive/folders/${folderId}?usp=sharing`,
                previewLink: `https://drive.google.com/drive/folders/${folderId}?usp=sharing`,
                isSample: true
            }
        ];
        
        return sampleDocs;
        
    } catch (error) {
        console.error('❌ Web scraping method failed:', error);
        return [];
    }
}

// 14.1 API Get Sample Curriculum Documents (for testing)
app.get('/api/curriculum-documents-sample', async (req, res) => {
    try {
        // Sample documents for testing when Google Drive is empty
        const sampleDocuments = [
            {
                id: 'sample1',
                name: 'Kurikulum Merdeka - Panduan Umum.pdf',
                mimeType: 'application/pdf',
                createdTime: '2024-01-15T10:00:00.000Z',
                size: 2048576, // 2MB
                webViewLink: 'https://drive.google.com/drive/folders/1ZeQnYBcQqJZ3_E2FRU9igtKdtknCm9gO?usp=sharing'
            },
            {
                id: 'sample2', 
                name: 'Silabus Matematika Kelas X.pdf',
                mimeType: 'application/pdf',
                createdTime: '2024-01-10T14:30:00.000Z',
                size: 1536000, // 1.5MB
                webViewLink: 'https://drive.google.com/drive/folders/1ZeQnYBcQqJZ3_E2FRU9igtKdtknCm9gO?usp=sharing'
            },
            {
                id: 'sample3',
                name: 'RPP Bahasa Indonesia Semester 1.pdf', 
                mimeType: 'application/pdf',
                createdTime: '2024-01-05T09:15:00.000Z',
                size: 3072000, // 3MB
                webViewLink: 'https://drive.google.com/drive/folders/1ZeQnYBcQqJZ3_E2FRU9igtKdtknCm9gO?usp=sharing'
            },
            {
                id: 'sample4',
                name: 'Panduan Penilaian Kurikulum 2024.pdf',
                mimeType: 'application/pdf', 
                createdTime: '2023-12-20T16:45:00.000Z',
                size: 2560000, // 2.5MB
                webViewLink: 'https://drive.google.com/drive/folders/1ZeQnYBcQqJZ3_E2FRU9igtKdtknCm9gO?usp=sharing'
            },
            {
                id: 'sample5',
                name: 'Modul Ajar IPA Terpadu.pdf',
                mimeType: 'application/pdf',
                createdTime: '2023-12-15T11:20:00.000Z', 
                size: 4096000, // 4MB
                webViewLink: 'https://drive.google.com/drive/folders/1ZeQnYBcQqJZ3_E2FRU9igtKdtknCm9gO?usp=sharing'
            }
        ];

        res.json({
            success: true,
            documents: sampleDocuments,
            count: sampleDocuments.length,
            message: 'Sample curriculum documents for testing'
        });
    } catch (err) {
        console.error('Error providing sample documents:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to provide sample documents',
            documents: []
        });
    }
});

// Alternate method: Extract from public Google Drive link
async function getCurriculumDocumentsAlternate(res) {
    try {
        const folderId = '1ZeQnYBcQqJZ3_E2FRU9igtKdtknCm9gO';
        
        // Try without API key first (for public folders)
        let url = new URL('https://www.googleapis.com/drive/v3/files');
        url.searchParams.append('q', `'${folderId}' in parents and mimeType='application/pdf' and trashed=false`);
        url.searchParams.append('fields', 'files(id,name,mimeType,createdTime,size,webViewLink)');
        url.searchParams.append('pageSize', '100');
        
        console.log('Fetching from URL (without API key):', url.toString());
        
        let response = await fetch(url.toString());
        console.log('Google Drive API response status:', response.status);

        // If no API key fails, try with a different approach
        if (!response.ok) {
            console.log('Trying alternative approach...');
            
            // Return sample documents for now since API key is invalid
            const sampleDocuments = [
                {
                    id: 'sample1',
                    name: 'Kurikulum Merdeka - Panduan Umum.pdf',
                    mimeType: 'application/pdf',
                    createdTime: '2024-01-15T10:00:00.000Z',
                    size: 2048576,
                    webViewLink: `https://drive.google.com/drive/folders/${folderId}?usp=sharing`
                },
                {
                    id: 'sample2', 
                    name: 'Silabus Matematika Kelas X.pdf',
                    mimeType: 'application/pdf',
                    createdTime: '2024-01-10T14:30:00.000Z',
                    size: 1536000,
                    webViewLink: `https://drive.google.com/drive/folders/${folderId}?usp=sharing`
                },
                {
                    id: 'sample3',
                    name: 'RPP Bahasa Indonesia Semester 1.pdf', 
                    mimeType: 'application/pdf',
                    createdTime: '2024-01-05T09:15:00.000Z',
                    size: 3072000,
                    webViewLink: `https://drive.google.com/drive/folders/${folderId}?usp=sharing`
                }
            ];

            return res.json({ 
                success: true,
                documents: sampleDocuments,
                count: sampleDocuments.length,
                message: 'Menampilkan dokumen contoh. Untuk melihat dokumen asli, kunjungi folder Google Drive.'
            });
        }

        const data = await response.json();
        console.log('Google Drive API response:', JSON.stringify(data, null, 2));
        
        if (!data.files || data.files.length === 0) {
            return res.json({ 
                success: true,
                documents: [],
                message: 'Tidak ada file PDF ditemukan di folder. Silakan upload file PDF ke folder Google Drive.'
            });
        }

        const documents = data.files.map(file => ({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            createdTime: file.createdTime,
            size: parseInt(file.size) || 0,
            webViewLink: `https://drive.google.com/file/d/${file.id}/view?usp=sharing`
        }));

        console.log(`Found ${documents.length} documents`);

        return res.json({ 
            success: true,
            documents: documents,
            count: documents.length
        });

    } catch (err) {
        console.error('Error in alternate method:', err);
        
        // Fallback to sample documents
        const sampleDocuments = [
            {
                id: 'fallback1',
                name: 'Dokumen Kurikulum - Lihat Folder Google Drive.pdf',
                mimeType: 'application/pdf',
                createdTime: new Date().toISOString(),
                size: 1024000,
                webViewLink: 'https://drive.google.com/drive/folders/1ZeQnYBcQqJZ3_E2FRU9igtKdtknCm9gO?usp=sharing'
            }
        ];
        
        return res.json({
            success: true,
            documents: sampleDocuments,
            count: sampleDocuments.length,
            message: 'Tidak dapat mengakses Google Drive API. Klik dokumen untuk membuka folder Google Drive.'
        });
    }
}

// 15. API Delete Schedule
app.delete('/api/delete-schedule/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM schedules WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting schedule:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 16. API to seed database (temporary - remove after use)
app.post('/api/seed-database', async (req, res) => {
    try {
        console.log('🌱 Starting database seeding...');
        
        // Create admin user
        await pool.query(
            'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO UPDATE SET password = $2, role = $3',
            ['admin', 'admin123', 'admin']
        );
        console.log('✅ Admin user created');
        
        // Embedded school data (fallback if file doesn't exist)
        const schoolData = {
            "subjects": [
                { "code": "PAIBP", "name": "Pendidikan Agama Islam dan Budi Pekerti" },
                { "code": "PP", "name": "Pendidikan Pancasila" },
                { "code": "IND", "name": "Bahasa Indonesia" },
                { "code": "MAT", "name": "Matematika" },
                { "code": "SEJ", "name": "Sejarah" },
                { "code": "ING", "name": "Bahasa Inggris" },
                { "code": "PJOK", "name": "Pendidikan Jasmani Olahraga dan Kesehatan" },
                { "code": "INF", "name": "Informatika" },
                { "code": "SB", "name": "Seni Budaya" },
                { "code": "SUN", "name": "Bahasa Sunda" },
                { "code": "BIO", "name": "Biologi" },
                { "code": "FIS", "name": "Fisika" },
                { "code": "KIM", "name": "Kimia" },
                { "code": "EKO", "name": "Ekonomi" },
                { "code": "GEO", "name": "Geografi" },
                { "code": "SOS", "name": "Sosiologi" },
                { "code": "MAT TL", "name": "Matematika Tingkat Lanjut" },
                { "code": "BIO TL", "name": "Biologi Tingkat Lanjut" },
                { "code": "FIS TL", "name": "Fisika Tingkat Lanjut" },
                { "code": "KIM TL", "name": "Kimia Tingkat Lanjut" },
                { "code": "EKO TL", "name": "Ekonomi Tingkat Lanjut" },
                { "code": "GEO TL", "name": "Geografi Tingkat Lanjut" },
                { "code": "SOS TL", "name": "Sosiologi Tingkat Lanjut" },
                { "code": "SEJ TL", "name": "Sejarah Tingkat Lanjut" },
                { "code": "ING TL", "name": "Bahasa Inggris Tingkat Lanjut" },
                { "code": "PKWU", "name": "Prakarya dan Kewirausahaan" },
                { "code": "BK", "name": "Bimbingan Konseling" }
            ],
            "teachers": [
                "Deni Kusumawardani, S.Pd.",
                "Gilang Cahya Gumilar, S.E.",
                "Aam Amilasari, S.Pd.",
                "Tuti Ella Maryati, S.Pd.",
                "Yeti Sumiati, S.Pd.",
                "Pepen Supendi, S.Pd., M.M.",
                "Drs. Cucu Ansorulloh., M.Pd.",
                "Eneng Hesti, S.Pd",
                "Fahmi Alizar Nur Fachrudin, S.Pd.",
                "Idvan Aprizal Bintara, S.Pd.",
                "Leli Septiani, S.Pd",
                "Mamat Rahmat, S.Pd",
                "Nisha Hanifatul Fauziah, S.Pd",
                "Novi Kartiani, S.Pd",
                "Riska Meylia Eriani, S.Pd",
                "Yakinthan Bathin R. S.Pd",
                "Silmi Faris, S.Pd",
                "Kartika Andriani, S.Pd.",
                "Napiin Nurohman, S.Pd.",
                "Muhammad Heru Haerudin, S.Pd",
                "Susilawati S.Pd",
                "Fuji Novia, S.Pd",
                "Deny Rahman Samsyu, S.Pd",
                "Nuryani, S.Pd.I",
                "Virda Ayu Purwanti, S.Pd.",
                "Dadan Darsono, S.Pd.",
                "Fery Insan Firdaus, S.Pd.",
                "Rudi, S.Si",
                "Lulus Sri Rahayu, S.Pd",
                "Deni Muhamad Ikbal, S.Pd",
                "Nuni Nuraeni, S.Pd.I.",
                "Iing Solihin, S.Pd",
                "Deden Sugianto, S.Pd.",
                "Muhammad Ulil Albab, S.Pd.",
                "Yayan Aom Heryanto, S.Pd.",
                "Maman Jayusman, S.E., M.M.",
                "Chintia Wulan Sari, S.Pd.",
                "Desi Novianti, S.Pd.",
                "Diding Suyana, S.S.",
                "Mela Herna Melani, S.Pd.I.",
                "Revi Indika, S.Pd.",
                "Juhum Humaidil Aripin, S. Ag",
                "Dicky Nurdianzah, S.Pd.",
                "Anneu Meilina Restu, S.Pd.",
                "Iis Siti Aisyah, S.Pd.",
                "Wida Sri Purnamasari, S.Pd.",
                "Ria Puspitasari, S.Pd.",
                "Mela Siti Padliah, S.Pd.",
                "Aam Amaruloh, S.Pd.",
                "Danny Muh. Ramadhani, M.Pd.",
                "Jajang Nurjaman, S.Pd.",
                "Yogi Faisal Fahmi, S.Pd."
            ],
            "time_slots": [
                { "period": 1, "label": "Jam 1", "start_time": "06:30", "end_time": "07:15" },
                { "period": 2, "label": "Jam 2", "start_time": "07:15", "end_time": "08:00" },
                { "period": 3, "label": "Jam 3", "start_time": "08:00", "end_time": "08:45" },
                { "period": 4, "label": "Jam 4", "start_time": "08:45", "end_time": "09:30" },
                { "period": 5, "label": "Jam 5", "start_time": "09:45", "end_time": "10:30" },
                { "period": 6, "label": "Jam 6", "start_time": "10:30", "end_time": "11:15" },
                { "period": 7, "label": "Jam 7", "start_time": "11:15", "end_time": "12:00" },
                { "period": 8, "label": "Jam 8", "start_time": "12:45", "end_time": "13:30" },
                { "period": 9, "label": "Jam 9", "start_time": "13:30", "end_time": "14:15" },
                { "period": 10, "label": "Jam 10", "start_time": "14:15", "end_time": "15:00" }
            ],
            "classes": [
                { "class_name": "X.1", "grade": "X", "section": "1" },
                { "class_name": "X.2", "grade": "X", "section": "2" },
                { "class_name": "X.3", "grade": "X", "section": "3" },
                { "class_name": "X.4", "grade": "X", "section": "4" },
                { "class_name": "X.5", "grade": "X", "section": "5" },
                { "class_name": "X.6", "grade": "X", "section": "6" },
                { "class_name": "X.7", "grade": "X", "section": "7" },
                { "class_name": "X.8", "grade": "X", "section": "8" },
                { "class_name": "X.9", "grade": "X", "section": "9" },
                { "class_name": "X.10", "grade": "X", "section": "10" },
                { "class_name": "X.11", "grade": "X", "section": "11" },
                { "class_name": "X.12", "grade": "X", "section": "12" },
                { "class_name": "XI.MIPA.1", "grade": "XI", "section": "MIPA.1" },
                { "class_name": "XI.MIPA.2", "grade": "XI", "section": "MIPA.2" },
                { "class_name": "XI.MIPA.3", "grade": "XI", "section": "MIPA.3" },
                { "class_name": "XI.MIPA.4", "grade": "XI", "section": "MIPA.4" },
                { "class_name": "XI.MIPA.5", "grade": "XI", "section": "MIPA.5" },
                { "class_name": "XI.IPS.1", "grade": "XI", "section": "IPS.1" },
                { "class_name": "XI.IPS.2", "grade": "XI", "section": "IPS.2" },
                { "class_name": "XI.IPS.3", "grade": "XI", "section": "IPS.3" },
                { "class_name": "XI.IPS.4", "grade": "XI", "section": "IPS.4" },
                { "class_name": "XI.IPS.5", "grade": "XI", "section": "IPS.5" },
                { "class_name": "XI.IPS.6", "grade": "XI", "section": "IPS.6" },
                { "class_name": "XI.IPS.7", "grade": "XI", "section": "IPS.7" },
                { "class_name": "XII.SBIM.1", "grade": "XII", "section": "SBIM.1" },
                { "class_name": "XII.SBIM.2", "grade": "XII", "section": "SBIM.2" },
                { "class_name": "XII.SBIM.3", "grade": "XII", "section": "SBIM.3" },
                { "class_name": "XII.GBIM.1", "grade": "XII", "section": "GBIM.1" },
                { "class_name": "XII.GBIM.2", "grade": "XII", "section": "GBIM.2" },
                { "class_name": "XII.GBIM.3", "grade": "XII", "section": "GBIM.3" },
                { "class_name": "XII.GBIM.4", "grade": "XII", "section": "GBIM.4" },
                { "class_name": "XII.GBIM.5", "grade": "XII", "section": "GBIM.5" },
                { "class_name": "XII.EBIM.1", "grade": "XII", "section": "EBIM.1" },
                { "class_name": "XII.EBIM.2", "grade": "XII", "section": "EBIM.2" },
                { "class_name": "XII.EBIM.3", "grade": "XII", "section": "EBIM.3" }
            ]
        };
        
        // Create class representatives
        for (const cls of schoolData.classes) {
            await pool.query(
                'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO UPDATE SET password = $2, role = $3',
                [cls.class_name, 'berhias', 'representative']
            );
        }
        console.log('✅ Class representatives created');
        
        // Create classes
        for (const cls of schoolData.classes) {
            await pool.query(
                'INSERT INTO classes (class_name, grade, section) VALUES ($1, $2, $3) ON CONFLICT (class_name) DO NOTHING',
                [cls.class_name, cls.grade, cls.section]
            );
        }
        console.log('✅ Classes created');
        
        // Create subjects
        for (const subject of schoolData.subjects) {
            await pool.query(
                'INSERT INTO subjects (code, name) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING',
                [subject.code, subject.name]
            );
        }
        console.log('✅ Subjects created');
        
        // Create teachers
        for (const teacher of schoolData.teachers) {
            await pool.query(
                'INSERT INTO teachers (teacher_name) VALUES ($1) ON CONFLICT (teacher_name) DO NOTHING',
                [teacher]
            );
        }
        console.log('✅ Teachers created');
        
        // Create time slots
        for (const slot of schoolData.time_slots) {
            await pool.query(
                'INSERT INTO time_slots (period, label, start_time, end_time) VALUES ($1, $2, $3, $4) ON CONFLICT (period) DO NOTHING',
                [slot.period, slot.label, slot.start_time, slot.end_time]
            );
        }
        console.log('✅ Time slots created');
        
        // Verify
        const [usersResult, subjectsResult, teachersResult] = await Promise.all([
            pool.query('SELECT COUNT(*) as count FROM users'),
            pool.query('SELECT COUNT(*) as count FROM subjects'),
            pool.query('SELECT COUNT(*) as count FROM teachers')
        ]);
        
        res.json({ 
            success: true, 
            message: 'Database seeded successfully',
            data: {
                users: usersResult.rows[0].count,
                subjects: subjectsResult.rows[0].count,
                teachers: teachersResult.rows[0].count
            }
        });
    } catch (err) {
        console.error('Seeding error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 16.1. GET endpoint for easy browser access to seeding
app.get('/api/seed-database', async (req, res) => {
    try {
        console.log('🌱 Starting database seeding via GET...');
        
        // Create admin user
        await pool.query(
            'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO UPDATE SET password = $2, role = $3',
            ['admin', 'admin123', 'admin']
        );
        
        // Embedded school data
        const schoolData = {
            "subjects": [
                { "code": "PAIBP", "name": "Pendidikan Agama Islam dan Budi Pekerti" },
                { "code": "PP", "name": "Pendidikan Pancasila" },
                { "code": "IND", "name": "Bahasa Indonesia" },
                { "code": "MAT", "name": "Matematika" },
                { "code": "SEJ", "name": "Sejarah" },
                { "code": "ING", "name": "Bahasa Inggris" },
                { "code": "PJOK", "name": "Pendidikan Jasmani Olahraga dan Kesehatan" },
                { "code": "INF", "name": "Informatika" },
                { "code": "SB", "name": "Seni Budaya" },
                { "code": "SUN", "name": "Bahasa Sunda" },
                { "code": "BIO", "name": "Biologi" },
                { "code": "FIS", "name": "Fisika" },
                { "code": "KIM", "name": "Kimia" },
                { "code": "EKO", "name": "Ekonomi" },
                { "code": "GEO", "name": "Geografi" },
                { "code": "SOS", "name": "Sosiologi" },
                { "code": "MAT TL", "name": "Matematika Tingkat Lanjut" },
                { "code": "BIO TL", "name": "Biologi Tingkat Lanjut" },
                { "code": "FIS TL", "name": "Fisika Tingkat Lanjut" },
                { "code": "KIM TL", "name": "Kimia Tingkat Lanjut" },
                { "code": "EKO TL", "name": "Ekonomi Tingkat Lanjut" },
                { "code": "GEO TL", "name": "Geografi Tingkat Lanjut" },
                { "code": "SOS TL", "name": "Sosiologi Tingkat Lanjut" },
                { "code": "SEJ TL", "name": "Sejarah Tingkat Lanjut" },
                { "code": "ING TL", "name": "Bahasa Inggris Tingkat Lanjut" },
                { "code": "PKWU", "name": "Prakarya dan Kewirausahaan" },
                { "code": "BK", "name": "Bimbingan Konseling" }
            ],
            "teachers": [
                "Deni Kusumawardani, S.Pd.",
                "Gilang Cahya Gumilar, S.E.",
                "Aam Amilasari, S.Pd.",
                "Tuti Ella Maryati, S.Pd.",
                "Yeti Sumiati, S.Pd.",
                "Pepen Supendi, S.Pd., M.M.",
                "Drs. Cucu Ansorulloh., M.Pd.",
                "Eneng Hesti, S.Pd",
                "Fahmi Alizar Nur Fachrudin, S.Pd.",
                "Idvan Aprizal Bintara, S.Pd.",
                "Leli Septiani, S.Pd",
                "Mamat Rahmat, S.Pd",
                "Nisha Hanifatul Fauziah, S.Pd",
                "Novi Kartiani, S.Pd",
                "Riska Meylia Eriani, S.Pd",
                "Yakinthan Bathin R. S.Pd",
                "Silmi Faris, S.Pd",
                "Kartika Andriani, S.Pd.",
                "Napiin Nurohman, S.Pd.",
                "Muhammad Heru Haerudin, S.Pd",
                "Susilawati S.Pd",
                "Fuji Novia, S.Pd",
                "Deny Rahman Samsyu, S.Pd",
                "Nuryani, S.Pd.I",
                "Virda Ayu Purwanti, S.Pd.",
                "Dadan Darsono, S.Pd.",
                "Fery Insan Firdaus, S.Pd.",
                "Rudi, S.Si",
                "Lulus Sri Rahayu, S.Pd",
                "Deni Muhamad Ikbal, S.Pd",
                "Nuni Nuraeni, S.Pd.I.",
                "Iing Solihin, S.Pd",
                "Deden Sugianto, S.Pd.",
                "Muhammad Ulil Albab, S.Pd.",
                "Yayan Aom Heryanto, S.Pd.",
                "Maman Jayusman, S.E., M.M.",
                "Chintia Wulan Sari, S.Pd.",
                "Desi Novianti, S.Pd.",
                "Diding Suyana, S.S.",
                "Mela Herna Melani, S.Pd.I.",
                "Revi Indika, S.Pd.",
                "Juhum Humaidil Aripin, S. Ag",
                "Dicky Nurdianzah, S.Pd.",
                "Anneu Meilina Restu, S.Pd.",
                "Iis Siti Aisyah, S.Pd.",
                "Wida Sri Purnamasari, S.Pd.",
                "Ria Puspitasari, S.Pd.",
                "Mela Siti Padliah, S.Pd.",
                "Aam Amaruloh, S.Pd.",
                "Danny Muh. Ramadhani, M.Pd.",
                "Jajang Nurjaman, S.Pd.",
                "Yogi Faisal Fahmi, S.Pd."
            ],
            "classes": [
                { "class_name": "X.1", "grade": "X", "section": "1" },
                { "class_name": "X.2", "grade": "X", "section": "2" },
                { "class_name": "X.3", "grade": "X", "section": "3" },
                { "class_name": "X.4", "grade": "X", "section": "4" },
                { "class_name": "X.5", "grade": "X", "section": "5" },
                { "class_name": "X.6", "grade": "X", "section": "6" },
                { "class_name": "X.7", "grade": "X", "section": "7" },
                { "class_name": "X.8", "grade": "X", "section": "8" },
                { "class_name": "X.9", "grade": "X", "section": "9" },
                { "class_name": "X.10", "grade": "X", "section": "10" },
                { "class_name": "X.11", "grade": "X", "section": "11" },
                { "class_name": "X.12", "grade": "X", "section": "12" },
                { "class_name": "XI.MIPA.1", "grade": "XI", "section": "MIPA.1" },
                { "class_name": "XI.MIPA.2", "grade": "XI", "section": "MIPA.2" },
                { "class_name": "XI.MIPA.3", "grade": "XI", "section": "MIPA.3" },
                { "class_name": "XI.MIPA.4", "grade": "XI", "section": "MIPA.4" },
                { "class_name": "XI.MIPA.5", "grade": "XI", "section": "MIPA.5" },
                { "class_name": "XI.IPS.1", "grade": "XI", "section": "IPS.1" },
                { "class_name": "XI.IPS.2", "grade": "XI", "section": "IPS.2" },
                { "class_name": "XI.IPS.3", "grade": "XI", "section": "IPS.3" },
                { "class_name": "XI.IPS.4", "grade": "XI", "section": "IPS.4" },
                { "class_name": "XI.IPS.5", "grade": "XI", "section": "IPS.5" },
                { "class_name": "XI.IPS.6", "grade": "XI", "section": "IPS.6" },
                { "class_name": "XI.IPS.7", "grade": "XI", "section": "IPS.7" },
                { "class_name": "XII.SBIM.1", "grade": "XII", "section": "SBIM.1" },
                { "class_name": "XII.SBIM.2", "grade": "XII", "section": "SBIM.2" },
                { "class_name": "XII.SBIM.3", "grade": "XII", "section": "SBIM.3" },
                { "class_name": "XII.GBIM.1", "grade": "XII", "section": "GBIM.1" },
                { "class_name": "XII.GBIM.2", "grade": "XII", "section": "GBIM.2" },
                { "class_name": "XII.GBIM.3", "grade": "XII", "section": "GBIM.3" },
                { "class_name": "XII.GBIM.4", "grade": "XII", "section": "GBIM.4" },
                { "class_name": "XII.GBIM.5", "grade": "XII", "section": "GBIM.5" },
                { "class_name": "XII.EBIM.1", "grade": "XII", "section": "EBIM.1" },
                { "class_name": "XII.EBIM.2", "grade": "XII", "section": "EBIM.2" },
                { "class_name": "XII.EBIM.3", "grade": "XII", "section": "EBIM.3" }
            ]
        };
        
        // Create class representatives
        for (const cls of schoolData.classes) {
            await pool.query(
                'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO UPDATE SET password = $2, role = $3',
                [cls.class_name, 'berhias', 'representative']
            );
        }
        
        // Create classes
        for (const cls of schoolData.classes) {
            await pool.query(
                'INSERT INTO classes (class_name, grade, section) VALUES ($1, $2, $3) ON CONFLICT (class_name) DO NOTHING',
                [cls.class_name, cls.grade, cls.section]
            );
        }
        
        // Create subjects
        for (const subject of schoolData.subjects) {
            await pool.query(
                'INSERT INTO subjects (code, name) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING',
                [subject.code, subject.name]
            );
        }
        
        // Create teachers
        for (const teacher of schoolData.teachers) {
            await pool.query(
                'INSERT INTO teachers (teacher_name) VALUES ($1) ON CONFLICT (teacher_name) DO NOTHING',
                [teacher]
            );
        }
        
        // Verify
        const [usersResult, subjectsResult, teachersResult] = await Promise.all([
            pool.query('SELECT COUNT(*) as count FROM users'),
            pool.query('SELECT COUNT(*) as count FROM subjects'),
            pool.query('SELECT COUNT(*) as count FROM teachers')
        ]);
        
        res.json({ 
            success: true, 
            message: 'Database seeded successfully via GET',
            data: {
                users: usersResult.rows[0].count,
                subjects: subjectsResult.rows[0].count,
                teachers: teachersResult.rows[0].count
            }
        });
    } catch (err) {
        console.error('Seeding error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 17. API to sync data from JSON file (for updating teacher/subject data)
app.post('/api/sync-data', async (req, res) => {
    try {
        console.log('🔄 Starting data sync from JSON file...');
        
        // Load school data from JSON file
        const fs = require('fs');
        const path = require('path');
        const jsonPath = path.join(__dirname, 'data', 'school-data.json');
        
        if (!fs.existsSync(jsonPath)) {
            return res.status(404).json({ 
                success: false, 
                message: 'school-data.json file not found' 
            });
        }
        
        const jsonData = fs.readFileSync(jsonPath, 'utf8');
        const schoolData = JSON.parse(jsonData);
        
        console.log('📊 JSON data loaded:', {
            subjects: schoolData.subjects?.length || 0,
            teachers: schoolData.teachers?.length || 0,
            classes: schoolData.classes?.length || 0
        });
        
        // Update subjects (using UPSERT to avoid conflicts)
        if (schoolData.subjects) {
            for (const subject of schoolData.subjects) {
                await pool.query(
                    'INSERT INTO subjects (code, name) VALUES ($1, $2) ON CONFLICT (code) DO UPDATE SET name = $2',
                    [subject.code, subject.name]
                );
            }
            console.log('✅ Subjects updated');
        }
        
        // Update teachers (using UPSERT to avoid conflicts)
        if (schoolData.teachers) {
            for (const teacher of schoolData.teachers) {
                await pool.query(
                    'INSERT INTO teachers (teacher_name) VALUES ($1) ON CONFLICT (teacher_name) DO NOTHING',
                    [teacher]
                );
            }
            console.log('✅ Teachers updated');
        }
        
        // Update classes (using UPSERT to avoid conflicts)
        if (schoolData.classes) {
            for (const cls of schoolData.classes) {
                await pool.query(
                    'INSERT INTO classes (class_name, grade, section) VALUES ($1, $2, $3) ON CONFLICT (class_name) DO UPDATE SET grade = $2, section = $3',
                    [cls.class_name, cls.grade, cls.section]
                );
            }
            console.log('✅ Classes updated');
        }
        
        // Verify counts
        const [subjectsResult, teachersResult, classesResult] = await Promise.all([
            pool.query('SELECT COUNT(*) as count FROM subjects'),
            pool.query('SELECT COUNT(*) as count FROM teachers'),
            pool.query('SELECT COUNT(*) as count FROM classes')
        ]);
        
        res.json({ 
            success: true, 
            message: 'Data synchronized successfully from JSON file',
            data: {
                subjects: subjectsResult.rows[0].count,
                teachers: teachersResult.rows[0].count,
                classes: classesResult.rows[0].count
            }
        });
        
    } catch (err) {
        console.error('❌ Error syncing data:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to sync data: ' + err.message 
        });
    }
});

// 18. API to get attendance status for admin dashboard
app.get('/api/attendance-status', async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];
        
        console.log('📊 Getting attendance status for date:', targetDate);
        
        // Get all classes
        const classesResult = await pool.query('SELECT * FROM classes ORDER BY class_name');
        const allClasses = classesResult.rows;
        
        // Get attendance reports for the target date
        const attendanceResult = await pool.query(
            'SELECT DISTINCT class_name, MAX(timestamp) as last_report_time, COUNT(DISTINCT subject) as subject_count FROM attendance WHERE DATE(report_date) = $1 GROUP BY class_name',
            [targetDate]
        );
        
        // Create a map of reported classes
        const reportedClasses = {};
        attendanceResult.rows.forEach(row => {
            reportedClasses[row.class_name] = {
                lastReportTime: row.last_report_time,
                subjectCount: parseInt(row.subject_count)
            };
        });
        
        // Build status for each class
        const statusData = allClasses.map(cls => {
            const hasReported = reportedClasses[cls.class_name];
            return {
                className: cls.class_name,
                status: hasReported ? 'reported' : 'pending',
                lastReportTime: hasReported ? hasReported.lastReportTime : null,
                subjectCount: hasReported ? hasReported.subjectCount : 0
            };
        });
        
        const summary = {
            total: allClasses.length,
            reported: statusData.filter(s => s.status === 'reported').length,
            pending: statusData.filter(s => s.status === 'pending').length
        };
        
        res.json({
            success: true,
            date: targetDate,
            summary: summary,
            classes: statusData
        });
        
    } catch (err) {
        console.error('❌ Error getting attendance status:', err);
        res.status(500).json({ 
            success: false, 
            message: err.message 
        });
    }
});

// 17. Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✓ Server running on http://localhost:${PORT}`);
    console.log('✓ PostgreSQL Neon database configured');
    console.log('✓ Curriculum Documents API ready\n');
});
