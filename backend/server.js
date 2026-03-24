const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// MySQL Connection Pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'MNBV@mnbv0987',
    database: 'course_registration',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test DB connection on startup
(async () => {
    try {
        const conn = await pool.getConnection();
        console.log('✅ Connected to MySQL database');
        conn.release();
    } catch (err) {
        console.error('❌ MySQL connection failed:', err.message);
        console.error('   Make sure MySQL is running and the database "course_registration" exists.');
        console.error('   Run: mysql -u root -p < db_setup.sql');
    }
})();

// ========================
// API ROUTES
// ========================

// POST /api/login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE username = ? AND password = ?',
            [username, password]
        );

        if (rows.length > 0) {
            res.json({ success: true, message: 'Login successful!', user: { id: rows[0].id, username: rows[0].username } });
        } else {
            res.status(401).json({ success: false, message: 'Invalid username or password.' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

// POST /api/register-user (Sign up)
app.post('/api/register-user', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    try {
        // Check if username already exists
        const [existing] = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Username already exists.' });
        }

        await pool.execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
        res.json({ success: true, message: 'Account created successfully! Please login.' });
    } catch (err) {
        console.error('Register user error:', err);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

// GET /api/courses
app.get('/api/courses', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM courses ORDER BY id');
        res.json({ success: true, courses: rows });
    } catch (err) {
        console.error('Courses error:', err);
        res.status(500).json({ success: false, message: 'Failed to load courses.' });
    }
});

// POST /api/register (Course registration)
app.post('/api/register', async (req, res) => {
    const { studentName, phone, email, courseId } = req.body;

    if (!studentName || !phone || !email || !courseId) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email address.' });
    }

    // Validate phone
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(phone)) {
        return res.status(400).json({ success: false, message: 'Invalid phone number (10-15 digits).' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Check seat availability
        const [courses] = await connection.execute(
            'SELECT * FROM courses WHERE id = ? FOR UPDATE',
            [courseId]
        );

        if (courses.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Course not found.' });
        }

        const course = courses[0];
        const availableSeats = course.max_seats - course.filled_seats;

        if (availableSeats <= 0) {
            await connection.rollback();
            return res.status(409).json({ success: false, message: `❌ Course Full! No seats available in ${course.name}.` });
        }

        // Check if email already registered for this course
        const [existingStudent] = await connection.execute(
            'SELECT id FROM students WHERE email = ? AND course_id = ?',
            [email, courseId]
        );

        if (existingStudent.length > 0) {
            await connection.rollback();
            return res.status(409).json({ success: false, message: 'You are already registered for this course.' });
        }

        // Insert student
        await connection.execute(
            'INSERT INTO students (name, phone, email, course_id) VALUES (?, ?, ?, ?)',
            [studentName, phone, email, courseId]
        );

        // Update filled seats
        await connection.execute(
            'UPDATE courses SET filled_seats = filled_seats + 1 WHERE id = ?',
            [courseId]
        );

        await connection.commit();

        res.json({
            success: true,
            message: `✅ Registration Successful! You are now enrolled in ${course.name}.`,
            availableSeats: availableSeats - 1
        });
    } catch (err) {
        await connection.rollback();
        console.error('Registration error:', err);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    } finally {
        connection.release();
    }
});

// Fallback: serve login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'dashboard.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📂 Serving frontend from: ${path.join(__dirname, '..', 'frontend')}`);
});
