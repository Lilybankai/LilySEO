-- Migration to fix all functions with mutable search paths
-- This adds SET search_path = public, pg_catalog to each function definition

-- 1. Fix get_user_remaining_searches function
CREATE OR REPLACE FUNCTION public.get_user_remaining_searches(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  monthly_limit INTEGER;
  used_searches INTEGER;
  extra_searches INTEGER;
  subscription_tier TEXT;
BEGIN
  -- Only allow users to view their own remaining searches or admins to view any
  IF user_uuid != auth.uid() AND 
     NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND raw_user_meta_data->>'role' = 'admin') THEN
    RETURN 0; -- Return 0 if not authorized
  END IF;

  -- Get user's subscription tier
  SELECT subscription_tier INTO subscription_tier
  FROM public.profiles
  WHERE id = user_uuid;

  -- Set monthly limit based on subscription tier
  IF subscription_tier = 'enterprise' THEN
    monthly_limit := 250; -- 250 searches per month for enterprise users
  ELSE
    monthly_limit := 0; -- Non-enterprise users have no access
  END IF;

  -- Calculate searches used this month
  SELECT COUNT(*) INTO used_searches
  FROM public.lead_searches
  WHERE user_id = user_uuid
  AND search_date >= date_trunc('month', CURRENT_DATE);

  -- Calculate available searches from purchased packages
  SELECT COALESCE(SUM(remaining_searches), 0) INTO extra_searches
  FROM public.user_search_packages
  WHERE user_id = user_uuid;

  -- Return total remaining searches
  RETURN GREATEST(0, (monthly_limit - used_searches)) + extra_searches;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_catalog;

-- 2. Fix update_todo_completed_metrics function
CREATE OR REPLACE FUNCTION public.update_todo_completed_metrics()
RETURNS TRIGGER AS $$
DECLARE
  completion_month DATE;
  completion_time INTEGER;
