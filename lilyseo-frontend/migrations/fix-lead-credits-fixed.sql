-- This script fixes issues with lead search credits

-- 1. Create the get_user_remaining_searches function with correct syntax
CREATE OR REPLACE FUNCTION public.get_user_remaining_searches(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  monthly_limit INTEGER;
  used_searches INTEGER;
  extra_searches INTEGER;
  subscription_tier TEXT;
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix table name inconsistency (check if search_packages exists, if not create it from lead_search_packages)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'search_packages' AND table_schema = 'public'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'lead_search_packages' AND table_schema = 'public'
  ) THEN
    -- Create search_packages as a view to lead_search_packages
    EXECUTE 'CREATE OR REPLACE VIEW public.search_packages AS SELECT * FROM public.lead_search_packages';
  END IF;
END
$$;

-- 3. Insert default search packages (if needed)
-- First, check if the table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'lead_search_packages' AND table_schema = 'public'
  ) THEN
    -- Insert packages if table exists
    INSERT INTO public.lead_search_packages (name, description, searches_count, price, active)
    SELECT 'Small Package', '50 additional lead searches', 50, 19.99, TRUE
    WHERE NOT EXISTS (
      SELECT 1 FROM public.lead_search_packages WHERE name = 'Small Package'
    );
    
    INSERT INTO public.lead_search_packages (name, description, searches_count, price, active)
    SELECT 'Medium Package', '100 additional lead searches', 100, 34.99, TRUE
    WHERE NOT EXISTS (
      SELECT 1 FROM public.lead_search_packages WHERE name = 'Medium Package'
    );
    
    INSERT INTO public.lead_search_packages (name, description, searches_count, price, active)
    SELECT 'Large Package', '250 additional lead searches', 250, 79.99, TRUE
    WHERE NOT EXISTS (
      SELECT 1 FROM public.lead_search_packages WHERE name = 'Large Package'
    );
  END IF;
END
$$;

-- 4. Give the user some search packages (as a bonus)
-- First, check if the tables exist
DO $$
DECLARE
  package_id UUID;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'lead_search_packages' AND table_schema = 'public'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_search_packages' AND table_schema = 'public'
  ) THEN
    -- Get the Medium Package ID
    SELECT id INTO package_id 
    FROM public.lead_search_packages 
    WHERE name = 'Medium Package'
    LIMIT 1;
    
    -- If we found a package ID, insert the user package
    IF package_id IS NOT NULL THEN
      INSERT INTO public.user_search_packages (user_id, package_id, remaining_searches)
      SELECT 
        '3de6eb1f-93c1-498e-938f-a0c6d43f6ec3', 
        package_id, 
        100  -- Explicit search count for Medium Package
      WHERE NOT EXISTS (
        SELECT 1 FROM public.user_search_packages 
        WHERE user_id = '3de6eb1f-93c1-498e-938f-a0c6d43f6ec3'
        AND remaining_searches > 0
      );
    END IF;
  END IF;
END
$$;

-- 5. Check remaining searches
SELECT public.get_user_remaining_searches('3de6eb1f-93c1-498e-938f-a0c6d43f6ec3') AS remaining_searches; 