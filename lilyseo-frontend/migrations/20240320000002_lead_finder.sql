-- Create the lead_searches table to track usage
CREATE TABLE IF NOT EXISTS lead_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  location TEXT NOT NULL,
  results_count INTEGER NOT NULL,
  search_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  month_year TEXT GENERATED ALWAYS AS (to_char(search_date, 'YYYY-MM')) STORED
);

-- Create the leads table to store search results
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  rating DECIMAL(3,1),
  address TEXT,
  phone TEXT,
  website TEXT,
  place_id TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  categories TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'New',
  notes TEXT,
  contacted BOOLEAN DEFAULT FALSE,
  contacted_date TIMESTAMP WITH TIME ZONE
);

-- Create search_packages table for top-up options
CREATE TABLE IF NOT EXISTS search_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  searches_count INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_search_packages table to track purchased packages
CREATE TABLE IF NOT EXISTS user_search_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES search_packages(id) ON DELETE RESTRICT,
  remaining_searches INTEGER NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create usage_limits table to define feature limits per subscription tier
CREATE TABLE IF NOT EXISTS usage_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_type TEXT NOT NULL, -- 'free', 'pro', 'enterprise'
  feature_name TEXT NOT NULL, -- 'lead_searches', etc.
  monthly_limit INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(plan_type, feature_name)
);

-- Insert default search packages
INSERT INTO search_packages (name, searches_count, price)
VALUES 
  ('Small Package', 50, 29.99),
  ('Medium Package', 100, 49.99),
  ('Large Package', 250, 99.99);

-- Insert default usage limits
INSERT INTO usage_limits (plan_type, feature_name, monthly_limit)
VALUES 
  ('enterprise', 'lead_searches', 250);

-- Add RLS policies
ALTER TABLE lead_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_search_packages ENABLE ROW LEVEL SECURITY;

-- Allow users to view only their own lead searches
CREATE POLICY "Users can view their own lead searches" 
  ON lead_searches FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to insert their own lead searches
CREATE POLICY "Users can insert their own lead searches" 
  ON lead_searches FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view only their own leads
CREATE POLICY "Users can view their own leads" 
  ON leads FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to insert their own leads
CREATE POLICY "Users can insert their own leads" 
  ON leads FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update only their own leads
CREATE POLICY "Users can update their own leads" 
  ON leads FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete only their own leads
CREATE POLICY "Users can delete their own leads" 
  ON leads FOR DELETE
  USING (auth.uid() = user_id);

-- Allow users to view their own search packages
CREATE POLICY "Users can view their own search packages" 
  ON user_search_packages FOR SELECT 
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS lead_searches_user_id_month_year_idx ON lead_searches(user_id, month_year);
CREATE INDEX IF NOT EXISTS leads_user_id_idx ON leads(user_id);
CREATE INDEX IF NOT EXISTS user_search_packages_user_id_idx ON user_search_packages(user_id); 