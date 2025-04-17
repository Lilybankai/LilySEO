-- Create usage limits for lead finder feature
-- This ensures that only enterprise users can access the Lead Finder feature

-- Check if the usage_limits table exists
CREATE TABLE IF NOT EXISTS public.usage_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  plan_type TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  monthly_limit INTEGER NOT NULL,
  UNIQUE (plan_type, feature_name)
);

-- Enable RLS if not already enabled
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for admin access if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'usage_limits' AND policyname = 'Allow admins to manage usage limits'
  ) THEN
    CREATE POLICY "Allow admins to manage usage limits" ON public.usage_limits
      USING (auth.uid() IN (
        SELECT auth.uid() FROM auth.users 
        WHERE raw_user_meta_data->>'role' = 'admin'
      ));
  END IF;
END
$$;

-- Add RLS policies for read access if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'usage_limits' AND policyname = 'Allow read access to all users'
  ) THEN
    CREATE POLICY "Allow read access to all users" ON public.usage_limits
      FOR SELECT USING (true);
  END IF;
END
$$;

-- Create trigger for updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_usage_limits_updated_at'
  ) THEN
    CREATE TRIGGER update_usage_limits_updated_at
      BEFORE UPDATE ON public.usage_limits
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- Insert/update usage limits for lead finder
INSERT INTO public.usage_limits (plan_type, feature_name, monthly_limit)
VALUES 
  ('free', 'lead_finder_searches', 0),
  ('pro', 'lead_finder_searches', 0),
  ('enterprise', 'lead_finder_searches', 250)
ON CONFLICT (plan_type, feature_name) 
DO UPDATE SET 
  monthly_limit = EXCLUDED.monthly_limit,
  updated_at = NOW(); 