-- Get prescription items for a specific diagnosis
-- This query retrieves all prescription items associated with a diagnosis
-- Used together with getDiagnosisDetails.sql to show complete diagnosis information
--
-- Parameters:
-- ? = diagnosis_id (INT) - The diagnosis ID to retrieve prescription items for
--
-- Returns:
-- Array of prescription items with: prescription_item_id, medication_id, medication_name, quantity, guide, duration

SELECT 
    pi.prescription_item_id,
    pi.medication_id,
    m.name AS medication_name,
    pi.quantity,
    pi.guide,
    pi.duration
FROM prescription_item pi
JOIN medications m ON pi.medication_id = m.medication_id
WHERE pi.diagnosis_id = ?
ORDER BY pi.prescription_item_id;


