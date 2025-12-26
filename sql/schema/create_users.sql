-- ============================================================
-- Table: users
-- ============================================================
-- Purpose: Base authentication and identity table for all users
-- Stores core user information for both doctors and patients
--
-- Design Notes:
-- - user_id is VARCHAR(50) to match Clerk's user ID format (e.g., user_2abc123...)
-- - role is ENUM to enforce valid values ('Doctor', 'Patient')
-- - nid_number, phone, and dob are optional to support Clerk webhook integration:
--   * Webhook Stage: User signs up via Clerk → webhook creates user record with only user_id
--   * Onboarding Stage: User completes onboarding → fills in nid_number, phone, dob, role
--   * Database Perspective: Fields are nullable for webhook integration
--   * Application Perspective: Fields are required - enforced during onboarding
-- - Indexed on nid_number and phone for fast patient lookup
--
-- Connected to:
-- - diagnosis table (doctor_id and patient_id foreign keys)
-- - Clerk authentication system (user_id matches Clerk ID)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    -- Primary key: Clerk user ID
    user_id VARCHAR(50) PRIMARY KEY,
    
    -- User identification (optional during onboarding)
    nid_number VARCHAR(20) UNIQUE,
    phone VARCHAR(20),
    
    -- Role-based access control (optional until onboarding)
    role ENUM('Doctor', 'Patient'),
    
    -- Personal information
    dob DATE,
    
    -- Audit timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_nid_format CHECK (nid_number IS NULL OR LENGTH(nid_number) >= 9),
    CONSTRAINT chk_phone_format CHECK (phone IS NULL OR LENGTH(phone) >= 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Confirm table creation
SELECT 'Table users created successfully' AS status;
