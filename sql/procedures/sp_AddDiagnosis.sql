DELETE PROCEDURE IF EXISTS sp_AddDiagnosis;

CREATE PROCEDURE sp_AddDiagnosis (
    IN p_diagnosis_id VARCHAR(50),
    IN p_patient_id VARCHAR(50),
    IN p_doctor_id VARCHAR(50),
    IN p_diagnosis TEXT,
    IN p_next_checkup DATE
)
BEGIN
    INSERT INTO diagnosis 
    (diagnosis_id, patient_id, doctor_id, diagnosis, date, next_checkup) 
    VALUES 
    (p_diagnosis_id, p_patient_id, p_doctor_id, p_diagnosis, NOW(), p_next_checkup);
END;    