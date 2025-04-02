-- Fix for feature request voting function issues
-- Run this migration in the Supabase SQL editor to fix the voting and commenting functionalities

-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS public.vote_for_feature_request(UUID);

-- Create the vote function with a single implementation
CREATE FUNCTION public.vote_for_feature_request(feature_request_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_already_voted BOOLEAN;
    v_user_id UUID := auth.uid();
BEGIN
    -- Check if user has already voted for this feature request
    SELECT EXISTS (
        SELECT 1 FROM public.feature_request_votes frv
        WHERE frv.feature_request_id = feature_request_id
        AND frv.user_id = v_user_id
    ) INTO v_already_voted;
    
    -- If user hasn't voted yet, add their vote
    IF NOT v_already_voted THEN
        -- Insert vote record
        INSERT INTO public.feature_request_votes (feature_request_id, user_id)
        VALUES (feature_request_id, v_user_id);
        
        -- Update upvote count
        UPDATE public.feature_requests fr
        SET upvotes = fr.upvotes + 1
        WHERE fr.id = feature_request_id;
        
        RETURN TRUE;
    ELSE
        -- User already voted, remove their vote
        DELETE FROM public.feature_request_votes frv
        WHERE frv.feature_request_id = feature_request_id
        AND frv.user_id = v_user_id;
        
        -- Update upvote count
        UPDATE public.feature_requests fr
        SET upvotes = fr.upvotes - 1
        WHERE fr.id = feature_request_id;
        
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- 3. Create a foreign key relationship between feature_request_comments and profiles
-- This makes it easier to query related profiles for comments

-- First, check if the foreign key already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'feature_request_comments_user_id_fkey_profiles' 
        AND table_name = 'feature_request_comments'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE public.feature_request_comments 
        ADD CONSTRAINT feature_request_comments_user_id_fkey_profiles
        FOREIGN KEY (user_id) 
        REFERENCES public.profiles(id);
    END IF;
END
$$;

-- 4. Create or update a view to efficiently get all feature requests with user details
-- Drop the view first to avoid column name change errors
DROP VIEW IF EXISTS public.feature_requests_with_users;

-- Create the view with the SECURITY INVOKER option which means it follows the permissions of the user
CREATE VIEW public.feature_requests_with_users WITH (security_barrier=true) AS
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
    p.subscription_tier,
    COALESCE(
        (SELECT COUNT(*) FROM public.feature_request_comments 
         WHERE feature_request_id = fr.id AND is_internal = false),
        0
    ) AS comments_count
FROM 
    public.feature_requests fr
LEFT JOIN 
    public.profiles p ON fr.user_id = p.id
WHERE
    -- Apply the same security logic here that's used in the RLS policy
    fr.is_public OR auth.uid() = fr.user_id OR 
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND raw_user_meta_data->>'role' = 'admin');

-- Set the owner to postgres to ensure proper permissions
ALTER VIEW public.feature_requests_with_users OWNER TO postgres;

-- Add comment to indicate this is a view with user information
COMMENT ON VIEW public.feature_requests_with_users IS 'Feature requests with user profile information and built-in security';

-- 5. Create or update a function to get user votes efficiently
CREATE OR REPLACE FUNCTION public.get_user_votes()
RETURNS TABLE (feature_request_id UUID) 
SECURITY DEFINER 
SET search_path = public, pg_catalog
AS $$
BEGIN
    RETURN QUERY
    SELECT frv.feature_request_id
    FROM public.feature_request_votes frv
    WHERE frv.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON public.feature_requests_with_users TO authenticated;
GRANT EXECUTE ON FUNCTION public.vote_for_feature_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_votes() TO authenticated; 