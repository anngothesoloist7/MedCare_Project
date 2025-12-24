-- ============================================================
-- Master Seed Script - Complete Sample Data
-- ============================================================
-- Purpose: Load all sample data for testing and demonstration
-- This is the ONLY seed file you need to run
--
-- IMPORTANT PREREQUISITES:
-- Before running this script, you MUST create at least 2 users via the application:
-- 1. One DOCTOR user
-- 2. One PATIENT user
--
-- Steps to create users:
-- 1. Sign up via the web application (creates user in Clerk)
-- 2. Complete onboarding and select role (Doctor or Patient)
-- 3. Remember the NID (National ID) you entered during onboarding
-- 4. Replace the NID values below with your actual NIDs
--
-- Usage:
--   mysql -u root -p medcare_db < sql/seed/seed_all.sql
--
-- What this script does:
-- 1. Clears all existing data (TRUNCATE tables)
-- 2. Seeds 15 realistic medications
-- 3. Seeds 8 diagnosis records (using your actual user IDs looked up by NID)
-- 4. Seeds prescription items linking diagnoses to medications
-- ============================================================

USE medcare_db;

-- ============================================================
-- STEP 1: SET YOUR NIDs HERE
-- ============================================================
-- TODO: Replace these with the actual NIDs you used during onboarding
-- These are the National ID numbers you entered when completing your profile

SET @DOCTOR_NID = '123456789';   -- Replace with your doctor's NID
SET @PATIENT_NID = '987654321';  -- Replace with your patient's NID

-- Look up user_ids based on NIDs
SET @DOCTOR_ID = (SELECT user_id FROM users WHERE nid_number = @DOCTOR_NID AND role = 'Doctor' LIMIT 1);
SET @PATIENT_ID = (SELECT user_id FROM users WHERE nid_number = @PATIENT_NID AND role = 'Patient' LIMIT 1);

-- Verify users were found
SELECT 'Looking up users by NID...' AS '';
SELECT 
    CASE 
        WHEN @DOCTOR_ID IS NULL THEN 'ERROR: Doctor not found with NID'
        ELSE CONCAT('Found Doctor: ', @DOCTOR_ID)
    END AS doctor_status,
    CASE 
        WHEN @PATIENT_ID IS NULL THEN 'ERROR: Patient not found with NID'
        ELSE CONCAT('Found Patient: ', @PATIENT_ID)
    END AS patient_status;

-- ============================================================
-- STEP 2: Clear Existing Data
-- ============================================================
SELECT '========================================' AS '';
SELECT 'Clearing existing data...' AS '';
SELECT '========================================' AS '';

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE prescription_item;
TRUNCATE TABLE diagnosis;
TRUNCATE TABLE medications;
SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Existing data cleared successfully' AS status;

-- ============================================================
-- STEP 3: Seed Medications (15 realistic medications)
-- ============================================================
SELECT '========================================' AS '';
SELECT 'Seeding medications...' AS '';
SELECT '========================================' AS '';

INSERT INTO medications (name, description, stock_quantity, unit_price) VALUES
('Paracetamol 500mg', 'Pain reliever and fever reducer. Used for mild to moderate pain and fever.', 500, 2.50),
('Amoxicillin 500mg', 'Antibiotic used to treat bacterial infections including respiratory, ear, and urinary tract infections.', 300, 8.75),
('Ibuprofen 400mg', 'Nonsteroidal anti-inflammatory drug (NSAID) for pain, fever, and inflammation.', 450, 3.25),
('Omeprazole 20mg', 'Proton pump inhibitor for treating acid reflux, heartburn, and stomach ulcers.', 200, 12.50),
('Metformin 500mg', 'Oral diabetes medication that helps control blood sugar levels in type 2 diabetes.', 350, 5.00),
('Lisinopril 10mg', 'ACE inhibitor for treating high blood pressure and heart failure.', 250, 6.50),
('Atorvastatin 20mg', 'Statin medication to lower cholesterol and reduce risk of heart disease.', 180, 15.00),
('Levothyroxine 50mcg', 'Thyroid hormone replacement for treating hypothyroidism.', 220, 7.25),
('Amlodipine 5mg', 'Calcium channel blocker for high blood pressure and chest pain (angina).', 280, 4.75),
('Cetirizine 10mg', 'Antihistamine for treating allergies, hay fever, and hives.', 400, 3.00),
('Salbutamol Inhaler', 'Bronchodilator for treating asthma and chronic obstructive pulmonary disease (COPD).', 150, 18.50),
('Aspirin 100mg', 'Blood thinner to prevent heart attacks and strokes. Also used for pain relief.', 600, 1.50),
('Clopidogrel 75mg', 'Antiplatelet medication to prevent blood clots in heart disease and stroke patients.', 120, 22.00),
('Losartan 50mg', 'Angiotensin receptor blocker (ARB) for high blood pressure and kidney protection.', 190, 8.00),
('Simvastatin 40mg', 'Statin for lowering cholesterol and preventing cardiovascular disease.', 160, 11.50);

