-- ============================================================
-- Procedure: sp_AddDiagnosis
-- ============================================================
-- Purpose: Inserts a new diagnosis record into the diagnosis table
-- Ensures that patient_id, doctor_id, diagnosis text, and next_checkup are properly recorded
--
-- Why this procedure exists:
-- Centralizes insertion logic for diagnosis records.
-- Can be called by application or scripts to add new consultations consistently.
--
-- Type: Stored Procedure
-- Table: diagnosis
-- Action: INSERT a new row into diagnosis table
--
-- Parameters:
-- IN p_patient_id VARCHAR(50)   : ID of the patient
-- IN p_doctor_id VARCHAR(50)    : ID of the doctor
-- IN p_diagnosis VARCHAR(255)   : Text of the diagnosis
-- IN p_next_checkup DATE        : Optional next checkup date
--
-- Connected to:
-- - diagnosis table (inserts new records)
-- - Works with trg_check_doctor_patient_insert/update to validate business rules
--
-- Note: DELIMITER is needed to allow BEGIN/END block to be parsed correctly
-- ============================================================

DROP PROCEDURE IF EXISTS sp_AddDiagnosis;

CREATE PROCEDURE sp_AddDiagnosis (
    IN p_patient_id VARCHAR(50),
    IN p_doctor_id VARCHAR(50),
    IN p_diagnosis VARCHAR(255),
    IN p_next_checkup DATE
)
BEGIN
    INSERT INTO diagnosis 
    (patient_id, doctor_id, diagnosis, date, next_checkup) 
    VALUES 
    (p_patient_id, p_doctor_id, p_diagnosis, NOW(), p_next_checkup);
END;