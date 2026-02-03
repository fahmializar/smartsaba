// --- VARIABEL GLOBAL DAN DATA ---
const API_BASE = window.location.origin + '/api';
let classSchedule = {}; 
let SCHOOL_SUBJECTS = [];
let SCHOOL_TEACHERS = [];
let TIME_SLOTS = [];

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

// Enhanced date formatting specifically for attendance history to avoid timezone issues
function formatAttendanceDate(dateString) {
    if (!dateString) return 'Tanggal tidak valid';
    
    try {
        // Handle different date formats more robustly
        let year, month, day;
        
        if (typeof dateString === 'string') {
            // Remove time part if present
            const dateOnly = dateString.split('T')[0];
            
            // Parse date components directly to avoid timezone conversion
            const parts = dateOnly.split('-');
            if (parts.length === 3) {
                year = parseInt(parts[0]);
                month = parseInt(parts[1]) - 1; // Month is 0-indexed in JavaScript
                day = parseInt(parts[2]);
            } else {
                throw new Error('Invalid date format');
            }
        } else if (dateString instanceof Date) {
            // Extract components from Date object using UTC methods
            year = dateString.getUTCFullYear();
            month = dateString.getUTCMonth();
            day = dateString.getUTCDate();
        } else {
            return 'Format tanggal tidak valid';
        }
        
        // Create date using local date components (no timezone conversion)
        const date = new Date(year, month, day);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Tanggal tidak valid';
        }
        
        // Format to Indonesian date using local time
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting attendance date:', error, 'Input:', dateString);
        return 'Error format tanggal';
    }
}

const CLASS_PERIODS = [
    { period: 1, time: '06:30-07:15', label: 'Jam 1 (06:30-07:15)' },
    { period: 2, time: '07:15-08:00', label: 'Jam 2 (07:15-08:00)' },
    { period: 3, time: '08:00-08:45', label: 'Jam 3 (08:00-08:45)' },
    { period: 4, time: '08:45-09:30', label: 'Jam 4 (08:45-09:30)' },
    { period: 5, time: '09:45-10:30', label: 'Jam 5 (09:45-10:30)' },
    { period: 6, time: '10:30-11:15', label: 'Jam 6 (10:30-11:15)' },
    { period: 7, time: '11:15-12:00', label: 'Jam 7 (11:15-12:00)' },
    { period: 8, time: '12:45-13:30', label: 'Jam 8 (12:45-13:30)' },
    { period: 9, time: '13:30-14:15', label: 'Jam 9 (13:30-14:15)' },
    { period: 10, time: '14:15-15:00', label: 'Jam 10 (14:15-15:00)' }
];

// --- FUNGSI INISIALISASI ---
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('userRole');
    if (isLoggedIn !== 'true' || userRole !== 'representative') {
        window.location.href = 'index.html';
    }
}

// Mobile menu toggle
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}

// Close mobile menu when clicking a navigation item
function closeMobileMenuOnNavClick() {
    const sidebar = document.querySelector('.sidebar');
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('active');
    }
}

// Setup mobile responsiveness
function setupMobileResponsiveness() {
    const mobileHeader = document.getElementById('mobileHeader');
    if (window.innerWidth <= 768) {
        if (mobileHeader) mobileHeader.style.display = 'flex';
    } else {
        if (mobileHeader) mobileHeader.style.display = 'none';
    }
}

// Update on resize
window.addEventListener('resize', setupMobileResponsiveness);

// Fetch dynamic data from database
async function loadDynamicData() {
    try {
        console.log('Loading dynamic data from API...');
        const [subjectsRes, teachersRes, timeSlotsRes] = await Promise.all([
            fetch(`${API_BASE}/subjects`),
            fetch(`${API_BASE}/teachers`),
            fetch(`${API_BASE}/time-slots`)
        ]);
        
        if (!subjectsRes.ok || !teachersRes.ok || !timeSlotsRes.ok) {
            throw new Error(`API error: Subjects ${subjectsRes.status}, Teachers ${teachersRes.status}, Time Slots ${timeSlotsRes.status}`);
        }
        
        const subjectsData = await subjectsRes.json();
        const teachersData = await teachersRes.json();
        const timeSlotsData = await timeSlotsRes.json();
        
        // Ensure data is in array format
        SCHOOL_SUBJECTS = Array.isArray(subjectsData) ? subjectsData : [];
        SCHOOL_TEACHERS = Array.isArray(teachersData) 
            ? teachersData.map(t => t.teacher_name || t.name || t) 
            : [];
        TIME_SLOTS = Array.isArray(timeSlotsData) ? timeSlotsData : [];
        
        console.log('Subjects loaded:', SCHOOL_SUBJECTS);
        console.log('Teachers loaded:', SCHOOL_TEACHERS);
        console.log('Time slots loaded:', TIME_SLOTS);
        
        if (SCHOOL_SUBJECTS.length === 0 || SCHOOL_TEACHERS.length === 0) {
            console.warn('Warning: No subjects or teachers loaded');
        }
    } catch (err) {
        console.error('Error loading dynamic data:', err);
        // Set empty arrays as fallback
        SCHOOL_SUBJECTS = [];
        SCHOOL_TEACHERS = [];
        TIME_SLOTS = [];
    }
}

