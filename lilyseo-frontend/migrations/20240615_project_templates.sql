-- Create project_templates table
CREATE TABLE IF NOT EXISTS public.project_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  organization_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_data JSONB NOT NULL,
  industry TEXT,
  is_default BOOLEAN DEFAULT FALSE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS project_templates_organization_id_idx ON public.project_templates(organization_id);
CREATE INDEX IF NOT EXISTS project_templates_industry_idx ON public.project_templates(industry);

-- Create RLS policies
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own templates
CREATE POLICY select_own_templates ON public.project_templates
  FOR SELECT USING (auth.uid() = organization_id);

-- Policy for users to insert their own templates
CREATE POLICY insert_own_templates ON public.project_templates
  FOR INSERT WITH CHECK (auth.uid() = organization_id);

-- Policy for users to update their own templates
CREATE POLICY update_own_templates ON public.project_templates
  FOR UPDATE USING (auth.uid() = organization_id);

-- Policy for users to delete their own templates
CREATE POLICY delete_own_templates ON public.project_templates
  FOR DELETE USING (auth.uid() = organization_id);

-- Add industry field to projects table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'projects' 
                   AND column_name = 'industry') THEN
        ALTER TABLE public.projects 
        ADD COLUMN industry TEXT;
    END IF;
END $$;

-- Create google_search_console_connections table
CREATE TABLE IF NOT EXISTS public.google_search_console_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMP WITH TIME ZONE NOT NULL,
  site_url TEXT NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS gsc_connections_user_id_idx ON public.google_search_console_connections(user_id);
CREATE INDEX IF NOT EXISTS gsc_connections_project_id_idx ON public.google_search_console_connections(project_id);

-- Create RLS policies
ALTER TABLE public.google_search_console_connections ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own GSC connections
CREATE POLICY select_own_gsc_connections ON public.google_search_console_connections
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own GSC connections
CREATE POLICY insert_own_gsc_connections ON public.google_search_console_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own GSC connections
CREATE POLICY update_own_gsc_connections ON public.google_search_console_connections
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own GSC connections
CREATE POLICY delete_own_gsc_connections ON public.google_search_console_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for project_templates
CREATE TRIGGER update_project_templates_updated_at
  BEFORE UPDATE ON public.project_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for google_search_console_connections
CREATE TRIGGER update_gsc_connections_updated_at
  BEFORE UPDATE ON public.google_search_console_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 