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

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
    console.log('✓ Terhubung ke PostgreSQL Neon');
});

// 2. Initialize PostgreSQL Tables
async function initializeDatabase() {
    try {
        // DROP all tables to start fresh
        await pool.query(`DROP TABLE IF EXISTS attendance CASCADE`);
        await pool.query(`DROP TABLE IF EXISTS schedules CASCADE`);
        await pool.query(`DROP TABLE IF EXISTS time_slots CASCADE`);
        await pool.query(`DROP TABLE IF EXISTS subjects CASCADE`);
        await pool.query(`DROP TABLE IF EXISTS teachers CASCADE`);
        await pool.query(`DROP TABLE IF EXISTS classes CASCADE`);
        await pool.query(`DROP TABLE IF EXISTS users CASCADE`);
        
        // Create fresh users table with correct schema
        await pool.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL
            )
        `);
        console.log('✓ Users table created');

        // Create classes table
        await pool.query(`
            CREATE TABLE classes (
                id SERIAL PRIMARY KEY,
                class_name VARCHAR(255) UNIQUE NOT NULL,
                grade VARCHAR(50),
                section VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create teachers table
        await pool.query(`
            CREATE TABLE teachers (
                id SERIAL PRIMARY KEY,
                teacher_name VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create subjects table
        await pool.query(`
            CREATE TABLE subjects (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create schedules table
        await pool.query(`
            CREATE TABLE schedules (
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
            CREATE TABLE time_slots (
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
            CREATE TABLE attendance (
                id SERIAL PRIMARY KEY,
                class_name VARCHAR(255) NOT NULL,
                report_date DATE NOT NULL,
                subject VARCHAR(255) NOT NULL,
                teacher_name VARCHAR(255),
                status VARCHAR(50),
                period INTEGER,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (class_name) REFERENCES classes(class_name) ON DELETE CASCADE
            )
        `);

        console.log('✓ Database tables created/verified');

        // Seed initial data
        await seedDatabase();
    } catch (err) {
        console.error('Error initializing database:', err.message);
    }
}

// Seed initial data
async function seedDatabase() {
    try {
        const fs = require('fs');
        const path = require('path');
        
        // Load school data from JSON
        const schoolDataPath = path.join(__dirname, 'data', 'school-data.json');
        const schoolData = JSON.parse(fs.readFileSync(schoolDataPath, 'utf8'));
        
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

// 9. API Submit Attendance
app.post('/api/submit-attendance', async (req, res) => {
    try {
        const { class_name, date, attendance } = req.body;
        if (!class_name || !date || !attendance) {
            return res.status(400).json({ success: false, message: 'Invalid data' });
        }

        for (const item of attendance) {
            const subject = item.name || item.subject;
            const teacher = item.teacher || '';
            const status = item.attendance || item.status;
            
            await pool.query(
                'INSERT INTO attendance (class_name, report_date, subject, teacher_name, status) VALUES ($1, $2, $3, $4, $5)',
                [class_name, date, subject, teacher, status]
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Error submitting attendance:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 10. API Get Analytics Data with Filters
app.get('/api/analytics', async (req, res) => {
    try {
        const { teacher_name, class_name, month, year } = req.query;
        
        let query = 'SELECT * FROM attendance WHERE status IS NOT NULL';
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
            const date = row.report_date;
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
        const result = await pool.query(
            'SELECT * FROM attendance WHERE class_name = $1 ORDER BY report_date DESC, timestamp DESC',
            [className]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching history:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 11. API Get All Reports (For Admin Dashboard)
app.get('/api/all-reports', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM attendance WHERE status IS NOT NULL AND subject IS NOT NULL AND report_date IS NOT NULL ORDER BY report_date DESC, timestamp DESC'
        );

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
                attendance: (row.status || '').toLowerCase()
            });
        });

        res.json(Object.values(groupedReports));
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
        // Using public folder - no authentication needed
        const folderId = '1ZeQnYBcQqJZ3_E2FRU9igtKdtknCm9gO';
        
        // Try alternate method directly (most reliable for public folders)
        return getCurriculumDocumentsAlternate(res);

    } catch (err) {
        console.error('Error fetching curriculum documents:', err);
        return res.json({
            success: false,
            error: 'Gagal mengambil dokumen dari Google Drive',
            documents: []
        });
    }
});

// Alternate method: Extract from public Google Drive link
async function getCurriculumDocumentsAlternate(res) {
    try {
        const folderId = '1ZeQnYBcQqJZ3_E2FRU9igtKdtknCm9gO';
        
        // Use public API key that works with public folders
        const apiKey = 'AIzaSyAQfxPJioun0Vpt0_kWWrDPj0_TAwLlSRw';
        
        // Fetch from Google Drive API
        const url = new URL('https://www.googleapis.com/drive/v3/files');
        url.searchParams.append('q', `'${folderId}' in parents and mimeType='application/pdf' and trashed=false`);
        url.searchParams.append('fields', 'files(id,name,mimeType,createdTime,size,webViewLink)');
        url.searchParams.append('pageSize', '100');
        url.searchParams.append('key', apiKey);
        
        console.log('Fetching from URL:', url.toString());
        
        const response = await fetch(url.toString());

        console.log('Google Drive API response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Google Drive API error:', response.status, errorText);
            // Return empty list with helpful message
            return res.json({ 
                success: true,
                documents: [],
                message: 'Tidak ada dokumen ditemukan. Silakan upload file PDF ke folder Google Drive Anda.'
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
        return res.json({
            success: false,
            error: 'Gagal mengambil dokumen dari Google Drive. ' + err.message,
            documents: []
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
        
        // Load school data
        const fs = require('fs');
        const path = require('path');
        const schoolDataPath = path.join(__dirname, 'data', 'school-data.json');
        const schoolData = JSON.parse(fs.readFileSync(schoolDataPath, 'utf8'));
        
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

// 17. Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✓ Server running on http://localhost:${PORT}`);
    console.log('✓ PostgreSQL Neon database configured');
    console.log('✓ Curriculum Documents API ready\n');
});