async function initializeDashboard() {
    checkAuth();
    setupMobileResponsiveness();
    await loadDynamicData();
    const className = localStorage.getItem('username'); 
    const classDisplay = document.getElementById('className');
    if (classDisplay) classDisplay.textContent = className;
    await loadClassSchedule();
    await loadAttendanceHistory(); 
}

// Group consecutive periods of the same subject-teacher combination
function groupConsecutiveSchedules(schedules) {
    const grouped = {};
    
    // First, group by day, subject, and teacher
    schedules.forEach(schedule => {
        const key = `${schedule.subjectName}-${schedule.teacherName}`;
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
                id: firstSchedule.id,
                subjectName: firstSchedule.subjectName,
                teacherName: firstSchedule.teacherName,
                startTime: firstSchedule.startTime,
                endTime: lastSchedule.endTime,
                periods: group.map(s => s.period),
                scheduleIds: group.map(s => s.id),
                isGrouped: group.length > 1
            });
        });
    });
    
    return result;
}

async function loadClassSchedule() {
    const className = localStorage.getItem('username');
    try {
        const response = await fetch(`${API_BASE}/class-schedules/${encodeURIComponent(className)}`);
        const schedules = await response.json();
        
        classSchedule = {}; 
        if (Array.isArray(schedules)) {
            schedules.forEach(s => {
                if (!classSchedule[s.day]) classSchedule[s.day] = [];
                classSchedule[s.day].push({
                    id: s.id,
                    subjectName: s.subject,
                    teacherName: s.teacher_name,
                    startTime: s.start_time,
                    endTime: s.end_time,
                    period: s.period
                });
            });
        }
        updateOverviewSchedule(); 
        updateWeeklyScheduleDisplay();
        const reportDateInput = document.getElementById('reportDate');
        if (reportDateInput) loadTodaySchedule(reportDateInput.value);
    } catch (error) {
        console.error('Error loading schedule:', error);
    }
}

// --- TAMPILAN OVERVIEW ---
function updateOverviewSchedule() {
    const overviewContainer = document.getElementById('allScheduleList');
    if (!overviewContainer) return;
    const daysToDisplay = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    let html = '';
    daysToDisplay.forEach(day => {
        const dayData = classSchedule[day] || [];
        
        // Group consecutive schedules for this day
        const groupedSchedules = groupConsecutiveSchedules(dayData);
        
        html += `<div style="font-size: 0.85em; color: var(--primary); margin: 20px 0 10px 0; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-left: 4px solid var(--secondary); padding-left: 10px; background: #f8fafc;">${day}</div>`;
        if (groupedSchedules.length === 0) {
            html += `<p style="font-size: 0.8em; color: #94a3b8; padding-left: 15px; margin-bottom: 10px;">Belum ada jadwal.</p>`;
        } else {
            groupedSchedules.sort((a, b) => a.startTime.localeCompare(b.startTime));
            groupedSchedules.forEach(s => {
                const periodDisplay = s.isGrouped 
                    ? `Jam ${s.periods[0]}-${s.periods[s.periods.length - 1]}`
                    : `Jam ${s.periods[0]}`;
                    
                const timeStyle = s.isGrouped 
                    ? "background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0;"
                    : "background: #f0f7ff; color: #3498db; border: 1px solid #cce3f5;";
                    
                html += `<div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; padding: 12px 15px; margin-bottom: 8px; border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                        <div>
                            <span style="font-weight: 700; color: #1e293b; font-size: 0.9em; display:block;">${s.subjectName}</span>
                            <span style="font-size: 0.75em; color: #64748b;">${s.teacherName}</span>
                            ${s.isGrouped ? `<div style="font-size: 0.7em; color: #059669; margin-top: 2px;">${periodDisplay}</div>` : ''}
                        </div>
                        <div style="${timeStyle} padding: 4px 10px; border-radius: 6px; font-size: 0.8em; font-weight: 700;">${s.startTime} - ${s.endTime}</div>
                    </div>`;
            });
        }
    });
    overviewContainer.innerHTML = html;
}

