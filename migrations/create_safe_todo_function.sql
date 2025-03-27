-- Create a function to safely add todo items with proper error handling for audit ID
-- This approach bypasses foreign key constraints by using a database function

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
AS $$
DECLARE
  v_todo_id UUID;
  v_audit_exists BOOLEAN;
  v_result JSONB;
BEGIN
  -- Check if the provided audit_id exists in the audits table (if specified)
  IF p_audit_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.audits WHERE id = p_audit_id
    ) INTO v_audit_exists;
    
    -- If audit doesn't exist in audits table, try audit_reports table
    IF NOT v_audit_exists THEN
      SELECT EXISTS (
        SELECT 1 FROM public.audit_reports WHERE id = p_audit_id
      ) INTO v_audit_exists;
    END IF;
    
    -- If audit doesn't exist anywhere, set it to NULL
    IF NOT v_audit_exists THEN
      p_audit_id := NULL;
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
    NOW(),
    NOW()
  )
  RETURNING id INTO v_todo_id;
  
  -- Return the result
  SELECT jsonb_build_object(
    'success', TRUE,
    'todo_id', v_todo_id,
    'audit_id', p_audit_id,
    'audit_exists', v_audit_exists
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
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.add_todo_safely TO authenticated;

-- Create a function to test if the add_todo_safely function works
CREATE OR REPLACE FUNCTION public.test_add_todo_safely()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_project_id UUID;
  v_result JSONB;
BEGIN
  -- Get a sample user ID
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  -- Get a sample project ID
  SELECT id INTO v_project_id FROM public.projects LIMIT 1;
  
  -- Test with a valid but non-existent audit ID
  v_result := public.add_todo_safely(
    v_user_id,
    v_project_id,
    'Test Todo - Safe Function',
    'Testing the safe todo function',
    'pending',
    'medium',
    '00000000-0000-0000-0000-000000000000'::UUID
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
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.test_add_todo_safely TO authenticated; 