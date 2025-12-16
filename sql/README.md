# SQL Files Directory

This directory contains all SQL code, separated from TypeScript/TSX code to avoid merge conflicts when team members work on different parts of the project.

## Directory Structure

- **`queries/`** - SELECT queries (read operations)
  - `rbac_setup.sql`, `example.sql`
- **`mutations/`** - INSERT data to tables
  - `insertDiagnosis.sql`, `insertDoctors`, `insertPatients.sql`, `insertMedication.sql`, `insertPrescriptionItem.sql`, `insertUsers.sql`
- **`procedures/`** - Stored procedures
  - `sp_AddDiagnosis.sql`, `sp_AddDoctor.sql`, `sp_AddPatient.sql`, `sp_AddMedication.sql`, `sp_AddPrescriptionItem.sql`, `sp.PatientHistoryRetrieval`
- **`schema/`** - DDL statements (CREATE, ALTER, DROP)
  - `create_diagnosis.sql`, `create_doctors.sql`, `create_medications.sql`, `create_patients.sql`, `create_prescription_item.sql`, `create_users.sql`

## Usage in TypeScript

### Reading Data (SELECT)

```typescript
import { executeQuery } from "@/utils/sql";

// In your API route or server component
const users = await executeQuery<User>("queries/getUserById.sql", [userId]);
```

### Writing Data (INSERT/UPDATE/DELETE)

```typescript
import { executeMutation } from "@/utils/sql";

// Create a new record
const result = await executeMutation("mutations/createUser.sql", [
  name,
  email,
  passwordHash,
]);
console.log(`Created user with ID: ${result.insertId}`);

// Update a record
await executeMutation("mutations/updatePatient.sql", [
  patientId,
  newAge,
  newHeight,
]);
```

### Stored Procedures

```typescript
import { executeProcedure } from "@/utils/sql";

const result = await executeProcedure(
  "procedures/sp_IssuePrescriptionItem.sql",
  [diagnosisId, medicationId, quantity, guide, duration]
);
```

### Transactions

```typescript
import { executeTransaction } from "@/utils/sql";

// Execute multiple queries atomically
const results = await executeTransaction([
  { filePath: "mutations/createUser.sql", params: [name, email] },
  { filePath: "mutations/createProfile.sql", params: [userId, bio] },
]);
```

## SQL File Format

SQL files should use prepared statement placeholders (`?`) for parameters:

```sql
-- queries/getUserById.sql
SELECT * FROM users WHERE user_id = ?;
```

```sql
-- mutations/createUser.sql
INSERT INTO users (full_name, email, password_hash, role)
VALUES (?, ?, ?, ?);
```

## Best Practices

1. **Use prepared statements** - Always use `?` placeholders instead of string concatenation to prevent SQL injection
2. **One query per file** - Keep each SQL file focused on a single query
3. **Descriptive names** - Use clear, descriptive file names that indicate the operation
4. **Comments** - Add comments in SQL files explaining complex queries
5. **Version control** - Commit SQL files to git so team members can collaborate


## Database Setup Flow

### Step 1: Database Creation

File: `sql/setup/create_database.sql`

- Drops and recreates `medcare_db`
- Sets UTF-8 encoding
- Must be run **before everything else**

---

### Step 2: Schema Definition

Folder: `sql/schema/`

Defines **core entities** and relationships:

### Core Tables

| Table               | Description                            |
| ------------------- | -------------------------------------- |
| `users`             | Base identity table (doctor + patient) |
| `doctors`           | Doctor-specific data (1:1 with users)  |
| `patients`          | Patient-specific data (1:1 with users) |
| `diagnosis`         | Medical diagnoses per consultation     |
| `medications`       | Medication catalog with versioning     |
| `prescription_item` | Medication prescribed per diagnosis    |

### Key Design Decisions

- **Single `users` table** for authentication & identity
- **Doctor / Patient tables extend users** via FK
- **Medications use (medication_id + timestamp)**
  - Enables medication versioning
  - Prescriptions always point to the exact version used

---

## Mutations (Seed & Simple Inserts)

Folder: `sql/mutations/`

### Purpose

- Used for **initial data seeding**
- Used for **simple INSERT operations**
- Called directly from TypeScript using parameterized queries

---

## Stored Procedures (Business Logic Layer)

Folder: `sql/procedures/`

Stored procedures handle **rules, validation, role logic, and transactions**. They are the **only supported way to perform writes** in the MedCare system.

### Procedure Design Intention

| Category           | Procedures                            | Responsibility                               |
| ------------------ | ------------------------------------- | -------------------------------------------- |
| Simple insert      | `sp_AddDiagnosis`, `sp_AddMedication` | Insert data only, no validation              |
| Multi-table insert | `sp_AddDoctor`, `sp_AddPatient`       | Insert into `users` + role table in one call |
| Critical logic     | `sp_AddPrescriptionItem`              | Stock validation, concurrency control        |
| Read + RBAC        | `sp_PatientHistoryRetrieval`          | Role-based filtered access                   |

---

## Triggers

Triggers automatically enforce immutability and safety rules:

- Prevent deletion of diagnoses
- Prevent deletion of prescription items

---

## Views

Views provide optimized, read-only datasets for frontend usage:

- Patient history
- Prescription details
- Today’s diagnoses
- Medication popularity

---

## RBAC

- Patients: read-only access to their own data
- Doctors: write access via procedures only
- No direct table modification allowed

---

## Frontend Usage Rules

- Writes → stored procedures
- Reads → views & queries
- Never update core tables directly



