-- Example SELECT query
-- This file demonstrates how to write SQL queries that will be executed from TypeScript
-- Use ? placeholders for parameters to prevent SQL injection

-- Example: Get user by ID
-- Usage in TypeScript: executeQuery('queries/example.sql', [userId])
SELECT 
  user_id,
  full_name,
  email,
  role,
  created_at
FROM users
WHERE user_id = ?;

-- FR-05: Medical Record Access
SELECT *
FROM vw_PatientConsultationHistory
WHERE patient_id = 'P001';

/*
PROCEDURE: sp_AddPrescriptionItem -> TRIGGERS: trg_MedicationStockAudit_Insert, trg_MedicationStockAudit_Update
DESCRIPTION: This procedure adds a new prescription item linked to a diagnosis and updates medication stock accordingly.
*/
CALL sp_AddPrescriptionItem(
    'PI1001',
    'DG1001',
    3,
    2,
    'Take after meals',
    '5 days',
    'D001'
);

/*
ADD VALUES TO USERS (General information) + ADD VALUES TO DOCTORS (Doctor specific information)
*/
CALL sp_AddDoctor(
    'D002',
    123456789,
    9876543210,
    '1980-09-26'
)




