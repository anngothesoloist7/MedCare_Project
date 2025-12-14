DROP TRIGGER IF EXISTS trg_Prevent_Description_Deletion;

-- Trigger to prevent deletion of prescription items
CREATE TRIGGER trg_Prevent_Description_Deletion
    BEFORE DELETE ON prescription_item
    FOR EACH ROWB
BEGIN
    SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Deletion of prescription items is not allowed.';
END;