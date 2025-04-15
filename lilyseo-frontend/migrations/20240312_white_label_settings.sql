-- Create white_label_settings table
CREATE TABLE IF NOT EXISTS public.white_label_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logo_url TEXT,
  logo_alt TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  company_name TEXT,
  custom_domain TEXT,
  custom_css TEXT,
  custom_js TEXT,
  custom_copyright TEXT,
  social_links JSONB,
  navigation JSONB,
  footer_navigation JSONB,
  is_active BOOLEAN DEFAULT FALSE
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS white_label_settings_user_id_idx ON public.white_label_settings(user_id);

-- Create RLS policies
ALTER TABLE public.white_label_settings ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own white label settings
CREATE POLICY select_own_white_label_settings ON public.white_label_settings
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own white label settings
CREATE POLICY insert_own_white_label_settings ON public.white_label_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own white label settings
CREATE POLICY update_own_white_label_settings ON public.white_label_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own white label settings
CREATE POLICY delete_own_white_label_settings ON public.white_label_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_white_label_settings_updated_at
  BEFORE UPDATE ON public.white_label_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 