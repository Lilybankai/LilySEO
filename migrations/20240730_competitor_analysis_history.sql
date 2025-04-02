-- Migration: Add competitor analysis history tracking
-- Description: This migration adds tables and functions to track historical competitor analysis data
-- with different retention policies based on subscription tier

-- Create the competitor_analysis_history table
CREATE TABLE IF NOT EXISTS public.competitor_analysis_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  seo_metrics JSONB NOT NULL DEFAULT '{}'::JSONB,
  technical_metrics JSONB NOT NULL DEFAULT '{}'::JSONB,
  content_metrics JSONB NOT NULL DEFAULT '{}'::JSONB,
  keyword_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  opportunity_data JSONB NOT NULL DEFAULT '{}'::JSONB
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS competitor_analysis_history_competitor_id_idx 
  ON public.competitor_analysis_history(competitor_id);
CREATE INDEX IF NOT EXISTS competitor_analysis_history_created_at_idx 
  ON public.competitor_analysis_history(created_at);

-- Create a trigger function to automatically create history records
CREATE OR REPLACE FUNCTION public.create_competitor_analysis_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.competitor_analysis_history (
    competitor_id,
    seo_metrics,
    technical_metrics,
    content_metrics,
    keyword_data,
    opportunity_data
  ) VALUES (
    NEW.competitor_id,
    NEW.seo_metrics,
    NEW.technical_metrics,
    NEW.content_metrics,
    NEW.keyword_data,
    NEW.opportunity_data
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on competitor_analysis table
DROP TRIGGER IF EXISTS trigger_create_competitor_analysis_history ON public.competitor_analysis;
CREATE TRIGGER trigger_create_competitor_analysis_history
AFTER INSERT OR UPDATE ON public.competitor_analysis
FOR EACH ROW
EXECUTE FUNCTION public.create_competitor_analysis_history();

-- Create a function to clean up historical data based on subscription tier
CREATE OR REPLACE FUNCTION public.cleanup_competitor_analysis_history()
RETURNS VOID AS $$
DECLARE
  competitor_record RECORD;
  project_tier TEXT;
  retention_days INTEGER;
BEGIN
  -- Loop through all competitors
  FOR competitor_record IN 
    SELECT c.id, p.subscription_tier 
    FROM public.competitors c
    JOIN public.projects p ON c.project_id = p.id
  LOOP
    -- Set retention period based on subscription tier
    IF competitor_record.subscription_tier = 'enterprise' THEN
      retention_days := 365; -- 12 months for enterprise
    ELSIF competitor_record.subscription_tier = 'pro' THEN
      retention_days := 30; -- 30 days for pro
    ELSE
      retention_days := 1; -- Only keep current snapshot for free
    END IF;
    
    -- Delete records older than retention period
    DELETE FROM public.competitor_analysis_history
    WHERE competitor_id = competitor_record.id
    AND created_at < (NOW() - (retention_days || ' days')::INTERVAL);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to run the cleanup function daily
SELECT cron.schedule(
  'cleanup-competitor-analysis-history',
  '0 0 * * *', -- Run at midnight every day
  $$SELECT public.cleanup_competitor_analysis_history()$$
);

-- Add notification settings table for change alerts
CREATE TABLE IF NOT EXISTS public.competitor_alert_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  email_alerts BOOLEAN NOT NULL DEFAULT FALSE,
  dashboard_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  alert_threshold INTEGER NOT NULL DEFAULT 10, -- Percentage change to trigger alert
  daily_digest BOOLEAN NOT NULL DEFAULT FALSE,
  weekly_digest BOOLEAN NOT NULL DEFAULT TRUE,
  metrics_to_monitor JSONB NOT NULL DEFAULT '["domainAuthority", "backlinks", "pageSpeed.desktop"]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS competitor_alert_settings_user_project_idx
  ON public.competitor_alert_settings(user_id, project_id);

-- Add a function to provide limited history for free tier
CREATE OR REPLACE FUNCTION public.get_competitor_history(
  p_competitor_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  id UUID,
  competitor_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  seo_metrics JSONB,
  technical_metrics JSONB,
  content_metrics JSONB,
  keyword_data JSONB,
  opportunity_data JSONB,
  subscription_tier TEXT
) AS $$
DECLARE
  v_project_id UUID;
  v_subscription_tier TEXT;
  v_max_days INTEGER;
BEGIN
  -- Get the project ID and subscription tier
  SELECT c.project_id, p.subscription_tier INTO v_project_id, v_subscription_tier
  FROM public.competitors c
  JOIN public.projects p ON c.project_id = p.id
  WHERE c.id = p_competitor_id;
  
  -- Set maximum days based on subscription tier
  IF v_subscription_tier = 'enterprise' THEN
    v_max_days := 365; -- 12 months for enterprise
  ELSIF v_subscription_tier = 'pro' THEN
    v_max_days := 30; -- 30 days for pro
  ELSE
    v_max_days := 1; -- Only today for free
  END IF;
  
  -- Limit the requested days to the maximum allowed for the tier
  IF p_days > v_max_days THEN
    p_days := v_max_days;
  END IF;
  
  -- Return the history records
  RETURN QUERY
  SELECT 
    h.id, h.competitor_id, h.created_at, 
    h.seo_metrics, h.technical_metrics, h.content_metrics, 
    h.keyword_data, h.opportunity_data,
    v_subscription_tier
  FROM public.competitor_analysis_history h
  WHERE h.competitor_id = p_competitor_id
  AND h.created_at >= (NOW() - (p_days || ' days')::INTERVAL)
  ORDER BY h.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON public.competitor_analysis_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_competitor_history TO authenticated; 