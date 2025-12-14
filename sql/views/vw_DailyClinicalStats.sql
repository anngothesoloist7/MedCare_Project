DROP VIEW IF EXISTS vw_DailyClinicalStats;

-- FR-04: Clinical Dashboard
/* View daily statistics (e.g., Total patients treated). */
CREATE VIEW vw_DailyClinicalStats as
SELECT
    CURRENT_TIMESTAMP as `Report Date`,
    COUNT(DISTINCT d.patient_id) AS `Total Patients Treated`
FROM diagnosis as d 
WHERE DARE(d.date) = CURRENT_DATE;