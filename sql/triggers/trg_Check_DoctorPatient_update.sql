-- ============================================================
-- Trigger: trg_check_doctor_patient_update
-- ============================================================
-- Purpose: Ensures that doctor_id and patient_id remain different on updates
-- Prevents existing diagnosis records from being updated to invalid state
--
-- Why this trigger exists:
-- Users might try to update doctor_id or patient_id in a diagnosis record.
-- This trigger enforces the business rule at the database level, preserving data integrity.
--
-- Type: BEFORE UPDATE trigger
-- Table: diagnosis
-- Action: Checks NEW row before update, raises error if doctor_id = patient_id
--
-- Error raised:
-- SQLSTATE '45000' with message 'doctor_id and patient_id must be different'
--
-- Connected to:
-- - diagnosis table (validates updates)
-- - Any UPDATE operation on the diagnosis table that could violate the rule will be blocked
-- DELIMITER $$ is required to allow MySQL to interpret the whole BEGIN/END as one statement
-- ============================================================
DELIMITER $$

CREATE TRIGGER trg_check_doctor_patient_update
BEFORE UPDATE ON diagnosis
FOR EACH ROW
BEGIN
    IF NEW.doctor_id = NEW.patient_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'doctor_id and patient_id must be different';
    END IF;
END$$

DELIMITER ;