# Database Setup Scripts

This folder contains scripts to set up the MedCare database from scratch.

## Files

### `create_database.sql`
Creates the `medcare_db` database with proper UTF-8 charset and collation.
Run this first if the database doesn't exist.

### `initial_data.sql`
Inserts sample data for testing purposes, including:
- Sample users (doctors and patients)
- Doctor and patient details
- Sample medications
- Diagnosis records
- Prescription items
- Medication compliance records

### `setup_all.sql`
Master setup script that runs all setup operations in the correct order:
1. Creates database
2. Creates all tables (schema files)
3. Creates triggers
4. Creates stored procedures
5. Creates views
6. Inserts initial data

## Functional Requirements
- FR-02: Medication Management (/procedures/sp_PrescriptionItem.sql)
- FR-03: Patient History Retrieval + FR-05: Medical Record Access 
-> Role-Based Access
We create a view that joins patients with their consultations (read-only) in vw_PatientConsultation.
Runs sp_PatientHistoryRetrieval
1. Patient -> vw_PatientConsultation
2. Doctor -> sp_PatientConsultation -> vw_PatientConsultation (needs integrate name for faster lookup).


- FR-04: Clinical Dashboard (/views/vw_DailyClinicalStats.sql)
- FR-06: Medication Tracking
create_medication_compliance.sql -> vw_PatientActiveMeds -> sp_MarkMedicationTaken 
Patients are only allowed to read prescription so use vw_PatientActiveMeds to show medications (required filter based on patient_id).
Then, patients could tick on which medications they have taken and sp_MarkMedicationTaken adds those to medication_compliance table.
- FR-09: System Reporting (/procedures/sp_GenerateMonthlyReport.sql)



## Usage

### Option 1: Run everything at once
```bash
mysql -u username -p < sql/setup/setup_all.sql
```

### Option 2: Run step by step
```bash
# 1. Create database
mysql -u username -p < sql/setup/create_database.sql

# 2. Create tables (run schema files in order)
mysql -u username -p medcare_db < sql/schema/01_users.sql
mysql -u username -p medcare_db < sql/schema/02_doctors.sql
# ... continue with other schema files

# 3. Create triggers, procedures, views
mysql -u username -p medcare_db < sql/triggers/create_triggers.sql
mysql -u username -p medcare_db < sql/procedures/create_procedures.sql
mysql -u username -p medcare_db < sql/views/create_views.sql

# 4. Insert initial data
mysql -u username -p medcare_db < sql/setup/initial_data.sql
```

## Notes

- Make sure you have the necessary permissions to create databases and tables
- The scripts use `IF NOT EXISTS` clauses to avoid errors if objects already exist
- Initial data is for testing purposes only - remove or modify for production use
- All scripts assume the database name `medcare_db`