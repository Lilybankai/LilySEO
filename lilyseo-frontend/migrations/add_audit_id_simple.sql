-- Simple migration script to add auditId column to the todos table
-- Use this simplified version if you encounter syntax errors with the main script

-- Add the auditId column if it doesn't exist
ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS "auditId" uuid REFERENCES audit_reports(id) ON DELETE SET NULL;

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_todos_audit_id ON todos("auditId");

-- Enable row level security if not already enabled
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- You'll need to manually create the function using the Supabase UI if needed
-- This simplified script just adds the column and index 