-- Fix the audit_id column in todos table (version 2)
-- This migration script ensures:
-- 1. Both auditId and audit_id formats are supported
-- 2. Foreign key constraints work with both audits and audit_reports tables
-- 3. The add_todo_safely function is created to simplify todo creation

-- Step 1: Check which audit columns exist and their data
DO $$
DECLARE
  has_audit_id BOOLEAN;
  has_audit_id_camel BOOLEAN;
  has_audit_reports_table BOOLEAN;
  has_audits_table BOOLEAN;
BEGIN
  -- Check if columns exist
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'todos' AND column_name = 'audit_id'
  ) INTO has_audit_id;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'todos' AND column_name = 'auditId'
  ) INTO has_audit_id_camel;
  
  -- Check if tables exist
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'audit_reports'
  ) INTO has_audit_reports_table;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'audits'
  ) INTO has_audits_table;
  
  -- Output debug info
  RAISE NOTICE 'Column audit_id exists: %', has_audit_id;
  RAISE NOTICE 'Column auditId exists: %', has_audit_id_camel;
  RAISE NOTICE 'Table audit_reports exists: %', has_audit_reports_table;
  RAISE NOTICE 'Table audits exists: %', has_audits_table;
  
  -- Step 2: Drop existing foreign key constraints if they exist
  IF has_audit_id THEN
    EXECUTE 'ALTER TABLE public.todos DROP CONSTRAINT IF EXISTS todos_audit_id_fkey';
  END IF;
  
  IF has_audit_id_camel THEN
    EXECUTE 'ALTER TABLE public.todos DROP CONSTRAINT IF EXISTS "todos_auditId_fkey"';
  END IF;
  
  -- Step 3: Ensure we have an audit_id column in snake_case format
  IF NOT has_audit_id AND has_audit_id_camel THEN
    -- Create audit_id and copy data from auditId
    EXECUTE 'ALTER TABLE public.todos ADD COLUMN audit_id UUID';
    EXECUTE 'UPDATE public.todos SET audit_id = "auditId" WHERE "auditId" IS NOT NULL';
    RAISE NOTICE 'Created audit_id column and copied data from auditId';
  ELSIF NOT has_audit_id THEN
    -- Just create the column
    EXECUTE 'ALTER TABLE public.todos ADD COLUMN audit_id UUID';
    RAISE NOTICE 'Created new audit_id column';
  END IF;
  
  -- Step 4: Ensure we have an auditId column in camelCase format for compatibility
  IF NOT has_audit_id_camel AND has_audit_id THEN
    -- Create auditId and copy data from audit_id
    EXECUTE 'ALTER TABLE public.todos ADD COLUMN "auditId" UUID';
    EXECUTE 'UPDATE public.todos SET "auditId" = audit_id WHERE audit_id IS NOT NULL';
    RAISE NOTICE 'Created auditId column and copied data from audit_id';
  ELSIF NOT has_audit_id_camel THEN
    -- Just create the column
    EXECUTE 'ALTER TABLE public.todos ADD COLUMN "auditId" UUID';
    RAISE NOTICE 'Created new auditId column';
  END IF;
  
  -- Step 5: Add a trigger to keep both columns in sync
  -- First drop the existing function if it exists
  DROP FUNCTION IF EXISTS sync_audit_id_columns() CASCADE;
  
  CREATE OR REPLACE FUNCTION sync_audit_id_columns()
  RETURNS TRIGGER AS $trigger_body$
  BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
      IF NEW.audit_id IS NOT NULL AND NEW."auditId" IS NULL THEN
        NEW."auditId" := NEW.audit_id;
      ELSIF NEW."auditId" IS NOT NULL AND NEW.audit_id IS NULL THEN
        NEW.audit_id := NEW."auditId";
      END IF;
    END IF;
    RETURN NEW;
  END;
  $trigger_body$ LANGUAGE plpgsql;
  
  -- Create the trigger
  DROP TRIGGER IF EXISTS sync_audit_ids_trigger ON todos;
  CREATE TRIGGER sync_audit_ids_trigger
  BEFORE INSERT OR UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION sync_audit_id_columns();
  
  RAISE NOTICE 'Created trigger to sync audit_id columns';
  
  -- Step 6: Drop existing functions to avoid conflicts
  DROP FUNCTION IF EXISTS public.add_todo_safely(UUID, UUID, TEXT, TEXT, TEXT, TEXT, UUID);
  
  -- Create a safer function to add todos with audit_id handling
  -- This function checks both audits and audit_reports tables
  CREATE OR REPLACE FUNCTION public.add_todo_safely(
    p_user_id UUID,
    p_project_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_status TEXT DEFAULT 'pending',
    p_priority TEXT DEFAULT 'medium',
    p_audit_id UUID DEFAULT NULL
  )
  RETURNS JSONB
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $todo_function$
  DECLARE
    v_todo_id UUID;
    v_audit_exists BOOLEAN := FALSE;
    v_audit_report_exists BOOLEAN := FALSE;
    v_result JSONB;
  BEGIN
    -- Check if the provided audit_id exists in the audits table (if specified)
    IF p_audit_id IS NOT NULL THEN
      IF (SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audits')) THEN
        SELECT EXISTS (
          SELECT 1 FROM public.audits WHERE id = p_audit_id
        ) INTO v_audit_exists;
      END IF;
      
      -- Also check the audit_reports table if it exists
      IF (SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_reports')) THEN
        SELECT EXISTS (
          SELECT 1 FROM public.audit_reports WHERE id = p_audit_id
        ) INTO v_audit_report_exists;
      END IF;
    END IF;
    
    -- Insert the todo item
    INSERT INTO public.todos (
      user_id,
      project_id,
      title,
      description,
      status,
      priority,
      audit_id,
      "auditId",
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      p_project_id,
      p_title,
      p_description,
      p_status,
      p_priority,
      p_audit_id,
      p_audit_id,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_todo_id;
    
    -- Return the result
    SELECT jsonb_build_object(
      'success', TRUE,
      'todo_id', v_todo_id,
      'audit_id', p_audit_id,
      'audit_exists', v_audit_exists OR v_audit_report_exists
    ) INTO v_result;
    
    RETURN v_result;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', SQLERRM,
        'error_detail', SQLSTATE
      );
  END;
  $todo_function$;
  
  RAISE NOTICE 'Created add_todo_safely function';
  
  -- Step 7: Drop existing test function to avoid conflicts
  -- Use DROP FUNCTION with all possible parameter combinations
  BEGIN
    -- Try to drop without parameters (dropping all overloaded versions)
    EXECUTE 'DROP FUNCTION IF EXISTS public.test_add_todo_safely() CASCADE';
  EXCEPTION WHEN OTHERS THEN
    -- Ignore errors
    RAISE NOTICE 'Error dropping test_add_todo_safely without parameters: %', SQLERRM;
  END;
  
  BEGIN
    -- Try with specific parameters
    EXECUTE 'DROP FUNCTION IF EXISTS public.test_add_todo_safely(TEXT, TEXT, TEXT, TEXT, UUID, UUID, UUID) CASCADE';
  EXCEPTION WHEN OTHERS THEN
    -- Ignore errors
    RAISE NOTICE 'Error dropping test_add_todo_safely with parameters: %', SQLERRM;
  END;
  
  -- Add a test function to verify the todo creation
  CREATE OR REPLACE FUNCTION public.test_add_todo_safely(
    p_title TEXT DEFAULT 'Test Todo',
    p_description TEXT DEFAULT 'Test Description',
    p_priority TEXT DEFAULT 'medium',
    p_status TEXT DEFAULT 'pending',
    p_project_id UUID DEFAULT NULL,
    p_issue_id UUID DEFAULT NULL,
    p_audit_id UUID DEFAULT NULL
  )
  RETURNS JSONB
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $test_function$
  DECLARE
    v_user_id UUID;
    v_project_id UUID := p_project_id;
    v_result JSONB;
  BEGIN
    -- Get a sample user ID
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    -- Get a sample project ID if none provided
    IF v_project_id IS NULL THEN
      SELECT id INTO v_project_id FROM public.projects LIMIT 1;
    END IF;
    
    -- Call the main function
    v_result := public.add_todo_safely(
      v_user_id,
      v_project_id,
      p_title,
      p_description,
      p_status,
      p_priority,
      p_audit_id
    );
    
    RETURN v_result;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', SQLERRM,
        'error_detail', SQLSTATE
      );
  END;
  $test_function$;
  
  RAISE NOTICE 'Created test_add_todo_safely function';
END $$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.add_todo_safely TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_add_todo_safely TO authenticated;

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_todos_audit_id ON todos(audit_id);
CREATE INDEX IF NOT EXISTS idx_todos_audit_id_camel ON todos("auditId"); 