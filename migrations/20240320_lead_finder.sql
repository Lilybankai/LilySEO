-- Lead Finder Migration
-- This migration adds tables for the Lead Finder feature, including:
-- - lead_search_packages: Available search packages for purchase
-- - user_search_packages: User-purchased search packages
-- - lead_searches: Record of searches performed
-- - leads: Business leads saved by users

-- Create lead_search_packages table
CREATE TABLE IF NOT EXISTS public.lead_search_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  searches_count INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  active BOOLEAN DEFAULT TRUE
);

-- Create user_search_packages table
CREATE TABLE IF NOT EXISTS public.user_search_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.lead_search_packages(id) ON DELETE CASCADE,
  remaining_searches INTEGER NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead_searches table
CREATE TABLE IF NOT EXISTS public.lead_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  location TEXT NOT NULL,
  min_rating DECIMAL(3, 1),
  max_results INTEGER,
  results_count INTEGER,
  search_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  website TEXT,
  rating DECIMAL(3, 1),
  place_id TEXT,
  latitude DECIMAL(10, 6),
  longitude DECIMAL(10, 6),
  categories TEXT[],
  notes TEXT,
  status TEXT CHECK (status IN ('New', 'Contacted', 'Qualified', 'Negotiating', 'Won', 'Lost')) DEFAULT 'New',
  contacted BOOLEAN DEFAULT FALSE,
  contacted_date TIMESTAMP WITH TIME ZONE,
  search_id UUID REFERENCES public.lead_searches(id) ON DELETE SET NULL
);

-- Create functions
-- Function to calculate the remaining searches for a user
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

-- Function to update profile search count when a search is performed
CREATE OR REPLACE FUNCTION public.update_lead_search_count()
RETURNS TRIGGER AS $$
DECLARE
  user_uuid UUID := NEW.user_id;
  available_in_plan INTEGER;
  available_in_packages INTEGER;
  package_to_update UUID;
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for lead searches
CREATE TRIGGER update_lead_search_usage
  AFTER INSERT ON public.lead_searches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lead_search_count();

-- Create indexes
CREATE INDEX IF NOT EXISTS lead_search_packages_active_idx ON public.lead_search_packages(active);
CREATE INDEX IF NOT EXISTS user_search_packages_user_id_idx ON public.user_search_packages(user_id);
CREATE INDEX IF NOT EXISTS lead_searches_user_id_idx ON public.lead_searches(user_id);
CREATE INDEX IF NOT EXISTS lead_searches_search_date_idx ON public.lead_searches(search_date);
CREATE INDEX IF NOT EXISTS leads_user_id_idx ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS leads_status_idx ON public.leads(status);

-- Create RLS policies

-- lead_search_packages table policies
ALTER TABLE public.lead_search_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all active packages" ON public.lead_search_packages
  FOR SELECT
  USING (active = TRUE);

CREATE POLICY "Allow admin to manage packages" ON public.lead_search_packages
  USING (auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  ));

-- user_search_packages table policies
ALTER TABLE public.user_search_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view their own packages" ON public.user_search_packages
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to buy packages" ON public.user_search_packages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- lead_searches table policies
ALTER TABLE public.lead_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view their own searches" ON public.lead_searches
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to create searches" ON public.lead_searches
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- leads table policies
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view their own leads" ON public.leads
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own leads" ON public.leads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own leads" ON public.leads
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own leads" ON public.leads
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create update triggers for updated_at column

CREATE TRIGGER update_lead_search_packages_updated_at
  BEFORE UPDATE ON public.lead_search_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_search_packages_updated_at
  BEFORE UPDATE ON public.user_search_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_searches_updated_at
  BEFORE UPDATE ON public.lead_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default search packages
INSERT INTO public.lead_search_packages (name, description, searches_count, price, active)
VALUES 
  ('Small Package', '50 additional lead searches', 50, 19.99, TRUE),
  ('Medium Package', '100 additional lead searches', 100, 34.99, TRUE),
  ('Large Package', '250 additional lead searches', 250, 79.99, TRUE); 