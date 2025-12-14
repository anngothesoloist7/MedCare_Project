DROP PROCEDURE IF EXISTS sp_GenerateMonthlyReport;

-- FR-09: Generate monthly reports on clinic performance and drug usage
CREATE PROCEDURE sp_GenerateMonthlyReport (
    IN p_month INT,
    IN p_year INT
)
BEGIN
    SELECT m.name as `Drug Name`, SUM(pi.quantity) as `Total Dispensed`
    FROM prescription_item as pi 
    JOIN medications as m ON pi.medication_id = m.medication_id
    GROUP BY m.name, MONTH(pi.created_at), YEAR(pi.created_at);
END;