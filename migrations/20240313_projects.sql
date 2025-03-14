-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active', 'archived', 'deleted')) DEFAULT 'active',
  last_audit_date TIMESTAMP WITH TIME ZONE,
  keywords TEXT[],
  competitors TEXT[]
);

-- Create indexes
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON public.projects(status);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON public.projects(created_at);

-- Create RLS policies
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own projects
CREATE POLICY select_own_projects ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own projects
CREATE POLICY insert_own_projects ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own projects
CREATE POLICY update_own_projects ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own projects
CREATE POLICY delete_own_projects ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 