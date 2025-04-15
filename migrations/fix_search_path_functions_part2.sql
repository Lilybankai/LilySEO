-- Migration to fix remaining functions with mutable search paths
-- This adds SET search_path = public, pg_catalog to each function definition

-- Fix vote_for_feature_request function
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'vote_for_feature_request' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.vote_for_feature_request(feature_request_id UUID)
    RETURNS BOOLEAN AS $$
    DECLARE
        already_voted BOOLEAN;
    BEGIN
        -- Check if user has already voted for this feature request
        SELECT EXISTS (
            SELECT 1 FROM public.feature_request_votes
            WHERE feature_request_id = vote_for_feature_request.feature_request_id
            AND user_id = auth.uid()
        ) INTO already_voted;
        
        -- If user hasn''t voted yet, add their vote
        IF NOT already_voted THEN
            -- Insert vote record
            INSERT INTO public.feature_request_votes (feature_request_id, user_id)
            VALUES (vote_for_feature_request.feature_request_id, auth.uid());
            
            -- Update upvote count
            UPDATE public.feature_requests
            SET upvotes = upvotes + 1
            WHERE id = vote_for_feature_request.feature_request_id;
            
            RETURN TRUE;
        ELSE
            -- User already voted, remove their vote
            DELETE FROM public.feature_request_votes
            WHERE feature_request_id = vote_for_feature_request.feature_request_id
            AND user_id = auth.uid();
            
            -- Update upvote count
            UPDATE public.feature_requests
            SET upvotes = upvotes - 1
            WHERE id = vote_for_feature_request.feature_request_id;
            
            RETURN FALSE;
        END IF;
    END;
    $$ LANGUAGE plpgsql SET search_path = public, pg_catalog;
    ';
  END IF;
END
$$;

-- Fix has_voted_for_feature function
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'has_voted_for_feature' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.has_voted_for_feature(feature_request_id UUID)
    RETURNS BOOLEAN AS $$
    BEGIN
        RETURN EXISTS (
            SELECT 1 FROM public.feature_request_votes
            WHERE feature_request_id = has_voted_for_feature.feature_request_id
            AND user_id = auth.uid()
        );
    END;
    $$ LANGUAGE plpgsql SET search_path = public, pg_catalog;
    ';
  END IF;
END
$$;

-- Fix implement_feature_request function
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'implement_feature_request' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.implement_feature_request(feature_request_id UUID, changelog_item_id UUID)
    RETURNS BOOLEAN AS $$
    BEGIN
        -- Check if user is an admin
        IF NOT EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND raw_user_meta_data->>''role'' = ''admin''
        ) THEN
            RETURN FALSE;
        END IF;
        
        -- Update feature request to link to changelog item and mark as completed
        UPDATE public.feature_requests
        SET implemented_in = changelog_item_id,
            status = ''Completed''::feature_request_status
        WHERE id = feature_request_id;
        
        RETURN FOUND;
    END;
    $$ LANGUAGE plpgsql SET search_path = public, pg_catalog;
    ';
  END IF;
END
$$;

-- Fix has_white_label_access function
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'has_white_label_access' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.has_white_label_access()
    RETURNS BOOLEAN AS $$
    DECLARE
        user_tier TEXT;
        user_status TEXT;
    BEGIN
        -- Get user''s subscription tier and status
        SELECT subscription_tier, subscription_status INTO user_tier, user_status
        FROM public.profiles
        WHERE id = auth.uid();
        
        -- Only pro and enterprise users with active subscriptions have access to white label features
        RETURN (user_tier = ''pro'' OR user_tier = ''enterprise'') AND 
               (user_status = ''active'' OR user_status = ''trialing'');
    END;
    $$ LANGUAGE plpgsql SET search_path = public, pg_catalog;
    ';
  END IF;
END
$$;

