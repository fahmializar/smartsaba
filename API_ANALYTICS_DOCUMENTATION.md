# API Documentation - Analytics Endpoint

## New Endpoint: GET /api/analytics

### Purpose
Retrieve filtered attendance analytics data with statistics, breakdowns, and raw records.

### Request Format

**Method**: `GET`

**URL**: `http://localhost:3000/api/analytics`

**Query Parameters** (all optional):

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| teacher_name | string | Filter by teacher name | `?teacher_name=Budi%20Santoso` |
| class_name | string | Filter by class name | `?class_name=10A` |
| month | integer | Filter by month (1-12) | `?month=01` |
| year | integer | Filter by year | `?year=2025` |

### Example Requests

**All data:**
```
GET /api/analytics
```

**Data for specific teacher:**
```
GET /api/analytics?teacher_name=Budi%20Santoso
```

**Data for specific class and month:**
```
GET /api/analytics?class_name=10A&month=01
```

**Complex filter:**
```
GET /api/analytics?teacher_name=Budi%20Santoso&class_name=10A&month=01&year=2025
```

### Response Format

```json
{
  "summary": {
    "totalRecords": 45,
    "hadir": 35,
    "tugas": 5,
    "tidak": 5,
    "hadirPercent": "77.78",
    "tugasPercent": "11.11",
    "tidakPercent": "11.11"
  },
  "byTeacher": {
    "Budi Santoso": {
      "hadir": 20,
      "tugas": 2,
      "tidak": 3,
      "total": 25
    },
    "Siti Nurhaliza": {
      "hadir": 15,
      "tugas": 3,
      "tidak": 2,
      "total": 20
    }
  },
  "byClass": {
    "10A": {
      "hadir": 25,
      "tugas": 3,
      "tidak": 2,
      "total": 30
    },
    "10B": {
      "hadir": 10,
      "tugas": 2,
      "tidak": 3,
      "total": 15
    }
  },
  "byDate": {
    "2025-01-20": {
      "hadir": 8,
      "tugas": 1,
      "tidak": 1,
      "total": 10
    },
    "2025-01-21": {
      "hadir": 9,
      "tugas": 0,
      "tidak": 1,
      "total": 10
    }
  },
  "rawData": [
    {
      "id": 1,
      "class_name": "10A",
      "report_date": "2025-01-20",
      "subject": "Matematika",
      "teacher_name": "Budi Santoso",
      "status": "hadir",
      "period": 1,
      "timestamp": "2025-01-20T08:00:00.000Z"
    },
    {
      "id": 2,
      "class_name": "10A",
      "report_date": "2025-01-20",
      "subject": "Bahasa Indonesia",
      "teacher_name": "Siti Nurhaliza",
      "status": "hadir",
      "period": 2,
      "timestamp": "2025-01-20T08:30:00.000Z"
    }
  ]
}
```

### Response Fields Explanation

#### Summary
- `totalRecords` - Total number of attendance records
- `hadir` - Count of "hadir" (present) records
- `tugas` - Count of "tugas" (task/assignment) records
- `tidak` - Count of "tidak" (absent) records
- `hadirPercent` - Percentage of hadir (string with 2 decimals)
- `tugasPercent` - Percentage of tugas (string with 2 decimals)
- `tidakPercent` - Percentage of tidak (string with 2 decimals)

#### byTeacher
Object with teacher names as keys, each containing:
- `hadir` - Count of hadir for this teacher
- `tugas` - Count of tugas for this teacher
- `tidak` - Count of tidak for this teacher
- `total` - Total records for this teacher

#### byClass
Object with class names as keys, each containing:
- `hadir` - Count of hadir for this class
- `tugas` - Count of tugas for this class
- `tidak` - Count of tidak for this class
- `total` - Total records for this class

#### byDate
Object with dates as keys (YYYY-MM-DD format), each containing:
- `hadir` - Count of hadir on this date
- `tugas` - Count of tugas on this date
- `tidak` - Count of tidak on this date
- `total` - Total records on this date

#### rawData
Array of attendance records with fields:
- `id` - Record ID
- `class_name` - Class name
- `report_date` - Date of attendance (YYYY-MM-DD)
- `subject` - Subject name
- `teacher_name` - Teacher name
- `status` - Attendance status (hadir, tugas, tidak)
- `period` - Period/lesson number
- `timestamp` - Exact timestamp

### Status Codes

| Code | Meaning | Response |
|------|---------|----------|
| 200 | Success | JSON object with analytics data |
| 400 | Bad Request | Invalid parameters |
| 500 | Server Error | `{"success": false, "message": "error description"}` |

### Error Responses

**Server Error Example:**
```json
{
  "success": false,
  "message": "Database connection error"
}
```

### Usage in Frontend

**Basic usage with fetch:**
```javascript
const response = await fetch('http://localhost:3000/api/analytics');
const data = await response.json();
console.log(data.summary);
```

**With filters:**
```javascript
const params = new URLSearchParams();
params.append('teacher_name', 'Budi Santoso');
params.append('month', '01');

const response = await fetch(`http://localhost:3000/api/analytics?${params.toString()}`);
const data = await response.json();
```

### Performance Notes

- Query filters are applied at database level (SQL WHERE clauses)
- Month/year filters use PostgreSQL EXTRACT function
- Results are typically returned in < 1 second
- For large datasets, consider pagination (future enhancement)

### Data Types

| Field | Type | Format |
|-------|------|--------|
| totalRecords | integer | Whole number |
| hadir/tugas/tidak | integer | Whole number |
| Percentages | string | "XX.XX" format |
| class_name | string | Text |
| teacher_name | string | Text |
| report_date | string | YYYY-MM-DD |
| timestamp | string | ISO 8601 format |
| status | string | "hadir" \| "tugas" \| "tidak" |
| month | integer | 1-12 |
| year | integer | YYYY |

### Database Query Logic

The endpoint executes:
```sql
SELECT * FROM attendance 
WHERE status IS NOT NULL
  AND [teacher_name = $1]           -- if provided
  AND [class_name = $2]             -- if provided
  AND [EXTRACT(MONTH FROM report_date) = $3]  -- if month provided
  AND [EXTRACT(YEAR FROM report_date) = $4]   -- if year provided
ORDER BY report_date DESC
```

### Caching Recommendations

- None - Data is real-time and should not be cached
- Each request fetches latest database state
- Suitable for update frequencies up to multiple times per day

### Limits

- No hard limit on returned records
- Maximum query string length: ~2000 characters
- For very large datasets, consider server-side pagination

### Related Endpoints

- `GET /api/all-reports` - Get all attendance reports (grouped)
- `GET /api/classes` - Get all classes
- `GET /api/teachers` - Get all teachers
- `GET /api/attendance-history/:className` - Get history for specific class

### Future Enhancements

Potential additions to this endpoint:
- Pagination support
- Sorting options
- Export format parameter (csv, json, etc.)
- Date range filters (date_from, date_to)
- Additional statistics (averages, trends)
- Student-level granularity (if needed)

---

**Endpoint Created**: January 23, 2026
**Version**: 1.0
**Database**: PostgreSQL Neon
