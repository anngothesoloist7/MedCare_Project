/*
-- NOT USED BY FRONTEND - COMMENTED OUT
DROP TRIGGER IF EXISTS trg_Prevent_Diagnosis_Deletion;

-- Trigger to prevent deletion of diagnosis records
CREATE TRIGGER trg_Prevent_Diagnosis_Deletion
    BEFORE DELETE ON diagnosis
    FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Deletion of diagnosis records is not allowed.';
END;
*/