// --- FUNGSI LAPOR KEHADIRAN ---
async function loadTodaySchedule(dateString) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = days[new Date(dateString).getDay()];
    const container = document.getElementById('todaySubjectsGrid');
    const todaySubjects = classSchedule[dayName] || [];
    if (!container) return;
    
    // Show loading state
    container.innerHTML = '<p style="text-align:center; padding:20px; color:#3498db;"><i class="fas fa-spinner fa-spin"></i> Memuat jadwal...</p>';
    
    if (todaySubjects.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px; color:#94a3b8;">Tidak ada jadwal presensi hari ini. Silakan atur jadwal terlebih dahulu di menu "Atur Jadwal".</p>';
        return;
    }

    // Check for existing reports for this date
    const className = localStorage.getItem('username') || 'Unknown';
    let existingReports = [];
    
    try {
        const response = await fetch(`${API_BASE}/check-existing-report?class_name=${encodeURIComponent(className)}&date=${dateString}`);
        if (response.ok) {
            const result = await response.json();
            if (result.exists) {
                existingReports = result.subjects;
                console.log('📋 Found existing reports:', existingReports);
            }
        }
    } catch (error) {
        console.error('Error checking existing reports:', error);
    }

    // Show warning if reports already exist
    let warningHtml = '';
    if (existingReports.length > 0) {
        const existingSubjects = existingReports.map(r => r.subject).join(', ');
        warningHtml = `
            <div style="background: #fef3cd; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <i class="fas fa-exclamation-triangle" style="color: #f59e0b; font-size: 1.2em;"></i>
                    <strong style="color: #92400e;">Laporan Sudah Ada</strong>
                </div>
                <p style="color: #92400e; margin: 0; font-size: 0.9em;">
                    Anda sudah melaporkan kehadiran untuk tanggal ${formatIndonesianDate(dateString)}:<br>
                    <strong>${existingSubjects}</strong>
                </p>
                <p style="color: #92400e; margin: 10px 0 0 0; font-size: 0.85em; font-style: italic;">
                    Jika Anda mengirim laporan baru, laporan lama akan diganti.
                </p>
            </div>
        `;
    }

    container.innerHTML = warningHtml;
    
    // Apply grouping logic to today's subjects for attendance reporting
    const groupedSubjects = groupConsecutiveSchedules(todaySubjects);
    
    // Sort grouped subjects by start time to show in chronological order
    const sortedSubjects = [...groupedSubjects].sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    // Render subject cards with grouped time slot information
    sortedSubjects.forEach((s, idx) => {
        // Check if this subject already has a report
        const existingReport = existingReports.find(r => r.subject === s.subjectName);
        const hasExistingReport = !!existingReport;
        
        const card = document.createElement('div');
        card.dataset.subject = s.subjectName;
        card.dataset.teacher = s.teacherName;
        card.dataset.start = s.startTime;
        card.dataset.end = s.endTime;
        
        // Create grouped time slot information
        const periodDisplay = s.isGrouped 
            ? `Jam ${s.periods[0]}-${s.periods[s.periods.length - 1]}`
            : `Jam ${s.periods[0]}`;
        card.dataset.timeSlot = periodDisplay;
        card.dataset.period = s.periods.join(','); // Store all periods for submission
        card.dataset.scheduleIds = s.scheduleIds.join(','); // Store all schedule IDs

        // Add visual indicator for existing reports
        let statusIndicator = '';
        let cardStyle = "display: flex; align-items: center; justify-content: space-between; background: #fff; padding: 15px; border-radius: 12px; margin-bottom: 12px; border: 1px solid #e2e8f0;";
        
        if (hasExistingReport) {
            const statusColor = existingReport.status === 'hadir' ? '#10b981' : 
                               existingReport.status === 'tugas' ? '#f59e0b' : '#ef4444';
            statusIndicator = `<div style="background: ${statusColor}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7em; font-weight: bold; margin-left: 8px;">✓ ${existingReport.status.toUpperCase()}</div>`;
            cardStyle = `display: flex; align-items: center; justify-content: space-between; background: #f8fafc; padding: 15px; border-radius: 12px; margin-bottom: 12px; border: 2px solid ${statusColor};`;
        }

        // Apply visual styling for grouped subjects
        if (s.isGrouped) {
            cardStyle = cardStyle.replace('background: #fff', 'background: #f0fdf4').replace('border: 1px solid #e2e8f0', 'border: 1px solid #bbf7d0');
        }

        card.style.cssText = cardStyle;
        card.innerHTML = `
            <div>
                <h4 style="margin: 0; color: #1e293b; font-size: 0.95em; display: flex; align-items: center;">
                    ${s.subjectName}${statusIndicator}
                </h4>
                <p style="margin: 2px 0 0 0; font-size: 0.75em; color: #64748b;">${s.teacherName}</p>
                <p style="margin: 2px 0 0 0; font-size: 0.7em; color: ${s.isGrouped ? '#16a34a' : '#3498db'}; font-weight: 600;">
                    <i class="fas fa-clock"></i> ${periodDisplay}, ${s.startTime} - ${s.endTime}
                </p>
                ${s.isGrouped ? `<p style="margin: 2px 0 0 0; font-size: 0.65em; color: #059669; font-weight: 500;">Multi-periode (${s.periods.length} jam pelajaran)</p>` : ''}
            </div>
            <div style="display: flex; gap: 8px;">
                <label style="cursor: pointer;">
                    <input type="radio" name="status_${idx}" value="Hadir" required style="display:none;" onchange="updateButtonStyle(this)">
                    <span class="btn-att" style="display:inline-block; padding: 6px 12px; border-radius: 6px; border: 1.5px solid #10b981; color: #10b981; font-weight: 700; font-size: 0.8em;">Hadir</span>
                </label>
                <label style="cursor: pointer;">
                    <input type="radio" name="status_${idx}" value="Tugas" style="display:none;" onchange="updateButtonStyle(this)">
                    <span class="btn-att" style="display:inline-block; padding: 6px 12px; border-radius: 6px; border: 1.5px solid #f59e0b; color: #f59e0b; font-weight: 700; font-size: 0.8em;">Tugas</span>
                </label>
                <label style="cursor: pointer;">
                    <input type="radio" name="status_${idx}" value="Kosong" style="display:none;" onchange="updateButtonStyle(this)">
                    <span class="btn-att" style="display:inline-block; padding: 6px 12px; border-radius: 6px; border: 1.5px solid #ef4444; color: #ef4444; font-weight: 700; font-size: 0.8em;">Kosong</span>
                </label>
            </div>`;
        container.appendChild(card);
    });
}

