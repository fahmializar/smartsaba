# School Data Structure Update

## Summary
Updated the system to use comprehensive, structured school data from JSON instead of hardcoded values in JavaScript. The database is now seeded automatically on first run with complete school information.

## Files Created/Modified

### 1. **data/school-data.json** (NEW)
Structured master data file containing:
- **16 Subjects**: Sejarah, Sosiologi, Fisika, Matematika Tingkat Lanjut, Kimia, Pendidikan Pancasila, Agama, Geografi, PJOK, Bimbingan Konseling, Bahasa Sunda, Bahasa Indonesia, Seni Budaya, Informatika, Biologi, Matematika Umum
- **25 Teachers**: Full teacher names with titles (S.Pd., S.E., M.Pd., etc.)
- **35 Classes** organized by grade:
  - Grade X: 12 classes (X.1 - X.12)
  - Grade XI MIPA: 5 classes (XI.MIPA.1 - XI.MIPA.5)
  - Grade XI IPS: 7 classes (XI.IPS.1 - XI.IPS.7)
  - Grade XII SBIM: 3 classes (XII.SBIM.1 - XII.SBIM.3)
  - Grade XII GBIM: 5 classes (XII.GBIM.1 - XII.GBIM.5)
  - Grade XII EBIM: 3 classes (XII.EBIM.1 - XII.EBIM.3)
- **10 Time Slots**: Jam 1-10 (06:30-15:00 with breaks at 09:30-09:45 and 12:00-12:45)

### 2. **sql/school-data-insert.sql** (REFERENCE)
Production-ready SQL INSERT statements for:
- All 16 subjects
- All 25 teachers
- All 35 classes
- All 10 time slots
- 35 class representative users (one per class)

Can be executed directly in Neon console for manual data insertion.

### 3. **server.js** - seedDatabase() Function (UPDATED)
Modified to dynamically read from `data/school-data.json` instead of hardcoded arrays:
- Loads JSON file on startup
- Inserts all subjects, teachers, classes, and time slots in a single operation
- Creates one representative user per class (username=class_name, password='berhias')
- Uses `ON CONFLICT DO NOTHING` for safe re-execution

## Key Features

✅ **Structured Data**: All school information now in organized JSON format  
✅ **Dynamic Loading**: Server reads from JSON file during initialization  
✅ **Complete Masters**: 35 classes, 25 teachers, 16 subjects, 10 time periods  
✅ **Grade/Section Normalization**: Classes now include grade and section fields  
✅ **Safe Seeding**: `ON CONFLICT DO NOTHING` allows idempotent database initialization  
✅ **Automatic Provisioning**: Class representative users created automatically  

## Login Credentials

After server initialization, the following users are created:

**Admin Account:**
- Username: `admin`
- Password: `admin123`
- Role: `admin`

**Class Representatives:**
- Username: Class name (e.g., `X.1`, `XI.MIPA.3`, `XII.GBIM.5`)
- Password: `berhias`
- Role: `representative`

## Class Name Format

**OLD FORMAT**: X-1, X-2, ..., XII-12 (36 classes) - **NO LONGER USED**

**NEW FORMAT**: X.1, X.2, ..., XII.EBIM.3 (35 classes) - **CURRENTLY ACTIVE**

Update any references in your application to use the new format with periods (.) instead of hyphens (-).

## Next Steps

1. Update `.env` with your actual PostgreSQL Neon connection string
2. Start the server: `node server.js`
3. Server will automatically create tables and seed data on first run
4. Verify login with any class name (e.g., X.1) and password `berhias`
5. Test dashboard features with the populated data

## Data Statistics

| Category | Count |
|----------|-------|
| Grades | 3 (X, XI, XII) |
| Grade Streams | 5 (X, XI.MIPA, XI.IPS, XII.SBIM, XII.GBIM, XII.EBIM) |
| Classes | 35 |
| Teachers | 25 |
| Subjects | 16 |
| Time Periods | 10 |
| Total Users (with admin & representatives) | 36 |
