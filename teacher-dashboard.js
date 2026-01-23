// Teacher Dashboard JavaScript

// Global variables
let uploadedFiles = JSON.parse(localStorage.getItem('teacherFiles')) || [];
let currentSection = 'overview';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeDashboard();
    setupEventListeners();
    updateStats();
    loadFiles();
});

// Authentication check
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('userRole');
    
    if (isLoggedIn !== 'true' || userRole !== 'teacher') {
        window.location.href = 'index.html';
        return;
    }
    
    // Set teacher name
    const username = localStorage.getItem('username');
    document.getElementById('teacherName').textContent = username || 'Guru';
}

// Initialize dashboard
function initializeDashboard() {
    // Set current date for report
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('reportDate');
    if (dateInput) {
        dateInput.value = today;
    }
}

// Setup event listeners
function setupEventListeners() {
    // File upload
    const fileInput = document.getElementById('fileInput');
    const uploadZone = document.getElementById('uploadZone');
    
    if (uploadZone && fileInput) {
        uploadZone.addEventListener('click', () => fileInput.click());
        
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });
        
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });
        
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelect(files[0]);
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
            }
        });
    }
    
    // Upload form
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUpload);
    }
    
    // Search and filter
    const searchInput = document.getElementById('searchFiles');
    const filterSelect = document.getElementById('filterType');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterFiles);
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', filterFiles);
    }
}

// Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelector(`[onclick="showSection('${sectionId}')"]`).classList.add('active');
    
    currentSection = sectionId;
}

// File handling
function handleFileSelect(file) {
    const preview = document.getElementById('filePreview');
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    // Validate file size
    if (file.size > maxSize) {
        alert('File terlalu besar. Maksimal 10MB.');
        return;
    }
    
    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
        alert('Format file tidak didukung. Gunakan PDF, DOC, atau DOCX.');
        return;
    }
    
    // Show preview
    preview.innerHTML = `
        <div class="file-item">
            <i class="fas fa-file-${getFileIcon(fileExtension)}"></i>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
            </div>
            <button type="button" class="remove-file" onclick="removeFilePreview()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    preview.classList.add('show');
}

function removeFilePreview() {
    const preview = document.getElementById('filePreview');
    const fileInput = document.getElementById('fileInput');
    
    preview.classList.remove('show');
    preview.innerHTML = '';
    fileInput.value = '';
}

function getFileIcon(extension) {
    switch (extension) {
        case '.pdf': return 'pdf';
        case '.doc':
        case '.docx': return 'word';
        default: return 'alt';
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Upload handling
function handleUpload(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const fileInput = document.getElementById('fileInput');
    
    if (!fileInput.files[0]) {
        alert('Mohon pilih file untuk diupload.');
        return;
    }
    
    // Create file object
    const fileObj = {
        id: Date.now(),
        name: fileInput.files[0].name,
        type: formData.get('docType'),
        subject: formData.get('subject'),
        grade: formData.get('grade'),
        semester: formData.get('semester'),
        description: formData.get('description'),
        uploadDate: new Date().toISOString(),
        size: fileInput.files[0].size
    };
    
    // Add to uploaded files
    uploadedFiles.push(fileObj);
    localStorage.setItem('teacherFiles', JSON.stringify(uploadedFiles));
    
    // Reset form
    e.target.reset();
    removeFilePreview();
    
    // Update stats and files
    updateStats();
    loadFiles();
    
    // Show success message
    alert('Dokumen berhasil diupload!');
    
    // Switch to files section
    showSection('files');
}

// Update statistics
function updateStats() {
    const rppCount = uploadedFiles.filter(file => file.type === 'rpp').length;
    const syllabusCount = uploadedFiles.filter(file => file.type === 'silabus').length;
    
    document.getElementById('rppCount').textContent = rppCount;
    document.getElementById('syllabusCount').textContent = syllabusCount;
    
    // Last update
    if (uploadedFiles.length > 0) {
        const lastFile = uploadedFiles[uploadedFiles.length - 1];
        const lastUpdate = new Date(lastFile.uploadDate);
        document.getElementById('lastUpdate').textContent = lastUpdate.toLocaleDateString('id-ID');
    }
}

// Load and display files
function loadFiles() {
    const filesGrid = document.getElementById('filesGrid');
    
    if (uploadedFiles.length === 0) {
        filesGrid.innerHTML = `
            <div class="no-files">
                <i class="fas fa-folder-open" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <p>Belum ada file yang diupload</p>
                <button class="action-btn" onclick="showSection('upload')">
                    <i class="fas fa-plus"></i>
                    Upload File Pertama
                </button>
            </div>
        `;
        return;
    }
    
    filesGrid.innerHTML = uploadedFiles.map(file => `
        <div class="file-card" data-type="${file.type}" data-name="${file.name.toLowerCase()}">
            <div class="file-header">
                <div class="file-type-icon">
                    <i class="fas fa-file-${getFileIcon('.' + file.name.split('.').pop())}"></i>
                </div>
                <div>
                    <div class="file-title">${file.name}</div>
                    <div class="file-meta">${getDocTypeLabel(file.type)} • ${file.subject} • Kelas ${file.grade}</div>
                </div>
            </div>
            <div class="file-details">
                <p><strong>Semester:</strong> ${file.semester}</p>
                <p><strong>Upload:</strong> ${new Date(file.uploadDate).toLocaleDateString('id-ID')}</p>
                <p><strong>Ukuran:</strong> ${formatFileSize(file.size)}</p>
                ${file.description ? `<p><strong>Deskripsi:</strong> ${file.description}</p>` : ''}
            </div>
            <div class="file-actions">
                <button class="file-action-btn btn-view" onclick="viewFile(${file.id})">
                    <i class="fas fa-eye"></i> Lihat
                </button>
                <button class="file-action-btn btn-download" onclick="downloadFile(${file.id})">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="file-action-btn btn-delete" onclick="deleteFile(${file.id})">
                    <i class="fas fa-trash"></i> Hapus
                </button>
            </div>
        </div>
    `).join('');
}

function getDocTypeLabel(type) {
    const labels = {
        'rpp': 'RPP',
        'silabus': 'Silabus',
        'materi': 'Materi',
        'evaluasi': 'Evaluasi'
    };
    return labels[type] || type;
}

// File actions
function viewFile(fileId) {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file) {
        alert(`Membuka file: ${file.name}\n(Dalam implementasi nyata, ini akan membuka file)`);
    }
}

function downloadFile(fileId) {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file) {
        alert(`Mengunduh file: ${file.name}\n(Dalam implementasi nyata, ini akan mengunduh file)`);
    }
}

function deleteFile(fileId) {
    if (confirm('Apakah Anda yakin ingin menghapus file ini?')) {
        uploadedFiles = uploadedFiles.filter(f => f.id !== fileId);
        localStorage.setItem('teacherFiles', JSON.stringify(uploadedFiles));
        updateStats();
        loadFiles();
    }
}

// Filter files
function filterFiles() {
    const searchTerm = document.getElementById('searchFiles').value.toLowerCase();
    const filterType = document.getElementById('filterType').value;
    
    const fileCards = document.querySelectorAll('.file-card');
    
    fileCards.forEach(card => {
        const fileName = card.dataset.name;
        const fileType = card.dataset.type;
        
        const matchesSearch = fileName.includes(searchTerm);
        const matchesFilter = !filterType || fileType === filterType;
        
        if (matchesSearch && matchesFilter) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Logout
function logout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        localStorage.removeItem('className');
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminUser');
        window.location.href = 'index.html';
    }
}