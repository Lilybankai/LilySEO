-- Migration for Internal Link Optimization
-- This migration adds internal_link_data field to audit_reports table

-- Add internal_link_data column to the audit_reports table
ALTER TABLE IF EXISTS public.audit_reports
ADD COLUMN IF NOT EXISTS internal_link_data JSONB DEFAULT NULL;

COMMENT ON COLUMN public.audit_reports.internal_link_data IS 'Contains internal link graph and analysis data';

-- Create a function to update audit_reports with internal link data
CREATE OR REPLACE FUNCTION public.update_audit_internal_links(
  p_audit_id UUID,
  p_internal_link_data JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.audit_reports
  SET internal_link_data = p_internal_link_data,
      updated_at = NOW()
  WHERE id = p_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 