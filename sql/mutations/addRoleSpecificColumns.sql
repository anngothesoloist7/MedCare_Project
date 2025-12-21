-- ADD ROLE-SPECIFIC COLUMNS TO USERS TABLE
-- This mutation adds the role-specific columns (speciality, age, height, gender) to the users table
-- These columns store role-specific information directly in the users table instead of separate tables
--
-- Columns added:
-- - speciality (VARCHAR(100)) - Medical speciality for doctors (NULL for patients)
-- - age (INT) - Age for patients (NULL for doctors)
-- - height (DECIMAL(3,2)) - Height in meters for patients (NULL for doctors)
-- - gender (ENUM) - Gender for patients: 'male', 'female', or 'other' (NULL for doctors)
--
-- All columns are nullable to allow NULL values for the role that doesn't use them
ALTER TABLE users
ADD COLUMN IF NOT EXISTS speciality VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS age INT NULL,
ADD COLUMN IF NOT EXISTS height DECIMAL(3, 2) NULL,
ADD COLUMN IF NOT EXISTS gender ENUM('male', 'female', 'other') NULL;

