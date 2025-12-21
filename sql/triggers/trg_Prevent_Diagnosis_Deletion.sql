-- ============================================================
-- Trigger: trg_Prevent_Diagnosis_Deletion
-- ============================================================
-- Purpose: Prevents deletion of diagnosis records for data integrity
-- Medical records should never be deleted - they are legal documents
--
-- Why this trigger exists:
-- In healthcare systems, diagnosis records are part of the medical history
-- and must be preserved for legal, regulatory, and patient care purposes.
-- This trigger enforces this business rule at the database level,
-- ensuring no application code can accidentally delete diagnosis records.
--
-- Type: BEFORE DELETE trigger
-- Table: diagnosis
-- Action: Raises an error to prevent the DELETE operation
--
-- Error raised:
-- SQLSTATE '45000' with message explaining why deletion is not allowed
--
-- Connected to:
-- - diagnosis table (protects records in this table)
-- - Used by: Any DELETE attempt on the diagnosis table will be blocked
--
-- Note: Single-statement trigger syntax (no BEGIN/END) works better with MySQL drivers
-- ============================================================

CREATE TRIGGER trg_Prevent_Diagnosis_Deletion
BEFORE DELETE ON diagnosis
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Deletion of diagnosis records is not allowed for data integrity.';