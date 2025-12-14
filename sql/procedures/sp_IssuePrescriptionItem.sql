DELETE PROCEDURE IF EXISTS sp_IssuePrescriptionItem;
-- FR-05: Prescription Management
/* Issue prescription items ensuring stock validation and transactional integrity. */
CREATE PROCEDURE sp_IssuePrescriptionItem (
  IN p_prescriptionitem_id VARCHAR(50),
  IN p_diagnosis_id VARCHAR(50),
  IN p_quantity INT,
  IN p_guide TEXT,
  IN p_duration TEXT,
  IN p_medication_id INT,
  IN p_doctor_id VARCHAR(50)
)
BEGIN
  DECLARE current_stock INT;

  -- Set context for doctor id
  SET @current_staff_id = p_doctor_id;

  -- Error handler: on any SQL error, rollback and rethrow an error
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'An error occurred while issuing prescription. Transaction rolled back.';
  END;

  -- Start transaction
  START TRANSACTION;

  -- Lock the medication row to prevent concurrent stock modifications
  SELECT stock_quantity
  INTO current_stock
  FROM medications
  WHERE medication_id = p_medication_id
  FOR UPDATE;

  -- If medication not found, rollback and error
  IF current_stock IS NULL THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Medication not found.';
  END IF;

  -- Validate requested quantity
  IF p_quantity <= 0 THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid quantity requested.';
  END IF;

  IF current_stock < p_quantity THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock for medication.';
  END IF;

  -- Insert the prescription item
  INSERT INTO prescription_item
    (prescriptionitem_id, diagnosis_id, quantity, guide, duration, medication_id)
  VALUES
    (p_prescriptionitem_id, p_diagnosis_id, p_quantity, p_guide, p_duration, p_medication_id);

  -- Decrement stock
  UPDATE medications
  SET stock_quantity = current_stock - p_quantity
  WHERE medication_id = p_medication_id;

  -- Commit transaction
  COMMIT;

  -- Clean context staff variable
  SET @current_staff_id = NULL;

END;
