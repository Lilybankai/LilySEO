-- Schema verification script to help diagnose database issues
-- This script outputs information about tables, columns, and constraints

-- Check audits-related tables
SELECT
  table_name,
  table_schema
FROM
  information_schema.tables
WHERE
  table_schema = 'public'
  AND table_name IN ('audits', 'audit_reports', 'todos')
ORDER BY
  table_name;

-- Check columns in todos table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM
  information_schema.columns
WHERE
  table_schema = 'public'
  AND table_name = 'todos'
ORDER BY
  ordinal_position;

-- Check foreign key constraints
SELECT
  tc.constraint_name,
  tc.table_name AS constrained_table,
  kcu.column_name AS constrained_column,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM
  information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE
  tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name = 'todos';

-- Check if specified audit ID exists in the audits or audit_reports table
SELECT
  'audits' AS table_name,
  COUNT(*) AS matching_records
FROM
  public.audits
WHERE
  id = '29e758dd-20dd-498f-b4f2-d227d1f24759'
UNION ALL
SELECT
  'audit_reports' AS table_name,
  COUNT(*) AS matching_records
FROM
  public.audit_reports
WHERE
  id = '29e758dd-20dd-498f-b4f2-d227d1f24759'
ORDER BY
  table_name;

-- Check schema definitions for the relevant tables
SELECT
  obj_description(oid) AS comment
FROM
  pg_class
WHERE
  relname IN ('audits', 'audit_reports', 'todos')
  AND relkind = 'r';

-- Check indices on todos table
SELECT
  indexname,
  indexdef
FROM
  pg_indexes
WHERE
  tablename = 'todos'
  AND schemaname = 'public'; 