-- ============================================================
-- Trigger: trg_Prevent_Prescription_Deletion
-- ============================================================
-- Purpose: Prevents deletion of prescription item records for data integrity
-- Prescription records should never be deleted - they are legal documents
--
-- Why this trigger exists:
-- In healthcare systems, prescription records are part of the medical history
-- and must be preserved for legal, regulatory, and patient care purposes.
-- This trigger enforces this business rule at the database level,
-- ensuring no application code can accidentally delete prescription records.
--
-- Type: BEFORE DELETE trigger
-- Table: prescription_item
-- Action: Raises an error to prevent the DELETE operation
--
-- Error raised:
-- SQLSTATE '45000' with message explaining why deletion is not allowed
--
-- Connected to:
-- - prescription_item table (protects records in this table)
-- - Used by: Any DELETE attempt on the prescription_item table will be blocked
--
-- Note: Single-statement trigger syntax (no BEGIN/END) works better with MySQL drivers
-- ============================================================

CREATE TRIGGER trg_Prevent_Prescription_Deletion
BEFORE DELETE ON prescription_item
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Deletion of prescription items is not allowed for data integrity.';