window.updateButtonStyle = function(input) {
    const parent = input.closest('div');
    parent.querySelectorAll('.btn-att').forEach(span => {
        span.style.background = 'transparent';
        span.style.color = span.style.borderColor;
    });
    const selectedSpan = input.nextElementSibling;
    selectedSpan.style.background = selectedSpan.style.borderColor;
    selectedSpan.style.color = "#fff";
};

// --- PENGIRIMAN DAN RIWAYAT ---
async function submitAttendanceReport() {
    const dateInput = document.getElementById('reportDate');
    if (!dateInput) return;
    
    // Get the date value and ensure it's properly formatted
    const rawDate = dateInput.value;
    if (!rawDate) {
        alert("Mohon pilih tanggal laporan!");
        return;
    }
    
    // Ensure date is in YYYY-MM-DD format and doesn't get timezone-shifted
    const dateParts = rawDate.split('-');
    if (dateParts.length !== 3) {
        alert("Format tanggal tidak valid!");
        return;
    }
    
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]);
    const day = parseInt(dateParts[2]);
    
    // Validate date components
    if (isNaN(year) || isNaN(month) || isNaN(day) || 
        month < 1 || month > 12 || day < 1 || day > 31) {
        alert("Tanggal tidak valid!");
        return;
    }
    
    // Format date as YYYY-MM-DD string (no timezone conversion)
    const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    console.log(`📅 Submitting attendance for date: ${date} (from input: ${rawDate})`);
    
    const className = localStorage.getItem('username') || 'Unknown';
    const cards = document.querySelectorAll('#todaySubjectsGrid > div');
    const attendance = [];
    let allSelected = true;

    cards.forEach((card, idx) => {
        const radio = card.querySelector(`input[name="status_${idx}"]:checked`);
        if (!radio) { allSelected = false; return; }
        
        // Get time slot information from the grouped schedule data stored in the card
        const timeSlotInfo = card.dataset.timeSlot || `${card.dataset.start}-${card.dataset.end}`;
        const periods = card.dataset.period ? card.dataset.period.split(',').map(p => parseInt(p)) : [];
        const scheduleIds = card.dataset.scheduleIds ? card.dataset.scheduleIds.split(',').map(id => parseInt(id)) : [];
        
        // For grouped subjects, create individual attendance records for each period
        // but maintain the grouped time slot label for display consistency
        if (periods.length > 1) {
            // Multi-period subject - create records for each period but with grouped info
            periods.forEach((period, periodIdx) => {
                // Calculate individual period times if needed
                const periodStartTime = card.dataset.start;
                const periodEndTime = card.dataset.end;
                
                attendance.push({ 
                    name: card.dataset.subject, 
                    teacher: card.dataset.teacher,
                    startTime: periodStartTime,
                    endTime: periodEndTime,
                    attendance: radio.value.toLowerCase(),
                    timeSlot: timeSlotInfo, // Keep grouped display format
                    period: period,
                    scheduleId: scheduleIds[periodIdx] || scheduleIds[0], // Map to correct schedule ID
                    isGrouped: true,
                    groupInfo: `${periods.length} jam pelajaran`
                });
            });
        } else {
            // Single period subject
            const period = periods[0] || null;
            attendance.push({ 
                name: card.dataset.subject, 
                teacher: card.dataset.teacher,
                startTime: card.dataset.start,
                endTime: card.dataset.end,
                attendance: radio.value.toLowerCase(),
                timeSlot: timeSlotInfo,
                period: period,
                scheduleId: scheduleIds[0],
                isGrouped: false
            });
        }
    });

    if (!allSelected || attendance.length === 0) return alert("Mohon pilih status untuk semua mata pelajaran!");

    try {
        // Check for existing reports for this date and class
        console.log('🔍 Checking for existing reports...');
        const checkResponse = await fetch(`${API_BASE}/check-existing-report?class_name=${encodeURIComponent(className)}&date=${date}`);
        
        if (checkResponse.ok) {
            const checkResult = await checkResponse.json();
            
            if (checkResult.exists && checkResult.subjects.length > 0) {
                const existingSubjects = checkResult.subjects.map(s => s.subject).join(', ');
                const confirmMessage = `⚠️ PERINGATAN: Anda sudah melaporkan kehadiran untuk tanggal ${formatIndonesianDate(date)}!\n\n` +
                    `Mata pelajaran yang sudah dilaporkan:\n${existingSubjects}\n\n` +
                    `Apakah Anda ingin mengganti laporan yang sudah ada?\n\n` +
                    `⚠️ Laporan lama akan dihapus dan diganti dengan laporan baru.`;
                
                if (!confirm(confirmMessage)) {
                    return; // User cancelled
                }
                
                // User confirmed to replace, continue with submission
                console.log('✅ User confirmed to replace existing report');
            }
        }

        // Create report object for LocalStorage (Dashboard Admin)
        const localReport = {
            id: Date.now(),
            className: className,
            date: date,
            submittedBy: className,
            createdAt: new Date().toISOString(),
            subjects: attendance,
            notes: ""
        };

        // Save to LocalStorage for Admin dashboard
        const existingReports = JSON.parse(localStorage.getItem('allReports')) || [];
        existingReports.push(localReport);
        localStorage.setItem('allReports', JSON.stringify(existingReports));
        console.log("Data berhasil disimpan ke LocalStorage allReports");

        // Send to Server
        console.log(`📤 Sending to server: class=${className}, date=${date}, records=${attendance.length}`);
        const res = await fetch(`${API_BASE}/submit-attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ class_name: className, date, attendance })
        });
        
        const result = await res.json();
        if (result.success) {
            const totalSubjects = cards.length;
            const totalPeriods = attendance.length;
            const groupedCount = attendance.filter(a => a.isGrouped).length;
            
            let successMessage = `Laporan berhasil dikirim untuk ${totalSubjects} mata pelajaran`;
            if (groupedCount > 0) {
                successMessage += ` (${totalPeriods} total jam pelajaran)`;
            }
            successMessage += `!\n\nTanggal laporan: ${formatIndonesianDate(date)}`;
            
            alert(successMessage);
            await loadAttendanceHistory(); 
            showSection('history'); 
        } else {
            alert("Laporan tersimpan di lokal browser.");
        }
    } catch (err) { 
        console.error(err);
        alert("Server offline. Laporan tersimpan secara lokal di browser."); 
        showSection('history');
    }
}

async function loadAttendanceHistory() {
    const className = localStorage.getItem('username');
    const historyList = document.getElementById('historyList'); 
    if (!historyList || !className) return;

    try {
        const response = await fetch(`${API_BASE}/attendance-history/${encodeURIComponent(className)}`);
        if (!response.ok) throw new Error('Gagal fetch riwayat');
        const history = await response.json();
        
        historyList.innerHTML = ''; 

        if (!Array.isArray(history) || history.length === 0) {
            historyList.innerHTML = '<p style="text-align:center; padding:20px; color:#94a3b8;">Belum ada riwayat laporan.</p>';
            return;
        }

        // Group attendance records by date and subject-teacher combination for display
        const groupedHistory = {};
        
        history.forEach(item => {
            // Use the explicit date string from server if available, otherwise use report_date
            const dateKey = item.report_date_string || item.report_date;
            const subjectKey = `${item.subject}-${item.teacher_name || 'Unknown'}`;
            
            console.log(`📅 Processing history item: date=${dateKey}, subject=${item.subject}`);
            
            if (!groupedHistory[dateKey]) {
                groupedHistory[dateKey] = {};
            }
            
            if (!groupedHistory[dateKey][subjectKey]) {
                groupedHistory[dateKey][subjectKey] = {
                    subject: item.subject,
                    teacher_name: item.teacher_name,
                    status: item.status,
                    periods: [],
                    time_slots: [],
                    ids: [],
                    report_date: dateKey // Use the corrected date
                };
            }
            
            // Add period and time slot info
            if (item.period) {
                groupedHistory[dateKey][subjectKey].periods.push(item.period);
            }
            if (item.time_slot) {
                groupedHistory[dateKey][subjectKey].time_slots.push(item.time_slot);
            }
            groupedHistory[dateKey][subjectKey].ids.push(item.id);
        });

        let html = `
            <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse: collapse; background: #fff; border-radius: 10px; overflow: hidden; font-size: 0.9em;">
                <thead style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                    <tr>
                        <th style="padding: 12px; text-align: left;">Tanggal</th>
                        <th style="padding: 12px; text-align: left;">Mata Pelajaran</th>
                        <th style="padding: 12px; text-align: center;">Status</th>
                        <th style="padding: 12px; text-align: center;">Aksi</th>
                    </tr>
                </thead>
                <tbody>`;

        // Sort dates in descending order (newest first)
        const sortedDates = Object.keys(groupedHistory).sort((a, b) => new Date(b) - new Date(a));
        
        sortedDates.forEach(date => {
            const dateSubjects = groupedHistory[date];
            
            Object.values(dateSubjects).forEach(item => {
                const statusColor = item.status === 'Hadir' ? '#10b981' : (item.status === 'Tugas' ? '#f59e0b' : '#ef4444');
                
                // Create time slot display with grouping logic
                let timeSlotInfo = '';
                if (item.periods.length > 0) {
                    // Sort periods and create ranges for consecutive periods
                    const sortedPeriods = [...new Set(item.periods)].sort((a, b) => a - b);
                    
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
                            timeSlotInfo = ` - Jam ${sortedPeriods[0]}-${sortedPeriods[sortedPeriods.length - 1]}`;
                        } else {
                            timeSlotInfo = ` - Jam ${sortedPeriods.join(', ')}`;
                        }
                    } else {
                        timeSlotInfo = ` - Jam ${sortedPeriods[0]}`;
                    }
                } else if (item.time_slots.length > 0) {
                    // Fallback to time_slot if available
                    const uniqueTimeSlots = [...new Set(item.time_slots)];
                    timeSlotInfo = ` - ${uniqueTimeSlots.join(', ')}`;
                }
                
                // Add visual indicator for grouped subjects
                let subjectDisplay = item.subject;
                if (item.periods.length > 1) {
                    subjectDisplay += ` <span style="font-size: 0.75em; color: #059669; font-weight: 500;">(${item.periods.length} jam)</span>`;
                }
                
                html += `
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px;">${formatAttendanceDate(item.report_date)}${timeSlotInfo}</td>
                        <td style="padding: 12px; font-weight: 600;">${subjectDisplay}<br><span style="font-size: 0.8em; color: #64748b;">${item.teacher_name || 'Unknown'}</span></td>
                        <td style="padding: 12px; text-align: center;">
                            <span style="background: ${statusColor}; color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.8em; font-weight: bold; display: inline-block; min-width: 60px;">${item.status}</span>
                        </td>
                        <td style="padding: 12px; text-align: center;">
                            <button onclick="deleteHistoryGroup([${item.ids.join(',')}], '${item.subject}')" style="background: #fee2e2; color: #dc2626; border: none; padding: 4px 8px; border-radius: 6px; cursor: pointer; font-size: 0.8em; font-weight: 600;">
                                <i class="fas fa-trash-alt"></i> Hapus
                            </button>
                        </td>
                    </tr>`;
            });
        });

        html += `</tbody></table></div>`;
        historyList.innerHTML = html;
    } catch (error) {
        console.error('Gagal memuat history:', error);
        historyList.innerHTML = '<p style="text-align:center; padding:20px; color:red;">Gagal memuat riwayat dari server.</p>';
    }
}

// Delete schedule group (handles both single and multi-period subjects)
async function deleteScheduleGroup(day, scheduleIds, subjectName) {
    const periodCount = scheduleIds.length;
    const periodText = periodCount > 1 ? `${periodCount} jam pelajaran` : '1 jam pelajaran';
    
    if (!confirm(`Yakin ingin menghapus jadwal ${subjectName} (${periodText}) dari hari ${day}?`)) return;
    
    try {
        // Delete all schedule IDs in this group
        const deletePromises = scheduleIds.map(id => 
            fetch(`${API_BASE}/delete-schedule/${id}`, { method: 'DELETE' })
        );
        
        const results = await Promise.all(deletePromises);
        
        // Check if all deletions were successful
        const allSuccessful = results.every(res => res.ok);
        
        if (allSuccessful) {
            alert(`Jadwal ${subjectName} (${periodText}) berhasil dihapus`);
            
            // Remove from local classSchedule object
            if (classSchedule[day]) {
                classSchedule[day] = classSchedule[day].filter(s => !scheduleIds.includes(s.id));
            }
            
            // Refresh displays
            updateWeeklyScheduleDisplay();
            updateOverviewSchedule();
            
            // Refresh today's schedule if viewing attendance section
            const reportDateInput = document.getElementById('reportDate');
            if (reportDateInput) loadTodaySchedule(reportDateInput.value);
        } else {
            alert('Beberapa jadwal gagal dihapus. Silakan coba lagi.');
        }
    } catch (error) {
        console.error('Error deleting schedule group:', error);
        alert('Gagal menghapus jadwal');
    }
}

// Delete single schedule item (kept for backward compatibility)
async function deleteScheduleItem(scheduleId, day) {
    if (!confirm(`Yakin ingin menghapus jadwal ini dari hari ${day}?`)) return;
    
    try {
        const response = await fetch(`${API_BASE}/delete-schedule/${scheduleId}`, { 
            method: 'DELETE' 
        });
        
        if (response.ok) {
            alert('Jadwal berhasil dihapus');
            // Remove from local classSchedule object
            if (classSchedule[day]) {
                classSchedule[day] = classSchedule[day].filter(s => s.id !== scheduleId);
            }
            // Refresh displays
            updateWeeklyScheduleDisplay();
            updateOverviewSchedule();
            // Refresh today's schedule if viewing attendance section
            const reportDateInput = document.getElementById('reportDate');
            if (reportDateInput) loadTodaySchedule(reportDateInput.value);
        } else {
            alert('Gagal menghapus jadwal');
        }
    } catch (error) {
        console.error('Error deleting schedule item:', error);
        alert('Gagal menghapus jadwal');
    }
}

// Delete single history item
async function deleteHistoryItem(id) {
    if (!confirm('Yakin ingin menghapus laporan ini?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/delete-attendance/${id}`, { method: 'DELETE' });
        if (response.ok) {
            alert('Laporan berhasil dihapus');
            await loadAttendanceHistory();
        } else {
            alert('Gagal menghapus laporan');
        }
    } catch (error) {
        console.error('Error deleting history item:', error);
        alert('Gagal menghapus laporan');
    }
}

