-- Create pdf_templates table
CREATE TABLE IF NOT EXISTS pdf_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  theme_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE pdf_templates ENABLE ROW LEVEL SECURITY;

-- Allow users to view only their own templates
CREATE POLICY "Users can view their own templates" 
  ON pdf_templates FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to insert their own templates
CREATE POLICY "Users can insert their own templates" 
  ON pdf_templates FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own templates
CREATE POLICY "Users can update their own templates" 
  ON pdf_templates FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow users to delete their own templates
CREATE POLICY "Users can delete their own templates" 
  ON pdf_templates FOR DELETE 
  USING (auth.uid() = user_id);

-- Add an index on user_id for faster queries
CREATE INDEX IF NOT EXISTS pdf_templates_user_id_idx ON pdf_templates (user_id);

-- Add a unique constraint on user_id and name
CREATE UNIQUE INDEX IF NOT EXISTS pdf_templates_user_id_name_idx ON pdf_templates (user_id, name);

-- Add function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_pdf_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update the updated_at timestamp
CREATE TRIGGER update_pdf_templates_updated_at
BEFORE UPDATE ON pdf_templates
FOR EACH ROW
EXECUTE FUNCTION update_pdf_templates_updated_at(); 