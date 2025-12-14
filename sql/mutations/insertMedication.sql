-- Insert a new medication into the medications table
-- This mutation is used to test the database connection between Next.js and Railway MySQL
-- 
-- Parameters (in order):
-- 1. name (VARCHAR) - Name of the medication
-- 2. description (TEXT) - Description of the medication
-- 3. stock_quantity (INT) - Current stock quantity
-- 4. unit_price (DECIMAL) - Price per unit
--
-- Usage in TypeScript:
-- executeMutation('mutations/insertMedication.sql', [name, description, stockQuantity, unitPrice])
--
-- Returns: Result object with insertId (the ID of the newly created medication)

-- MEDICATIONS TABLE
INSERT INTO medications 
(medication_id, name, description, stock_quantity, staff_id, created_at) 
VALUES
('M001', 'Lisinopril 10mg', 'ACE inhibitor for hypertension', 500, 'D001', '2023-02-01 08:00:00'),
('M002', 'Metformin 500mg', 'Oral hypoglycemic for type 2 diabetes', 750, 'D002', '2023-02-01 09:15:00'),
('M003', 'Amoxicillin 250mg', 'Broad-spectrum penicillin antibiotic', 300, 'D003', '2023-02-01 10:30:00'),
('M004', 'Ibuprofen 400mg', 'NSAID for pain and inflammation', 1000, 'D004', '2023-02-01 11:45:00'),
('M005', 'Omeprazole 20mg', 'Proton pump inhibitor for GERD', 600, 'D005', '2023-02-01 13:00:00'),
('M006', 'Loratadine 10mg', 'Antihistamine for allergies', 800, 'D006', '2023-02-02 08:30:00'),
('M007', 'Sertraline 50mg', 'SSRI antidepressant', 450, 'D007', '2023-02-02 10:00:00'),
('M008', 'Acetaminophen 500mg', 'Analgesic and antipyretic', 1200, 'D008', '2023-02-02 11:20:00'),
('M009', 'Albuterol Inhaler', 'Bronchodilator for asthma', 150, 'D009', '2023-02-02 14:15:00'),
('M010', 'Atorvastatin 20mg', 'Statin for cholesterol management', 550, 'D010', '2023-02-03 09:45:00'),
('M011', 'Zolpidem 10mg', 'Sedative-hypnotic for insomnia', 200, 'D001', '2023-02-03 11:30:00'),
('M012', 'Hydrocortisone 1% Cream', 'Topical steroid for dermatitis', 180, 'D002', '2023-02-03 13:45:00'),
('M013', 'Ciprofloxacin 500mg', 'Fluoroquinolone antibiotic for UTI', 250, 'D003', '2023-02-04 10:15:00'),
('M014', 'Naproxen 250mg', 'NSAID for arthritis pain', 400, 'D004', '2023-02-04 12:00:00'),
('M015', 'Vitamin D3 1000IU', 'Dietary supplement', 900, 'D005', '2023-02-04 14:30:00'),
('M016', 'Clonazepam 0.5mg', 'Benzodiazepine for anxiety', 120, 'D006', '2023-02-05 09:00:00'),
('M017', 'Losartan 50mg', 'ARB for hypertension', 350, 'D007', '2023-02-05 11:15:00'),
('M018', 'Gabapentin 300mg', 'For neuropathic pain', 275, 'D008', '2023-02-05 13:45:00');

