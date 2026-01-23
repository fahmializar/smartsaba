# Kurikulum Smansaba - School Management System

A comprehensive school management website for curriculum programs, teacher administration, and attendance monitoring.

## Features

### 🏫 **Landing Page**
- Professional school branding
- Curriculum programs showcase
- Academic calendar
- Secure role-based login system

### 👨‍🏫 **Teacher Dashboard**
- Upload and manage administrative documents (RPP, Silabus)
- File organization by subject, grade, and semester
- Document search and filtering
- File statistics and overview

### 👨‍🎓 **Class Representative Dashboard**
- Weekly attendance reporting for teachers
- Multiple subjects per day tracking
- Attendance status: Present, Late, Absent
- Report history with filtering

### 🔧 **Admin Dashboard**
- View all attendance reports from representatives
- Analytics and statistics
- Monitor teacher file uploads
- Export functionality
- Real-time data filtering

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js with Express
- **Database**: SQLite3
- **Styling**: Custom CSS with responsive design
- **Icons**: Font Awesome 6

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Quick Start

1. **Clone or download the project files**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Main website: http://localhost:3000
   - Admin dashboard: http://localhost:3000/admin

## Default Login Credentials

### For Testing the System:

**Teachers:**
- Username: `guru1`
- Password: `berhias`

**Class Representatives:**
All classes have accounts with their class name as username and `berhias` as password:
- Grade X: `X.1`, `X.2`, `X.3`, ..., `X.12`
- Grade XI: `XI.1`, `XI.2`, `XI.3`, ..., `XI.12`
- Grade XII GBIM: `XII.GBIM.1`, `XII.GBIM.2`, ..., `XII.GBIM.5`
- Grade XII EBIM: `XII.EBIM.1`, `XII.EBIM.2`, `XII.EBIM.3`
- Grade XII SBIM: `XII.SBIM.1`, `XII.SBIM.2`, ..., `XII.SBIM.5`

Examples:
- Username: `X.1`, Password: `berhias`
- Username: `XI.5`, Password: `berhias`
- Username: `XII.GBIM.1`, Password: `berhias`

**Admin:**
- Username: `admin`
- Password: `berhias`

## Database

The system uses SQLite database (`school_management.db`) which is automatically created when you first run the server. The database includes:

- **users**: User accounts and roles
- **attendance_reports**: Main attendance reports
- **attendance_subjects**: Subject-specific attendance data
- **teacher_files**: Metadata for uploaded files

## API Endpoints

### Authentication
- `POST /api/login` - User authentication

### Attendance Reports
- `POST /api/attendance-reports` - Submit new attendance report
- `GET /api/attendance-reports` - Get attendance reports (with filtering)
- `GET /api/attendance-stats` - Get attendance statistics

### Teacher Files
- `POST /api/teacher-files` - Save file metadata
- `GET /api/teacher-files` - Get teacher files

## File Structure

```
kurikulum-smansaba/
├── index.html                    # Landing page
├── teacher-dashboard.html        # Teacher interface
├── representative-dashboard.html # Class rep interface
├── admin-dashboard.html         # Admin interface
├── styles.css                   # Main styles
├── dashboard.css               # Dashboard styles
├── admin.css                   # Admin-specific styles
├── script.js                   # Landing page scripts
├── teacher-dashboard.js        # Teacher functionality
├── representative-dashboard.js # Class rep functionality
├── admin-dashboard.js          # Admin functionality
├── server.js                   # Backend server
├── package.json               # Dependencies
└── README.md                  # This file
```

## Usage Guide

### For Class Representatives:
1. Login with representative credentials
2. Navigate to "Laporan Kehadiran"
3. Fill in the date and class information
4. Add subjects with teacher names and time slots
5. Mark attendance status for each teacher
6. Add any additional notes
7. Submit the report

### For Teachers:
1. Login with teacher credentials
2. Navigate to "Upload Dokumen"
3. Select document type (RPP, Silabus, etc.)
4. Fill in subject, grade, and semester
5. Upload your file (PDF, DOC, DOCX)
6. View and manage uploaded files in "File Saya"

### For Administrators:
1. Access the admin dashboard at `/admin`
2. Login with admin credentials
3. View attendance reports and statistics
4. Monitor teacher file uploads
5. Export reports for record keeping

## Customization

### Adding New Document Types
Edit the `docType` select options in `teacher-dashboard.html`:
```html
<option value="new_type">New Document Type</option>
```

### Modifying School Information
Update the school name and branding in:
- `index.html` (hero section)
- Navigation logos in all dashboard files
- CSS custom properties for colors

### Database Schema Changes
Modify the table creation queries in `server.js` `initializeDatabase()` function.

## Production Deployment

1. **Environment Variables**: Set up proper environment variables for production
2. **Database**: Consider migrating to PostgreSQL or MySQL for production
3. **File Storage**: Implement proper file upload and storage (AWS S3, etc.)
4. **Authentication**: Add proper JWT-based authentication
5. **HTTPS**: Enable SSL/TLS encryption
6. **Process Manager**: Use PM2 or similar for process management

## Security Considerations

- The current implementation uses simple authentication for demonstration
- In production, implement proper password hashing (bcrypt)
- Add CSRF protection
- Implement rate limiting
- Validate and sanitize all inputs
- Use HTTPS in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the project repository.