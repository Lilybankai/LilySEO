-- Fix for SECURITY DEFINER view security issue
-- This migration removes the SECURITY DEFINER property from the search_packages view

-- Check if view exists and recreate it without SECURITY DEFINER
DO $$
BEGIN
  -- Drop the existing view if it exists
  DROP VIEW IF EXISTS public.search_packages;
  
  -- Recreate the view without SECURITY DEFINER property
  CREATE OR REPLACE VIEW public.search_packages 
  AS SELECT * FROM public.lead_search_packages;
  
  -- Make sure RLS is enabled on the underlying table
  ALTER TABLE public.lead_search_packages ENABLE ROW LEVEL SECURITY;
  
  -- Ensure the correct policies exist for the underlying table
  -- This policy already exists from the original migration but we're making sure it's there
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'lead_search_packages' 
    AND policyname = 'Allow read access to all active packages'
  ) THEN
    CREATE POLICY "Allow read access to all active packages" ON public.lead_search_packages
      FOR SELECT
      USING (active = TRUE);
  END IF;
END
$$; 