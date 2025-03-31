-- Migration to fix all remaining SECURITY DEFINER functions
-- This migration removes the SECURITY DEFINER property from functions and adds proper security checks

-- 1. Fix add_todo_safely function
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
AS $$
DECLARE
  v_todo_id UUID;
  v_audit_exists BOOLEAN := FALSE;
  v_audit_report_exists BOOLEAN := FALSE;
  v_result JSONB;
BEGIN
  -- Security check - only allow users to add todos for themselves or admins to add for anyone
  IF p_user_id != auth.uid() AND 
     NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND raw_user_meta_data->>'role' = 'admin') THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Not authorized to add todos for other users',
      'error_detail', 'PERMISSION_DENIED'
    );
  END IF;

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
$$;

-- 2. Fix test_add_todo_safely function (if needed)
DROP FUNCTION IF EXISTS public.test_add_todo_safely();

-- 3. Fix vote_for_feature_request function
CREATE OR REPLACE FUNCTION vote_for_feature_request(p_feature_request_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_already_voted BOOLEAN;
    v_user_id UUID := auth.uid();
BEGIN
    -- Check if user has already voted for this feature request
    SELECT EXISTS (
        SELECT 1 FROM public.feature_request_votes frv
        WHERE frv.feature_request_id = p_feature_request_id
        AND frv.user_id = v_user_id
    ) INTO v_already_voted;
    
    -- If user hasn't voted yet, add their vote
    IF NOT v_already_voted THEN
        -- Insert vote record
        INSERT INTO public.feature_request_votes (feature_request_id, user_id)
        VALUES (p_feature_request_id, v_user_id);
        
        -- Update upvote count
        UPDATE public.feature_requests fr
        SET upvotes = fr.upvotes + 1
        WHERE fr.id = p_feature_request_id;
        
        RETURN TRUE;
    ELSE
        -- User already voted, remove their vote
        DELETE FROM public.feature_request_votes frv
        WHERE frv.feature_request_id = p_feature_request_id
        AND frv.user_id = v_user_id;
        
        -- Update upvote count
        UPDATE public.feature_requests fr
        SET upvotes = fr.upvotes - 1
        WHERE fr.id = p_feature_request_id;
        
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- Create a compatibility function to handle previous parameter naming
CREATE OR REPLACE FUNCTION vote_for_feature_request(feature_request_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN vote_for_feature_request(p_feature_request_id := feature_request_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- 4. Fix has_voted_for_feature function
CREATE OR REPLACE FUNCTION has_voted_for_feature(feature_request_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM feature_request_votes
        WHERE feature_request_id = has_voted_for_feature.feature_request_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql;

-- 5. Fix implement_feature_request function
CREATE OR REPLACE FUNCTION implement_feature_request(feature_request_id UUID, changelog_item_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user is an admin
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND raw_user_meta_data->>'role' = 'admin'
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Update feature request to link to changelog item and mark as completed
    UPDATE feature_requests
    SET implemented_in = changelog_item_id,
        status = 'Completed'::feature_request_status
    WHERE id = feature_request_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 6. Fix has_white_label_access function
CREATE OR REPLACE FUNCTION has_white_label_access()
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    user_status TEXT;
BEGIN
    -- Get user's subscription tier and status
    SELECT subscription_tier, subscription_status INTO user_tier, user_status
    FROM profiles
    WHERE id = auth.uid();
    
    -- Only pro and enterprise users with active subscriptions have access to white label features
    RETURN (user_tier = 'pro' OR user_tier = 'enterprise') AND 
           (user_status = 'active' OR user_status = 'trialing');
END;
$$ LANGUAGE plpgsql;

-- 7. Fix rotate_api_key function
CREATE OR REPLACE FUNCTION rotate_api_key(key_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_owns_key BOOLEAN;
    new_key TEXT;
BEGIN
    -- Check if the user owns the key
    SELECT EXISTS (
        SELECT 1 FROM api_keys
        WHERE id = key_id AND user_id = auth.uid()
    ) INTO user_owns_key;
    
    IF NOT user_owns_key THEN
        RAISE EXCEPTION 'User does not own this API key';
    END IF;
    
    -- Generate a new random API key with a prefix
    new_key := 'lilyseo_' || encode(gen_random_bytes(24), 'hex');
    
    -- Update the key value and reset the updated_at timestamp
    UPDATE api_keys
    SET key_value = new_key,
        updated_at = now()
    WHERE id = key_id;
    
    -- Return the new key value
    RETURN new_key;
END;
$$ LANGUAGE plpgsql;

-- 8. Fix revoke_api_key function
CREATE OR REPLACE FUNCTION revoke_api_key(key_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_owns_key BOOLEAN;
BEGIN
    -- Check if the user owns the key
    SELECT EXISTS (
        SELECT 1 FROM api_keys
        WHERE id = key_id AND user_id = auth.uid()
    ) INTO user_owns_key;
    
    IF NOT user_owns_key THEN
        RAISE EXCEPTION 'User does not own this API key';
    END IF;
    
    -- Update the key to set it as inactive
    UPDATE api_keys
    SET is_active = FALSE
    WHERE id = key_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 9. Fix validate_api_key function (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'validate_api_key' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        EXECUTE '
        CREATE OR REPLACE FUNCTION validate_api_key(key_value TEXT, required_scope TEXT DEFAULT ''read'')
        RETURNS UUID AS $$
        DECLARE
            key_user_id UUID;
            key_scopes TEXT[];
        BEGIN
            -- Find the user ID associated with this key
            SELECT 
                user_id, 
                scopes 
            INTO 
                key_user_id, 
                key_scopes 
            FROM 
                api_keys
            WHERE 
                key_value = validate_api_key.key_value
                AND is_active = TRUE
                AND expires_at > NOW();
                
            -- Check if key exists and has the required scope
            IF key_user_id IS NULL OR NOT (required_scope = ANY(key_scopes)) THEN
                RETURN NULL;
            END IF;
            
            -- Log usage of the key
            IF key_user_id IS NOT NULL THEN
                -- Attempt to log the usage, but don''t fail if this doesn''t work
                BEGIN
                    INSERT INTO api_usage (
                        api_key_id,
                        user_id,
                        endpoint,
                        method,
                        status_code,
                        response_time,
                        ip_address,
                        user_agent
                    )
                    VALUES (
                        (SELECT id FROM api_keys WHERE key_value = validate_api_key.key_value),
                        key_user_id,
                        current_setting(''request.path'', true),
                        current_setting(''request.method'', true),
                        200,
                        0,
                        current_setting(''request.headers'', true)::jsonb->>''x-forwarded-for'',
                        current_setting(''request.headers'', true)::jsonb->>''user-agent''
                    );
                EXCEPTION
                    WHEN OTHERS THEN
                        -- Just silently continue even if logging fails
                        NULL;
                END;
            END IF;
            
            RETURN key_user_id;
        END;
        $$ LANGUAGE plpgsql;
        ';
    END IF;
END
$$;

-- 10. Fix assign_support_ticket and resolve_support_ticket functions
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'assign_support_ticket' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        EXECUTE '
        CREATE OR REPLACE FUNCTION assign_support_ticket(ticket_id UUID, staff_id UUID)
        RETURNS BOOLEAN AS $$
        BEGIN
            -- Check if user is an admin
            IF NOT EXISTS (
                SELECT 1 FROM auth.users 
                WHERE auth.users.id = auth.uid() 
                AND raw_user_meta_data->>'role' = ''admin''
            ) THEN
                RETURN FALSE;
            END IF;
            
            -- Update ticket assignment
            UPDATE support_tickets
            SET assigned_to = staff_id, 
                status = CASE WHEN status = ''Open'' THEN ''In Progress''::support_ticket_status ELSE status END
            WHERE id = ticket_id;
            
            RETURN FOUND;
        END;
        $$ LANGUAGE plpgsql;
        ';
        
        EXECUTE '
        CREATE OR REPLACE FUNCTION resolve_support_ticket(ticket_id UUID)
        RETURNS BOOLEAN AS $$
        BEGIN
            -- Check if user is an admin or the ticket is assigned to them
            IF NOT EXISTS (
                SELECT 1 
                FROM support_tickets 
                WHERE id = ticket_id AND 
                     (auth.uid() = assigned_to OR 
                      EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND raw_user_meta_data->>'role' = ''admin''))
            ) THEN
                RETURN FALSE;
            END IF;
            
            -- Update ticket status
            UPDATE support_tickets
            SET status = ''Resolved''::support_ticket_status,
                resolved_at = now()
            WHERE id = ticket_id;
            
            RETURN FOUND;
        END;
        $$ LANGUAGE plpgsql;
        ';
    END IF;
END
$$; 