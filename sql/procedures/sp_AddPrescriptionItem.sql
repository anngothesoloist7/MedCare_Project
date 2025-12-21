DROP PROCEDURE IF EXISTS sp_AddPrescriptionItem;

-- ============================================================
-- Stored Procedure: sp_AddPrescriptionItem
-- ============================================================
-- Purpose: Issue prescription items with stock validation
-- Ensures there is enough stock before inserting the prescription item
--
-- Why this procedure exists:
-- This procedure validates that sufficient stock exists BEFORE inserting
-- the prescription item. The actual stock decrement is now handled by
-- the trg_AfterInsert_PrescriptionItem trigger, which fires AFTER the
-- INSERT is successful. This separation provides:
-- 1. Validation logic in procedure (check before insert)
-- 2. Stock update logic in trigger (automatic after insert)
-- 3. Better separation of concerns
--
-- Parameters:
-- - p_diagnosis_id: The diagnosis this prescription belongs to (VARCHAR)
-- - p_medication_id: The medication being prescribed (VARCHAR)
-- - p_quantity: Number of units to prescribe (INT)
-- - p_guide: Instructions for taking the medication (TEXT)
-- - p_duration: How long to take the medication (TEXT)
-- - p_doctor_id: The doctor issuing the prescription (VARCHAR)
--
-- Validation checks:
-- 1. Medication exists (not NULL)
-- 2. Quantity is positive (> 0)
-- 3. Not out of stock (stock > 0)
-- 4. Sufficient stock (stock >= quantity)
--
-- Note: Stock decrement is handled by trg_AfterInsert_PrescriptionItem trigger
-- Transaction management is done by the calling code (route handler)
--
-- Connected to:
-- - prescription_item table (inserts new records)
-- - medications table (validates stock)
-- - trg_AfterInsert_PrescriptionItem trigger (decrements stock)
-- - Used by: POST /api/diagnosis endpoint
-- ============================================================

CREATE PROCEDURE sp_AddPrescriptionItem (
  IN p_diagnosis_id VARCHAR(50),
  IN p_medication_id VARCHAR(50),
  IN p_quantity INT,
  IN p_guide TEXT,
  IN p_duration TEXT,
  IN p_doctor_id VARCHAR(50)
)
BEGIN
  -- All DECLARE statements must come first in MySQL stored procedures
  -- This includes both variable declarations and handler declarations
  DECLARE current_stock INT;

  -- Error handler for unexpected SQL errors (not for explicit SIGNAL statements)
  -- The calling code manages the transaction, so we just re-signal the error
  -- Note: Explicit SIGNAL statements (like "Medication not found") will pass through
  -- This handler only catches unexpected SQL errors (constraint violations, etc.)
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    -- Re-signal the original error to preserve error details
    -- The outer transaction will handle rollback
    RESIGNAL;
  END;

  -- Doctor context for audit triggers (SET statements come after DECLARE)
  SET @current_staff_id = p_doctor_id;

  -- Note: Transaction is managed by the calling code (route handler)
  -- This procedure does not start/commit transactions to avoid nested transaction conflicts

  -- Lock medication row and get stock_quantity (prevents concurrent oversell)
  -- The medications table has medication_id as primary key (no timestamp column)
  SELECT m.stock_quantity
  INTO current_stock
  FROM medications as m
  WHERE m.medication_id = p_medication_id
  FOR UPDATE;

  -- Medication does not exist
  IF current_stock IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Medication not found.';
  END IF;

  -- Invalid quantity
  IF p_quantity <= 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Invalid quantity requested.';
  END IF;

  -- Out of stock
  IF current_stock = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Medication out of stock.';
  END IF;

  -- Insufficient stock
  IF current_stock < p_quantity THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Insufficient stock for medication.';
  END IF;

  -- Insert prescription item
  -- Foreign key: medication_id -> medications(medication_id)
  -- Note: The prescription_item table only references medication_id (no timestamp)
  -- prescription_item_id is AUTO_INCREMENT INTEGER, so MySQL will generate it automatically
  INSERT INTO prescription_item
    (diagnosis_id, medication_id, quantity, guide, duration)
  VALUES
    (p_diagnosis_id, p_medication_id, p_quantity, p_guide, p_duration);

  -- ============================================================
  -- IMPORTANT: Stock decrement is now handled by trigger
  -- ============================================================
  -- The trg_AfterInsert_PrescriptionItem trigger will automatically
  -- decrement the stock_quantity in medications table after this
  -- INSERT is successful. This provides:
  -- 1. Automatic stock management
  -- 2. Consistency even if INSERT is done outside this procedure
  -- 3. Clear separation of validation (here) and action (trigger)
  -- ============================================================

  -- Note: Transaction commit is handled by the calling code
  -- This ensures proper transaction management and avoids nested transaction conflicts

  -- Cleanup context
  SET @current_staff_id = NULL;

END;
