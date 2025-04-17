-- Function to populate the audit_metrics_history table from existing completed audits
CREATE OR REPLACE FUNCTION populate_audit_metrics_history()
RETURNS void AS $$
DECLARE
  audit_record RECORD;
BEGIN
  -- Loop through all completed audits
  FOR audit_record IN 
    SELECT id, project_id, user_id, score, status, report, metadata
    FROM public.audits
    WHERE status = 'completed'
  LOOP
    -- Insert metrics history record for each audit
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
      desktop_performance_score,
      created_at
    )
    VALUES (
      audit_record.id,
      audit_record.project_id,
      audit_record.user_id,
      audit_record.score,
      COALESCE((audit_record.metadata->>'fixes_needed')::INTEGER, 0),
      COALESCE((audit_record.report->'score'->'categories'->'onPageSeo')::INTEGER, 0),
      COALESCE((audit_record.report->'score'->'categories'->'performance')::INTEGER, 0),
      COALESCE((audit_record.report->'score'->'categories'->'usability')::INTEGER, 0),
      COALESCE((audit_record.report->'score'->'categories'->'links')::INTEGER, 0),
      COALESCE((audit_record.report->'score'->'categories'->'social')::INTEGER, 0),
      COALESCE((audit_record.report->'summary'->'totalIssues')::INTEGER, 0),
      COALESCE((SELECT COUNT(*) FROM jsonb_array_elements(
        CASE 
          WHEN jsonb_typeof(audit_record.report->'recommendations') = 'array' 
          THEN audit_record.report->'recommendations'
          ELSE '[]'::jsonb
        END
      ) WHERE value->>'priority' = 'critical'), 0),
      COALESCE((SELECT COUNT(*) FROM jsonb_array_elements(
        CASE 
          WHEN jsonb_typeof(audit_record.report->'recommendations') = 'array' 
          THEN audit_record.report->'recommendations'
          ELSE '[]'::jsonb
        END
      ) WHERE value->>'priority' = 'high'), 0),
      COALESCE((SELECT COUNT(*) FROM jsonb_array_elements(
        CASE 
          WHEN jsonb_typeof(audit_record.report->'recommendations') = 'array' 
          THEN audit_record.report->'recommendations'
          ELSE '[]'::jsonb
        END
      ) WHERE value->>'priority' IN ('medium', 'low')), 0),
      COALESCE((audit_record.report->'mozData'->'domainAuthority')::FLOAT, 0),
      COALESCE((audit_record.report->'mozData'->'pageAuthority')::FLOAT, 0),
      COALESCE((audit_record.report->'mozData'->'linkingDomains')::INTEGER, 0),
      COALESCE((audit_record.report->'mozData'->'totalLinks')::INTEGER, 0),
      COALESCE((audit_record.report->'pageSpeed'->'mobile'->'score')::INTEGER, 0),
      COALESCE((audit_record.report->'pageSpeed'->'desktop'->'score')::INTEGER, 0),
      (SELECT created_at FROM public.audits WHERE id = audit_record.id)
    )
    ON CONFLICT (audit_id) DO NOTHING;
    
    -- Also update the fixes_needed column in the audits table
    UPDATE public.audits
    SET fixes_needed = COALESCE((audit_record.metadata->>'fixes_needed')::INTEGER, 0)
    WHERE id = audit_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to populate metrics from existing audits
SELECT populate_audit_metrics_history();

-- Drop the function after executing it (one-time use)
DROP FUNCTION IF EXISTS populate_audit_metrics_history(); 