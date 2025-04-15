-- Create the pdf_generation_jobs table
CREATE TABLE IF NOT EXISTS pdf_generation_jobs (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER NOT NULL DEFAULT 0,
  parameters JSONB NOT NULL DEFAULT '{}',
  error_message TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  content JSONB
);

-- Create an index on audit_id for faster lookups
CREATE INDEX IF NOT EXISTS pdf_generation_jobs_audit_id_idx ON pdf_generation_jobs(audit_id);

-- Create an index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS pdf_generation_jobs_user_id_idx ON pdf_generation_jobs(user_id);

-- Create an index on status for faster filtering
CREATE INDEX IF NOT EXISTS pdf_generation_jobs_status_idx ON pdf_generation_jobs(status);

-- Set up RLS policies
ALTER TABLE pdf_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Allow users to select their own jobs
CREATE POLICY select_own_pdf_jobs ON pdf_generation_jobs
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own jobs
CREATE POLICY insert_own_pdf_jobs ON pdf_generation_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own jobs
CREATE POLICY update_own_pdf_jobs ON pdf_generation_jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own jobs
CREATE POLICY delete_own_pdf_jobs ON pdf_generation_jobs
  FOR DELETE USING (auth.uid() = user_id);

-- Create an updated_at trigger
CREATE OR REPLACE FUNCTION update_pdf_generation_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pdf_generation_jobs_updated_at
BEFORE UPDATE ON pdf_generation_jobs
FOR EACH ROW
EXECUTE FUNCTION update_pdf_generation_jobs_updated_at();

-- Functions for job management
CREATE OR REPLACE FUNCTION update_pdf_generation_job_status(
  p_job_id UUID,
  p_status VARCHAR,
  p_progress INTEGER,
  p_error_message TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE pdf_generation_jobs
  SET 
    status = p_status,
    progress = p_progress,
    error_message = p_error_message,
    updated_at = NOW()
  WHERE 
    id = p_job_id AND 
    auth.uid() = user_id;
    
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_pdf_generation_job_content(
  p_job_id UUID,
  p_content JSONB
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE pdf_generation_jobs
  SET 
    content = p_content,
    updated_at = NOW()
  WHERE 
    id = p_job_id AND 
    auth.uid() = user_id;
    
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 