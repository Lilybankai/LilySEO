-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  full_name TEXT,
  avatar_url TEXT,
  email TEXT NOT NULL,
  subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('free', 'pro', 'enterprise')) DEFAULT 'free',
  subscription_status TEXT CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  company_name TEXT,
  company_size TEXT,
  industry TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_subscription_tier_idx ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS profiles_subscription_status_idx ON public.profiles(subscription_status);
CREATE INDEX IF NOT EXISTS profiles_stripe_customer_id_idx ON public.profiles(stripe_customer_id);

-- Create RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own profile
CREATE POLICY select_own_profile ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy for users to update their own profile
CREATE POLICY update_own_profile ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create function to create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to create a profile when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 