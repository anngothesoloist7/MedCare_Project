-- Object: vw_PrescriptionDetails
-- Requirement: When a user (Doctor/Patient) clicks on a diagnosis in the History list, 
-- this view returns the specific medicines prescribed for that visit.
CREATE VIEW vw_PrescriptionDetails AS
SELECT 
    pi.diagnosis_id, 
    m.name AS DrugName,
    pi.quantity,
    pi.guide,
    pi.duration
FROM prescription_item pi
JOIN medications m 
    ON pi.medication_id = m.medication_id 
    AND pi.medication_timestamp = m.timestamp;