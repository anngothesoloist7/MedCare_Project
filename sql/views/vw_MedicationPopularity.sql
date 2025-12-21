/*
-- NOT USED BY FRONTEND - COMMENTED OUT
-- Object: vw_MedicationPopularity
-- Requirement: Doctors need to see the top 5 most prescribed medications.
-- Logic: Aggregates usage count from PrescriptionItems.
CREATE VIEW vw_MedicationPopularity AS
SELECT 
    m.name AS DrugName,
    COUNT(pi.prescriptionitem_id) AS UsageCount, -- Top prescribed medication
    m.stock_quantity AS CurrentStock -- Stock warning indicator
FROM medications m
JOIN prescription_item pi 
    ON m.medication_id = pi.medication_id 
    AND m.timestamp = pi.medication_timestamp
GROUP BY m.name, m.stock_quantity
ORDER BY UsageCount DESC;
*/