-- Function to get performance trend data for a specific project
CREATE OR REPLACE FUNCTION get_project_performance_trends(project_id_param UUID, limit_param INTEGER DEFAULT 12)
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
$$ LANGUAGE plpgsql;

-- Function to get month-over-month score changes for a project
CREATE OR REPLACE FUNCTION get_project_score_changes(project_id_param UUID)
RETURNS TABLE (
  metric TEXT,
  current_value NUMERIC,
  previous_value NUMERIC,
  change_value NUMERIC,
  change_percent NUMERIC,
  is_improvement BOOLEAN
) AS $$
DECLARE
  current_date TIMESTAMP := NOW();
  one_month_ago TIMESTAMP := NOW() - INTERVAL '1 month';
  two_months_ago TIMESTAMP := NOW() - INTERVAL '2 months';
  latest_metrics RECORD;
  previous_metrics RECORD;
  user_id_var UUID;
BEGIN
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
    metric := 'overall_score';
    current_value := latest_metrics.overall_score;
    previous_value := previous_metrics.overall_score;
    change_value := current_value - previous_value;
    change_percent := CASE WHEN previous_value = 0 THEN 0 ELSE (change_value / previous_value) * 100 END;
    is_improvement := change_value > 0;
    RETURN NEXT;
    
    -- On-Page SEO Score
    metric := 'on_page_seo_score';
    current_value := latest_metrics.on_page_seo_score;
    previous_value := previous_metrics.on_page_seo_score;
    change_value := current_value - previous_value;
    change_percent := CASE WHEN previous_value = 0 THEN 0 ELSE (change_value / previous_value) * 100 END;
    is_improvement := change_value > 0;
    RETURN NEXT;
    
    -- Performance Score
    metric := 'performance_score';
    current_value := latest_metrics.performance_score;
    previous_value := previous_metrics.performance_score;
    change_value := current_value - previous_value;
    change_percent := CASE WHEN previous_value = 0 THEN 0 ELSE (change_value / previous_value) * 100 END;
    is_improvement := change_value > 0;
    RETURN NEXT;
    
    -- Usability Score
    metric := 'usability_score';
    current_value := latest_metrics.usability_score;
    previous_value := previous_metrics.usability_score;
    change_value := current_value - previous_value;
    change_percent := CASE WHEN previous_value = 0 THEN 0 ELSE (change_value / previous_value) * 100 END;
    is_improvement := change_value > 0;
    RETURN NEXT;
    
    -- Links Score
    metric := 'links_score';
    current_value := latest_metrics.links_score;
    previous_value := previous_metrics.links_score;
    change_value := current_value - previous_value;
    change_percent := CASE WHEN previous_value = 0 THEN 0 ELSE (change_value / previous_value) * 100 END;
    is_improvement := change_value > 0;
    RETURN NEXT;
    
    -- Fixes Needed (lower is better)
    metric := 'fixes_needed';
    current_value := latest_metrics.fixes_needed;
    previous_value := previous_metrics.fixes_needed;
    change_value := current_value - previous_value;
    change_percent := CASE WHEN previous_value = 0 THEN 0 ELSE (change_value / previous_value) * 100 END;
    is_improvement := change_value < 0; -- For fixes, a decrease is an improvement
    RETURN NEXT;
    
    -- Total Issues (lower is better)
    metric := 'total_issues';
    current_value := latest_metrics.total_issues;
    previous_value := previous_metrics.total_issues;
    change_value := current_value - previous_value;
    change_percent := CASE WHEN previous_value = 0 THEN 0 ELSE (change_value / previous_value) * 100 END;
    is_improvement := change_value < 0; -- For issues, a decrease is an improvement
    RETURN NEXT;
  ELSE
    -- If we don't have both periods, return null values
    metric := 'no_comparison_data';
    current_value := NULL;
    previous_value := NULL;
    change_value := NULL;
    change_percent := NULL;
    is_improvement := NULL;
    RETURN NEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION get_project_performance_trends TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_score_changes TO authenticated; 