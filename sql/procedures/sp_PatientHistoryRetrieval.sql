/*
FR-03: Patient History Retrieval
FR-05: Medical Record Access
View comprehensive timelines of past consultations, diagnoses, and treatments.
*/

DROP PROCEDURE IF EXISTS sp_PatientHistoryRetrieval;

DELIMITER //
CREATE PROCEDURE sp_PatientHistoryRetrieval(
    IN p_nid_number INT,
    IN p_user_role ENUM('doctor','patient')
)
BEGIN
    -- Role-based access
    IF p_user_role = 'patient' THEN
        -- Patients can only see their own records
        SELECT * 
        FROM vw_PatientHistoryRetrieval
        WHERE PatientNID = p_nid_number;
    ELSEIF p_user_role = 'doctor' THEN
        -- Doctors can search by patient_id
        SELECT *
        FROM vw_PatientHistoryRetrieval
        WHERE (patient_id = p_patient_id);
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unauthorized role';
    END IF;
END;
