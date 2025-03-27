-- INSTRUCTIONS:
-- 1. Log in to your Supabase dashboard
-- 2. Go to SQL Editor
-- 3. Copy this entire file
-- 4. Paste it into the SQL editor
-- 5. Click "Run" to execute the migration

-- Add completion_date column to todos table
ALTER TABLE public.todos
ADD COLUMN IF NOT EXISTS completion_date timestamp with time zone;

-- Add comment to the column
COMMENT ON COLUMN public.todos.completion_date IS 'The date and time when the todo was marked as completed';

-- Create an index on the completion_date column for faster querying
CREATE INDEX IF NOT EXISTS idx_todos_completion_date ON public.todos(completion_date);

-- Update existing completed todos to set the completion_date to updated_at
UPDATE public.todos 
SET completion_date = updated_at 
WHERE status = 'completed' AND completion_date IS NULL; 