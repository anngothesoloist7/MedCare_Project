DROP TRIGGER IF EXISTS trg_Audit_StockUpdate;

-- Trigger to automatically update medications audit table
CREATE TRIGGER trg_Audit_StockUpdate
    AFTER UPDATE ON medications
    FOR EACH ROW
BEGIN
    -- Ensure authorized stock updates
    IF @current_staff_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Unauthorized stock update detected.';
    END IF;

    -- Log stock changes
    IF NEW.stock_quantity <> OLD.stock_quantity THEN
        INSERT INTO medication_audit (
            medication_id, old_quantity, new_quantity, change_type, change_at, staff_id
        ) 
        VALUES (
            OLD.medication_id, OLD.stock_quantity, NEW.stock_quantity,
            CASE 
                WHEN NEW.stock_quantity > OLD.stock_quantity THEN 'addition'
                ELSE 'deduction'
            END,
            /* Doctor updates medications stock so use current_staff_id for staff_id*/
            @current_staff_id,
            CURRENT_TIMESTAMP
        );
    END IF;
END;