-- Fix add_audit_metrics_history function
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'add_audit_metrics_history' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.add_audit_metrics_history()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Only insert metrics when status changes to completed
      IF NEW.status = ''completed'' AND (OLD.status IS NULL OR OLD.status != ''completed'') THEN
        -- Calculate scores and metrics from the audit report data
        INSERT INTO public.audit_metrics_history (
          audit_id,
          project_id,
          user_id,
          overall_score,
          on_page_seo_score,
          performance_score,
          usability_score,
          links_score,
          social_score,
          fixes_needed,
          total_issues,
          critical_issues,
          major_issues,
          minor_issues,
          domain_authority,
          mobile_performance_score,
          desktop_performance_score
        ) VALUES (
          NEW.id,
          NEW.project_id,
          NEW.user_id,
          COALESCE((NEW.report->''score''->''overall'')::INTEGER, 0),
          COALESCE((NEW.report->''score''->''onPageSeo'')::INTEGER, 0),
          COALESCE((NEW.report->''score''->''performance'')::INTEGER, 0),
          COALESCE((NEW.report->''score''->''usability'')::INTEGER, 0),
          COALESCE((NEW.report->''score''->''links'')::INTEGER, 0),
          COALESCE((NEW.report->''score''->''social'')::INTEGER, 0),
          COALESCE((NEW.report->''recommendations''->''total'')::INTEGER, 0),
          COALESCE((SELECT COUNT(*) FROM jsonb_array_elements(NEW.report->''recommendations'')), 0),
          COALESCE((SELECT COUNT(*) FROM jsonb_array_elements(NEW.report->''recommendations'') WHERE value->''priority'' = ''high''), 0),
          COALESCE((SELECT COUNT(*) FROM jsonb_array_elements(NEW.report->''recommendations'') WHERE value->''priority'' = ''medium''), 0),
          COALESCE((SELECT COUNT(*) FROM jsonb_array_elements(NEW.report->''recommendations'') WHERE value->''priority'' = ''low''), 0),
          COALESCE((NEW.report->''mozData''->''domainAuthority'')::FLOAT, 0),
          COALESCE((NEW.report->''pageSpeed''->''mobile''->''performance'')::INTEGER, 0),
          COALESCE((NEW.report->''pageSpeed''->''desktop''->''performance'')::INTEGER, 0)
        );
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SET search_path = public, pg_catalog;
    ';
  END IF;
END
$$;

-- Fix update_audit_internal_links function
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_audit_internal_links' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.update_audit_internal_links()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Update any fields in the audit that reference this URL
      UPDATE public.audits
      SET report = jsonb_set(
        report, 
        ''{internalLinks}'',
        (
          SELECT jsonb_agg(
            CASE
              WHEN link->>''url'' = OLD.url THEN jsonb_set(link, ''{url}'', to_jsonb(NEW.url))
              ELSE link
            END
          )
          FROM jsonb_array_elements(report->''internalLinks'') as link
        )
      )
      WHERE project_id = NEW.project_id
      AND report->>''internalLinks'' IS NOT NULL;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SET search_path = public, pg_catalog;
    ';
  END IF;
END
$$;

-- Fix add_todo_item function
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'add_todo_item' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.add_todo_item(
      p_user_id UUID,
      p_project_id UUID,
      p_title TEXT,
      p_description TEXT,
      p_priority TEXT DEFAULT ''medium''
    )
    RETURNS UUID AS $$
    DECLARE
      v_todo_id UUID;
    BEGIN
      -- Security check - only allow users to add todos for themselves or admins to add for anyone
      IF p_user_id != auth.uid() AND 
         NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND raw_user_meta_data->>''role'' = ''admin'') THEN
        RAISE EXCEPTION ''Not authorized to add todos for other users'';
      END IF;
      
      INSERT INTO public.todos (
        user_id,
        project_id,
        title,
        description,
        priority,
        created_at,
        updated_at
      ) VALUES (
        p_user_id,
        p_project_id,
        p_title,
        p_description,
        p_priority,
        NOW(),
        NOW()
      )
      RETURNING id INTO v_todo_id;
      
      RETURN v_todo_id;
    END;
    $$ LANGUAGE plpgsql SET search_path = public, pg_catalog;
    ';
  END IF;
END
$$;

-- Fix debug_get_column_names function
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'debug_get_column_names' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.debug_get_column_names(table_name TEXT)
    RETURNS TABLE (column_name TEXT, data_type TEXT) AS $$
    BEGIN
      -- Admin only function
      IF NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND raw_user_meta_data->>''role'' = ''admin'') THEN
        RAISE EXCEPTION ''Only admins can debug table structure'';
      END IF;
      
      RETURN QUERY
      SELECT 
        column_name::TEXT, 
        data_type::TEXT
      FROM 
        information_schema.columns
      WHERE 
        table_schema = ''public''
        AND table_name = debug_get_column_names.table_name
      ORDER BY 
        ordinal_position;
    END;
    $$ LANGUAGE plpgsql SET search_path = public, pg_catalog;
    ';
  END IF;
END
$$;

