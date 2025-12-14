/*
FR-03: Patient History Retrieval
View comprehensive timelines of past consultations, diagnoses, and treatments.
*/

DROP PROCEDURE IF EXISTS sp_PatientHistoryRetrieval;

CREATE PROCEDURE sp_PatientHistoryRetrieval(
    IN p_user_id INT,
    IN p_user_role ENUM('doctor','patient')
)
BEGIN
    -- Role-based access
    IF p_user_role = 'patient' THEN
        -- Patients can only see their own records
        SELECT * 
        FROM PatientConsultation
        WHERE patient_id = p_user_id;
    ELSEIF p_user_role = 'doctor' THEN
        -- Doctors can search by patient_id
        SELECT *
        FROM PatientConsultation
        WHERE (patient_id = p_patient_id);
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unauthorized role';
    END IF;
END;


/*
Doctors can search by patient_id or patient_name
patient_id = p_patient_id OR patient_name LIKE CONCAT('%', p_patient_name, '%'
*/