// Global variables
let currentRole = 'teacher';

// Navigation
function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
}

// Modal
function openLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

// Password toggle
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('passwordToggleIcon');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// Role selector (visual only)
function selectRole(role) {
    currentRole = role;
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.role === role);
    });
}

// ======================
// LOGIN (FINAL & BENAR)
// ======================
async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        alert('Username dan password wajib diisi');
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.message);
            return;
        }

        // Simpan session
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', result.username);
        localStorage.setItem('userRole', result.role);

        // Redirect sesuai role
        if (result.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } 
        else if (result.role === 'teacher') {
            window.location.href = 'teacher-dashboard.html';
        } 
        else if (result.role === 'representative') {
            localStorage.setItem('className', result.username);
            window.location.href = 'representative-dashboard.html';
        }

    } catch (error) {
        console.error(error);
        alert('Server tidak merespons');
    }
}

// Close modal click outside
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target === modal) closeLoginModal();
};

// Navbar scroll
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            scrollToSection(link.getAttribute('href').substring(1));
        });
    });
});

// Auto-login state
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('userRole');

    if (isLoggedIn === 'true' && username && role) {
        const loginBtn = document.querySelector('.login-btn');
        loginBtn.innerHTML = `<i class="fas fa-user"></i> ${username}`;
        loginBtn.onclick = () => {
            if (role === 'admin') location.href = 'admin-dashboard.html';
            if (role === 'teacher') location.href = 'teacher-dashboard.html';
            if (role === 'representative') location.href = 'representative-dashboard.html';
        };
    }
}

document.addEventListener('DOMContentLoaded', checkLoginStatus);