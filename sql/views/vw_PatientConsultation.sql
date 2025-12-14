DROP VIEW IF EXISTS vw_PatientConsultation;

-- FR-05: Medical Record Access
/* Log in to view consultation history and doctor notes (Read-only). 
- ONLY_VIEW ACCESS TO PATIENT'S OWN RECORDS
*/
CREATE VIEW vw_PatientConsultation
SELECT
    p.patient_id,
    d.doctor_id,
    c.date AS `Consultation Date`,
    p.diagnosis,
    p.next_checkup as `Next Checkup Date`
FROM prescription_item as pi
JOIN diagnosis d ON pi.diagnosis_id = d.diagnosis_id
JOIN medications m ON pi.medication_id = m.medication_id
JOIN patients p ON d.patient_id = p.patient_id
WHERE p.patient_id = patient_id;


