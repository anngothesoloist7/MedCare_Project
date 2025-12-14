DROP VIEW IF EXISTS vw_PatientActiveMeds;

-- FR-06: Medication Tracking
/* View active prescriptions with dosage instructions. Mark doses as "Taken" to track compliance. */
CREATE VIEW vw_PatientActiveMeds AS
SELECT
    d.patient_id,
    pi.prescriptionitem_id,
    m.name AS medication_name,
    pi.quantity,
    pi.guide,
    pi.duration,
    d.date AS prescribed_date
FROM prescription_item pi
JOIN diagnosis d ON pi.diagnosis_id = d.diagnosis_id
JOIN medications m ON pi.medication_id = m.medication_id
WHERE d.next_checkup >= CURRENT_DATE;