// Admin Dashboard JavaScript - PostgreSQL Version with Teacher Filter

// Global variables
let currentSection = 'overview';
let currentReportsData = [];
const API_BASE = window.location.origin + '/api';

// Indonesian date formatting utility
function formatIndonesianDate(dateString) {
    if (!dateString) return 'Tanggal tidak valid';
    
    try {
        // Handle different date formats
        let date;
        if (typeof dateString === 'string') {
            // Remove time part if present (e.g., "2024-01-26T00:00:00.000Z" -> "2024-01-26")
            const dateOnly = dateString.split('T')[0];
            date = new Date(dateOnly + 'T00:00:00.000Z'); // Add UTC time to avoid timezone issues
        } else if (dateString instanceof Date) {
            date = dateString;
        } else {
            return 'Format tanggal tidak valid';
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Tanggal tidak valid';
        }
        
        // Format to Indonesian date
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC' // Use UTC to avoid timezone conversion
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Error format tanggal';
    }
}

// 1. Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Admin Dashboard Initializing...');
    
    // Test if functions are working
    window.testFunction = function() {
        console.log('✅ JavaScript is working!');
        alert('JavaScript is working!');
    };
    
    console.log('📋 Available functions:', {
        showSection: typeof showSection,
        loadReports: typeof loadReports,
        loadAnalytics: typeof loadAnalytics
    });
    checkAuth();
    initializeDashboard();
    setupEventListeners();
    refreshAllData();
});

// 2. Refresh All Data
async function refreshAllData() {
    console.log('📊 Refreshing all data...');
    await Promise.all([
        loadStats(),
        loadRecentReports(),
        populateClassDropdown(),
        populateTeacherDropdown()
    ]);
    
    if (currentSection === 'reports') {
        await loadReports();
    }
}

// 3. Check Authentication
function checkAuth() {
    const userName = localStorage.getItem('username');
    if (userName) {
        document.getElementById('adminName').textContent = userName;
    } else {
        document.getElementById('adminName').textContent = 'Administrator';
    }
}

// 4. Initialize Dashboard (Set default year/month)
function initializeDashboard() {
    const now = new Date();
    const currentYear = now.getFullYear(); 
    const yearSelect = document.getElementById('filterYear');
    if (yearSelect) yearSelect.value = currentYear.toString();
    
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    const monthSelect = document.getElementById('filterMonth');
    if (monthSelect) monthSelect.value = currentMonth;
}

// 5. Setup Event Listeners
function setupEventListeners() {
    const filterIds = ['filterMonth', 'filterYear', 'filterClass', 'filterTeacher'];
    filterIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                if (currentSection === 'reports') loadReports();
                else refreshAllData();
            });
        }
    });
    
    // Add analytics filter listeners
    const analyticsFilterIds = ['analyticsTeacher', 'analyticsClass', 'analyticsTimeSlot', 'analyticsDate', 'analyticsMonth', 'analyticsYear'];
    analyticsFilterIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                if (currentSection === 'analytics') loadAnalytics();
            });
        }
    });
}

// 6. Navigate Menu
function showSection(sectionId) {
    console.log('showSection called with:', sectionId);
    
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
        console.log('Section activated:', sectionId);
    } else {
        console.error('Section not found:', sectionId);
    }
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const navItem = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (navItem) {
        navItem.classList.add('active');
        console.log('Nav item activated for:', sectionId);
    } else {
        console.error('Nav item not found for:', sectionId);
    }
    
    currentSection = sectionId;
    
    // Handle section-specific initialization
    if (sectionId === 'reports') {
        loadReports();
    } else if (sectionId === 'analytics') {
        populateAnalyticsDropdowns();
        loadAnalytics();
    } else if (sectionId === 'attendance-status') {
        initializeAttendanceStatus();
    } else {
        refreshAllData();
    }
}

