-- Create competitor_data table
CREATE TABLE IF NOT EXISTS public.competitor_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  competitor_url TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT competitor_data_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT competitor_data_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS competitor_data_user_id_idx ON public.competitor_data (user_id);

-- Create index on project_id
CREATE INDEX IF NOT EXISTS competitor_data_project_id_idx ON public.competitor_data (project_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS competitor_data_created_at_idx ON public.competitor_data (created_at DESC);

-- Create unique index on project_id and competitor_url to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS competitor_data_project_id_url_idx ON public.competitor_data (project_id, competitor_url);

-- Set up Row Level Security (RLS)
ALTER TABLE public.competitor_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to select their own competitor data
CREATE POLICY competitor_data_select_policy ON public.competitor_data
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own competitor data
CREATE POLICY competitor_data_insert_policy ON public.competitor_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own competitor data
CREATE POLICY competitor_data_delete_policy ON public.competitor_data
  FOR DELETE
  USING (auth.uid() = user_id); 