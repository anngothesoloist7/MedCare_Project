DROP PROCEDURE IF EXISTS sp_AddPrescriptionItem;
-- FR-05: Prescription Management
/* Issue prescription items ensuring stock validation and transactional integrity. */
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

  -- Decrement stock for the medication
  -- The medications table has medication_id as primary key (no timestamp)
  UPDATE medications
  SET stock_quantity = stock_quantity - p_quantity
  WHERE medication_id = p_medication_id;

  -- Note: Transaction commit is handled by the calling code
  -- This ensures proper transaction management and avoids nested transaction conflicts

  -- Cleanup context
  SET @current_staff_id = NULL;

END;
