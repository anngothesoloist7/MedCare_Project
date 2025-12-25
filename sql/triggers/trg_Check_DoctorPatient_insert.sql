-- ============================================================
-- Trigger: trg_check_doctor_patient_insert
-- ============================================================
-- Purpose: Ensures that doctor_id and patient_id are always different
-- This enforces the business rule that a doctor cannot diagnose themselves as a patient
--
-- Why this trigger exists:
-- In healthcare systems, it is logically invalid for a doctor to diagnose themselves.
-- This trigger enforces the rule at the database level, preventing application-level errors.
--
-- Type: BEFORE INSERT trigger
-- Table: diagnosis
-- Action: Checks NEW row before insertion, raises error if doctor_id = patient_id
--
-- Error raised:
-- SQLSTATE '45000' with message 'doctor_id and patient_id must be different'
--
-- Connected to:
-- - diagnosis table (validates new records)
-- - Any INSERT operation on the diagnosis table will be validated
-- Note: Uses BEGIN/END block because we have multiple statements (IF + SIGNAL)
-- DELIMITER $$ is required to allow MySQL to interpret the whole BEGIN/END as one statement
-- ============================================================

CREATE TRIGGER trg_check_doctor_patient_insert
BEFORE INSERT ON diagnosis
FOR EACH ROW
BEGIN
    IF NEW.doctor_id = NEW.patient_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'doctor_id and patient_id must be different';
    END IF;
END;