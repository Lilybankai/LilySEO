-- Add new columns to audits table for storing audit options
ALTER TABLE public.audits 
  ADD COLUMN IF NOT EXISTS check_seo BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS check_performance BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS check_mobile BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS check_security BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS check_accessibility BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS audit_depth TEXT;

-- Fix report column to allow for proper JSONB handling
-- Create a function to safely handle the report field
CREATE OR REPLACE FUNCTION safely_store_report(report_data JSONB)
RETURNS JSONB AS $$
BEGIN
  -- Return the input if it's valid, or an empty object if not
  RETURN COALESCE(report_data, '{}'::JSONB);
EXCEPTION
  WHEN OTHERS THEN
    RETURN '{}'::JSONB;
END;
$$ LANGUAGE plpgsql; 