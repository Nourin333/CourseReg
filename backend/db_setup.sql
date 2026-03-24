-- Course Registration System - Database Setup
CREATE DATABASE IF NOT EXISTS course_registration;
USE course_registration;

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    faculty VARCHAR(100),
    max_seats INT NOT NULL DEFAULT 60,
    filled_seats INT NOT NULL DEFAULT 0
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL,
    course_id INT NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Users table for login
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample courses
INSERT INTO courses (name, code, description, faculty, max_seats, filled_seats) VALUES
('Computer Science', 'CS101', 'Learn programming, algorithms, data structures, and software engineering principles.', 'Dr. Ananya Sharma', 60, 0),
('Mechanical Engineering', 'MECH201', 'Study thermodynamics, fluid mechanics, manufacturing processes, and machine design.', 'Prof. Rajesh Kumar', 50, 0),
('Civil Engineering', 'CIVIL301', 'Explore structural analysis, construction management, geotechnics, and urban planning.', 'Dr. Priya Nair', 45, 0),
('Electronics & Communication', 'EC401', 'Master circuit design, signal processing, VLSI, and communication systems.', 'Prof. Vikram Patel', 55, 0),
('Electrical Engineering', 'EEE501', 'Study power systems, electrical machines, control systems, and renewable energy.', 'Dr. Meena Iyer', 50, 0);

-- Insert a default user (username: admin, password: admin123)
INSERT INTO users (username, password) VALUES ('admin', 'admin123');
