-- Create audits table
CREATE TABLE IF NOT EXISTS public.audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  score INTEGER,
  report JSONB,
  pdf_url TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS audits_user_id_idx ON public.audits(user_id);
CREATE INDEX IF NOT EXISTS audits_project_id_idx ON public.audits(project_id);
CREATE INDEX IF NOT EXISTS audits_status_idx ON public.audits(status);
CREATE INDEX IF NOT EXISTS audits_created_at_idx ON public.audits(created_at);

-- Create RLS policies
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own audits
CREATE POLICY select_own_audits ON public.audits
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own audits
CREATE POLICY insert_own_audits ON public.audits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own audits
CREATE POLICY update_own_audits ON public.audits
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own audits
CREATE POLICY delete_own_audits ON public.audits
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
CREATE TRIGGER update_audits_updated_at
  BEFORE UPDATE ON public.audits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 