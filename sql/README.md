# Database Setup Guide

Complete step-by-step instructions to set up the MedCare database.

---

## 📋 Quick Setup

**⚠️ IMPORTANT**: Run in this exact order (dependency order):

# Step 1: Create database

CREATE DATABASE medcare_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Step 2: Create tables by running sql files

`sql/schema/create_users.sql`
`sql/schema/create_medications.sql`
`sql/schema/create_diagnosis.sql`
`sql/schema/create_prescription_item.sql`

# Step 3: Create indexes by running sql files

`sql/schema/create_indexes.sql`

# Step 4: Create views by running sql files

`sql/views/vw_DoctorPatientVisits.sql`
`sql/views/vw_LowStockMedications.sql`
`sql/views/vw_MedicationPopularity.sql`
`sql/views/vw_PatientDiagnosisHistory.sql`
`sql/views/vw_PrescriptionDetails.sql`
`sql/views/vw_TodayDiagnoses.sql`

# Step 5: Create procedures & triggers by running sql files

`sql/procedures/sp_AddDiagnosis.sql`
`sql/procedures/sp_AddPrescriptionItem.sql`
`sql/triggers/trg_AfterInsert_PrescriptionItem.sql`
`sql/triggers/trg_Prevent_Diagnosis_Deletion.sql`
`sql/triggers/trg_Prevent_Prescription_Deletion.sql`
`sql/triggers/trg_Check_DoctorPatient_insert.sql`
`sql/triggers/trg_Check_DoctorPatient_update.sql`

---

## 📂 Directory Structure

```
sql/
├── README.md (this file)
├── schema/          Tables & indexes
├── views/           Reporting views
├── procedures/      Business logic
├── triggers/        Data integrity
├── seed/            Sample data
├── queries/         Query templates
└── mutations/       Update templates
```

## 🧪 Load Sample Data

**Prerequisites**:

1. Create 2 users via web app (1 doctor, 1 patient)
2. Complete onboarding (remember your NIDs)
3. Edit `sql/seed/seed_all.sql`:
   ```sql
   SET @DOCTOR_NID = 'your_doctor_nid';
   SET @PATIENT_NID = 'your_patient_nid';
   ```

**Run**:

```bash
mysql -u root -p medcare_db < sql/seed/seed_all.sql
```

Loads: 15 medications | 8 diagnoses | 12 prescription items

---

## ✅ Verification

```sql
SELECT
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'medcare_db' AND TABLE_TYPE = 'BASE TABLE') AS tables,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'medcare_db' AND INDEX_NAME != 'PRIMARY') AS indexes,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_SCHEMA = 'medcare_db') AS views,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_SCHEMA = 'medcare_db' AND ROUTINE_TYPE = 'PROCEDURE') AS procedures,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TRIGGERS WHERE TRIGGER_SCHEMA = 'medcare_db') AS triggers;
```

**Expected**: Tables: 4 | Indexes: 16 (including 12 created and 4 PRIMARY) | Views: 6 | Procedures: 2 | Triggers: 5

---

## 🔄 Reset Database

```bash
mysql -u root -p -e "DROP DATABASE IF EXISTS medcare_db;"
# Then repeat setup from Step 1
```

---

## 📚 Next Steps

1. **Configure App**: Update `.env` with database credentials
2. **Create Users**: Sign up via web app

For detailed schema documentation, see [`docs/database.md`](../docs/database.md)
