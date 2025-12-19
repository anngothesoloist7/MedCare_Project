DROP PROCEDURE IF EXISTS sp_AddDiagnosis;

CREATE PROCEDURE sp_AddDiagnosis (
    IN p_patient_id VARCHAR(50),
    IN p_doctor_id VARCHAR(50),
    IN p_diagnosis VARCHAR(255),
    IN p_next_checkup DATE
)
BEGIN
    INSERT INTO diagnosis 
    (patient_id, doctor_id, diagnosis, date, next_checkup) 
    VALUES 
    (p_patient_id, p_doctor_id, p_diagnosis, NOW(), p_next_checkup);
END;    