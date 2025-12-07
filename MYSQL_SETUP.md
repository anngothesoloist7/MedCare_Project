# MySQL Setup Guide

This guide explains how to use MySQL (deployed on Railway) with this Next.js project.

## Quick Start

1. **Install dependencies** (already done)
   ```bash
   pnpm install
   ```

2. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your Railway MySQL deployment credentials:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` with your Railway MySQL values:
     - `MYSQLHOST` or `MYSQL_HOST`
     - `MYSQLPORT` or `MYSQL_PORT` (usually 3306)
     - `MYSQLUSER` or `MYSQL_USER`
     - `MYSQLPASSWORD` or `MYSQL_PASSWORD` or `MYSQL_ROOT_PASSWORD`
     - `MYSQLDATABASE` or `MYSQL_DATABASE`
     - OR use `MYSQL_URL` or `MYSQL_PUBLIC_URL` (full connection string)

3. **Create your SQL files**
   - Add SELECT queries in `sql/queries/`
   - Add INSERT/UPDATE/DELETE in `sql/mutations/`
   - Add stored procedures in `sql/procedures/`
   - Add DDL statements in `sql/schema/`

4. **Use in your code**
   ```typescript
   import { executeQuery, executeMutation } from '@/utils/sql';
   
   // Read data
   const users = await executeQuery('queries/getUserById.sql', [userId]);
   
   // Write data
   const result = await executeMutation('mutations/createUser.sql', [name, email]);
   ```

## Project Structure

```
medcare/
├── sql/                          # All SQL code (separated from TS/TSX)
│   ├── queries/                  # SELECT queries (read operations)
│   ├── mutations/                # INSERT/UPDATE/DELETE (write operations)
│   ├── procedures/               # Stored procedures
│   └── schema/                   # DDL statements (CREATE, ALTER, DROP)
├── src/
│   ├── utils/
│   │   ├── db.ts                 # Database connection pool
│   │   └── sql.ts                # SQL execution utilities
│   └── app/
│       └── api/
│           └── example/           # Example API route (delete when ready)
└── .env                          # Environment variables (not in git)
```

## Key Files

### `src/utils/db.ts`
- Manages MySQL connection pool
- Handles Railway environment variables
- Provides `query()`, `getConnection()`, and `closePool()` functions

### `src/utils/sql.ts`
- `executeQuery()` - Execute SELECT queries
- `executeMutation()` - Execute INSERT/UPDATE/DELETE
- `executeProcedure()` - Execute stored procedures
- `executeTransaction()` - Execute multiple queries atomically
- `executeRaw()` - Execute raw SQL (use sparingly)

## Writing SQL Files

### Example SELECT Query (`sql/queries/getUserById.sql`)
```sql
SELECT user_id, full_name, email, role
FROM users
WHERE user_id = ?;
```

### Example INSERT Mutation (`sql/mutations/createUser.sql`)
```sql
INSERT INTO users (full_name, email, password_hash, role)
VALUES (?, ?, ?, ?);
```

### Example Stored Procedure Call (`sql/procedures/sp_IssuePrescriptionItem.sql`)
```sql
CALL sp_IssuePrescriptionItem(?, ?, ?, ?, ?);
```

## Usage Examples

### In API Routes (`src/app/api/`)
```typescript
import { executeQuery, executeMutation } from '@/utils/sql';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const userId = new URL(request.url).searchParams.get('userId');
  const users = await executeQuery('queries/getUserById.sql', [userId]);
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const { name, email } = await request.json();
  const result = await executeMutation('mutations/createUser.sql', [name, email]);
  return NextResponse.json({ id: result.insertId });
}
```

### In Server Components
```typescript
import { executeQuery } from '@/utils/sql';

export default async function UsersPage() {
  const users = await executeQuery('queries/getAllUsers.sql');
  return <div>{/* render users */}</div>;
}
```

### Transactions
```typescript
import { executeTransaction } from '@/utils/sql';

// Execute multiple queries atomically
const results = await executeTransaction([
  { filePath: 'mutations/createUser.sql', params: [name, email] },
  { filePath: 'mutations/createProfile.sql', params: [userId, bio] }
]);
```

## Railway Environment Variables

Railway provides these variables for MySQL:
- `MYSQLHOST` - Database host
- `MYSQLPORT` - Database port
- `MYSQLUSER` - Database user
- `MYSQLPASSWORD` - Database password
- `MYSQLDATABASE` - Database name
- `MYSQL_URL` - Full connection URL (alternative)
- `MYSQL_PUBLIC_URL` - Public connection URL (alternative)

The code supports both formats:
- Railway format: `MYSQLHOST`, `MYSQLPORT`, etc.
- Standard format: `MYSQL_HOST`, `MYSQL_PORT`, etc.
- URL format: `MYSQL_URL` or `MYSQL_PUBLIC_URL`

## Best Practices

1. **Always use prepared statements** - Use `?` placeholders, never string concatenation
2. **Separate SQL from TypeScript** - Keep all SQL in `sql/` directory
3. **One query per file** - Each SQL file should contain one query
4. **Descriptive names** - Use clear file names like `getUserById.sql`
5. **Type safety** - Use TypeScript types when calling queries:
   ```typescript
   interface User {
     user_id: number;
     full_name: string;
     email: string;
   }
   const users = await executeQuery<User>('queries/getUserById.sql', [userId]);
   ```

## Troubleshooting

### Connection Errors
- Verify environment variables are set correctly
- Check Railway MySQL service is running
- Ensure network access is allowed

### SQL File Not Found
- Check file path is relative to `sql/` directory
- Verify file extension is `.sql`
- Ensure file is committed to git

### Type Errors
- Use TypeScript interfaces for query results
- Check parameter types match SQL placeholders

## Next Steps

1. Delete `src/app/api/example/route.ts` when you start implementing real routes
2. Create your database schema in `sql/schema/`
3. Write your queries in `sql/queries/` and `sql/mutations/`
4. Implement your API routes using the SQL utilities



