# SQL Files Directory

This directory contains all SQL code, separated from TypeScript/TSX code to avoid merge conflicts when team members work on different parts of the project.

## Directory Structure

- **`queries/`** - SELECT queries (read operations)
  - Example: `getUserById.sql`, `getAllPatients.sql`
- **`mutations/`** - INSERT, UPDATE, DELETE queries (write operations)
  - Example: `createUser.sql`, `updatePatient.sql`, `deleteMedication.sql`
- **`procedures/`** - Stored procedures
  - Example: `sp_IssuePrescriptionItem.sql`, `sp_GetPatientHistory.sql`
- **`schema/`** - DDL statements (CREATE, ALTER, DROP)
  - Example: `create_tables.sql`, `create_indexes.sql`, `create_triggers.sql`

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


