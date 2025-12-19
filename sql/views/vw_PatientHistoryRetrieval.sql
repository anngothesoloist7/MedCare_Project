/* Object: vw_MedicalHistoryMaster is later incorporated in sp_PatientHistoryRetrieval to meet role-based access requirement.
-- Requirement: 
-- 1. Doctor: Views history of a specific patient.
-- 2. Patient: Views their own full history.
*/
CREATE VIEW vw_PatientHistoryRetrieval AS
SELECT 
    d.diagnosis_id,
    d.patient_id,
    d.doctor_id,
    u.nid_number AS PatientNID,
    u.phone AS PatientPhone,
    d.date AS ConsultationDate,
    doc.speciality AS DoctorSpeciality,
    d.diagnosis AS DiagnosisSummary,
    d.next_checkup AS NextVisitDate
FROM diagnosis d
JOIN doctors doc ON d.doctor_id = doc.doctor_id
JOIN users u ON d.patient_id = u.user_id
ORDER BY d.date DESC;