BEGIN
  -- Only proceed if status changed to 'completed'
  IF NEW.status = 'completed' AND (OLD.status != 'completed' OR OLD.status IS NULL) THEN
    -- Extract year and month from completion timestamp
    completion_month := date_trunc('month', NOW())::date;
    completion_time := 0;
    
    -- Ensure this function can only update metrics for the todo creator
    IF NEW.user_id = auth.uid() OR 
       EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND raw_user_meta_data->>'role' = 'admin') THEN
      -- Calculate completion time if we have created_at
      IF NEW.created_at IS NOT NULL THEN
        completion_time := EXTRACT(EPOCH FROM (NOW() - NEW.created_at))::INTEGER;
      END IF;
      
      -- Try to update existing record
      UPDATE public.todo_metrics
      SET 
        todos_completed = todos_completed + 1,
        total_time_spent = total_time_spent + NEW.time_spent,
        average_completion_time = CASE
          WHEN todos_completed = 0 THEN completion_time
          ELSE (average_completion_time * todos_completed + completion_time) / (todos_completed + 1)
        END,
        updated_at = NOW()
      WHERE 
        project_id = NEW.project_id 
        AND user_id = NEW.user_id 
        AND month = completion_month;
      
      -- If no record was updated (no record exists), insert a new one
      IF NOT FOUND THEN
        INSERT INTO public.todo_metrics (
          project_id, 
          user_id, 
          month, 
          todos_completed,
          average_completion_time,
          total_time_spent
        ) VALUES (
          NEW.project_id,
          NEW.user_id,
          completion_month,
          1,
          completion_time,
          NEW.time_spent
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_catalog;

-- 3. Fix add_team_member function
CREATE OR REPLACE FUNCTION public.add_team_member(
  p_team_owner_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_permissions TEXT DEFAULT 'member'
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  permissions TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_user_id UUID;
  v_invite_token TEXT;
  v_team_member_id UUID;
  status TEXT;
  created_at TIMESTAMPTZ;
BEGIN
  -- Security check - only allow users to add members to their own team or admins
  IF p_team_owner_id != auth.uid() AND 
     NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND raw_user_meta_data->>'role' = 'admin') THEN
    RAISE EXCEPTION 'Not authorized to add team members to this team';
  END IF;

  -- Check if under team member limit
  IF NOT public.check_team_member_limit(p_team_owner_id) THEN
    RAISE EXCEPTION 'Team member limit reached for your subscription tier';
  END IF;
  
  -- Check if user already exists by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;
  
  -- Generate invite token (simple UUID for now)
  v_invite_token := gen_random_uuid()::TEXT;
  
  -- Insert team member
  INSERT INTO public.team_members (
    team_owner_id,
    user_id,
    email,
    name,
    permissions,
    status,
    invite_token,
    invite_expires_at
  ) VALUES (
    p_team_owner_id,
    COALESCE(v_user_id, '00000000-0000-0000-0000-000000000000'::UUID), -- Placeholder if user doesn't exist yet
    p_email,
    p_name,
    p_permissions,
    'pending',
    v_invite_token,
    NOW() + INTERVAL '7 days'
  )
  RETURNING id, email, name, permissions, status, created_at INTO v_team_member_id, p_email, p_name, p_permissions, status, created_at;
  
  RETURN QUERY
  SELECT 
    v_team_member_id,
    p_email,
    p_name,
    p_permissions,
    'pending'::TEXT,
    created_at;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_catalog;

-- 4. Fix update_todo_created_metrics function
CREATE OR REPLACE FUNCTION public.update_todo_created_metrics()
RETURNS TRIGGER AS $$
DECLARE
  todo_month DATE := date_trunc('month', NEW.created_at)::date;
BEGIN
  -- Ensure this function can only update metrics for the todo creator
  IF NEW.user_id = auth.uid() OR 
     EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND raw_user_meta_data->>'role' = 'admin') THEN
    -- Try to update existing record
    UPDATE public.todo_metrics
    SET 
      todos_created = todos_created + 1,
      updated_at = NOW()
    WHERE 
      project_id = NEW.project_id 
      AND user_id = NEW.user_id 
      AND month = todo_month;
    
    -- If no record was updated (no record exists), insert a new one
    IF NOT FOUND THEN
      INSERT INTO public.todo_metrics (
        project_id, 
        user_id, 
        month, 
        todos_created
      ) VALUES (
        NEW.project_id,
        NEW.user_id,
        todo_month,
        1
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_catalog;

-- 5. Fix check_team_member_limit function
CREATE OR REPLACE FUNCTION public.check_team_member_limit(p_team_owner_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription_tier TEXT;
  v_team_member_limit INTEGER;
  v_current_member_count INTEGER;
BEGIN
  -- Security check - only allow users to check their own limits or admins to check any
  IF p_team_owner_id != auth.uid() AND 
     NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND raw_user_meta_data->>'role' = 'admin') THEN
    RETURN FALSE;
  END IF;

  -- Get the user's subscription tier
  SELECT subscription_tier INTO v_subscription_tier
  FROM public.profiles
  WHERE id = p_team_owner_id;
  
  -- Default to 'free' if not found
  IF v_subscription_tier IS NULL THEN
    v_subscription_tier := 'free';
  END IF;
  
  -- Get the team member limit for this tier
  SELECT team_member_limit INTO v_team_member_limit
  FROM public.subscription_limits
  WHERE subscription_tier = v_subscription_tier;
  
  -- Default to 0 if not found
  IF v_team_member_limit IS NULL THEN
    v_team_member_limit := 0;
  END IF;
  
  -- Count current team members
  SELECT COUNT(*) INTO v_current_member_count
  FROM public.team_members
  WHERE team_owner_id = p_team_owner_id;
  
  -- Return true if below limit, false if at or above limit
  RETURN v_current_member_count < v_team_member_limit;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_catalog;

-- 6. Fix get_user_votes function
CREATE OR REPLACE FUNCTION public.get_user_votes(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (feature_request_id UUID) AS $$
BEGIN
  -- If user is not authenticated, return empty result set
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT NULL::UUID WHERE FALSE;
    RETURN;
  END IF;

  -- Only allow users to view their own votes, or admins to view any votes
  IF user_uuid = auth.uid() OR 
     EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND raw_user_meta_data->>'role' = 'admin') THEN
    RETURN QUERY
    SELECT frv.feature_request_id
    FROM public.feature_request_votes frv
    WHERE frv.user_id = user_uuid;
  ELSE
    -- Return empty result set if not authorized
    RETURN QUERY
    SELECT NULL::UUID WHERE FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- 7. Fix update_lead_search_count function
CREATE OR REPLACE FUNCTION public.update_lead_search_count()
RETURNS TRIGGER AS $$
DECLARE
  user_uuid UUID := NEW.user_id;
  available_in_plan INTEGER;
  available_in_packages INTEGER;
  package_to_update UUID;
BEGIN
  -- Security check - user can only update their own usage or admins can update any
  IF user_uuid != auth.uid() AND 
     NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND raw_user_meta_data->>'role' = 'admin') THEN
    RETURN NEW; -- Return without updating if not authorized
  END IF;

  -- Get monthly allowance remaining
  SELECT GREATEST(0, 250 - COUNT(*))
  INTO available_in_plan
  FROM public.lead_searches
  WHERE user_id = user_uuid
  AND search_date >= date_trunc('month', CURRENT_DATE);

  -- If monthly allowance is available, just use that
  IF available_in_plan > 0 THEN
    RETURN NEW;
  END IF;

  -- Otherwise, find a package with remaining searches
  SELECT id
  INTO package_to_update
  FROM public.user_search_packages
  WHERE user_id = user_uuid
  AND remaining_searches > 0
  ORDER BY created_at ASC
  LIMIT 1;

  -- Update the package with one less search
  IF package_to_update IS NOT NULL THEN
    UPDATE public.user_search_packages
    SET remaining_searches = remaining_searches - 1
    WHERE id = package_to_update;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_catalog;

