-- Create a new table to store audit metrics history
CREATE TABLE IF NOT EXISTS public.audit_metrics_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Overall metrics
  overall_score INTEGER NOT NULL,
  fixes_needed INTEGER NOT NULL DEFAULT 0,
  
  -- Category scores
  on_page_seo_score INTEGER NOT NULL DEFAULT 0,
  performance_score INTEGER NOT NULL DEFAULT 0,
  usability_score INTEGER NOT NULL DEFAULT 0,
  links_score INTEGER NOT NULL DEFAULT 0,
  social_score INTEGER NOT NULL DEFAULT 0,
  
  -- Page speed metrics (mobile)
  mobile_performance_score INTEGER,
  mobile_fcp FLOAT, -- First Contentful Paint
  mobile_lcp FLOAT, -- Largest Contentful Paint
  mobile_cls FLOAT, -- Cumulative Layout Shift
  mobile_tbt FLOAT, -- Total Blocking Time
  mobile_si FLOAT,  -- Speed Index
  mobile_tti FLOAT, -- Time to Interactive
  
  -- Page speed metrics (desktop)
  desktop_performance_score INTEGER,
  desktop_fcp FLOAT,
  desktop_lcp FLOAT,
  desktop_cls FLOAT,
  desktop_tbt FLOAT,
  desktop_si FLOAT,
  desktop_tti FLOAT,
  
  -- Domain metrics
  domain_authority FLOAT,
  page_authority FLOAT,
  linking_domains INTEGER,
  total_links INTEGER,
  
  -- Issue counts
  total_issues INTEGER NOT NULL DEFAULT 0,
  critical_issues INTEGER NOT NULL DEFAULT 0,
  major_issues INTEGER NOT NULL DEFAULT 0,
  minor_issues INTEGER NOT NULL DEFAULT 0,
  
  -- Additional metadata
  metadata JSONB
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS audit_metrics_history_audit_id_idx ON public.audit_metrics_history(audit_id);
CREATE INDEX IF NOT EXISTS audit_metrics_history_project_id_idx ON public.audit_metrics_history(project_id);
CREATE INDEX IF NOT EXISTS audit_metrics_history_user_id_idx ON public.audit_metrics_history(user_id);
CREATE INDEX IF NOT EXISTS audit_metrics_history_created_at_idx ON public.audit_metrics_history(created_at);

-- Set up Row Level Security
ALTER TABLE public.audit_metrics_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to select their own audit metrics
CREATE POLICY select_own_audit_metrics ON public.audit_metrics_history
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own audit metrics
CREATE POLICY insert_own_audit_metrics ON public.audit_metrics_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own audit metrics
CREATE POLICY update_own_audit_metrics ON public.audit_metrics_history
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own audit metrics
CREATE POLICY delete_own_audit_metrics ON public.audit_metrics_history
  FOR DELETE USING (auth.uid() = user_id);

-- Add fixes_needed column to audits table for quick reference
ALTER TABLE public.audits ADD COLUMN IF NOT EXISTS fixes_needed INTEGER DEFAULT 0;

-- Update function to insert metrics history when an audit is completed
CREATE OR REPLACE FUNCTION add_audit_metrics_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to 'completed'
  IF (NEW.status = 'completed' AND OLD.status != 'completed') THEN
    -- Extract needed metrics from the report JSON
    INSERT INTO public.audit_metrics_history (
      audit_id,
      project_id,
      user_id,
      overall_score,
      fixes_needed,
      on_page_seo_score,
      performance_score,
      usability_score,
      links_score,
      social_score,
      total_issues,
      critical_issues,
      major_issues,
      minor_issues,
      domain_authority,
      page_authority,
      linking_domains,
      total_links,
      mobile_performance_score,
      desktop_performance_score
    )
    VALUES (
      NEW.id,
      NEW.project_id,
      NEW.user_id,
      NEW.score,
      COALESCE((NEW.metadata->>'fixes_needed')::INTEGER, 0),
      COALESCE((NEW.report->'score'->'categories'->'onPageSeo')::INTEGER, 0),
      COALESCE((NEW.report->'score'->'categories'->'performance')::INTEGER, 0),
      COALESCE((NEW.report->'score'->'categories'->'usability')::INTEGER, 0),
      COALESCE((NEW.report->'score'->'categories'->'links')::INTEGER, 0),
      COALESCE((NEW.report->'score'->'categories'->'social')::INTEGER, 0),
      COALESCE((NEW.report->'summary'->'totalIssues')::INTEGER, 0),
      COALESCE((SELECT COUNT(*) FROM jsonb_array_elements(
        CASE 
          WHEN jsonb_typeof(NEW.report->'recommendations') = 'array' 
          THEN NEW.report->'recommendations'
          ELSE '[]'::jsonb
        END
      ) WHERE value->>'priority' = 'critical'), 0),
      COALESCE((SELECT COUNT(*) FROM jsonb_array_elements(
        CASE 
          WHEN jsonb_typeof(NEW.report->'recommendations') = 'array' 
          THEN NEW.report->'recommendations'
          ELSE '[]'::jsonb
        END
      ) WHERE value->>'priority' = 'high'), 0),
      COALESCE((SELECT COUNT(*) FROM jsonb_array_elements(
        CASE 
          WHEN jsonb_typeof(NEW.report->'recommendations') = 'array' 
          THEN NEW.report->'recommendations'
          ELSE '[]'::jsonb
        END
      ) WHERE value->>'priority' IN ('medium', 'low')), 0),
      COALESCE((NEW.report->'mozData'->'domainAuthority')::FLOAT, 0),
      COALESCE((NEW.report->'mozData'->'pageAuthority')::FLOAT, 0),
      COALESCE((NEW.report->'mozData'->'linkingDomains')::INTEGER, 0),
      COALESCE((NEW.report->'mozData'->'totalLinks')::INTEGER, 0),
      COALESCE((NEW.report->'pageSpeed'->'mobile'->'score')::INTEGER, 0),
      COALESCE((NEW.report->'pageSpeed'->'desktop'->'score')::INTEGER, 0)
    );
    
    -- Also update the fixes_needed column in the audits table
    UPDATE public.audits
    SET fixes_needed = COALESCE((NEW.metadata->>'fixes_needed')::INTEGER, 0)
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to add metrics history when an audit is updated to completed status
DROP TRIGGER IF EXISTS add_audit_metrics_on_complete ON public.audits;
CREATE TRIGGER add_audit_metrics_on_complete
  AFTER UPDATE ON public.audits
  FOR EACH ROW
  EXECUTE FUNCTION add_audit_metrics_history();

-- Create view to simplify access to performance trends data
CREATE OR REPLACE VIEW project_performance_trends AS
SELECT 
  project_id,
  user_id,
  created_at,
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
FROM 
  public.audit_metrics_history
ORDER BY 
  project_id, created_at DESC;

-- RLS policy is already enforced on the underlying table
-- The view inherits the security policies from audit_metrics_history
COMMENT ON VIEW project_performance_trends IS 'View for project performance trends over time. Access controlled by RLS on the underlying table.'; 