// Delete grouped history items (for multi-period subjects)
async function deleteHistoryGroup(ids, subjectName) {
    const recordCount = ids.length;
    const recordText = recordCount > 1 ? `${recordCount} record kehadiran` : '1 record kehadiran';
    
    if (!confirm(`Yakin ingin menghapus ${recordText} untuk ${subjectName}?`)) return;
    
    try {
        // Delete all attendance records in this group
        const deletePromises = ids.map(id => 
            fetch(`${API_BASE}/delete-attendance/${id}`, { method: 'DELETE' })
        );
        
        const results = await Promise.all(deletePromises);
        
        // Check if all deletions were successful
        const allSuccessful = results.every(res => res.ok);
        
        if (allSuccessful) {
            alert(`${recordText} untuk ${subjectName} berhasil dihapus`);
            await loadAttendanceHistory();
        } else {
            alert('Beberapa record gagal dihapus. Silakan coba lagi.');
        }
    } catch (error) {
        console.error('Error deleting history group:', error);
        alert('Gagal menghapus record kehadiran');
    }
}

// Delete all history for current class
async function deleteAllHistory() {
    if (!confirm('⚠️ PERINGATAN: Semua riwayat laporan akan dihapus permanen. Lanjutkan?')) return;
    if (!confirm('Yakin? Tindakan ini tidak dapat dibatalkan!')) return;
    
    const className = localStorage.getItem('username');
    try {
        const response = await fetch(`${API_BASE}/delete-all-attendance/${encodeURIComponent(className)}`, { method: 'DELETE' });
        if (response.ok) {
            alert('Semua riwayat berhasil dihapus');
            await loadAttendanceHistory();
        } else {
            alert('Gagal menghapus semua riwayat');
        }
    } catch (error) {
        console.error('Error deleting all history:', error);
        alert('Gagal menghapus semua riwayat');
    }
}

