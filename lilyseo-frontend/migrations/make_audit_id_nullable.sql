-- Simpler migration approach: make audit_id nullable without foreign key constraints
-- This is a fallback approach if the other migration fails

-- Check if the constraint exists and drop it
DO $$
BEGIN
  -- Drop the constraint if it exists (try both camelCase and snake_case versions)
  ALTER TABLE public.todos DROP CONSTRAINT IF EXISTS "todos_auditId_fkey";
  ALTER TABLE public.todos DROP CONSTRAINT IF EXISTS todos_audit_id_fkey;
  
  -- If auditId column exists, rename it to audit_id
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'todos' AND column_name = 'auditId'
  ) THEN
    ALTER TABLE public.todos RENAME COLUMN "auditId" TO audit_id;
    RAISE NOTICE 'Renamed auditId column to audit_id';
  END IF;
  
  -- If audit_id doesn't exist yet, create it
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'todos' AND column_name = 'audit_id'
  ) THEN
    ALTER TABLE public.todos ADD COLUMN audit_id uuid;
    RAISE NOTICE 'Created audit_id column';
  END IF;
  
  -- Make sure the column is nullable
  ALTER TABLE public.todos ALTER COLUMN audit_id DROP NOT NULL;
  
  -- Create index if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'todos' AND indexname = 'idx_todos_audit_id'
  ) THEN
    CREATE INDEX idx_todos_audit_id ON public.todos(audit_id);
    RAISE NOTICE 'Created index on audit_id column';
  END IF;
  
  RAISE NOTICE 'Successfully updated audit_id column to be nullable with no foreign key constraint';
END $$; 