SELECT COUNT(*) AS 'Medications Inserted' FROM medications;

-- ============================================================
-- STEP 4: Seed Diagnosis Records (8 sample diagnoses)
-- ============================================================
SELECT '========================================' AS '';
SELECT 'Seeding diagnosis records...' AS '';
SELECT '========================================' AS '';

INSERT INTO diagnosis (patient_id, doctor_id, diagnosis, date, next_checkup) VALUES
-- Recent diagnoses (last 7 days)
(@PATIENT_ID, @DOCTOR_ID, 
 'Acute upper respiratory infection. Prescribed antibiotics and rest. Patient advised to increase fluid intake.', 
 DATE_SUB(NOW(), INTERVAL 2 DAY), 
 DATE_ADD(CURDATE(), INTERVAL 7 DAY)),

(@PATIENT_ID, @DOCTOR_ID, 
 'Seasonal allergies with mild symptoms. Prescribed antihistamine. Patient should avoid known allergens.', 
 DATE_SUB(NOW(), INTERVAL 5 DAY), 
 NULL),

-- Older diagnoses (1-4 weeks ago)
(@PATIENT_ID, @DOCTOR_ID, 
 'Routine checkup. Blood pressure slightly elevated. Recommended lifestyle modifications and monitoring.', 
 DATE_SUB(NOW(), INTERVAL 15 DAY), 
 DATE_ADD(CURDATE(), INTERVAL 30 DAY)),

(@PATIENT_ID, @DOCTOR_ID, 
 'Gastroesophageal reflux disease (GERD). Prescribed proton pump inhibitor. Dietary modifications recommended.', 
 DATE_SUB(NOW(), INTERVAL 20 DAY), 
 DATE_ADD(CURDATE(), INTERVAL 14 DAY)),

(@PATIENT_ID, @DOCTOR_ID, 
 'Migraine headache. Prescribed pain medication. Patient advised to identify and avoid triggers.', 
 DATE_SUB(NOW(), INTERVAL 25 DAY), 
 NULL),

-- Historical diagnoses (1-3 months ago)
(@PATIENT_ID, @DOCTOR_ID, 
 'Type 2 diabetes mellitus - follow-up. Blood sugar levels improving with medication. Continue current treatment plan.', 
 DATE_SUB(NOW(), INTERVAL 45 DAY), 
 DATE_ADD(CURDATE(), INTERVAL 60 DAY)),

(@PATIENT_ID, @DOCTOR_ID, 
 'Hypertension - routine monitoring. Blood pressure well controlled with medication. No changes to treatment.', 
 DATE_SUB(NOW(), INTERVAL 60 DAY), 
 DATE_ADD(CURDATE(), INTERVAL 90 DAY)),

(@PATIENT_ID, @DOCTOR_ID, 
 'Acute bronchitis. Prescribed bronchodilator and cough suppressant. Patient should rest and avoid irritants.', 
 DATE_SUB(NOW(), INTERVAL 75 DAY), 
 NULL);

SELECT COUNT(*) AS 'Diagnosis Records Inserted' FROM diagnosis;

