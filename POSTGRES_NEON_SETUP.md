# PostgreSQL Neon Database Setup Guide

## Step 1: Get Your Neon Connection String

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project or use existing one
3. Copy your connection string (looks like: `postgresql://neondb_owner:password@ep-xyz.us-east-1.neon.tech/neondb`)

## Step 2: Update .env File

Edit `.env` file and add your connection string:

```
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@YOUR_HOST/neondb
PORT=3000
```

Replace:
- `YOUR_PASSWORD` - Your Neon database password
- `YOUR_HOST` - Your Neon host (e.g., ep-xyz.us-east-1.neon.tech)
- `neondb` - Your database name (default)

## Step 3: Start the Server

```bash
node server.js
```

You should see:
```
✓ Terhubung ke PostgreSQL Neon
✓ Database tables created/verified
✓ Admin user created
✓ Classes and representatives created
✓ Teachers created
✓ Subjects created
✓ Server running on http://localhost:3000
```

## Database Structure

### Tables Created:
- **users** - Login credentials (admin, class representatives)
- **classes** - All class names (X-1 through XII-12)
- **teachers** - All teacher names
- **subjects** - All school subjects
- **schedules** - Class schedule (which subject, which teacher, which day)
- **attendance** - Attendance reports submitted by class representatives

## Features

### Representative Dashboard
- View class schedule
- Submit daily attendance reports
- Select subjects and teachers from database
- View submission history

### Admin Dashboard
- View all attendance reports
- Filter by month, year, class
- See which subjects had attendance issues
- Automatic data from all class representatives

## API Endpoints

- `POST /api/login` - User login
- `GET /api/classes` - All classes
- `GET /api/teachers` - All teachers
- `GET /api/subjects` - All subjects
- `GET /api/class-schedules/:className` - Class schedule
- `POST /api/save-schedule` - Save class schedule
- `POST /api/submit-attendance` - Submit attendance report
- `GET /api/attendance-history/:className` - Class attendance history
- `GET /api/all-reports` - All reports (admin dashboard)

## Testing

1. Login as Admin: username=`admin`, password=`admin123`
2. Login as Representative: username=`X-9`, password=`berhias`
3. Submit attendance reports from representative dashboard
4. View in admin dashboard (should show automatically)
