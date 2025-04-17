-- Fix the audit_id column in todos table
-- This migration script addresses issues with the audit_id column in the todos table:
-- 1. Drops the incorrect foreign key constraint (if it exists)
-- 2. Updates column naming convention to snake_case
-- 3. Sets up correct foreign key reference to audits table

-- First, check what table the audit IDs are actually in
DO $$
DECLARE
  audit_table_exists BOOLEAN;
  audit_reports_table_exists BOOLEAN;
  constraint_exists BOOLEAN;
BEGIN
  -- Check if audits table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'audits'
  ) INTO audit_table_exists;
  
  -- Check if audit_reports table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'audit_reports'
  ) INTO audit_reports_table_exists;
  
  -- Check if the constraint exists
  SELECT EXISTS (
    SELECT FROM information_schema.table_constraints
    WHERE constraint_name = 'todos_auditId_fkey'
    AND table_schema = 'public'
  ) INTO constraint_exists;
  
  -- Drop the incorrect foreign key constraint if it exists
  IF constraint_exists THEN
    EXECUTE 'ALTER TABLE public.todos DROP CONSTRAINT IF EXISTS "todos_auditId_fkey"';
    RAISE NOTICE 'Dropped foreign key constraint todos_auditId_fkey';
  ELSE
    RAISE NOTICE 'Foreign key constraint todos_auditId_fkey does not exist';
  END IF;
  
  -- Check if audit_id column exists
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'todos' AND column_name = 'audit_id'
  ) THEN
    -- If both columns exist, we need to decide which one to keep (prefer audit_id)
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'todos' AND column_name = 'auditId'
    ) THEN
      -- Update records to ensure audit_id has all the data from auditId
      EXECUTE 'UPDATE public.todos SET audit_id = "auditId" WHERE audit_id IS NULL AND "auditId" IS NOT NULL';
      
      -- Drop the camelCase column (assuming snake_case is the preferred convention)
      EXECUTE 'ALTER TABLE public.todos DROP COLUMN IF EXISTS "auditId"';
      RAISE NOTICE 'Dropped duplicate auditId column, kept audit_id';
    ELSE
      RAISE NOTICE 'Only audit_id column exists, keeping it';
    END IF;
  ELSE
    -- If only auditId exists, rename it to audit_id
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'todos' AND column_name = 'auditId'
    ) THEN
      EXECUTE 'ALTER TABLE public.todos RENAME COLUMN "auditId" TO audit_id';
      RAISE NOTICE 'Renamed auditId column to audit_id';
    ELSE
      -- Neither column exists, create it
      EXECUTE 'ALTER TABLE public.todos ADD COLUMN audit_id uuid';
      RAISE NOTICE 'Created audit_id column';
    END IF;
  END IF;
  
  -- Create the correct foreign key constraint
  IF audit_table_exists THEN
    -- Link to audits table if it exists
    EXECUTE 'ALTER TABLE public.todos ADD CONSTRAINT todos_audit_id_fkey FOREIGN KEY (audit_id) REFERENCES public.audits(id) ON DELETE SET NULL';
    RAISE NOTICE 'Created foreign key constraint to audits table';
  ELSIF audit_reports_table_exists THEN
    -- Link to audit_reports if that's the table that exists
    EXECUTE 'ALTER TABLE public.todos ADD CONSTRAINT todos_audit_id_fkey FOREIGN KEY (audit_id) REFERENCES public.audit_reports(id) ON DELETE SET NULL';
    RAISE NOTICE 'Created foreign key constraint to audit_reports table';
  ELSE
    RAISE NOTICE 'Neither audits nor audit_reports tables exist. Skipping foreign key creation.';
  END IF;
  
  -- Create an index for better performance
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'todos' AND indexname = 'idx_todos_audit_id'
  ) THEN
    EXECUTE 'CREATE INDEX idx_todos_audit_id ON public.todos(audit_id)';
    RAISE NOTICE 'Created index on audit_id column';
  ELSE
    RAISE NOTICE 'Index already exists on audit_id column';
  END IF;
END $$; 