-- Fix sync_audit_id_columns function
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'sync_audit_id_columns' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.sync_audit_id_columns()
    RETURNS VOID AS $$
    BEGIN
      -- Admin only function
      IF NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND raw_user_meta_data->>''role'' = ''admin'') THEN
        RAISE EXCEPTION ''Only admins can sync audit columns'';
      END IF;
      
      -- Update todos table to sync the two audit ID columns
      UPDATE public.todos
      SET "auditId" = audit_id
      WHERE "auditId" IS NULL AND audit_id IS NOT NULL;
      
      UPDATE public.todos
      SET audit_id = "auditId"
      WHERE audit_id IS NULL AND "auditId" IS NOT NULL;
    END;
    $$ LANGUAGE plpgsql SET search_path = public, pg_catalog;
    ';
  END IF;
END
$$;

-- Fix rotate_api_key function
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'rotate_api_key' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.rotate_api_key(key_id UUID)
    RETURNS TEXT AS $$
    DECLARE
        user_owns_key BOOLEAN;
        new_key TEXT;
    BEGIN
        -- Check if the user owns the key
        SELECT EXISTS (
            SELECT 1 FROM public.api_keys
            WHERE id = key_id AND user_id = auth.uid()
        ) INTO user_owns_key;
        
        IF NOT user_owns_key THEN
            RAISE EXCEPTION ''User does not own this API key'';
        END IF;
        
        -- Generate a new random API key with a prefix
        new_key := ''lilyseo_'' || encode(gen_random_bytes(24), ''hex'');
        
        -- Update the key value and reset the updated_at timestamp
        UPDATE public.api_keys
        SET key_value = new_key,
            updated_at = now()
        WHERE id = key_id;
        
        -- Return the new key value
        RETURN new_key;
    END;
    $$ LANGUAGE plpgsql SET search_path = public, pg_catalog;
    ';
  END IF;
END
$$;

-- Fix revoke_api_key function
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'revoke_api_key' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.revoke_api_key(key_id UUID)
    RETURNS BOOLEAN AS $$
    DECLARE
        user_owns_key BOOLEAN;
    BEGIN
        -- Check if the user owns the key
        SELECT EXISTS (
            SELECT 1 FROM public.api_keys
            WHERE id = key_id AND user_id = auth.uid()
        ) INTO user_owns_key;
        
        IF NOT user_owns_key THEN
            RAISE EXCEPTION ''User does not own this API key'';
        END IF;
        
        -- Update the key to set it as inactive
        UPDATE public.api_keys
        SET is_active = FALSE
        WHERE id = key_id;
        
        RETURN TRUE;
    END;
    $$ LANGUAGE plpgsql SET search_path = public, pg_catalog;
    ';
  END IF;
END
$$;

-- Fix validate_api_key function
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'validate_api_key' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.validate_api_key(key_value TEXT, required_scope TEXT DEFAULT ''read'')
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
            public.api_keys
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
                INSERT INTO public.api_usage (
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
                    (SELECT id FROM public.api_keys WHERE key_value = validate_api_key.key_value),
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
    $$ LANGUAGE plpgsql SET search_path = public, pg_catalog;
    ';
  END IF;
END
$$;

-- Fix assign_support_ticket function
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'assign_support_ticket' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.assign_support_ticket(ticket_id UUID, staff_id UUID)
    RETURNS BOOLEAN AS $$
    BEGIN
        -- Check if user is an admin
        IF NOT EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND raw_user_meta_data->>''role'' = ''admin''
        ) THEN
            RETURN FALSE;
        END IF;
        
        -- Update ticket assignment
        UPDATE public.support_tickets
        SET assigned_to = staff_id, 
            status = CASE WHEN status = ''Open'' THEN ''In Progress''::support_ticket_status ELSE status END
        WHERE id = ticket_id;
        
        RETURN FOUND;
    END;
    $$ LANGUAGE plpgsql SET search_path = public, pg_catalog;
    ';
  END IF;
END
$$;

-- Fix resolve_support_ticket function
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'resolve_support_ticket' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.resolve_support_ticket(ticket_id UUID)
    RETURNS BOOLEAN AS $$
    BEGIN
        -- Check if user is an admin or the ticket is assigned to them
        IF NOT EXISTS (
            SELECT 1 
            FROM public.support_tickets 
            WHERE id = ticket_id AND 
                 (auth.uid() = assigned_to OR 
                  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND raw_user_meta_data->>''role'' = ''admin''))
        ) THEN
            RETURN FALSE;
        END IF;
        
        -- Update ticket status
        UPDATE public.support_tickets
        SET status = ''Resolved''::support_ticket_status,
            resolved_at = now()
        WHERE id = ticket_id;
        
        RETURN FOUND;
    END;
    $$ LANGUAGE plpgsql SET search_path = public, pg_catalog;
    ';
  END IF;
END
$$; 