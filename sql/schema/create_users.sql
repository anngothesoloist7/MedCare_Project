-- CREATE USERS TABLE
-- This table stores user information for both doctors, patients, and admins
-- Schema based on the database schema documentation:
-- - user_id: Primary key (VARCHAR(50))
-- - nid_number: National ID number (optional, will be updated during onboarding)
-- - phone: Phone number (optional, will be updated during onboarding)
-- - role: enum field for 'Admin', 'Doctor', or 'Patient' (optional, will be updated during onboarding)
-- - dob: Date of birth (optional, will be updated during onboarding)
-- - created_at: Timestamp when record was created
-- - updated_at: Timestamp when record was last updated
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(50) PRIMARY KEY,
    nid_number INT NULL,
    phone VARCHAR(20) NULL,
    role ENUM("Admin", "Doctor", "Patient") NULL,
    dob DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Index on national ID and phone for faster lookups
    INDEX idx_nid_number (nid_number),
    INDEX idx_phone (phone)
);