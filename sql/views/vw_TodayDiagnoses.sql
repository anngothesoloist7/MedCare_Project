-- Object: vw_TodayDiagnoses
-- Requirement: Doctors need to see the list of diagnoses/patients for the current day.
CREATE VIEW vw_TodayDiagnoses AS
SELECT 
    d.diagnosis_id,
    d.doctor_id,
    u.nid_number AS PatientNID,
    d.diagnosis AS DiagnosisContent,
    d.date AS ConsultationTime
FROM diagnosis d
JOIN patients p ON d.patient_id = p.patient_id
JOIN users u ON p.patient_id = u.user_id
WHERE DATE(d.date) = CURDATE();