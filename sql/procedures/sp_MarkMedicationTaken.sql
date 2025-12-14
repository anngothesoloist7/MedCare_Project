DROP PROCEDURE IF EXISTS sp_MarkMedicationTaken;

-- FR-06: Medication Tracking
/* View active prescriptions with dosage instructions. Mark doses as "Taken" to track compliance. */
CREATE PROCEDURE sp_MarkMedicationTaken (
    IN p_prescriptionitem_id VARCHAR(50)
)
BEGIN
    INSERT INTO medication_compliance (
        prescriptionitem_id,
        taken_date
    )
    VALUES (
        p_prescriptionitem_id
    );
END;