// --- MANAJEMEN JADWAL ---
function switchDay(day) {
    document.getElementById('currentDayName').textContent = day;
    document.querySelectorAll('.day-tab').forEach(t => t.classList.toggle('active', t.textContent.trim() === day));
    document.getElementById('subjectsList').innerHTML = '';
}

function addScheduleSubject() {
    // Validate that data is loaded
    if (SCHOOL_SUBJECTS.length === 0 || SCHOOL_TEACHERS.length === 0) {
        alert('Data mata pelajaran atau guru belum dimuat. Silakan refresh halaman.');
        console.error('Cannot add subject - data not loaded. Subjects:', SCHOOL_SUBJECTS, 'Teachers:', SCHOOL_TEACHERS);
        return;
    }
    
    const container = document.getElementById('subjectsList');
    const div = document.createElement('div');
    div.className = 'schedule-subject-item';
    div.style.cssText = "margin-bottom:15px; padding:15px; border:1px solid #eee; border-radius:10px; position:relative; background:#fff;";
    
    // Build subject options
    const subjectOptions = SCHOOL_SUBJECTS.length > 0 
        ? SCHOOL_SUBJECTS.map(s => `<option value="${s.name || s.id}">${s.name || 'Unknown'}</option>`).join('')
        : '<option value="">Tidak ada data mata pelajaran</option>';
    
    // Build teacher options
    const teacherOptions = SCHOOL_TEACHERS.length > 0
        ? SCHOOL_TEACHERS.map(t => `<option value="${t}">${t}</option>`).join('')
        : '<option value="">Tidak ada data guru</option>';
    
    // Build time slot checkboxes
    const timeSlotCheckboxes = TIME_SLOTS.length > 0
        ? TIME_SLOTS.map(slot => `
            <div style="display: flex; align-items: center; margin-bottom: 8px; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; background: #f8fafc;">
                <input type="checkbox" 
                       class="timeslot-checkbox" 
                       value="${slot.period}" 
                       data-start="${slot.start_time}" 
                       data-end="${slot.end_time}"
                       data-label="${slot.label}"
                       id="timeslot_${Date.now()}_${slot.period}"
                       style="margin-right: 10px; transform: scale(1.2);">
                <label for="timeslot_${Date.now()}_${slot.period}" 
                       style="cursor: pointer; font-size: 13px; font-weight: 500; color: #374151; flex: 1;">
                    ${slot.label} (${slot.start_time} - ${slot.end_time})
                </label>
            </div>
        `).join('')
        : '<p style="color: #94a3b8; font-style: italic;">Tidak ada data jam pelajaran</p>';
    
    div.innerHTML = `
        <button type="button" onclick="this.parentElement.remove()" style="position:absolute; top:5px; right:5px; border:none; background:none; color:red; cursor:pointer; font-size:18px;">&times;</button>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
            <div>
                <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 5px; color: #374151;">Mata Pelajaran</label>
                <select class="subject-dropdown" required style="width:100%; padding:8px; border-radius:5px; border:1px solid #ccc; font-size: 13px;">
                    <option value="">Pilih Mata Pelajaran</option>${subjectOptions}
                </select>
            </div>
            <div>
                <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 5px; color: #374151;">Guru</label>
                <select class="teacher-dropdown" required style="width:100%; padding:8px; border-radius:5px; border:1px solid #ccc; font-size: 13px;">
                    <option value="">Pilih Guru</option>${teacherOptions}
                </select>
            </div>
        </div>
        <div>
            <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 8px; color: #374151;">
                Jam Pelajaran <span style="font-size: 11px; color: #64748b; font-weight: normal;">(Pilih satu atau lebih)</span>
            </label>
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <button type="button" onclick="selectAllTimeSlots(this)" 
                        style="padding: 4px 8px; font-size: 11px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Pilih Semua
                </button>
                <button type="button" onclick="deselectAllTimeSlots(this)" 
                        style="padding: 4px 8px; font-size: 11px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Batal Semua
                </button>
            </div>
            <div class="timeslot-checkboxes" style="max-height: 200px; overflow-y: auto; border: 1px solid #d1d5db; border-radius: 8px; padding: 10px; background: #ffffff;">
                ${timeSlotCheckboxes}
            </div>
        </div>`;
    container.appendChild(div);
}

