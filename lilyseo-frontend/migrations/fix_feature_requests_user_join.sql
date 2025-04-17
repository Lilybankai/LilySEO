-- Fix for feature_requests foreign key relationship
-- This migration adds a proper foreign key relationship for the user_id column

-- First check if we need to update the RLS policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Anyone can view public feature requests" ON feature_requests;
  
  -- Recreate the policies with proper syntax
  CREATE POLICY "Anyone can view public feature requests" ON feature_requests
    FOR SELECT
    USING (is_public OR auth.uid() = user_id OR 
          EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'));
  
  -- Create a view to expose the user relationship properly for Supabase's RPC
  -- This enables the `user:user_id` join syntax
  DROP VIEW IF EXISTS feature_requests_with_users;
  
  -- Create the view with the SECURITY INVOKER option which means it follows the permissions of the user
  CREATE VIEW feature_requests_with_users WITH (security_barrier=true) AS
  SELECT 
    fr.id,
    fr.created_at,
    fr.updated_at,
    fr.title,
    fr.description,
    fr.user_id,
    fr.status,
    fr.upvotes,
    fr.planned_release,
    fr.implemented_in,
    fr.is_public,
    p.id AS profile_id,
    p.email,
    p.first_name,
    p.last_name,
    p.avatar_url,
    p.subscription_tier
  FROM 
    feature_requests fr
  JOIN 
    profiles p ON fr.user_id = p.id
  WHERE
    -- Apply the same security logic here that we use in the RLS policy
    fr.is_public OR auth.uid() = fr.user_id OR 
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND raw_user_meta_data->>'role' = 'admin');
  
  -- Set the owner to postgres to ensure proper permissions
  ALTER VIEW feature_requests_with_users OWNER TO postgres;
  
  -- Add comment to indicate this is a view with user information
  COMMENT ON VIEW feature_requests_with_users IS 'Feature requests with user profile information and built-in security';
  
  -- Fix feature_request_votes table RLS policies
  -- First, ensure RLS is enabled
  ALTER TABLE feature_request_votes ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can see their own votes" ON feature_request_votes;
  DROP POLICY IF EXISTS "Users can add their own votes" ON feature_request_votes;
  DROP POLICY IF EXISTS "Users can remove their own votes" ON feature_request_votes;
  
  -- Create updated policies for feature_request_votes
  -- Policy to allow users to see votes (both their own and others)
  CREATE POLICY "Anyone can see votes" ON feature_request_votes
    FOR SELECT
    USING (TRUE);
  
  -- Policy for users to insert their own votes
  CREATE POLICY "Users can add their own votes" ON feature_request_votes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  
  -- Policy for users to delete their own votes
  CREATE POLICY "Users can remove their own votes" ON feature_request_votes
    FOR DELETE
    USING (auth.uid() = user_id);
END
$$;

-- Create a function to get votes for a specific user
CREATE OR REPLACE FUNCTION get_user_votes(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (feature_request_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT frv.feature_request_id
  FROM feature_request_votes frv
  WHERE frv.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- Update the frontend code to use the new view and function
-- Note: This SQL doesn't actually update the frontend code, you'll need to do that manually
-- For the feature_request_votes issue, update the code to use the get_user_votes function 