-- 8. Fix add_todo_safely function
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
SET search_path = public, pg_catalog
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

-- Fix remaining functions if they exist
DO $$
BEGIN
  -- 9. Fix get_project_performance_trends function if it exists
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_project_performance_trends' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION public.get_project_performance_trends(project_id_param UUID, limit_param INTEGER DEFAULT 12)
      RETURNS TABLE (
        created_at TIMESTAMP WITH TIME ZONE,
        overall_score INTEGER,
        on_page_seo_score INTEGER,
        performance_score INTEGER,
        usability_score INTEGER,
        links_score INTEGER,
        social_score INTEGER,
        fixes_needed INTEGER,
        total_issues INTEGER
      ) AS $$
      DECLARE
        user_id_var UUID;
      BEGIN
        -- Get current user ID for security check
        user_id_var := auth.uid();
        
        -- Return data only if the user owns the project
        RETURN QUERY
        SELECT 
          h.created_at,
          h.overall_score,
          h.on_page_seo_score,
          h.performance_score,
          h.usability_score,
          h.links_score,
          h.social_score,
          h.fixes_needed,
          h.total_issues
        FROM 
          public.audit_metrics_history h
        WHERE 
          h.project_id = project_id_param
          AND h.user_id = user_id_var
        ORDER BY 
          h.created_at DESC
        LIMIT 
          limit_param;
      END;
      $$ LANGUAGE plpgsql SET search_path = public, pg_catalog;
    ';
  END IF;

  -- 10. Fix get_project_score_changes function if it exists
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_project_score_changes' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION public.get_project_score_changes(project_id_param UUID)
      RETURNS TABLE (
        metric TEXT,
        current_value NUMERIC,
        previous_value NUMERIC,
        change_value NUMERIC,
        change_percent NUMERIC,
        is_improvement BOOLEAN
      ) AS $$
      DECLARE
        current_date TIMESTAMP;
        one_month_ago TIMESTAMP;
        two_months_ago TIMESTAMP;
        latest_metrics RECORD;
        previous_metrics RECORD;
        user_id_var UUID;
      BEGIN
        -- Initialize variables
        current_date := NOW();
        one_month_ago := NOW() - INTERVAL ''1 month'';
        two_months_ago := NOW() - INTERVAL ''2 months'';
        
        -- Get current user ID for security check
        user_id_var := auth.uid();
        
        -- Get the latest metrics within the last month
        SELECT 
          overall_score, on_page_seo_score, performance_score, 
          usability_score, links_score, social_score, fixes_needed, total_issues
        INTO latest_metrics
        FROM public.audit_metrics_history
        WHERE 
          project_id = project_id_param AND
          user_id = user_id_var AND
          created_at >= one_month_ago AND
          created_at <= current_date
        ORDER BY created_at DESC
        LIMIT 1;
        
        -- Get the previous metrics from the month before
        SELECT 
          overall_score, on_page_seo_score, performance_score, 
          usability_score, links_score, social_score, fixes_needed, total_issues
        INTO previous_metrics
        FROM public.audit_metrics_history
        WHERE 
          project_id = project_id_param AND
          user_id = user_id_var AND
          created_at >= two_months_ago AND
          created_at < one_month_ago
        ORDER BY created_at DESC
        LIMIT 1;
        
        -- If we have both periods of data, calculate the changes
        IF latest_metrics IS NOT NULL AND previous_metrics IS NOT NULL THEN
          -- Overall Score
          metric := ''overall_score'';
          current_value := latest_metrics.overall_score;
          previous_value := previous_metrics.overall_score;
          change_value := current_value - previous_value;
          change_percent := CASE WHEN previous_value = 0 THEN 0 ELSE (change_value / previous_value) * 100 END;
          is_improvement := change_value > 0;
          RETURN NEXT;
          
          -- On-Page SEO Score
          metric := ''on_page_seo_score'';
          current_value := latest_metrics.on_page_seo_score;
          previous_value := previous_metrics.on_page_seo_score;
          change_value := current_value - previous_value;
          change_percent := CASE WHEN previous_value = 0 THEN 0 ELSE (change_value / previous_value) * 100 END;
          is_improvement := change_value > 0;
          RETURN NEXT;
          
          -- Performance Score
          metric := ''performance_score'';
          current_value := latest_metrics.performance_score;
          previous_value := previous_metrics.performance_score;
          change_value := current_value - previous_value;
          change_percent := CASE WHEN previous_value = 0 THEN 0 ELSE (change_value / previous_value) * 100 END;
          is_improvement := change_value > 0;
          RETURN NEXT;
          
          -- Usability Score
          metric := ''usability_score'';
          current_value := latest_metrics.usability_score;
          previous_value := previous_metrics.usability_score;
          change_value := current_value - previous_value;
          change_percent := CASE WHEN previous_value = 0 THEN 0 ELSE (change_value / previous_value) * 100 END;
          is_improvement := change_value > 0;
          RETURN NEXT;
          
          -- Links Score
          metric := ''links_score'';
          current_value := latest_metrics.links_score;
          previous_value := previous_metrics.links_score;
          change_value := current_value - previous_value;
          change_percent := CASE WHEN previous_value = 0 THEN 0 ELSE (change_value / previous_value) * 100 END;
          is_improvement := change_value > 0;
          RETURN NEXT;
          
          -- Fixes Needed (lower is better)
          metric := ''fixes_needed'';
          current_value := latest_metrics.fixes_needed;
          previous_value := previous_metrics.fixes_needed;
          change_value := current_value - previous_value;
          change_percent := CASE WHEN previous_value = 0 THEN 0 ELSE (change_value / previous_value) * 100 END;
          is_improvement := change_value < 0; -- For fixes, a decrease is an improvement
          RETURN NEXT;
          
          -- Total Issues (lower is better)
          metric := ''total_issues'';
          current_value := latest_metrics.total_issues;
          previous_value := previous_metrics.total_issues;
          change_value := current_value - previous_value;
          change_percent := CASE WHEN previous_value = 0 THEN 0 ELSE (change_value / previous_value) * 100 END;
          is_improvement := change_value < 0; -- For issues, a decrease is an improvement
          RETURN NEXT;
        ELSE
          -- If we don''t have both periods, return null values
          metric := ''no_comparison_data'';
          current_value := NULL;
          previous_value := NULL;
          change_value := NULL;
          change_percent := NULL;
          is_improvement := NULL;
          RETURN NEXT;
        END IF;
      END;
      $$ LANGUAGE plpgsql SET search_path = public, pg_catalog;
    ';
  END IF;
END
$$; 