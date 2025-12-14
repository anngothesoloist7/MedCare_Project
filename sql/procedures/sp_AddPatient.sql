DELETE PROCEDURE IF EXISTS sp_AddPatient;

-- Insert a new patient and corresponding user record
CREATE PROCEDURE sp_AddPatient (
    IN p_patient_id VARCHAR(50), 
    IN p_nid_number INT, 
    IN p_phone INT,
    IN p_dob DATE
)
BEGIN
    INSERT INTO patients (patient_id) VALUES (p_patient_id);
    INSERT INTO users (user_id, nid_number, phone, dob, role) 
    VALUES (p_patient_id, p_nid_number, p_phone, p_dob, 'patient');
END;