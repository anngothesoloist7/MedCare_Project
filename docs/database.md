# MedCare Database Documentation

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Normalization to 3NF](#normalization-to-3nf)
3. [Entity-Relationship Diagram](#entity-relationship-diagram)
4. [Table Specifications](#table-specifications)
5. [Indexes and Performance](#indexes-and-performance)
6. [Views](#views)
7. [Stored Procedures](#stored-procedures)
8. [Triggers](#triggers)
9. [Security Configuration](#security-configuration)

---

## Schema Overview

The MedCare database uses a **4-table schema** designed to support an AI-powered patient care system. The schema is normalized to Third Normal Form (3NF) to ensure data integrity, minimize redundancy, and optimize query performance.

### Core Tables

| Table               | Purpose                              | Primary Key                  | Type           |
| ------------------- | ------------------------------------ | ---------------------------- | -------------- |
| `users`             | Base authentication and identity     | `user_id` (VARCHAR)          | Base Entity    |
| `medications`       | Medication catalog with inventory    | `medication_id` (INT)        | Catalog        |
| `diagnosis`         | Medical consultations/diagnoses      | `diagnosis_id` (INT)         | Transaction    |
| `prescription_item` | Prescribed medications per diagnosis | `prescription_item_id` (INT) | Junction Table |

### Design Philosophy

- **Single `users` table**: Stores both doctors and patients, differentiated by `role` ENUM
- **Clerk integration**: `user_id` matches Clerk's external authentication system
- **Inventory tracking**: `medications` table tracks stock levels for prescription validation
- **Audit trails**: All tables include `created_at` and `updated_at` timestamps

---

## Normalization to 3NF

### Functional Dependencies

#### 1. **users** table

```
user_id → nid_number, phone, role, dob, created_at, updated_at
```

- **1NF**: ✅ All attributes are atomic (no repeating groups)
- **2NF**: ✅ No partial dependencies (single-attribute primary key)
- **3NF**: ✅ No transitive dependencies (all non-key attributes depend only on user_id)

#### 2. **medications** table

```
medication_id → name, description, stock_quantity, unit_price, created_at, updated_at
```

- **1NF**: ✅ All attributes are atomic
- **2NF**: ✅ No partial dependencies (single-attribute primary key)
- **3NF**: ✅ No transitive dependencies (all non-key attributes depend only on medication_id)

#### 3. **diagnosis** table

```
diagnosis_id → doctor_id, patient_id, diagnosis, date, next_checkup, created_at, updated_at
```

- **1NF**: ✅ All attributes are atomic
- **2NF**: ✅ No partial dependencies (single-attribute primary key)
- **3NF**: ✅ No transitive dependencies
  - `doctor_id` and `patient_id` are foreign keys, not derived attributes
  - All other attributes depend solely on `diagnosis_id`

#### 4. **prescription_item** table

```
prescription_item_id → diagnosis_id, medication_id, quantity, guide, duration, created_at, updated_at
```

- **1NF**: ✅ All attributes are atomic
- **2NF**: ✅ No partial dependencies (single-attribute primary key)
- **3NF**: ✅ No transitive dependencies
  - `diagnosis_id` and `medication_id` are foreign keys
  - `quantity`, `guide`, and `duration` are specific to this prescription instance

### Normalization Proof

**All tables are in 3NF because:**

1. **First Normal Form (1NF)**: All tables have atomic values with no repeating groups
2. **Second Normal Form (2NF)**: All tables use single-attribute primary keys, eliminating partial dependencies
3. **Third Normal Form (3NF)**: No transitive dependencies exist - all non-key attributes depend directly on the primary key

### Design Decisions

**Why not separate Doctor and Patient tables?**

- Originally considered Class Table Inheritance (6-table design with separate `doctors` and `patients` tables)
- **Decision**: Use single `users` table with `role` ENUM for simplicity
- **Rationale**:
  - Both doctors and patients share the same core attributes (nid_number, phone, dob)
  - No doctor-specific or patient-specific attributes currently needed
  - Simpler schema reduces JOIN complexity
  - Role-based access control handled at application level (Clerk) and database level (MySQL users)
  - Can easily extend with separate tables in future if role-specific attributes are needed

**Why are nid_number, phone, dob, and role optional?**

- **Integration Requirement**: Clerk webhook integration necessitates optional fields
- **User Creation Flow**:
  1. **Webhook Stage**: When a user signs up via Clerk, a webhook immediately creates a user record in our database
     - At this point, only `user_id` is available from Clerk
     - `nid_number`, `phone`, `dob`, and `role` are not yet known
     - Record is created with NULL values for these fields to maintain referential integrity
  2. **Onboarding Stage**: When the user first accesses the application, they must complete onboarding
     - User is required to fill in all "optional" fields (nid_number, phone, dob, role)
     - Application enforces that these fields must be completed before accessing main features
     - Fields are updated from NULL to actual values
- **Database Perspective**: Fields are marked as optional (nullable) to support the webhook integration
- **Application Perspective**: Fields are effectively required - users cannot proceed without completing onboarding
- **Design Trade-off**: We accept temporary incomplete records (during webhook → onboarding transition) to enable seamless Clerk integration

**Why VARCHAR(50) for user_id?**

- Matches Clerk's user ID format (e.g., `user_2abc123def456...`)
- Allows seamless integration with external authentication system
- No need for separate mapping table

**Why separate prescription_item table?**

- Implements many-to-many relationship between diagnosis and medications
- Each prescription has unique dosage instructions (`quantity`, `guide`, `duration`)
- Allows multiple medications per diagnosis
- Enables medication usage tracking and analytics

---

## Entity-Relationship Diagram

### Relationships

```
users (1) ----< (M) diagnosis [as doctor]
users (1) ----< (M) diagnosis [as patient]
diagnosis (1) ----< (M) prescription_item
medications (1) ----< (M) prescription_item
```

- **users → diagnosis**: One doctor can have many diagnoses (1:M)
- **users → diagnosis**: One patient can have many diagnoses (1:M)
- **diagnosis → prescription_item**: One diagnosis can have many prescription items (1:M)
- **medications → prescription_item**: One medication can appear in many prescriptions (1:M)

---

## Table Specifications

### 1. users

**Purpose**: Base authentication and identity table for all users (doctors and patients)

| Column       | Type                      | Constraints                 | Description                   |
| ------------ | ------------------------- | --------------------------- | ----------------------------- |
| `user_id`    | VARCHAR(50)               | PRIMARY KEY                 | Clerk user ID (external auth) |
| `nid_number` | VARCHAR(20)               | UNIQUE, CHECK (length ≥ 9)  | National ID number (optional) |
| `phone`      | VARCHAR(20)               | CHECK (length ≥ 10)         | Phone number (optional)       |
| `role`       | ENUM('Doctor', 'Patient') |                             | User role for RBAC (optional) |
| `dob`        | DATE                      |                             | Date of birth (optional)      |
| `created_at` | TIMESTAMP                 | DEFAULT CURRENT_TIMESTAMP   | Record creation time          |
| `updated_at` | TIMESTAMP                 | ON UPDATE CURRENT_TIMESTAMP | Last update time              |

**Indexes**:

- `idx_users_nid_number` on `nid_number` (fast patient lookup)
- `idx_users_phone` on `phone` (fast patient lookup)
- `idx_users_role` on `role` (role filtering)

**Note on Optional Fields in Users table**:
Fields marked as "optional" (`nid_number`, `phone`, `dob`, `role`) are nullable to support Clerk webhook integration. When a user signs up via Clerk, a webhook creates the user record with only `user_id` available. During the onboarding process, users are required to complete these fields before accessing the application. From a database perspective, these fields are optional; from an application perspective, they are effectively required after onboarding.

---

### 2. medications

**Purpose**: Catalog of all available medications with inventory tracking

| Column           | Type          | Constraints                         | Description                       |
| ---------------- | ------------- | ----------------------------------- | --------------------------------- |
| `medication_id`  | INT           | PRIMARY KEY, AUTO_INCREMENT         | Unique medication ID              |
| `name`           | VARCHAR(255)  | NOT NULL, UNIQUE                    | Medication name                   |
| `description`    | TEXT          |                                     | Medication description (optional) |
| `stock_quantity` | INT           | NOT NULL, DEFAULT 0, CHECK (≥ 0)    | Current stock level               |
| `unit_price`     | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00, CHECK (≥ 0) | Price per unit                    |
| `created_at`     | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP           | Record creation time              |
| `updated_at`     | TIMESTAMP     | ON UPDATE CURRENT_TIMESTAMP         | Last update time                  |

**Indexes**:

- `idx_medications_name` on `name` (medication search)
- `idx_medications_stock` on `stock_quantity` (low stock queries)

---

### 3. diagnosis

**Purpose**: Core transaction table for medical consultations and diagnoses

| Column         | Type        | Constraints                         | Description                       |
| -------------- | ----------- | ----------------------------------- | --------------------------------- |
| `diagnosis_id` | INT         | PRIMARY KEY, AUTO_INCREMENT         | Unique diagnosis ID               |
| `doctor_id`    | VARCHAR(50) | NOT NULL, FK → users(user_id)       | Doctor who made diagnosis         |
| `patient_id`   | VARCHAR(50) | NOT NULL, FK → users(user_id)       | Patient being diagnosed           |
| `diagnosis`    | TEXT        | NOT NULL                            | Diagnosis text/summary            |
| `date`         | DATE        | DEFAULT CURRENT_DATE                | Diagnosis date                    |
| `next_checkup` | DATE        |                                     | Next scheduled checkup (optional) |
| `created_at`   | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP           | Record creation time              |
| `updated_at`   | TIMESTAMP   | ON UPDATE CURRENT_TIMESTAMP         | Last update time                  |

**Constraints**:

- `CHECK (next_checkup IS NULL OR next_checkup >= DATE(date))` - Future checkup dates only
- `ON DELETE RESTRICT` - Cannot delete users with diagnoses
- **Logic Enforcement:** The rule `doctor_id != patient_id` is enforced via `trg_check_doctor_patient_insert` and `trg_check_doctor_patient_update` triggers.
- Protected by `trg_Prevent_Diagnosis_Deletion` trigger.

**Indexes**:

- `idx_diagnosis_patient_id` on `patient_id` (patient history)
- `idx_diagnosis_doctor_id` on `doctor_id` (doctor visits)
- `idx_diagnosis_date` on `date` (date sorting)
- `idx_diagnosis_patient_date` on `(patient_id, date)` (optimized patient history)
- `idx_diagnosis_doctor_date` on `(doctor_id, date)` (optimized doctor visits)

---

### 4. prescription_item

**Purpose**: Junction table linking diagnoses to prescribed medications (M:N relationship)

| Column                 | Type         | Constraints                               | Description                 |
| ---------------------- | ------------ | ----------------------------------------- | --------------------------- |
| `prescription_item_id` | INT          | PRIMARY KEY, AUTO_INCREMENT               | Unique prescription item ID |
| `diagnosis_id`         | INT          | NOT NULL, FK → diagnosis(diagnosis_id)    | Related diagnosis           |
| `medication_id`        | INT          | NOT NULL, FK → medications(medication_id) | Prescribed medication       |
| `quantity`             | INT          | NOT NULL, CHECK (> 0)                     | Quantity prescribed         |
| `guide`                | TEXT         | NOT NULL                                  | Dosage instructions         |
| `duration`             | VARCHAR(255) | NOT NULL                                  | Treatment duration          |
| `created_at`           | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP                 | Record creation time        |
| `updated_at`           | TIMESTAMP    | ON UPDATE CURRENT_TIMESTAMP               | Last update time            |

**Constraints**:

- `ON DELETE RESTRICT` - Cannot delete diagnoses or medications with prescriptions
- Protected by `trg_Prevent_Prescription_Deletion` trigger
- Triggers `trg_AfterInsert_PrescriptionItem` to decrement medication stock

**Indexes**:

- `idx_prescription_diagnosis_id` on `diagnosis_id` (prescriptions per diagnosis)
- `idx_prescription_medication_id` on `medication_id` (medication usage stats)

---

## Indexes and Performance

### Performance Requirements

**NFR-03**: Patient records must be retrieved in under **2 seconds**

### Index Strategy

Total indexes: **16**

#### Users Table (3 indexes)

1. `idx_users_nid_number` - Patient lookup by National ID
2. `idx_users_phone` - Patient lookup by phone number
3. `idx_users_role` - Filter users by role (Doctor/Patient)

#### Diagnosis Table (5 indexes)

1. `idx_diagnosis_patient_id` - Patient's diagnosis history
2. `idx_diagnosis_doctor_id` - Doctor's patient visits
3. `idx_diagnosis_date` - Date-based sorting and filtering
4. `idx_diagnosis_patient_date` - Composite index for patient history queries
5. `idx_diagnosis_doctor_date` - Composite index for doctor visit queries

#### Medications Table (2 indexes)

1. `idx_medications_name` - Medication search and autocomplete
2. `idx_medications_stock` - Low stock alerts and inventory queries

#### Prescription_Item Table (2 indexes)

1. `idx_prescription_diagnosis_id` - Prescriptions per diagnosis
2. `idx_prescription_medication_id` - Medication usage statistics

### Query Optimization

**Composite indexes** are used for common query patterns:

- `(patient_id, date)` optimizes: `WHERE patient_id = ? ORDER BY date DESC`
- `(doctor_id, date)` optimizes: `WHERE doctor_id = ? ORDER BY date DESC`

**Foreign key indexes** improve JOIN performance for:

- Doctor-diagnosis relationships
- Patient-diagnosis relationships
- Diagnosis-prescription relationships
- Medication-prescription relationships

---

## Views

Total views: **6**

### 1. vw_DoctorPatientVisits

**Purpose**: Doctor's patient visits sorted by most recent first

```sql
SELECT diagnosis_id, doctor_id, patient_id, date, diagnosis, next_checkup
FROM diagnosis
ORDER BY date DESC
```

### 2. vw_LowStockMedications

**Purpose**: Medications with lowest stock quantities (alerts)

```sql
SELECT medication_id, name, stock_quantity, unit_price
FROM medications
ORDER BY stock_quantity ASC
LIMIT 5
```

### 3. vw_MedicationPopularity

**Purpose**: Medications ranked by prescription usage count

```sql
SELECT m.medication_id, m.name, m.stock_quantity, m.unit_price,
       COUNT(pi.prescription_item_id) AS usage_count
FROM medications m
LEFT JOIN prescription_item pi ON m.medication_id = pi.medication_id
GROUP BY m.medication_id
ORDER BY usage_count DESC
```

### 4. vw_PatientDiagnosisHistory

**Purpose**: Patient's complete diagnosis history

```sql
SELECT diagnosis_id, patient_id, doctor_id, diagnosis, date, next_checkup
FROM diagnosis
ORDER BY date DESC
```

### 5. vw_PrescriptionDetails

**Purpose**: Detailed prescription information with medication names

```sql
SELECT pi.prescription_item_id, pi.diagnosis_id, pi.medication_id,
       m.name AS medication_name, pi.quantity, pi.guide, pi.duration
FROM prescription_item pi
JOIN medications m ON pi.medication_id = m.medication_id
```

### 6. vw_TodayDiagnoses

**Purpose**: Diagnoses created today (daily statistics)

```sql
SELECT diagnosis_id, doctor_id, patient_id, diagnosis, date
FROM diagnosis
WHERE DATE(date) = CURDATE()
```

---

## Stored Procedures

Total procedures: **2**

### 1. sp_AddDiagnosis

**Purpose**: Insert a new diagnosis record

**Parameters**:

- `p_patient_id` (VARCHAR(50)) - Patient's user ID
- `p_doctor_id` (VARCHAR(50)) - Doctor's user ID
- `p_diagnosis` (VARCHAR(255)) - Diagnosis text
- `p_next_checkup` (DATE) - Next checkup date (optional)

**Logic**:

- Inserts diagnosis with current timestamp
- No validation (simple insert procedure)

### 2. sp_AddPrescriptionItem

**Purpose**: Issue prescription items with stock validation

**Parameters**:

- `p_diagnosis_id` (VARCHAR(50)) - Related diagnosis ID
- `p_medication_id` (VARCHAR(50)) - Medication ID
- `p_quantity` (INT) - Quantity to prescribe
- `p_guide` (TEXT) - Dosage instructions
- `p_duration` (TEXT) - Treatment duration
- `p_doctor_id` (VARCHAR(50)) - Doctor issuing prescription

**Validation Checks**:

1. Medication exists (not NULL)
2. Quantity is positive (> 0)
3. Not out of stock (stock > 0)
4. Sufficient stock (stock >= quantity)

**Concurrency Control**:

- Uses `SELECT ... FOR UPDATE` to lock medication row
- Prevents overselling in concurrent transactions

**Stock Management**:

- Stock decrement handled by `trg_AfterInsert_PrescriptionItem` trigger
- Separation of concerns: validation in procedure, action in trigger

---

## Triggers

Total triggers: **5**

### 1. trg_AfterInsert_PrescriptionItem

**Type**: AFTER INSERT on `prescription_item`

**Purpose**: Automatically decrement medication stock after prescription

**Logic**:

```sql
UPDATE medications
SET stock_quantity = stock_quantity - NEW.quantity
WHERE medication_id = NEW.medication_id
```

**Benefits**:

- Automatic stock management
- Consistency even if INSERT is done outside stored procedure
- Clear separation of validation (procedure) and action (trigger)

### 2. trg_Prevent_Diagnosis_Deletion

**Type**: BEFORE DELETE on `diagnosis`

**Purpose**: Prevent deletion of diagnosis records (audit trail)

**Logic**:

```sql
SIGNAL SQLSTATE '45000'
SET MESSAGE_TEXT = 'Diagnosis records cannot be deleted for audit purposes'
```

**Rationale**: Medical records must be preserved for legal and audit purposes

### 3. trg_Prevent_Prescription_Deletion

**Type**: BEFORE DELETE on `prescription_item`

**Purpose**: Prevent deletion of prescription records (audit trail)

**Logic**:

```sql
SIGNAL SQLSTATE '45000'
SET MESSAGE_TEXT = 'Prescription records cannot be deleted for audit purposes'
```

**Rationale**: Prescription history must be preserved for medical and legal purposes

### 4. trg_check_doctor_patient_insert

**Type**: BEFORE INSERT on `diagnosis`

**Purpose**: Ensures that doctor_id and patient_id are different upon creation.

**Logic**:

```sql
IF NEW.doctor_id = NEW.patient_id THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'doctor_id and patient_id must be different';
END IF;
```

**Rationale**: A doctor cannot diagnose themselves (enforces business rule).

### 5. trg_check_doctor_patient_update

**Type**: BEFORE UPDATE on `diagnosis`

**Purpose**: Ensures that doctor_id and patient_id remain different during updates.

**Logic**:

```sql
IF NEW.doctor_id = NEW.patient_id THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'doctor_id and patient_id must be different';
END IF;
```

**Rationale**: Prevents existing records from being updated to an invalid state.

---

## Security Configuration

### Least-Privilege Principle

- **No DELETE privileges** for doctor, patient, or app users
- **Triggers prevent deletion** of diagnosis and prescription records
- **Stored procedures enforce business logic** before data modification
- **Views provide filtered access** to sensitive data

### SQL Injection Prevention

- **Parameterized queries**: All SQL files use `?` placeholders
- **Prepared statements**: Application uses `mysql2` with parameter binding
- **No string concatenation**: All user input is parameterized

### Authentication

- **Clerk handles user authentication**: Passwords are enterprise-grade encrypted and stored in Clerk
- **user_id matches Clerk ID**: Direct mapping without redundant fields
- **Application-level RBAC**: Web app manages user roles and permissions
- **Database-level RBAC**: MySQL `users.role` enforce access control

---

## Summary

The MedCare database is designed with:

- ✅ **4 tables** in Third Normal Form (3NF)
- ✅ **16 indexes** for query optimization (NFR-03: under 2 seconds)
- ✅ **6 views** for reporting and analytics
- ✅ **2 stored procedures** for business logic
- ✅ **5 triggers** for data integrity and audit trails
- ✅ **2 User Roles** (Doctor & Patient) with strict access control
- ✅ **SQL injection prevention** via parameterized queries
- ✅ **Clerk integration** for external authentication

The schema supports all functional requirements while maintaining data integrity, security, and performance.
