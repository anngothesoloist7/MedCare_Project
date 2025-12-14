-- Create roles
CREATE ROLE patient_role;
CREATE ROLE doctor_role;

-- PATIENT PERMISSIONS
GRANT SELECT ON medcare_db.vw_DoctorConsultation TO patient_role;
GRANT SELECT ON medcare_db.vw_PatientMyMeds TO patient_role;
GRANT EXECUTE ON PROCEDURE medcare_db.sp_MarkMedicationTaken TO patient_role;

-- DOCTOR PERMISSIONS
-- Diagnosis & prescription operations
GRANT SELECT, INSERT ON medcare_db.diagnosis TO doctor_role;
GRANT SELECT, INSERT ON medcare_db.prescriptionitem TO doctor_role;

-- Medication stock handled only via procedures
GRANT EXECUTE ON PROCEDURE medcare_db.sp_IssuePrescriptionItem TO doctor_role;

-- Read patient history
GRANT SELECT ON medcare_db.vw_DoctorConsultation TO doctor_role;

-- Assign roles to users
GRANT patient_role TO 'patient_user'@'%';
SET DEFAULT ROLE patient_role FOR 'patient_user'@'%';