// 7. Load Statistics
async function loadStats() {
    try {
        console.log('📈 Loading stats...');
        const response = await fetch(`${API_BASE}/all-reports`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const reports = await response.json();
        
        console.log('✅ Reports fetched:', reports.length);
        
        const totalReportsEl = document.getElementById('totalReports');
        const activeClassesEl = document.getElementById('activeClasses');
        const weeklyReportsEl = document.getElementById('weeklyReports');
        const monthlyReportsEl = document.getElementById('monthlyReports');
        
        // Count unique report submissions (class + date)
        const uniqueDateClass = new Set(reports.map(r => `${r.className}-${r.date}`));
        if (totalReportsEl) totalReportsEl.textContent = uniqueDateClass.size;
        
        // Count active classes
        if (activeClassesEl) {
            const uniqueClasses = [...new Set(reports.map(r => r.className))];
            activeClassesEl.textContent = uniqueClasses.length;
        }
        
        // Count this week's reports
        if (weeklyReportsEl) {
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const weekReports = reports.filter(r => new Date(r.date) >= weekAgo);
            weeklyReportsEl.textContent = weekReports.length;
        }
        
        // Count this month's reports
        if (monthlyReportsEl) {
            const now = new Date();
            const monthReports = reports.filter(r => {
                const rDate = new Date(r.date);
                return rDate.getMonth() === now.getMonth() && rDate.getFullYear() === now.getFullYear();
            });
            monthlyReportsEl.textContent = monthReports.length;
        }
    } catch (err) {
        console.error('❌ Error loading stats:', err);
        document.getElementById('totalReports').textContent = '0';
        document.getElementById('activeClasses').textContent = '0';
    }
}

// 8. Load Recent Reports
async function loadRecentReports() {
    try {
        console.log('📋 Loading recent reports...');
        const response = await fetch(`${API_BASE}/all-reports`);
        const reports = await response.json();
        
        const container = document.getElementById('recentReportsPreview');
        if (!container) return;

        if (!Array.isArray(reports) || reports.length === 0) {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">Belum ada laporan</div>';
            return;
        }

        const recent = [...reports].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

        container.innerHTML = recent.map(report => `
            <div style="padding: 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
                <div>
                    <strong style="color:#1e3a8a;">${report.className}</strong><br>
                    <small>${report.date}</small>
                </div>
                <span style="font-size: 0.8em; color: #666;">Oleh: ${report.submittedBy}</span>
            </div>
        `).join('');
    } catch (err) {
        console.error('❌ Error loading recent reports:', err);
    }
}

// 9. Populate Classes Dropdown from Database
async function populateClassDropdown() {
    const filterClass = document.getElementById('filterClass');
    if (!filterClass) return;

    try {
        console.log('📚 Loading classes...');
        const response = await fetch(`${API_BASE}/classes`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const classes = await response.json();
        
        console.log('✅ Classes loaded:', classes.length);
        
        const currentSelection = filterClass.value;
        filterClass.innerHTML = '<option value="">Semua Kelas</option>';
        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.class_name;
            option.textContent = cls.class_name;
            filterClass.appendChild(option);
        });
        filterClass.value = currentSelection;
    } catch (err) {
        console.error('❌ Error loading classes:', err);
        filterClass.innerHTML = '<option value="">Semua Kelas</option>';
    }
}

// 10. Populate Teachers Dropdown from Database
async function populateTeacherDropdown() {
    const filterTeacher = document.getElementById('filterTeacher');
    if (!filterTeacher) return;

    try {
        console.log('👨‍🏫 Loading teachers...');
        const response = await fetch(`${API_BASE}/teachers`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const teachers = await response.json();
        
        console.log('✅ Teachers loaded:', teachers.length);
        
        const currentSelection = filterTeacher.value;
        filterTeacher.innerHTML = '<option value="">Semua Guru</option>';
        teachers.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher.teacher_name;
            option.textContent = teacher.teacher_name;
            filterTeacher.appendChild(option);
        });
        filterTeacher.value = currentSelection;
    } catch (err) {
        console.error('❌ Error loading teachers:', err);
        filterTeacher.innerHTML = '<option value="">Semua Guru</option>';
    }
}

