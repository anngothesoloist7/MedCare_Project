-- ============================================================
-- Index Creation Script
-- ============================================================
-- Purpose: Create indexes for performance optimization
-- These indexes support fast queries for common operations
--
-- Performance Requirements:
-- - NFR-03: Patient records must be retrieved in under 3 seconds
-- - Indexes on foreign keys improve JOIN performance
-- - Indexes on search fields (nid_number, phone, name) improve lookup speed
--
-- Usage:
--   mysql -u root -p medcare_db < sql/schema/create_indexes.sql
--
-- Note: Run this AFTER all tables are created
-- ============================================================

USE medcare_db;

-- ============================================================
-- Indexes on users table
-- ============================================================

-- Index for fast patient lookup by National ID
-- Used by: patient reception, patient search
CREATE INDEX idx_users_nid_number ON users(nid_number);

-- Index for fast patient lookup by phone number
-- Used by: patient reception, patient search
CREATE INDEX idx_users_phone ON users(phone);

-- Index for filtering users by role
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- Indexes on diagnosis table
-- ============================================================

-- Index for patient's diagnosis history retrieval
-- Used by: patient dashboard, medical history queries
CREATE INDEX idx_diagnosis_patient_id ON diagnosis(patient_id);

-- Index for doctor's patient visits retrieval
-- Used by: doctor dashboard, doctor statistics
CREATE INDEX idx_diagnosis_doctor_id ON diagnosis(doctor_id);

-- Index for diagnosis date sorting and filtering
-- Used by: timeline queries, date-based reports
CREATE INDEX idx_diagnosis_date ON diagnosis(date);

-- Composite index for patient history sorted by date
-- Optimizes: SELECT * FROM diagnosis WHERE patient_id = ? ORDER BY date DESC
CREATE INDEX idx_diagnosis_patient_date ON diagnosis(patient_id, date);

-- Composite index for doctor visits sorted by date
-- Optimizes: SELECT * FROM diagnosis WHERE doctor_id = ? ORDER BY date DESC
CREATE INDEX idx_diagnosis_doctor_date ON diagnosis(doctor_id, date);

-- ============================================================
-- Indexes on medications table
-- ============================================================

-- Index for medication name search
-- Used by: medication search, autocomplete
CREATE INDEX idx_medications_name ON medications(name);

-- Index for low stock queries
-- Used by: inventory management, stock alerts
CREATE INDEX idx_medications_stock ON medications(stock_quantity);

-- ============================================================
-- Indexes on prescription_item table
-- ============================================================

-- Index for retrieving prescriptions by diagnosis
-- Used by: diagnosis detail view, prescription history
CREATE INDEX idx_prescription_diagnosis_id ON prescription_item(diagnosis_id);

-- Index for medication usage statistics
-- Used by: medication popularity queries, usage tracking
CREATE INDEX idx_prescription_medication_id ON prescription_item(medication_id);

-- Confirm index creation
SELECT 'All indexes created successfully' AS status;
