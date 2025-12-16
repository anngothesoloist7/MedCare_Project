DELETE PROCEDURE IF EXISTS sp_AddMedication;


CREATE PROCEDURE sp_AddMedication (
    IN p_medication_id VARCHAR(50)
    IN timestamp INT UNSIGNED,  
    IN p_staff_id VARCHAR(50),
    IN p_medication_name VARCHAR(100),
    IN p_description TEXT,
    IN p_stock_quantity INT,
    IN p_price DECIMAL(10,2)
)
BEGIN
    INSERT INTO medications 
    (medication_id, timestamp, staff_id, medication_name, description, stock_quantity, price) 
    VALUES 
    (p_medication_id, p_timestamp, p_staff_id, p_medication_name, p_description, p_stock_quantity, p_price);
END;