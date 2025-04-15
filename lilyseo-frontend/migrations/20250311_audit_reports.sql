-- Create audit_reports table
CREATE TABLE IF NOT EXISTS public.audit_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  report_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT audit_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT audit_reports_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS audit_reports_user_id_idx ON public.audit_reports (user_id);

-- Create index on project_id
CREATE INDEX IF NOT EXISTS audit_reports_project_id_idx ON public.audit_reports (project_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS audit_reports_created_at_idx ON public.audit_reports (created_at DESC);

-- Set up Row Level Security (RLS)
ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to select their own audit reports
CREATE POLICY audit_reports_select_policy ON public.audit_reports
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own audit reports
CREATE POLICY audit_reports_insert_policy ON public.audit_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own audit reports
CREATE POLICY audit_reports_delete_policy ON public.audit_reports
  FOR DELETE
  USING (auth.uid() = user_id); 