// Helper function to select all time slots in a subject item
function selectAllTimeSlots(button) {
    const subjectItem = button.closest('.schedule-subject-item');
    const checkboxes = subjectItem.querySelectorAll('.timeslot-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
}

// Helper function to deselect all time slots in a subject item
function deselectAllTimeSlots(button) {
    const subjectItem = button.closest('.schedule-subject-item');
    const checkboxes = subjectItem.querySelectorAll('.timeslot-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

async function handleScheduleSubmit(e) {
    e.preventDefault();
    const className = localStorage.getItem('username');
    const day = document.getElementById('currentDayName').textContent;
    const items = document.querySelectorAll('.schedule-subject-item');
    const schedules = [];
    
    items.forEach(item => {
        const subject = item.querySelector('.subject-dropdown').value;
        const teacher = item.querySelector('.teacher-dropdown').value;
        const selectedTimeSlots = item.querySelectorAll('.timeslot-checkbox:checked');
        
        if (subject && teacher && selectedTimeSlots.length > 0) {
            // Create a schedule entry for each selected time slot
            selectedTimeSlots.forEach(checkbox => {
                const startTime = checkbox.dataset.start;
                const endTime = checkbox.dataset.end;
                const period = parseInt(checkbox.value);
                
                schedules.push({ 
                    day, 
                    subject, 
                    teacher_name: teacher, 
                    start_time: startTime, 
                    end_time: endTime,
                    period: period
                });
            });
        }
    });
    
    if (schedules.length === 0) {
        alert("Pilih Mata Pelajaran, Guru, dan minimal satu Jam Pelajaran!");
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/save-schedule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ class_name: className, schedules })
        });
        
        const result = await res.json();
        if (result.success) {
            alert(`Jadwal berhasil disimpan! Total ${schedules.length} jam pelajaran ditambahkan.`);
            document.getElementById('subjectsList').innerHTML = '';
            await loadClassSchedule();
        } else {
            alert("Gagal menyimpan jadwal: " + (result.message || 'Unknown error'));
        }
    } catch (err) { 
        console.error('Error saving schedule:', err);
        alert("Gagal menyimpan jadwal. Silakan coba lagi."); 
    }
}

