-- Get top 5 medications by prescription usage count
-- Joins prescription_item with medications to count usage per medication
-- Returns medication_id, name, and usage_count ordered by usage DESC
-- 
-- Usage in TypeScript:
-- executeQuery('queries/getTop5Medications.sql')
--
-- Returns: Array of medication objects with usage counts

SELECT 
    m.medication_id,
    m.name,
    COUNT(pi.prescription_item_id) AS usage_count
FROM medications m
LEFT JOIN prescription_item pi ON m.medication_id = pi.medication_id
GROUP BY m.medication_id, m.name
ORDER BY usage_count DESC
LIMIT 5;
