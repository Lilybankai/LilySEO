-- Create competitors table
CREATE TABLE IF NOT EXISTS public.competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  keywords TEXT[],
  last_analysis_date TIMESTAMP WITH TIME ZONE,
  analysis_data JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS competitors_user_id_idx ON public.competitors(user_id);
CREATE INDEX IF NOT EXISTS competitors_project_id_idx ON public.competitors(project_id);
CREATE INDEX IF NOT EXISTS competitors_last_analysis_date_idx ON public.competitors(last_analysis_date);

-- Create RLS policies
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own competitors
CREATE POLICY select_own_competitors ON public.competitors
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own competitors
CREATE POLICY insert_own_competitors ON public.competitors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own competitors
CREATE POLICY update_own_competitors ON public.competitors
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own competitors
CREATE POLICY delete_own_competitors ON public.competitors
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_competitors_updated_at
  BEFORE UPDATE ON public.competitors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 