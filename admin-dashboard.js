// Admin Dashboard JavaScript - PostgreSQL Version with Teacher Filter

// Global variables
let currentSection = 'overview';
let currentReportsData = [];
const API_BASE = window.location.origin + '/api';

// Indonesian date formatting utility
function formatIndonesianDate(dateString) {
    if (!dateString) return 'Tanggal tidak valid';
    
    try {
        let year, month, day;
        
        if (typeof dateString === 'string') {
            // Remove time part if present (e.g., "2024-01-26T00:00:00.000Z" -> "2024-01-26")
            const dateOnly = dateString.split('T')[0];
            
            // Parse date components directly to avoid timezone issues
            const parts = dateOnly.split('-');
            if (parts.length === 3) {
                year = parseInt(parts[0]);
                month = parseInt(parts[1]) - 1; // Month is 0-indexed in Date constructor
                day = parseInt(parts[2]);
            } else {
                return 'Format tanggal tidak valid';
            }
        } else if (dateString instanceof Date) {
            year = dateString.getFullYear();
            month = dateString.getMonth();
            day = dateString.getDate();
        } else {
            return 'Format tanggal tidak valid';
        }
        
        // Create date using local timezone components
        const date = new Date(year, month, day);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Tanggal tidak valid';
        }
        
        // Format to Indonesian date using local timezone
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
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
    } else if (sectionId === 'schedules') {
        initializeSchedulesSection();
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
    const scheduleFilterClass = document.getElementById('scheduleFilterClass');

    try {
        console.log('📚 Loading classes...');
        const response = await fetch(`${API_BASE}/classes`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const classes = await response.json();
        
        console.log('✅ Classes loaded:', classes.length);
        
        // Populate reports filter dropdown
        if (filterClass) {
            const currentSelection = filterClass.value;
            filterClass.innerHTML = '<option value="">Semua Kelas</option>';
            classes.forEach(cls => {
                const option = document.createElement('option');
                option.value = cls.class_name;
                option.textContent = cls.class_name;
                filterClass.appendChild(option);
            });
            filterClass.value = currentSelection;
        }
        
        // Populate schedules filter dropdown
        if (scheduleFilterClass) {
            const currentSelection = scheduleFilterClass.value;
            scheduleFilterClass.innerHTML = '<option value="">Pilih Kelas</option>';
            classes.forEach(cls => {
                const option = document.createElement('option');
                option.value = cls.class_name;
                option.textContent = cls.class_name;
                scheduleFilterClass.appendChild(option);
            });
            scheduleFilterClass.value = currentSelection;
        }
        
    } catch (err) {
        console.error('❌ Error loading classes:', err);
        if (filterClass) filterClass.innerHTML = '<option value="">Semua Kelas</option>';
        if (scheduleFilterClass) scheduleFilterClass.innerHTML = '<option value="">Pilih Kelas</option>';
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

        // Display reports with grouped time slots
        container.innerHTML = filtered.map(report => `
            <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 8px; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">
                    <strong>${report.className} - ${formatIndonesianDate(report.date)}</strong>
                    <small style="color:#666;">Pengirim: ${report.submittedBy}</small>
                </div>
                <div class="subjects-grid">
                    ${report.subjects && report.subjects.length > 0 ? (() => {
                        // Group subjects by name and teacher for display
                        const groupedSubjects = {};
                        report.subjects.forEach(s => {
                            const key = `${s.name}-${s.teacher}`;
                            if (!groupedSubjects[key]) {
                                groupedSubjects[key] = {
                                    name: s.name,
                                    teacher: s.teacher,
                                    attendance: s.attendance,
                                    periods: [],
                                    timeSlots: []
                                };
                            }
                            
                            if (s.period) {
                                groupedSubjects[key].periods.push(s.period);
                            }
                            if (s.timeSlot) {
                                groupedSubjects[key].timeSlots.push(s.timeSlot);
                            }
                        });
                        
                        return Object.values(groupedSubjects).map(s => {
                            // Create grouped time slot display
                            let timeSlotDisplay = '';
                            if (s.periods.length > 0) {
                                const sortedPeriods = [...new Set(s.periods)].sort((a, b) => a - b);
                                if (sortedPeriods.length > 1) {
                                    // Check if periods are consecutive
                                    let isConsecutive = true;
                                    for (let i = 1; i < sortedPeriods.length; i++) {
                                        if (sortedPeriods[i] !== sortedPeriods[i-1] + 1) {
                                            isConsecutive = false;
                                            break;
                                        }
                                    }
                                    
                                    if (isConsecutive) {
                                        timeSlotDisplay = `<div style="font-size: 0.75em; color: #64748b;">Jam ${sortedPeriods[0]}-${sortedPeriods[sortedPeriods.length - 1]} <span style="color: #059669;">(${sortedPeriods.length} jam)</span></div>`;
                                    } else {
                                        timeSlotDisplay = `<div style="font-size: 0.75em; color: #64748b;">Jam ${sortedPeriods.join(', ')}</div>`;
                                    }
                                } else {
                                    timeSlotDisplay = `<div style="font-size: 0.75em; color: #64748b;">Jam ${sortedPeriods[0]}</div>`;
                                }
                            } else if (s.timeSlots.length > 0) {
                                const uniqueTimeSlots = [...new Set(s.timeSlots)];
                                timeSlotDisplay = `<div style="font-size: 0.75em; color: #64748b;">${uniqueTimeSlots.join(', ')}</div>`;
                            }
                            
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
                        `}).join('');
                    })() : '<div style="color: #999;">Tidak ada data mata pelajaran</div>'}
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
        const timeSlotData = [['KEHADIRAN PER WAKTU'], []];
        timeSlotData.push(['Waktu', 'Hadir', 'Tugas', 'Tidak Hadir', 'Total', 'Persentase Hadir']);
        
        // Group by time slot for analysis
        const byTimeSlot = {};
        data.rawData.forEach(row => {
            let timeSlot = 'N/A';
            
            // Use actual start_time and end_time if available
            if (row.start_time && row.end_time) {
                timeSlot = `${row.start_time}-${row.end_time}`;
            } else if (row.period) {
                // Fallback to period-based time calculation
                const CLASS_PERIODS = [
                    { period: 1, start: '06:30', end: '07:15' },
                    { period: 2, start: '07:15', end: '08:00' },
                    { period: 3, start: '08:00', end: '08:45' },
                    { period: 4, start: '08:45', end: '09:30' },
                    { period: 5, start: '09:45', end: '10:30' },
                    { period: 6, start: '10:30', end: '11:15' },
                    { period: 7, start: '11:15', end: '12:00' },
                    { period: 8, start: '12:45', end: '13:30' },
                    { period: 9, start: '13:30', end: '14:15' },
                    { period: 10, start: '14:15', end: '15:00' }
                ];
                const periodInfo = CLASS_PERIODS.find(p => p.period === row.period);
                if (periodInfo) {
                    timeSlot = `${periodInfo.start}-${periodInfo.end}`;
                }
            } else if (row.time_slot) {
                timeSlot = row.time_slot;
            }
            
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
        XLSX.utils.book_append_sheet(workbook, timeSlotSheet, 'Waktu');

        // Sheet 5: Raw Data with Grouped Time Slots
        const rawData = [['DATA KEHADIRAN LENGKAP'], []];
        rawData.push(['Tanggal', 'Kelas', 'Mata Pelajaran', 'Guru', 'Waktu', 'Status']);
        
        // Group raw data by date, class, subject, teacher, and status for better display
        const groupedRawData = {};
        data.rawData.forEach(row => {
            // Use text date to avoid timezone issues
            const reportDate = row.report_date_text || (typeof row.report_date === 'string' ? row.report_date.split('T')[0] : row.report_date);
            const key = `${reportDate}-${row.class_name}-${row.subject}-${row.teacher_name || 'N/A'}-${row.status || 'Tidak Hadir'}`;
            if (!groupedRawData[key]) {
                groupedRawData[key] = {
                    report_date: reportDate,
                    class_name: row.class_name,
                    subject: row.subject,
                    teacher_name: row.teacher_name || 'N/A',
                    status: (row.status || 'Tidak Hadir').toUpperCase(),
                    periods: [],
                    time_slots: [],
                    start_times: [],
                    end_times: []
                };
            }
            
            // Collect periods and time slots
            if (row.period) {
                groupedRawData[key].periods.push(row.period);
            }
            if (row.time_slot) {
                groupedRawData[key].time_slots.push(row.time_slot);
            }
            // Collect actual start and end times from database
            if (row.start_time) {
                groupedRawData[key].start_times.push(row.start_time);
            }
            if (row.end_time) {
                groupedRawData[key].end_times.push(row.end_time);
            }
        });
        
        // Convert grouped data to Excel rows with proper time slot formatting
        Object.values(groupedRawData).forEach(group => {
            let timeSlotInfo = 'N/A';
            
            // Use actual start_time and end_time from the database if available
            if (group.start_times && group.start_times.length > 0 && group.end_times && group.end_times.length > 0) {
                // Get unique start and end times, then create range
                const uniqueStartTimes = [...new Set(group.start_times)].sort();
                const uniqueEndTimes = [...new Set(group.end_times)].sort();
                
                if (uniqueStartTimes.length === 1 && uniqueEndTimes.length === 1) {
                    // Single time slot
                    timeSlotInfo = `${uniqueStartTimes[0]}-${uniqueEndTimes[0]}`;
                } else if (uniqueStartTimes.length > 0 && uniqueEndTimes.length > 0) {
                    // Multiple time slots - show range from earliest start to latest end
                    timeSlotInfo = `${uniqueStartTimes[0]}-${uniqueEndTimes[uniqueEndTimes.length - 1]}`;
                }
            } else if (group.periods.length > 0) {
                // Fallback to period-based time calculation using CLASS_PERIODS
                const CLASS_PERIODS = [
                    { period: 1, start: '06:30', end: '07:15' },
                    { period: 2, start: '07:15', end: '08:00' },
                    { period: 3, start: '08:00', end: '08:45' },
                    { period: 4, start: '08:45', end: '09:30' },
                    { period: 5, start: '09:45', end: '10:30' },
                    { period: 6, start: '10:30', end: '11:15' },
                    { period: 7, start: '11:15', end: '12:00' },
                    { period: 8, start: '12:45', end: '13:30' },
                    { period: 9, start: '13:30', end: '14:15' },
                    { period: 10, start: '14:15', end: '15:00' }
                ];
                
                const sortedPeriods = [...new Set(group.periods)].sort((a, b) => a - b);
                const firstPeriod = CLASS_PERIODS.find(p => p.period === sortedPeriods[0]);
                const lastPeriod = CLASS_PERIODS.find(p => p.period === sortedPeriods[sortedPeriods.length - 1]);
                
                if (firstPeriod && lastPeriod) {
                    timeSlotInfo = `${firstPeriod.start}-${lastPeriod.end}`;
                }
            } else if (group.time_slots.length > 0) {
                // Fallback to time_slot if available
                const uniqueTimeSlots = [...new Set(group.time_slots)];
                timeSlotInfo = uniqueTimeSlots.join(', ');
            }
            
            rawData.push([
                group.report_date, // Already a properly formatted YYYY-MM-DD string
                group.class_name,
                group.subject,
                group.teacher_name,
                timeSlotInfo,
                group.status
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
        alert(`✅ File Excel berhasil diunduh: ${filename}\n\n📊 File berisi 5 sheet:\n• Ringkasan\n• Data per Guru\n• Data per Kelas\n• Data per Waktu\n• Data Lengkap`);

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
        csvContent += "KEHADIRAN PER WAKTU\n";
        csvContent += "=".repeat(50) + "\n";
        csvContent += "Waktu,Hadir,Tugas,Tidak Hadir,Total,Persentase Hadir\n";
        
        // Group by time slot for analysis
        const byTimeSlot = {};
        data.rawData.forEach(row => {
            let timeSlot = 'N/A';
            
            // Use actual start_time and end_time if available
            if (row.start_time && row.end_time) {
                timeSlot = `${row.start_time}-${row.end_time}`;
            } else if (row.period) {
                // Fallback to period-based time calculation
                const CLASS_PERIODS = [
                    { period: 1, start: '06:30', end: '07:15' },
                    { period: 2, start: '07:15', end: '08:00' },
                    { period: 3, start: '08:00', end: '08:45' },
                    { period: 4, start: '08:45', end: '09:30' },
                    { period: 5, start: '09:45', end: '10:30' },
                    { period: 6, start: '10:30', end: '11:15' },
                    { period: 7, start: '11:15', end: '12:00' },
                    { period: 8, start: '12:45', end: '13:30' },
                    { period: 9, start: '13:30', end: '14:15' },
                    { period: 10, start: '14:15', end: '15:00' }
                ];
                const periodInfo = CLASS_PERIODS.find(p => p.period === row.period);
                if (periodInfo) {
                    timeSlot = `${periodInfo.start}-${periodInfo.end}`;
                }
            } else if (row.time_slot) {
                timeSlot = row.time_slot;
            }
            
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
        
        // Sheet 5 equivalent: Raw Data with Grouped Time Slots
        csvContent += "DATA KEHADIRAN LENGKAP\n";
        csvContent += "=".repeat(50) + "\n";
        csvContent += "Tanggal,Kelas,Mata Pelajaran,Guru,Waktu,Status\n";
        
        // Group raw data by date, class, subject, teacher, and status for better display
        const groupedRawData = {};
        data.rawData.forEach(row => {
            // Use text date to avoid timezone issues
            const reportDate = row.report_date_text || (typeof row.report_date === 'string' ? row.report_date.split('T')[0] : row.report_date);
            const key = `${reportDate}-${row.class_name}-${row.subject}-${row.teacher_name || 'N/A'}-${row.status || 'Tidak Hadir'}`;
            if (!groupedRawData[key]) {
                groupedRawData[key] = {
                    report_date: reportDate,
                    class_name: row.class_name,
                    subject: row.subject,
                    teacher_name: row.teacher_name || 'N/A',
                    status: (row.status || 'Tidak Hadir').toUpperCase(),
                    periods: [],
                    time_slots: [],
                    start_times: [],
                    end_times: []
                };
            }
            
            // Collect periods and time slots
            if (row.period) {
                groupedRawData[key].periods.push(row.period);
            }
            if (row.time_slot) {
                groupedRawData[key].time_slots.push(row.time_slot);
            }
            // Collect actual start and end times from database
            if (row.start_time) {
                groupedRawData[key].start_times.push(row.start_time);
            }
            if (row.end_time) {
                groupedRawData[key].end_times.push(row.end_time);
            }
        });
        
        // Convert grouped data to CSV rows with proper time slot formatting
        Object.values(groupedRawData).forEach(group => {
            let timeSlotInfo = 'N/A';
            
            // Use actual start_time and end_time from the database if available
            if (group.start_times && group.start_times.length > 0 && group.end_times && group.end_times.length > 0) {
                // Get unique start and end times, then create range
                const uniqueStartTimes = [...new Set(group.start_times)].sort();
                const uniqueEndTimes = [...new Set(group.end_times)].sort();
                
                if (uniqueStartTimes.length === 1 && uniqueEndTimes.length === 1) {
                    // Single time slot
                    timeSlotInfo = `${uniqueStartTimes[0]}-${uniqueEndTimes[0]}`;
                } else if (uniqueStartTimes.length > 0 && uniqueEndTimes.length > 0) {
                    // Multiple time slots - show range from earliest start to latest end
                    timeSlotInfo = `${uniqueStartTimes[0]}-${uniqueEndTimes[uniqueEndTimes.length - 1]}`;
                }
            } else if (group.periods.length > 0) {
                // Fallback to period-based time calculation using CLASS_PERIODS
                const CLASS_PERIODS = [
                    { period: 1, start: '06:30', end: '07:15' },
                    { period: 2, start: '07:15', end: '08:00' },
                    { period: 3, start: '08:00', end: '08:45' },
                    { period: 4, start: '08:45', end: '09:30' },
                    { period: 5, start: '09:45', end: '10:30' },
                    { period: 6, start: '10:30', end: '11:15' },
                    { period: 7, start: '11:15', end: '12:00' },
                    { period: 8, start: '12:45', end: '13:30' },
                    { period: 9, start: '13:30', end: '14:15' },
                    { period: 10, start: '14:15', end: '15:00' }
                ];
                
                const sortedPeriods = [...new Set(group.periods)].sort((a, b) => a - b);
                const firstPeriod = CLASS_PERIODS.find(p => p.period === sortedPeriods[0]);
                const lastPeriod = CLASS_PERIODS.find(p => p.period === sortedPeriods[sortedPeriods.length - 1]);
                
                if (firstPeriod && lastPeriod) {
                    timeSlotInfo = `${firstPeriod.start}-${lastPeriod.end}`;
                }
            } else if (group.time_slots.length > 0) {
                // Fallback to time_slot if available
                const uniqueTimeSlots = [...new Set(group.time_slots)];
                timeSlotInfo = uniqueTimeSlots.join(', ');
            }
            
            csvContent += `${group.report_date},"${group.class_name}","${group.subject}","${group.teacher_name}","${timeSlotInfo}",${group.status}\n`;
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
        
        alert('✅ File CSV berhasil diunduh!\n\n📊 File berisi semua data analitik:\n• Ringkasan statistik\n• Data per guru\n• Data per kelas\n• Data per waktu\n• Data kehadiran lengkap\n\n💡 File dapat dibuka di Excel atau Google Sheets\n\n📝 Format: CSV (Excel Compatible)');
        
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

// 19. Schedule Management Functions
let currentSelectedClass = '';
let currentScheduleData = [];

// Load class schedules
async function loadClassSchedules() {
    const selectedClass = document.getElementById('scheduleFilterClass').value;
    const selectedDay = document.getElementById('scheduleFilterDay').value;
    
    if (!selectedClass) {
        document.getElementById('scheduleOverview').style.display = 'block';
        document.getElementById('scheduleDetails').style.display = 'none';
        return;
    }
    
    try {
        console.log('📅 Loading schedules for class:', selectedClass);
        
        const response = await fetch(`${API_BASE}/class-schedules/${selectedClass}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const schedules = await response.json();
        console.log('✅ Schedules loaded:', schedules.length);
        
        // Filter by day if selected
        const filteredSchedules = selectedDay 
            ? schedules.filter(s => s.day === selectedDay)
            : schedules;
        
        currentSelectedClass = selectedClass;
        currentScheduleData = filteredSchedules;
        
        // Update UI
        document.getElementById('scheduleOverview').style.display = 'none';
        document.getElementById('scheduleDetails').style.display = 'block';
        document.getElementById('selectedClassName').textContent = `Jadwal Kelas ${selectedClass}`;
        
        // Render schedule views
        renderScheduleTable(filteredSchedules);
        renderWeeklySchedule(filteredSchedules);
        
        // Update summary
        updateScheduleSummary(schedules);
        
    } catch (error) {
        console.error('❌ Error loading schedules:', error);
        alert('Gagal memuat jadwal kelas: ' + error.message);
    }
}

// Render schedule table view
function renderScheduleTable(schedules) {
    const tbody = document.getElementById('scheduleTableBody');
    
    if (schedules.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: #64748b;">
                    <i class="fas fa-calendar-times"></i><br>
                    Belum ada jadwal untuk kelas ini
                </td>
            </tr>
        `;
        return;
    }
    
    // Group consecutive periods of the same subject-teacher combination
    const groupedSchedules = groupConsecutiveSchedules(schedules);
    
    // Sort schedules by day and start time
    const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    const sortedSchedules = groupedSchedules.sort((a, b) => {
        const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
        if (dayDiff !== 0) return dayDiff;
        return a.start_time.localeCompare(b.start_time);
    });
    
    tbody.innerHTML = sortedSchedules.map(schedule => {
        const periodDisplay = schedule.periods.length > 1 
            ? `Jam ${schedule.periods[0]}-${schedule.periods[schedule.periods.length - 1]}`
            : `Jam ${schedule.periods[0]}`;
            
        return `
            <tr>
                <td>
                    <span class="day-badge day-${schedule.day.toLowerCase()}">${schedule.day}</span>
                </td>
                <td>
                    <span class="period-badge">${periodDisplay}</span>
                </td>
                <td>
                    <strong>${schedule.subject}</strong>
                </td>
                <td>${schedule.teacher_name}</td>
                <td>
                    <span class="time-display">${schedule.start_time} - ${schedule.end_time}</span>
                </td>
                <td>
                    <button class="action-btn delete-btn" onclick="deleteScheduleGroup('${schedule.groupKey}')" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Group consecutive periods of the same subject-teacher combination
function groupConsecutiveSchedules(schedules) {
    const grouped = {};
    
    // First, group by day, subject, and teacher
    schedules.forEach(schedule => {
        const key = `${schedule.day}-${schedule.subject}-${schedule.teacher_name}`;
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(schedule);
    });
    
    // Then, merge consecutive periods and create time ranges
    const result = [];
    
    Object.entries(grouped).forEach(([key, scheduleGroup]) => {
        // Sort by period
        scheduleGroup.sort((a, b) => (a.period || 0) - (b.period || 0));
        
        // Group consecutive periods
        const consecutiveGroups = [];
        let currentGroup = [scheduleGroup[0]];
        
        for (let i = 1; i < scheduleGroup.length; i++) {
            const current = scheduleGroup[i];
            const previous = scheduleGroup[i - 1];
            
            // Check if periods are consecutive
            if (current.period === previous.period + 1) {
                currentGroup.push(current);
            } else {
                consecutiveGroups.push(currentGroup);
                currentGroup = [current];
            }
        }
        consecutiveGroups.push(currentGroup);
        
        // Create grouped schedule entries
        consecutiveGroups.forEach((group, groupIndex) => {
            const firstSchedule = group[0];
            const lastSchedule = group[group.length - 1];
            
            result.push({
                groupKey: `${key}-${groupIndex}`,
                day: firstSchedule.day,
                subject: firstSchedule.subject,
                teacher_name: firstSchedule.teacher_name,
                start_time: firstSchedule.start_time,
                end_time: lastSchedule.end_time,
                periods: group.map(s => s.period),
                scheduleIds: group.map(s => s.id)
            });
        });
    });
    
    return result;
}

// Render weekly schedule grid
function renderWeeklySchedule(schedules) {
    const container = document.getElementById('weeklyScheduleGrid');
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    const periods = Array.from({length: 10}, (_, i) => i + 1);
    
    // Group consecutive periods first
    const groupedSchedules = groupConsecutiveSchedules(schedules);
    
    // Create schedule map for quick lookup
    const scheduleMap = {};
    groupedSchedules.forEach(schedule => {
        schedule.periods.forEach(period => {
            const key = `${schedule.day}-${period}`;
            scheduleMap[key] = schedule;
        });
    });
    
    let html = '';
    
    // Header row
    html += '<div class="time-header">Jam</div>';
    days.forEach(day => {
        html += `<div class="day-header">${day}</div>`;
    });
    
    // Time slot rows
    periods.forEach(period => {
        html += `<div class="time-slot">Jam ${period}</div>`;
        
        days.forEach(day => {
            const key = `${day}-${period}`;
            const schedule = scheduleMap[key];
            
            if (schedule) {
                // Check if this is the first period of a multi-period subject
                const isFirstPeriod = schedule.periods[0] === period;
                const periodSpan = schedule.periods.length;
                
                if (isFirstPeriod && periodSpan > 1) {
                    // Multi-period subject - show full info with spanning
                    html += `<div class="schedule-cell has-class multi-period" style="grid-row: span ${periodSpan};">`;
                    html += `<div class="subject-name">${schedule.subject}</div>`;
                    html += `<div class="teacher-name">${schedule.teacher_name}</div>`;
                    html += `<div class="time-range">${schedule.start_time} - ${schedule.end_time}</div>`;
                    html += `</div>`;
                } else if (isFirstPeriod) {
                    // Single-period subject
                    html += `<div class="schedule-cell has-class">`;
                    html += `<div class="subject-name">${schedule.subject}</div>`;
                    html += `<div class="teacher-name">${schedule.teacher_name}</div>`;
                    html += `<div class="time-range">${schedule.start_time} - ${schedule.end_time}</div>`;
                    html += `</div>`;
                } else {
                    // This is a continuation of a multi-period subject, skip it
                    // (it's handled by the grid-row span above)
                    return;
                }
            } else {
                html += `<div class="schedule-cell"><div class="empty-slot">-</div></div>`;
            }
        });
    });
    
    container.innerHTML = html;
}

// Update schedule summary
function updateScheduleSummary(allSchedules) {
    const uniqueTeachers = new Set(allSchedules.map(s => s.teacher_name)).size;
    const totalPeriods = allSchedules.length;
    
    document.getElementById('totalScheduledPeriods').textContent = totalPeriods;
    document.getElementById('totalActiveTeachers').textContent = uniqueTeachers;
}

// Switch between table and weekly view
function switchScheduleTab(view) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update views
    document.querySelectorAll('.schedule-view').forEach(view => view.classList.remove('active'));
    
    if (view === 'table') {
        document.getElementById('scheduleTableView').classList.add('active');
    } else if (view === 'weekly') {
        document.getElementById('scheduleWeeklyView').classList.add('active');
    }
}

// Delete schedule group (handles both single and multi-period subjects)
async function deleteScheduleGroup(groupKey) {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;
    
    try {
        // Find the schedule group by groupKey
        const groupedSchedules = groupConsecutiveSchedules(currentScheduleData);
        const scheduleGroup = groupedSchedules.find(g => g.groupKey === groupKey);
        
        if (!scheduleGroup) {
            alert('Jadwal tidak ditemukan');
            return;
        }
        
        // Delete all schedule IDs in this group
        const deletePromises = scheduleGroup.scheduleIds.map(id => 
            fetch(`${API_BASE}/delete-schedule/${id}`, { method: 'DELETE' })
        );
        
        const results = await Promise.all(deletePromises);
        
        // Check if all deletions were successful
        const allSuccessful = results.every(res => res.ok);
        
        if (allSuccessful) {
            const periodText = scheduleGroup.periods.length > 1 
                ? `${scheduleGroup.periods.length} jam pelajaran` 
                : '1 jam pelajaran';
            alert(`Jadwal ${scheduleGroup.subject} (${periodText}) berhasil dihapus`);
            loadClassSchedules(); // Reload current view
        } else {
            alert('Beberapa jadwal gagal dihapus. Silakan coba lagi.');
        }
    } catch (error) {
        console.error('❌ Error deleting schedule group:', error);
        alert('Gagal menghapus jadwal: ' + error.message);
    }
}

// Keep the old function for backward compatibility
async function deleteScheduleItem(scheduleId) {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/delete-schedule/${scheduleId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        if (result.success) {
            alert('Jadwal berhasil dihapus');
            loadClassSchedules(); // Reload current view
        } else {
            alert('Gagal menghapus jadwal: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('❌ Error deleting schedule:', error);
        alert('Gagal menghapus jadwal: ' + error.message);
    }
}

// Edit class schedule (redirect to representative dashboard)
function editClassSchedule() {
    if (!currentSelectedClass) return;
    
    const message = `Untuk mengedit jadwal kelas ${currentSelectedClass}, silakan:
    
1. Login sebagai perwakilan kelas ${currentSelectedClass}
2. Gunakan menu "Atur Jadwal Kelas"
3. Atau hubungi perwakilan kelas untuk melakukan perubahan

Password perwakilan kelas: berhias`;
    
    alert(message);
}

// Delete entire class schedule
async function deleteClassSchedule() {
    if (!currentSelectedClass) return;
    
    const confirmMessage = `Apakah Anda yakin ingin menghapus SEMUA jadwal untuk kelas ${currentSelectedClass}?
    
Tindakan ini tidak dapat dibatalkan!`;
    
    if (!confirm(confirmMessage)) return;
    
    try {
        // Delete all schedules for this class
        const deletePromises = currentScheduleData.map(schedule => 
            fetch(`${API_BASE}/delete-schedule/${schedule.id}`, { method: 'DELETE' })
        );
        
        await Promise.all(deletePromises);
        
        alert(`Semua jadwal untuk kelas ${currentSelectedClass} berhasil dihapus`);
        
        // Reset view
        document.getElementById('scheduleFilterClass').value = '';
        document.getElementById('scheduleOverview').style.display = 'block';
        document.getElementById('scheduleDetails').style.display = 'none';
        
        // Reload summary
        loadSchedulesSummary();
        
    } catch (error) {
        console.error('❌ Error deleting class schedule:', error);
        alert('Gagal menghapus jadwal kelas: ' + error.message);
    }
}

// Export schedules
function exportSchedules() {
    if (!currentSelectedClass || currentScheduleData.length === 0) {
        alert('Pilih kelas terlebih dahulu untuk export jadwal');
        return;
    }
    
    // Group consecutive periods first
    const groupedSchedules = groupConsecutiveSchedules(currentScheduleData);
    
    // Create CSV content
    const headers = ['Hari', 'Jam Pelajaran', 'Mata Pelajaran', 'Guru', 'Waktu'];
    const csvContent = [
        headers.join(','),
        ...groupedSchedules.map(schedule => {
            const periodDisplay = schedule.periods.length > 1 
                ? `Jam ${schedule.periods[0]}-${schedule.periods[schedule.periods.length - 1]}`
                : `Jam ${schedule.periods[0]}`;
                
            return [
                schedule.day,
                `"${periodDisplay}"`,
                `"${schedule.subject}"`,
                `"${schedule.teacher_name}"`,
                `${schedule.start_time} - ${schedule.end_time}`
            ].join(',');
        })
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Jadwal_${currentSelectedClass}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert(`Jadwal kelas ${currentSelectedClass} berhasil diexport ke CSV`);
}

// Load schedules summary for all classes
async function loadSchedulesSummary() {
    try {
        const classesResponse = await fetch(`${API_BASE}/classes`);
        const classes = await classesResponse.json();
        
        let totalClassesWithSchedule = 0;
        let totalPeriods = 0;
        const allTeachers = new Set();
        
        // Check each class for schedules
        for (const cls of classes) {
            try {
                const scheduleResponse = await fetch(`${API_BASE}/class-schedules/${cls.class_name}`);
                if (scheduleResponse.ok) {
                    const schedules = await scheduleResponse.json();
                    if (schedules.length > 0) {
                        totalClassesWithSchedule++;
                        totalPeriods += schedules.length;
                        schedules.forEach(s => allTeachers.add(s.teacher_name));
                    }
                }
            } catch (error) {
                console.warn(`Could not load schedule for ${cls.class_name}:`, error);
            }
        }
        
        document.getElementById('totalScheduledClasses').textContent = totalClassesWithSchedule;
        document.getElementById('totalScheduledPeriods').textContent = totalPeriods;
        document.getElementById('totalActiveTeachers').textContent = allTeachers.size;
        
    } catch (error) {
        console.error('❌ Error loading schedules summary:', error);
    }
}

// Initialize schedules section
function initializeSchedulesSection() {
    // Populate class dropdown
    populateClassDropdown();
    
    // Load summary
    loadSchedulesSummary();
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