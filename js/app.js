// ============================
// Course Registration Portal
// Frontend Application Logic
// ============================

const API_BASE = '';
let courses = [];
let selectedCourseId = null;

// Course color mapping
const courseColors = {
    'CS101':    '#6C63FF',
    'MECH201':  '#FF6B6B',
    'CIVIL301': '#00C853',
    'EC401':    '#FFB300',
    'EEE501':   '#00D2FF'
};

// ---- Initialization ----
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) {
        window.location.href = '/';
        return;
    }

    // Set welcome message
    const navUser = document.getElementById('navUser');
    if (navUser) {
        navUser.textContent = `Welcome, ${user.username}`;
    }

    // Load courses
    loadCourses();
});

// ---- Load Courses ----
async function loadCourses() {
    const grid = document.getElementById('coursesGrid');

    try {
        const res = await fetch(API_BASE + '/api/courses');
        const data = await res.json();

        if (data.success) {
            courses = data.courses;
            renderCourses();
            updateStats();
        } else {
            grid.innerHTML = '<p style="text-align:center;color:var(--error);grid-column:1/-1;">Failed to load courses.</p>';
        }
    } catch (err) {
        grid.innerHTML = '<p style="text-align:center;color:var(--error);grid-column:1/-1;">⚠️ Cannot connect to server. Make sure the backend is running.</p>';
    }
}

// ---- Render Course Cards ----
function renderCourses() {
    const grid = document.getElementById('coursesGrid');
    grid.innerHTML = '';

    courses.forEach((course, index) => {
        const available = course.max_seats - course.filled_seats;
        const percentage = (course.filled_seats / course.max_seats) * 100;
        const color = courseColors[course.code] || '#6C63FF';

        let statusClass = 'available';
        let statusText = 'Available';
        if (available <= 0) {
            statusClass = 'full';
            statusText = 'Full';
        } else if (percentage >= 80) {
            statusClass = 'limited';
            statusText = 'Few Left';
        }

        let barClass = '';
        if (percentage >= 90) barClass = 'danger';
        else if (percentage >= 70) barClass = 'warning';

        const isSelected = selectedCourseId === course.id;

        const card = document.createElement('div');
        card.className = `course-card${isSelected ? ' selected' : ''}`;
        card.style.setProperty('--card-color', color);
        card.style.animationDelay = `${index * 0.1}s`;

        card.innerHTML = `
            <div class="card-header">
                <span class="card-code">${course.code}</span>
                <span class="card-status ${statusClass}">
                    <span class="status-dot"></span>
                    ${statusText}
                </span>
            </div>
            <h3 class="card-name">${course.name}</h3>
            <p class="card-description">${course.description}</p>
            <div class="card-meta">
                <div class="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span>Faculty: <strong>${course.faculty}</strong></span>
                </div>
                <div class="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                    <span>Max Seats: <strong>${course.max_seats}</strong></span>
                </div>
            </div>
            <div class="seat-bar-wrapper">
                <div class="seat-info">
                    <span>Seats Filled: ${course.filled_seats}/${course.max_seats}</span>
                    <span>${available} Available</span>
                </div>
                <div class="seat-bar">
                    <div class="seat-bar-fill ${barClass}" style="width: ${percentage}%"></div>
                </div>
            </div>
            <button class="btn-select ${isSelected ? 'selected' : ''}" 
                    onclick="selectCourse(${course.id})"
                    ${available <= 0 ? 'disabled' : ''}>
                ${available <= 0 ? '🚫 Course Full' : (isSelected ? '✓ Selected' : '🎓 Select Course')}
            </button>
        `;

        grid.appendChild(card);
    });
}

// ---- Update Stats ----
function updateStats() {
    const totalCoursesEl = document.getElementById('totalCourses');
    const totalSeatsEl = document.getElementById('totalSeats');
    const availableSeatsEl = document.getElementById('availableSeats');

    if (totalCoursesEl) {
        const totalSeats = courses.reduce((sum, c) => sum + c.max_seats, 0);
        const totalFilled = courses.reduce((sum, c) => sum + c.filled_seats, 0);

        animateNumber(totalCoursesEl, courses.length);
        animateNumber(totalSeatsEl, totalSeats);
        animateNumber(availableSeatsEl, totalSeats - totalFilled);
    }
}

function animateNumber(el, target) {
    const duration = 800;
    const start = parseInt(el.textContent) || 0;
    const startTime = performance.now();

    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        el.textContent = Math.round(start + (target - start) * eased);
        if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}

// ---- Select Course ----
function selectCourse(courseId) {
    selectedCourseId = courseId;
    const course = courses.find(c => c.id === courseId);

    // Update cards
    renderCourses();

    // Show registration form
    const regSection = document.getElementById('registrationSection');
    regSection.style.display = 'block';
    regSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Update badge
    document.getElementById('selectedCourseName').textContent = `${course.code} — ${course.name}`;
}

function clearSelection() {
    selectedCourseId = null;
    renderCourses();
    document.getElementById('registrationSection').style.display = 'none';
}

// ---- Registration ----
async function handleRegistration(e) {
    e.preventDefault();

    if (!selectedCourseId) {
        showToast('Please select a course first.', 'error');
        return;
    }

    const btn = document.getElementById('submitRegBtn');
    const studentName = document.getElementById('studentName').value.trim();
    const phone = document.getElementById('studentPhone').value.trim();
    const email = document.getElementById('studentEmail').value.trim();

    btn.classList.add('loading');
    btn.disabled = true;

    try {
        const res = await fetch(API_BASE + '/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentName,
                phone,
                email,
                courseId: selectedCourseId
            })
        });

        const data = await res.json();

        if (data.success) {
            showToast(data.message, 'success');
            // Reset form
            document.getElementById('registrationForm').reset();
            clearSelection();
            // Reload courses to update seats
            await loadCourses();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('❌ Connection failed. Please try again.', 'error');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// ---- Toast Notifications ----
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// ---- Logout ----
function handleLogout() {
    localStorage.removeItem('user');
    window.location.href = '/';
}