-- ============================================================
-- STEP 5: Seed Prescription Items
-- ============================================================
SELECT '========================================' AS '';
SELECT 'Seeding prescription items...' AS '';
SELECT '========================================' AS '';

-- Note: diagnosis_id values are auto-generated (1-8 for the 8 diagnoses above)
-- medication_id values correspond to the medications seeded above (1-15)

-- Diagnosis 1: Acute upper respiratory infection
INSERT INTO prescription_item (diagnosis_id, medication_id, quantity, guide, duration) VALUES
(1, 2, 21, 'Take 1 capsule three times daily with food', '7 days'),
(1, 1, 30, 'Take 1-2 tablets every 6 hours as needed for fever or pain', '10 days');

-- Diagnosis 2: Seasonal allergies
INSERT INTO prescription_item (diagnosis_id, medication_id, quantity, guide, duration) VALUES
(2, 10, 30, 'Take 1 tablet once daily, preferably in the evening', '30 days');

-- Diagnosis 3: Routine checkup with elevated blood pressure
INSERT INTO prescription_item (diagnosis_id, medication_id, quantity, guide, duration) VALUES
(3, 6, 30, 'Take 1 tablet once daily in the morning', '30 days');

-- Diagnosis 4: GERD
INSERT INTO prescription_item (diagnosis_id, medication_id, quantity, guide, duration) VALUES
(4, 4, 30, 'Take 1 capsule once daily before breakfast', '30 days');

-- Diagnosis 5: Migraine headache
INSERT INTO prescription_item (diagnosis_id, medication_id, quantity, guide, duration) VALUES
(5, 3, 20, 'Take 1 tablet every 6-8 hours as needed for pain, maximum 3 tablets per day', '10 days');

-- Diagnosis 6: Type 2 diabetes follow-up
INSERT INTO prescription_item (diagnosis_id, medication_id, quantity, guide, duration) VALUES
(6, 5, 60, 'Take 1 tablet twice daily with meals (morning and evening)', '30 days');

-- Diagnosis 7: Hypertension monitoring
INSERT INTO prescription_item (diagnosis_id, medication_id, quantity, guide, duration) VALUES
(7, 6, 90, 'Take 1 tablet once daily in the morning', '90 days'),
(7, 12, 90, 'Take 1 tablet once daily in the morning with water', '90 days');

-- Diagnosis 8: Acute bronchitis
INSERT INTO prescription_item (diagnosis_id, medication_id, quantity, guide, duration) VALUES
(8, 11, 1, 'Inhale 1-2 puffs every 4-6 hours as needed for breathing difficulty', '30 days'),
(8, 1, 20, 'Take 1-2 tablets every 6 hours as needed for pain or fever', '7 days');

SELECT COUNT(*) AS 'Prescription Items Inserted' FROM prescription_item;

-- ============================================================
-- STEP 6: Verification Summary
-- ============================================================
SELECT '========================================' AS '';
SELECT 'Database Seeding Complete!' AS '';
SELECT '========================================' AS '';

SELECT 
    (SELECT COUNT(*) FROM medications) AS 'Medications',
    (SELECT COUNT(*) FROM diagnosis) AS 'Diagnoses',
    (SELECT COUNT(*) FROM prescription_item) AS 'Prescription Items';

SELECT '========================================' AS '';
SELECT 'Sample data loaded successfully!' AS '';
SELECT 'You can now test the application with realistic data.' AS '';
SELECT '========================================' AS '';

-- Show summary of prescriptions per diagnosis
SELECT 
    d.diagnosis_id,
    LEFT(d.diagnosis, 50) AS diagnosis_summary,
    COUNT(pi.prescription_item_id) AS prescription_count,
    GROUP_CONCAT(m.name SEPARATOR ', ') AS medications
FROM diagnosis d
LEFT JOIN prescription_item pi ON d.diagnosis_id = pi.diagnosis_id
LEFT JOIN medications m ON pi.medication_id = m.medication_id
GROUP BY d.diagnosis_id, d.diagnosis
ORDER BY d.diagnosis_id;
