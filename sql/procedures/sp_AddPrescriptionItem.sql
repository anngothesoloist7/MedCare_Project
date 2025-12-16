DELETE PROCEDURE IF EXISTS sp_IssuePrescriptionItem;
-- FR-05: Prescription Management
/* Issue prescription items ensuring stock validation and transactional integrity. */
CREATE PROCEDURE sp_AddPrescriptionItem (
  IN p_prescriptionitem_id VARCHAR(50),
  IN p_diagnosis_id VARCHAR(50),
  IN p_medication_id INT,
  p_medication_timestamp INT UNSIGNED,
  IN p_quantity INT,
  IN p_guide TEXT,
  IN p_duration TEXT,
  IN p_doctor_id VARCHAR(50)
)
BEGIN
  DECLARE current_stock INT;

  -- Doctor context for audit triggers
  SET @current_staff_id = p_doctor_id;

  -- Rollback on any SQL error
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Prescription failed. Transaction rolled back.';
  END;

  START TRANSACTION;

  -- Lock medication row (prevents concurrent oversell)
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
  INSERT INTO prescription_item
    (prescriptionitem_id, diagnosis_id, medication_id, medication_timestamp, quantity, guide, duration)
  VALUES
    (p_prescriptionitem_id, p_diagnosis_id, p_medication_id, p_medication_timestamp,
     p_quantity, p_guide, p_duration);

  -- Decrement stock
  UPDATE medications
  SET stock_quantity = stock_quantity - p_quantity
  WHERE medication_id = p_medication_id;

  COMMIT;

  -- Cleanup context
  SET @current_staff_id = NULL;

END;
