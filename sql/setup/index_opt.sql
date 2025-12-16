-- A. Patient Identification Optimization
-- Context: Receptionists frequently search patients by National ID or Phone.
-- (Note: user_id is already optimized as the Primary Key)
CREATE INDEX idx_nid_number ON users(nid_number);

-- B. Patient History Retrieval Optimization
-- Context: "Get History" is the most used feature by Doctors.
-- Strategy: Compound Index (Filter by Patient -> Sort by Date).
CREATE INDEX idx_doctor_patient_date ON diagnosis(patient_id, date);

-- C. Medication Search Optimization
-- Context: Prefix search for drug names in the prescription module.
CREATE INDEX idx_medication_name ON medications(name);