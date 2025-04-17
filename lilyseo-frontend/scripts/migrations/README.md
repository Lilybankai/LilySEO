# Database Migrations

This directory contains SQL migration scripts for the LilySEO database.

## Running Migrations

### Add Audit ID to Todos Table

The `add_audit_id_to_todos.sql` script adds an `auditId` column to the `todos` table, allowing todos to be associated with specific audits. 

To run this migration:

1. Log in to your Supabase dashboard
2. Go to SQL Editor
3. Copy the contents of `add_audit_id_to_todos.sql`
4. Paste into the SQL editor
5. Click "Run" to execute the migration

The script is idempotent and will only make changes if the column doesn't already exist.

## Troubleshooting

### Syntax Error at or near "BEGIN"

If you encounter the error:
```
ERROR: 42601: syntax error at or near "BEGIN"
LINE 29: BEGIN
```

This is typically related to PostgreSQL function syntax. The updated script in this repository should fix this issue. Make sure you're using the latest version of the script.

If you're still having issues, you can try running simplified parts of the script:

1. First add just the column:
```sql
ALTER TABLE todos ADD COLUMN IF NOT EXISTS "auditId" uuid REFERENCES audit_reports(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_todos_audit_id ON todos("auditId");
```

2. Then manually create the function in a separate query using the UI function builder in Supabase.

### Column Name Case Sensitivity

Note that the application expects the column to be named `auditId` (camelCase) and not `audit_id` (snake_case). This is important because PostgreSQL column names are case-sensitive when quoted. The migration scripts have been updated to use the correct case.

## Error Handling

If you're encountering errors related to missing columns in the `todos` table (for example, "Could not find the 'auditId' column of 'todos'"), you should run the migration script to add the necessary columns.

However, the application is designed to gracefully handle cases where the column doesn't exist, so it will still function even without the migration, though with reduced functionality. 