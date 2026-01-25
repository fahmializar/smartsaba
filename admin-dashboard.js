// Admin Dashboard JavaScript - PostgreSQL Version with Teacher Filter

// Global variables
let currentSection = 'overview';
let currentReportsData = [];
const API_BASE = window.location.origin + '/api';

// 1. Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Admin Dashboard Initializing...');
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
}

// 6. Navigate Menu
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const navItem = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (navItem) navItem.classList.add('active');
    
    currentSection = sectionId;
    if (sectionId === 'reports') loadReports();
    else refreshAllData();
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
                    <strong>${report.className} - ${new Date(report.date).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</strong>
                    <small style="color:#666;">Pengirim: ${report.submittedBy}</small>
                </div>
                <div class="subjects-grid">
                    ${report.subjects && report.subjects.length > 0 ? report.subjects.map(s => `
                        <div style="display: flex; justify-content: space-between; font-size: 0.9em; margin-bottom: 8px; padding: 8px; background: #f9fafb; border-radius: 4px;">
                            <div>
                                <div style="font-weight: 600; color: #1e293b;">${s.name}</div>
                                <div style="font-size: 0.8em; color: #64748b;">${s.teacher}</div>
                            </div>
                            <span style="font-weight: bold; color: ${
                                s.attendance && s.attendance.toLowerCase() === 'hadir' ? '#10b981' : 
                                (s.attendance && s.attendance.toLowerCase() === 'tugas' ? '#f59e0b' : '#ef4444')
                            }; align-self: center;">
                                ${(s.attendance || 'TIDAK').toUpperCase()}
                            </span>
                        </div>
                    `).join('') : '<div style="color: #999;">Tidak ada data mata pelajaran</div>'}
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
        const month = document.getElementById('analyticsMonth')?.value || '';
        const year = document.getElementById('analyticsYear')?.value || '';

        // Build query string
        const params = new URLSearchParams();
        if (teacher) params.append('teacher_name', teacher);
        if (cls) params.append('class_name', cls);
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

// 13. Download Analytics as Excel
async function downloadExcelAnalytics() {
    try {
        console.log('📥 Preparing Excel download...');

        // Get filter values
        const teacher = document.getElementById('analyticsTeacher')?.value || '';
        const cls = document.getElementById('analyticsClass')?.value || '';
        const month = document.getElementById('analyticsMonth')?.value || '';
        const year = document.getElementById('analyticsYear')?.value || '';

        // Build query string
        const params = new URLSearchParams();
        if (teacher) params.append('teacher_name', teacher);
        if (cls) params.append('class_name', cls);
        if (month) params.append('month', month);
        if (year) params.append('year', year);

        const response = await fetch(`${API_BASE}/analytics?${params.toString()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

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

        // Sheet 4: Raw Data
        const rawData = [['DATA KEHADIRAN LENGKAP'], []];
        rawData.push(['Tanggal', 'Kelas', 'Mata Pelajaran', 'Guru', 'Status']);
        data.rawData.forEach(row => {
            rawData.push([
                row.report_date,
                row.class_name,
                row.subject,
                row.teacher_name || 'N/A',
                (row.status || 'Tidak Hadir').toUpperCase()
            ]);
        });
        const rawDataSheet = XLSX.utils.aoa_to_sheet(rawData);
        rawDataSheet['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(workbook, rawDataSheet, 'Data Lengkap');

        // Generate filename with date
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const filename = `Analitik_Kehadiran_${dateStr}.xlsx`;

        // Download
        XLSX.writeFile(workbook, filename);
        console.log('✅ Excel file downloaded:', filename);

    } catch (err) {
        console.error('❌ Error downloading Excel:', err);
        alert('Error downloading Excel: ' + err.message);
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

// 15. Update showSection to handle analytics
const originalShowSection = showSection;
showSection = function(sectionId) {
    originalShowSection(sectionId);
    if (sectionId === 'analytics') {
        populateAnalyticsDropdowns();
        loadAnalytics();
    }
};

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