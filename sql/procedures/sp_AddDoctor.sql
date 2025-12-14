DELETE PROCEDURE IF EXISTS sp_AddDoctor;
-- Insert a new doctor and corresponding user record
CREATE PROCEDURE sp_AddDoctor (
    IN p_doctor_id VARCHAR(50), 
    IN p_nid_number INT, 
    IN p_phone INT,
    IN p_dob DATE
)
BEGIN
    INSERT INTO doctors (doctor_id) VALUES (p_doctor_id);
    INSERT INTO users (user_id, nid_number, phone, dob, role) 
    VALUES (p_doctor_id, p_nid_number, p_phone, p_dob, 'doctor');
END;