function updateWeeklyScheduleDisplay() {
    const container = document.getElementById('scheduleWeek');
    if (!container) return;
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    container.innerHTML = days.map(day => {
        const dayData = classSchedule[day] || [];
        const groupedSchedules = groupConsecutiveSchedules(dayData);
        
        return `<div style="flex:1; min-width:160px; border:1px solid #e2e8f0; padding:10px; border-radius:10px; background:#fff;">
            <div style="border-bottom:2px solid #3498db; padding-bottom:5px; margin-bottom:10px; font-weight:bold; color:#1e3a8a; font-size:12px;">${day}</div>
            ${groupedSchedules.map(s => {
                const periodDisplay = s.isGrouped 
                    ? `Jam ${s.periods[0]}-${s.periods[s.periods.length - 1]}`
                    : `Jam ${s.periods[0]}`;
                    
                const bgColor = s.isGrouped ? '#f0fdf4' : '#f8fafc';
                const borderColor = s.isGrouped ? '#bbf7d0' : '#edf2f7';
                const periodColor = s.isGrouped ? '#16a34a' : '#3498db';
                
                return `<div style="font-size:10px; margin-bottom:8px; padding:5px; background:${bgColor}; border-radius:4px; border:1px solid ${borderColor}; position:relative;">
                    <div style="font-weight:600; color:#1e293b; margin-bottom:2px;">${s.subjectName}</div>
                    <div style="color:#64748b; font-size:9px; margin-bottom:2px;">${s.teacherName}</div>
                    <div style="color:${periodColor}; font-size:8px; font-weight:600; margin-bottom:1px;">
                        ${periodDisplay}
                    </div>
                    <div style="color:#3498db; font-size:9px; font-weight:600;">
                        <i class="fas fa-clock"></i> ${s.startTime}-${s.endTime}
                    </div>
                    <button onclick="deleteScheduleGroup('${day}', [${s.scheduleIds.join(',')}], '${s.subjectName}')" style="position:absolute; top:2px; right:2px; background:#ef4444; color:white; border:none; border-radius:3px; width:16px; height:16px; font-size:8px; cursor:pointer; display:flex; align-items:center; justify-content:center;" title="Hapus jadwal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>`;
            }).join('')}
        </div>`;
    }).join('');
}

// --- UTILS ---
function showSection(id) {
    const section = document.getElementById(id);
    if (!section) return; 
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    section.classList.add('active');
    closeMobileMenuOnNavClick();
    
    if (id === 'history') loadAttendanceHistory();
    if (id === 'overview') updateOverviewSchedule();

    document.querySelectorAll('.nav-item').forEach(n => {
        const href = n.getAttribute('href');
        const onclick = n.getAttribute('onclick');
        const isMatch = (href && href.includes(id)) || (onclick && onclick.includes(id));
        n.classList.toggle('active', !!isMatch);
    });
}

function logout() {
    if (confirm("Logout dari sistem?")) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    // Setup form event listener after DOM is ready
    const scheduleForm = document.getElementById('scheduleForm');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', handleScheduleSubmit);
    }
});