// 11. Load Reports with Filters (including teacher filter)
async function loadReports() {
    const container = document.getElementById('reportsList');
    if (!container) return;

    const fMonth = document.getElementById('filterMonth')?.value || '';
    const fYear = document.getElementById('filterYear')?.value || '';
    const fClass = document.getElementById('filterClass')?.value || '';
    const fTeacher = document.getElementById('filterTeacher')?.value || '';

    try {
        console.log('📄 Loading reports with filters:', {fMonth, fYear, fClass, fTeacher});
        const response = await fetch(`${API_BASE}/all-reports`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const allData = await response.json();

        console.log('✅ Total reports from API:', allData.length);

        // Filter reports
        const filtered = allData.filter(report => {
            const d = new Date(report.date);
            const m = (d.getMonth() + 1).toString().padStart(2, '0');
            const y = d.getFullYear().toString();
            
            const monthMatch = fMonth === '' || m === fMonth;
            const yearMatch = fYear === '' || y === fYear;
            const classMatch = fClass === '' || report.className === fClass;
            
            // Check if any subject has matching teacher
            let teacherMatch = fTeacher === '';
            if (fTeacher !== '') {
                teacherMatch = report.subjects && report.subjects.some(s => s.teacher === fTeacher);
            }
            
            return monthMatch && yearMatch && classMatch && teacherMatch;
        });

        console.log('✅ Filtered reports:', filtered.length);

        if (filtered.length === 0) {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">Tidak ada laporan yang sesuai filter</div>';
            return;
        }

        // Sort by date descending
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Display reports
        container.innerHTML = filtered.map(report => `
            <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 8px; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">
                    <strong>${report.className} - ${formatIndonesianDate(report.date)}</strong>
                    <small style="color:#666;">Pengirim: ${report.submittedBy}</small>
                </div>
                <div class="subjects-grid">
                    ${report.subjects && report.subjects.length > 0 ? report.subjects.map(s => {
                        const timeSlotInfo = s.timeSlot || (s.period ? `Jam ${s.period}` : '');
                        const timeSlotDisplay = timeSlotInfo ? `<div style="font-size: 0.75em; color: #64748b;">${timeSlotInfo}</div>` : '';
                        return `
                        <div style="display: flex; justify-content: space-between; font-size: 0.9em; margin-bottom: 8px; padding: 8px; background: #f9fafb; border-radius: 4px;">
                            <div>
                                <div style="font-weight: 600; color: #1e293b;">${s.name}</div>
                                <div style="font-size: 0.8em; color: #64748b;">${s.teacher}</div>
                                ${timeSlotDisplay}
                            </div>
                            <span style="font-weight: bold; color: ${
                                s.attendance && s.attendance.toLowerCase() === 'hadir' ? '#10b981' : 
                                (s.attendance && s.attendance.toLowerCase() === 'tugas' ? '#f59e0b' : '#ef4444')
                            }; align-self: center;">
                                ${(s.attendance || 'TIDAK').toUpperCase()}
                            </span>
                        </div>
                    `}).join('') : '<div style="color: #999;">Tidak ada data mata pelajaran</div>'}
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('❌ Error loading reports:', err);
        container.innerHTML = '<div style="padding: 20px; color: red;">❌ Error loading reports. Check browser console for details.</div>';
    }
}

// 12. Load Analytics with Filters
let analyticsChart = null;
let trendChart = null;

async function loadAnalytics() {
    try {
        console.log('📊 Loading analytics...');
        
        // Get filter values
        const teacher = document.getElementById('analyticsTeacher')?.value || '';
        const cls = document.getElementById('analyticsClass')?.value || '';
        const timeSlot = document.getElementById('analyticsTimeSlot')?.value || '';
        const specificDate = document.getElementById('analyticsDate')?.value || '';
        const month = document.getElementById('analyticsMonth')?.value || '';
        const year = document.getElementById('analyticsYear')?.value || '';

        // Build query string
        const params = new URLSearchParams();
        if (teacher) params.append('teacher_name', teacher);
        if (cls) params.append('class_name', cls);
        if (timeSlot) params.append('period', timeSlot);
        if (specificDate) params.append('date', specificDate);
        if (month) params.append('month', month);
        if (year) params.append('year', year);

        const response = await fetch(`${API_BASE}/analytics?${params.toString()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        console.log('✅ Analytics data loaded:', data);

        // Update summary cards
        document.getElementById('totalRecords').textContent = data.summary.totalRecords;
        document.getElementById('hadirCount').textContent = data.summary.hadir;
        document.getElementById('tugasCount').textContent = data.summary.tugas;
        document.getElementById('tidakCount').textContent = data.summary.tidak;
        
        document.getElementById('hadirPercent').textContent = data.summary.hadirPercent + '%';
        document.getElementById('hadirPercentSuccess').textContent = data.summary.hadirPercent + '%';
        document.getElementById('tugasPercentWarning').textContent = data.summary.tugasPercent + '%';
        document.getElementById('tidakPercentDanger').textContent = data.summary.tidakPercent + '%';

        // Populate teacher performance
        populateTeacherPerformance(data.byTeacher);
        
        // Populate class stats
        populateClassStats(data.byClass);

        // Create charts
        createAttendanceChart(data.summary);
        createTrendChart(data.byDate);

    } catch (err) {
        console.error('❌ Error loading analytics:', err);
        alert('Error loading analytics: ' + err.message);
    }
}

function populateTeacherPerformance(byTeacher) {
    const container = document.getElementById('teacherPerformance');
    if (!container) return;

    const html = Object.entries(byTeacher).map(([teacher, stats]) => {
        const percent = stats.total > 0 ? ((stats.hadir / stats.total) * 100).toFixed(1) : 0;
        return `
            <div style="margin-bottom: 15px; padding: 10px; background: #f9fafb; border-radius: 6px; border-left: 4px solid #1e3a8a;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <strong style="color: #1e293b;">${teacher}</strong>
                    <span style="font-weight: bold; color: #10b981;">${percent}%</span>
                </div>
                <div style="display: flex; gap: 10px; font-size: 0.85em;">
                    <span style="color: #10b981;">✓ ${stats.hadir} Hadir</span>
                    <span style="color: #f59e0b;">⚠ ${stats.tugas} Tugas</span>
                    <span style="color: #ef4444;">✗ ${stats.tidak} Tidak</span>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html || '<div style="color: #999; padding: 20px; text-align: center;">Tidak ada data</div>';
}

function populateClassStats(byClass) {
    const container = document.getElementById('classStats');
    if (!container) return;

    const html = Object.entries(byClass).map(([className, stats]) => {
        const percent = stats.total > 0 ? ((stats.hadir / stats.total) * 100).toFixed(1) : 0;
        return `
            <div style="margin-bottom: 15px; padding: 10px; background: #f9fafb; border-radius: 6px; border-left: 4px solid #059669;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <strong style="color: #1e293b;">${className}</strong>
                    <span style="font-weight: bold; color: #10b981;">${percent}%</span>
                </div>
                <div style="display: flex; gap: 10px; font-size: 0.85em;">
                    <span style="color: #10b981;">✓ ${stats.hadir}</span>
                    <span style="color: #f59e0b;">⚠ ${stats.tugas}</span>
                    <span style="color: #ef4444;">✗ ${stats.tidak}</span>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html || '<div style="color: #999; padding: 20px; text-align: center;">Tidak ada data</div>';
}

function createAttendanceChart(summary) {
    const ctx = document.getElementById('attendanceChart');
    if (!ctx) return;

    // Destroy previous chart if exists
    if (analyticsChart) analyticsChart.destroy();

    const total = summary.totalRecords;
    
    analyticsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Hadir', 'Tugas', 'Tidak Hadir'],
            datasets: [{
                data: [summary.hadir, summary.tugas, summary.tidak],
                backgroundColor: [
                    '#10b981', // green
                    '#f59e0b', // orange
                    '#ef4444'  // red
                ],
                borderColor: ['#ffffff', '#ffffff', '#ffffff'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 14 },
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}

function createTrendChart(byDate) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    // Destroy previous chart if exists
    if (trendChart) trendChart.destroy();

    const sortedDates = Object.keys(byDate).sort();
    const hadirTrend = sortedDates.map(date => byDate[date].hadir);
    const tugasTrend = sortedDates.map(date => byDate[date].tugas);
    const tidakTrend = sortedDates.map(date => byDate[date].tidak);

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedDates,
            datasets: [
                {
                    label: 'Hadir',
                    data: hadirTrend,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#10b981'
                },
                {
                    label: 'Tugas',
                    data: tugasTrend,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#f59e0b'
                },
                {
                    label: 'Tidak Hadir',
                    data: tidakTrend,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#ef4444'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: { size: 12 },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 13 },
                    bodyFont: { size: 12 },
                    cornerRadius: 4
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// 13. Download Analytics as Excel with robust XLSX loading
async function downloadExcelAnalytics() {
    const downloadBtn = document.getElementById('downloadBtn');
    const downloadBtnText = document.getElementById('downloadBtnText');
    const originalText = downloadBtnText.textContent;
    
    try {
        // Show loading state
        downloadBtn.disabled = true;
        downloadBtnText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memuat...';
        
        console.log('📥 Preparing Excel download...');

        // Try to ensure XLSX is loaded
        downloadBtnText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memuat XLSX...';
        const xlsxLoaded = await ensureXLSXLoaded();
        
        if (!xlsxLoaded) {
            console.log('⚠️ XLSX library could not be loaded, using CSV format instead');
            downloadBtnText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengunduh CSV...';
            return downloadAsCSV();
        }

        downloadBtnText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengunduh Excel...';

        // Get filter values
        const teacher = document.getElementById('analyticsTeacher')?.value || '';
        const cls = document.getElementById('analyticsClass')?.value || '';
        const timeSlot = document.getElementById('analyticsTimeSlot')?.value || '';
        const specificDate = document.getElementById('analyticsDate')?.value || '';
        const month = document.getElementById('analyticsMonth')?.value || '';
        const year = document.getElementById('analyticsYear')?.value || '';

        // Build query string
        const params = new URLSearchParams();
        if (teacher) params.append('teacher_name', teacher);
        if (cls) params.append('class_name', cls);
        if (timeSlot) params.append('period', timeSlot);
        if (specificDate) params.append('date', specificDate);
        if (month) params.append('month', month);
        if (year) params.append('year', year);

        console.log('📊 Fetching analytics data with params:', params.toString());
        console.log('🔍 DEBUG - Date filter value:', specificDate);
        console.log('🔍 DEBUG - Full URL:', `${API_BASE}/analytics?${params.toString()}`);
        const response = await fetch(`${API_BASE}/analytics?${params.toString()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const data = await response.json();

        console.log('📊 Analytics data received:', data);

        // Check if we have data
        if (!data.summary || data.summary.totalRecords === 0) {
            alert('Tidak ada data kehadiran untuk diunduh. Pastikan ada laporan kehadiran yang telah disubmit.');
            return;
        }

        // Prepare data for Excel
        const workbook = XLSX.utils.book_new();

        // Sheet 1: Summary
        const summaryData = [
            ['RINGKASAN ANALITIK KEHADIRAN'],
            [],
            ['Metrik', 'Jumlah', 'Persentase'],
            ['Total Kehadiran', data.summary.totalRecords, '100%'],
            ['Hadir', data.summary.hadir, data.summary.hadirPercent + '%'],
            ['Tugas', data.summary.tugas, data.summary.tugasPercent + '%'],
            ['Tidak Hadir', data.summary.tidak, data.summary.tidakPercent + '%']
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        summarySheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');

        // Sheet 2: Teacher Performance
        const teacherData = [['KEHADIRAN PER GURU'], []];
        teacherData.push(['Guru', 'Hadir', 'Tugas', 'Tidak Hadir', 'Total', 'Persentase Hadir']);
        Object.entries(data.byTeacher).forEach(([teacher, stats]) => {
            const percent = stats.total > 0 ? ((stats.hadir / stats.total) * 100).toFixed(1) : 0;
            teacherData.push([teacher, stats.hadir, stats.tugas, stats.tidak, stats.total, percent + '%']);
        });
        const teacherSheet = XLSX.utils.aoa_to_sheet(teacherData);
        teacherSheet['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(workbook, teacherSheet, 'Guru');

        // Sheet 3: Class Performance
        const classData = [['KEHADIRAN PER KELAS'], []];
        classData.push(['Kelas', 'Hadir', 'Tugas', 'Tidak Hadir', 'Total', 'Persentase Hadir']);
        Object.entries(data.byClass).forEach(([className, stats]) => {
            const percent = stats.total > 0 ? ((stats.hadir / stats.total) * 100).toFixed(1) : 0;
            classData.push([className, stats.hadir, stats.tugas, stats.tidak, stats.total, percent + '%']);
        });
        const classSheet = XLSX.utils.aoa_to_sheet(classData);
        classSheet['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(workbook, classSheet, 'Kelas');

        // Sheet 4: Time Slot Performance
        const timeSlotData = [['KEHADIRAN PER JAM PELAJARAN'], []];
        timeSlotData.push(['Jam Pelajaran', 'Hadir', 'Tugas', 'Tidak Hadir', 'Total', 'Persentase Hadir']);
        
        // Group by time slot for analysis
        const byTimeSlot = {};
        data.rawData.forEach(row => {
            const timeSlot = row.time_slot || (row.period ? `Jam ${row.period}` : 'N/A');
            if (!byTimeSlot[timeSlot]) {
                byTimeSlot[timeSlot] = { hadir: 0, tugas: 0, tidak: 0, total: 0 };
            }
            byTimeSlot[timeSlot].total++;
            if (row.status && row.status.toLowerCase() === 'hadir') byTimeSlot[timeSlot].hadir++;
            else if (row.status && row.status.toLowerCase() === 'tugas') byTimeSlot[timeSlot].tugas++;
            else byTimeSlot[timeSlot].tidak++;
        });
        
        Object.entries(byTimeSlot).forEach(([timeSlot, stats]) => {
            const percent = stats.total > 0 ? ((stats.hadir / stats.total) * 100).toFixed(1) : 0;
            timeSlotData.push([timeSlot, stats.hadir, stats.tugas, stats.tidak, stats.total, percent + '%']);
        });
        const timeSlotSheet = XLSX.utils.aoa_to_sheet(timeSlotData);
        timeSlotSheet['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(workbook, timeSlotSheet, 'Jam Pelajaran');

        // Sheet 5: Raw Data
        const rawData = [['DATA KEHADIRAN LENGKAP'], []];
        rawData.push(['Tanggal', 'Kelas', 'Mata Pelajaran', 'Guru', 'Jam Pelajaran', 'Status']);
        data.rawData.forEach(row => {
            const timeSlotInfo = row.time_slot || (row.period ? `Jam ${row.period}` : 'N/A');
            rawData.push([
                formatIndonesianDate(row.report_date),
                row.class_name,
                row.subject,
                row.teacher_name || 'N/A',
                timeSlotInfo,
                (row.status || 'Tidak Hadir').toUpperCase()
            ]);
        });
        const rawDataSheet = XLSX.utils.aoa_to_sheet(rawData);
        rawDataSheet['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(workbook, rawDataSheet, 'Data Lengkap');

        // Generate filename with date and filters
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        let filename = `Analitik_Kehadiran_${dateStr}`;
        
        // Add filter info to filename
        if (specificDate) {
            const filterDate = new Date(specificDate).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
            }).replace(/\//g, '-');
            filename = `Analitik_Kehadiran_${filterDate}`;
        } else if (month && year) {
            const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            filename = `Analitik_Kehadiran_${monthNames[parseInt(month)]}_${year}`;
        } else if (year) {
            filename = `Analitik_Kehadiran_${year}`;
        }
        
        filename += '.xlsx';

        // Download
        console.log('💾 Generating Excel file:', filename);
        XLSX.writeFile(workbook, filename);
        console.log('✅ Excel file downloaded successfully:', filename);
        
        // Show success message
        alert(`✅ File Excel berhasil diunduh: ${filename}\n\n📊 File berisi 5 sheet:\n• Ringkasan\n• Data per Guru\n• Data per Kelas\n• Data per Jam Pelajaran\n• Data Lengkap`);

    } catch (err) {
        console.error('❌ Error downloading Excel:', err);
        
        // If Excel fails, try CSV as fallback
        console.log('🔄 Excel failed, trying CSV fallback...');
        try {
            downloadBtnText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengunduh CSV...';
            await downloadAsCSV();
        } catch (csvErr) {
            console.error('❌ CSV fallback also failed:', csvErr);
            alert('❌ Gagal mengunduh file.\n\nSilakan coba lagi atau hubungi administrator.');
        }
    } finally {
        // Reset button state
        downloadBtn.disabled = false;
        downloadBtnText.textContent = originalText;
    }
}

// Function to ensure XLSX library is loaded with multiple fallback sources
async function ensureXLSXLoaded() {
    // Check if already loaded
    if (typeof XLSX !== 'undefined') {
        console.log('✅ XLSX already loaded');
        return true;
    }

    console.log('📦 XLSX not found, attempting to load...');

    // List of CDN sources to try
    const cdnSources = [
        'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
        'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
        'https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js',
        'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js'
    ];

    for (const src of cdnSources) {
        try {
            console.log(`🔄 Trying to load XLSX from: ${src}`);
            const loaded = await loadScript(src);
            if (loaded && typeof XLSX !== 'undefined') {
                console.log('✅ XLSX loaded successfully from:', src);
                return true;
            }
        } catch (error) {
            console.log(`❌ Failed to load from ${src}:`, error.message);
        }
    }

    console.log('❌ All XLSX CDN sources failed');
    return false;
}

// Helper function to load script dynamically
function loadScript(src) {
    return new Promise((resolve, reject) => {
        // Check if script is already loaded
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.type = 'text/javascript';
        
        script.onload = () => {
            console.log('✅ Script loaded successfully:', src);
            resolve(true);
        };
        
        script.onerror = () => {
            console.log('❌ Failed to load script:', src);
            document.head.removeChild(script);
            reject(new Error(`Failed to load script: ${src}`));
        };
        
        document.head.appendChild(script);
        
        // Timeout after 10 seconds
        setTimeout(() => {
            if (script.parentNode) {
                document.head.removeChild(script);
                reject(new Error(`Timeout loading script: ${src}`));
            }
        }, 10000);
    });
}

// Fallback CSV download function
async function downloadAsCSV() {
    try {
        console.log('📥 XLSX not available, downloading as CSV...');
        
        // Get the same data
        const teacher = document.getElementById('analyticsTeacher')?.value || '';
        const cls = document.getElementById('analyticsClass')?.value || '';
        const timeSlot = document.getElementById('analyticsTimeSlot')?.value || '';
        const specificDate = document.getElementById('analyticsDate')?.value || '';
        const month = document.getElementById('analyticsMonth')?.value || '';
        const year = document.getElementById('analyticsYear')?.value || '';

        const params = new URLSearchParams();
        if (teacher) params.append('teacher_name', teacher);
        if (cls) params.append('class_name', cls);
        if (timeSlot) params.append('period', timeSlot);
        if (specificDate) params.append('date', specificDate);
        if (month) params.append('month', month);
        if (year) params.append('year', year);

        const response = await fetch(`${API_BASE}/analytics?${params.toString()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (!data.summary || data.summary.totalRecords === 0) {
            alert('Tidak ada data kehadiran untuk diunduh.');
            return;
        }

        // Create comprehensive CSV content with multiple sheets equivalent
        let csvContent = '';
        
        // Sheet 1 equivalent: Summary
        csvContent += "RINGKASAN ANALITIK KEHADIRAN\n";
        csvContent += "=".repeat(50) + "\n";
        csvContent += "Metrik,Jumlah,Persentase\n";
        csvContent += `Total Kehadiran,${data.summary.totalRecords},100%\n`;
        csvContent += `Hadir,${data.summary.hadir},${data.summary.hadirPercent}%\n`;
        csvContent += `Tugas,${data.summary.tugas},${data.summary.tugasPercent}%\n`;
        csvContent += `Tidak Hadir,${data.summary.tidak},${data.summary.tidakPercent}%\n\n`;
        
        // Sheet 2 equivalent: Teacher Performance
        csvContent += "KEHADIRAN PER GURU\n";
        csvContent += "=".repeat(50) + "\n";
        csvContent += "Guru,Hadir,Tugas,Tidak Hadir,Total,Persentase Hadir\n";
        Object.entries(data.byTeacher).forEach(([teacher, stats]) => {
            const percent = stats.total > 0 ? ((stats.hadir / stats.total) * 100).toFixed(1) : 0;
            csvContent += `"${teacher}",${stats.hadir},${stats.tugas},${stats.tidak},${stats.total},${percent}%\n`;
        });
        csvContent += "\n";
        
        // Sheet 3 equivalent: Class Performance
        csvContent += "KEHADIRAN PER KELAS\n";
        csvContent += "=".repeat(50) + "\n";
        csvContent += "Kelas,Hadir,Tugas,Tidak Hadir,Total,Persentase Hadir\n";
        Object.entries(data.byClass).forEach(([className, stats]) => {
            const percent = stats.total > 0 ? ((stats.hadir / stats.total) * 100).toFixed(1) : 0;
            csvContent += `"${className}",${stats.hadir},${stats.tugas},${stats.tidak},${stats.total},${percent}%\n`;
        });
        csvContent += "\n";
        
        // Sheet 4 equivalent: Time Slot Performance
        csvContent += "KEHADIRAN PER JAM PELAJARAN\n";
        csvContent += "=".repeat(50) + "\n";
        csvContent += "Jam Pelajaran,Hadir,Tugas,Tidak Hadir,Total,Persentase Hadir\n";
        
        // Group by time slot for analysis
        const byTimeSlot = {};
        data.rawData.forEach(row => {
            const timeSlot = row.time_slot || (row.period ? `Jam ${row.period}` : 'N/A');
            if (!byTimeSlot[timeSlot]) {
                byTimeSlot[timeSlot] = { hadir: 0, tugas: 0, tidak: 0, total: 0 };
            }
            byTimeSlot[timeSlot].total++;
            if (row.status && row.status.toLowerCase() === 'hadir') byTimeSlot[timeSlot].hadir++;
            else if (row.status && row.status.toLowerCase() === 'tugas') byTimeSlot[timeSlot].tugas++;
            else byTimeSlot[timeSlot].tidak++;
        });
        
        Object.entries(byTimeSlot).forEach(([timeSlot, stats]) => {
            const percent = stats.total > 0 ? ((stats.hadir / stats.total) * 100).toFixed(1) : 0;
            csvContent += `"${timeSlot}",${stats.hadir},${stats.tugas},${stats.tidak},${stats.total},${percent}%\n`;
        });
        csvContent += "\n";
        
        // Sheet 5 equivalent: Raw Data
        csvContent += "DATA KEHADIRAN LENGKAP\n";
        csvContent += "=".repeat(50) + "\n";
        csvContent += "Tanggal,Kelas,Mata Pelajaran,Guru,Jam Pelajaran,Status\n";
        data.rawData.forEach(row => {
            const timeSlotInfo = row.time_slot || (row.period ? `Jam ${row.period}` : 'N/A');
            csvContent += `${formatIndonesianDate(row.report_date)},"${row.class_name}","${row.subject}","${row.teacher_name || 'N/A'}","${timeSlotInfo}",${(row.status || 'Tidak Hadir').toUpperCase()}\n`;
        });

        // Download CSV with UTF-8 BOM for proper Excel compatibility
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        const now = new Date();
        let filename = `Analitik_Kehadiran_${now.toISOString().slice(0, 10)}`;
        
        // Add filter info to filename
        if (specificDate) {
            const filterDate = new Date(specificDate).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
            }).replace(/\//g, '-');
            filename = `Analitik_Kehadiran_${filterDate}`;
        } else if (month && year) {
            const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            filename = `Analitik_Kehadiran_${monthNames[parseInt(month)]}_${year}`;
        } else if (year) {
            filename = `Analitik_Kehadiran_${year}`;
        }
        
        filename += '.csv';
        link.setAttribute('download', filename);
        
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert('✅ File CSV berhasil diunduh!\n\n📊 File berisi semua data analitik:\n• Ringkasan statistik\n• Data per guru\n• Data per kelas\n• Data per jam pelajaran\n• Data kehadiran lengkap\n\n💡 File dapat dibuka di Excel atau Google Sheets\n\n📝 Format: CSV (Excel Compatible)');
        
    } catch (err) {
        console.error('❌ Error downloading CSV:', err);
        alert('Error downloading data: ' + err.message);
    }
}

// 14. Populate analytics dropdowns on section show
function populateAnalyticsDropdowns() {
    const filterTeacher = document.getElementById('analyticsTeacher');
    const filterClass = document.getElementById('analyticsClass');

    Promise.all([
        filterTeacher ? fetch(`${API_BASE}/teachers`) : Promise.resolve(null),
        filterClass ? fetch(`${API_BASE}/classes`) : Promise.resolve(null)
    ]).then(([teacherRes, classRes]) => {
        if (teacherRes && teacherRes.ok) {
            return Promise.all([
                teacherRes.json(),
                classRes?.json() || Promise.resolve([])
            ]);
        }
        return [[], []];
    }).then(([teachers, classes]) => {
        if (filterTeacher) {
            const current = filterTeacher.value;
            filterTeacher.innerHTML = '<option value="">Semua Guru</option>';
            teachers.forEach(t => {
                const option = document.createElement('option');
                option.value = t.teacher_name;
                option.textContent = t.teacher_name;
                filterTeacher.appendChild(option);
            });
            filterTeacher.value = current;
        }

        if (filterClass) {
            const current = filterClass.value;
            filterClass.innerHTML = '<option value="">Semua Kelas</option>';
            classes.forEach(c => {
                const option = document.createElement('option');
                option.value = c.class_name;
                option.textContent = c.class_name;
                filterClass.appendChild(option);
            });
            filterClass.value = current;
        }
    }).catch(err => console.error('Error loading analytics dropdowns:', err));
}

// 16. Logout
function logout() {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('username');
    window.location.href = 'index.html';
}

// 17. Toggle Sidebar Mobile
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

// 18. Export Reports (placeholder)
function exportReports() {
    alert('Fitur export akan segera hadir!');
}

// 15. Attendance Status Functions
let allClasses = [];
let attendanceStatusData = [];

// Load attendance status for a specific date
async function loadAttendanceStatus() {
    try {
        const selectedDate = document.getElementById('statusDate').value || (() => {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        })();
        
        console.log('📊 Loading attendance status for date:', selectedDate);
        
        // Load all classes
        const classesResponse = await fetch(`${API_BASE}/classes`);
        if (!classesResponse.ok) throw new Error('Failed to fetch classes');
        allClasses = await classesResponse.json();
        console.log('📋 Loaded classes:', allClasses.length);
        
        // Load attendance reports - use the grouped reports from all-reports endpoint
        const cacheBuster = Date.now();
        const reportsResponse = await fetch(`${API_BASE}/all-reports?_cb=${cacheBuster}`);
        if (!reportsResponse.ok) throw new Error('Failed to fetch reports');
        const allGroupedReports = await reportsResponse.json();
        console.log('📝 Total grouped reports in database:', allGroupedReports.length);
        
        // Debug: Show sample report dates
        if (allGroupedReports.length > 0) {
            console.log('📅 Sample report dates from API:');
            allGroupedReports.slice(0, 5).forEach((r, i) => {
                console.log(`${i + 1}. Class: ${r.className}, Date: ${r.date}, Type: ${typeof r.date}`);
                if (r.date instanceof Date) {
                    console.log(`   Date string: ${r.date.toString()}`);
                    console.log(`   ISO: ${r.date.toISOString()}`);
                } else if (typeof r.date === 'string') {
                    console.log(`   String value: "${r.date}"`);
                }
            });
        }
        
        // Debug: Show sample report dates
        if (allGroupedReports.length > 0) {
            console.log('📅 Sample report dates:', allGroupedReports.slice(0, 3).map(r => ({
                class: r.className,
                date: r.date,
                dateType: typeof r.date
            })));
        }
        
        // Filter reports for the selected date
        console.log('🔍 Starting date filtering...');
        console.log('🔍 Total grouped reports to filter:', allGroupedReports.length);
        console.log('🔍 Looking for date:', selectedDate);
        
        const dateReports = allGroupedReports.filter((report, index) => {
            if (!report.date) {
                console.log(`❌ Report ${index}: No date`);
                return false;
            }
            
            // Handle different date formats with timezone-aware comparison
            let reportDate;
            if (typeof report.date === 'string') {
                // If it's a string, it's likely an ISO string from JSON serialization
                // Parse it back to a Date object first, then extract local date
                const dateObj = new Date(report.date);
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                reportDate = `${year}-${month}-${day}`;
                console.log(`📅 Report ${index} (${report.className}): String date "${report.date}" -> Date object ${dateObj.toString()} -> ${reportDate}`);
            } else if (report.date instanceof Date) {
                // FIXED: Use local date string instead of UTC to avoid timezone conversion issues
                const year = report.date.getFullYear();
                const month = String(report.date.getMonth() + 1).padStart(2, '0');
                const day = String(report.date.getDate()).padStart(2, '0');
                reportDate = `${year}-${month}-${day}`;
                console.log(`📅 Report ${index} (${report.className}): Date object ${report.date.toString()} -> ${reportDate}`);
            } else {
                console.log(`❌ Report ${index}: Unknown date type ${typeof report.date}`);
                return false;
            }
            
            const matches = reportDate === selectedDate;
            if (matches) {
                console.log(`✅ MATCH: ${report.className} -> ${reportDate}`);
            }
            
            return matches;
        });
        
        console.log('📊 Reports for selected date:', dateReports.length);
        console.log('🎯 Selected date:', selectedDate);
        
        // Create a map of classes that have reported
        const reportedClasses = new Set();
        const reportsByClass = {};
        
        dateReports.forEach(report => {
            reportedClasses.add(report.className);
            reportsByClass[report.className] = report;
        });
        
        console.log('📊 Classes with reports:', Array.from(reportedClasses));
        
        // Create attendance status data
        attendanceStatusData = allClasses.map(cls => {
            const hasReported = reportedClasses.has(cls.class_name);
            const classReport = reportsByClass[cls.class_name];
            const lastReportTime = hasReported && classReport ? new Date(classReport.createdAt) : null;
            const subjectCount = hasReported && classReport ? classReport.subjects.length : 0;
            
            console.log(`📋 Class ${cls.class_name}: ${hasReported ? 'REPORTED' : 'PENDING'} (${subjectCount} subjects)`);
            
            return {
                className: cls.class_name,
                status: hasReported ? 'reported' : 'pending',
                lastReportTime: lastReportTime,
                subjectCount: subjectCount,
                reports: hasReported ? [classReport] : []
            };
        });
        
        updateAttendanceStatusSummary();
        renderAttendanceStatusTable();
        
    } catch (error) {
        console.error('❌ Error loading attendance status:', error);
        // Use alert as fallback if showError doesn't exist
        if (typeof showError === 'function') {
            showError('Gagal memuat status kehadiran: ' + error.message);
        } else {
            alert('Gagal memuat status kehadiran: ' + error.message);
        }
    }
}

// Update summary cards
function updateAttendanceStatusSummary() {
    const reportedCount = attendanceStatusData.filter(item => item.status === 'reported').length;
    const pendingCount = attendanceStatusData.filter(item => item.status === 'pending').length;
    const totalCount = attendanceStatusData.length;
    
    document.getElementById('reportedCount').textContent = reportedCount;
    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('totalClasses').textContent = totalCount;
}

// Render attendance status table
function renderAttendanceStatusTable() {
    const tbody = document.getElementById('attendanceStatusTableBody');
    const filter = document.getElementById('statusFilter').value;
    
    let filteredData = attendanceStatusData;
    if (filter !== 'all') {
        filteredData = attendanceStatusData.filter(item => item.status === filter);
    }
    
    if (filteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="loading">
                    <i class="fas fa-info-circle"></i> Tidak ada data untuk ditampilkan
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredData.map(item => {
        const statusBadge = item.status === 'reported' ? 
            '<span class="status-badge reported"><i class="fas fa-check-circle"></i> Sudah Lapor</span>' :
            '<span class="status-badge pending"><i class="fas fa-clock"></i> Belum Lapor</span>';
        
        const lastReportTime = item.lastReportTime ? 
            formatIndonesianDate(item.lastReportTime) + ' ' + item.lastReportTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
        
        const actions = item.status === 'reported' ? 
            `<button class="action-btn view-btn" onclick="viewClassReports('${item.className}')">
                <i class="fas fa-eye"></i> Lihat
            </button>` :
            `<button class="action-btn remind-btn" onclick="remindClass('${item.className}')">
                <i class="fas fa-bell"></i> Ingatkan
            </button>`;
        
        return `
            <tr>
                <td><strong>${item.className}</strong></td>
                <td>${statusBadge}</td>
                <td>${lastReportTime}</td>
                <td>${item.subjectCount} mata pelajaran</td>
                <td>${actions}</td>
            </tr>
        `;
    }).join('');
}

// Filter attendance status table
function filterAttendanceStatus() {
    renderAttendanceStatusTable();
}

// View class reports (redirect to reports section with filter)
function viewClassReports(className) {
    // Set the class filter in reports section
    document.getElementById('filterClass').value = className;
    
    // Switch to reports section
    showSection('reports');
    
    // Load reports with the class filter
    loadReports();
}

// Remind class (placeholder function - could send notification/email)
function remindClass(className) {
    const selectedDate = document.getElementById('statusDate').value || (() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    })();
    const formattedDate = new Date(selectedDate).toLocaleDateString('id-ID');
    
    if (confirm(`Kirim pengingat ke perwakilan kelas ${className} untuk melaporkan kehadiran tanggal ${formattedDate}?`)) {
        // Here you could implement actual notification sending
        // For now, just show a success message
        alert(`Pengingat telah dikirim ke perwakilan kelas ${className}`);
        
        // You could add API call here to send actual notification
        // await fetch(`${API_BASE}/send-reminder`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ className, date: selectedDate })
        // });
    }
}

// Initialize attendance status when section is shown
function initializeAttendanceStatus() {
    // Set today's date as default
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;
    document.getElementById('statusDate').value = todayString;
    
    // Load initial data
    loadAttendanceStatus();
}