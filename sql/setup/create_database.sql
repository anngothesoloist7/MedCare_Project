-- CREATE DATABASE SCRIPT
-- This script creates the MedCare database if it doesn't exist
-- Run this script first before creating tables

-- Create database with proper charset and collation
DROP DATABASE IF EXISTS medcare_db;
CREATE DATABASE medcare_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Use the database
USE medcare_db;

-- Show success message
SELECT 'Database medcare_db created successfully' as status;