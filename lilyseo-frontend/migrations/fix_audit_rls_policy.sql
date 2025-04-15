-- First, let's check the existing RLS policies for the audits table
SELECT * FROM pg_policies WHERE tablename = 'audits';

-- Now let's fix the insert policy for audits
-- Drop the existing insert policy if it exists
DROP POLICY IF EXISTS insert_own_audits ON public.audits;

-- Create a more permissive insert policy that allows service role and authenticated users to insert
CREATE POLICY insert_own_audits ON public.audits
  FOR INSERT 
  WITH CHECK (
    -- Allow inserts where the user_id matches the authenticated user
    auth.uid() = user_id
    OR 
    -- Allow inserts from service role or when using the REST API with proper authentication
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
  );

-- Create a function that can bypass RLS for service role operations
CREATE OR REPLACE FUNCTION insert_audit_bypass_rls(
  p_project_id UUID,
  p_user_id UUID,
  p_url TEXT
)
RETURNS SETOF audits
SECURITY DEFINER -- This runs with the privileges of the function creator
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO audits (
    project_id,
    user_id,
    url,
    status
  )
  VALUES (
    p_project_id,
    p_user_id,
    p_url,
    'pending'
  )
  RETURNING *;
END;
$$ LANGUAGE plpgsql; 