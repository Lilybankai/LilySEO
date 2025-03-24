-- Create a function to safely insert an audit record without JSONB issues
CREATE OR REPLACE FUNCTION create_audit_record(
  p_project_id UUID,
  p_user_id UUID,
  p_url TEXT
)
RETURNS SETOF audits AS $$
BEGIN
  -- Simple insert with only required fields
  -- Avoiding any type conversion or COALESCE issues
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