-- Create todo_columns table for kanban board column customization
CREATE TABLE IF NOT EXISTS public.todo_columns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS todo_columns_user_id_idx ON public.todo_columns(user_id);
CREATE INDEX IF NOT EXISTS todo_columns_position_idx ON public.todo_columns(position);

-- Set up Row Level Security (RLS)
ALTER TABLE public.todo_columns ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their custom columns
CREATE POLICY todo_columns_owner_policy ON public.todo_columns
  FOR ALL
  USING (auth.uid() = user_id);

-- Add default columns for existing users
INSERT INTO public.todo_columns (user_id, title, status, color, position)
SELECT 
  id AS user_id,
  'To Do' AS title,
  'pending' AS status,
  '#3B82F6' AS color,
  0 AS position
FROM 
  auth.users
WHERE
  NOT EXISTS (
    SELECT 1 FROM public.todo_columns 
    WHERE public.todo_columns.user_id = auth.users.id AND position = 0
  );

INSERT INTO public.todo_columns (user_id, title, status, color, position)
SELECT 
  id AS user_id,
  'In Progress' AS title,
  'in_progress' AS status,
  '#F59E0B' AS color,
  1 AS position
FROM 
  auth.users
WHERE
  NOT EXISTS (
    SELECT 1 FROM public.todo_columns 
    WHERE public.todo_columns.user_id = auth.users.id AND position = 1
  );

INSERT INTO public.todo_columns (user_id, title, status, color, position)
SELECT 
  id AS user_id,
  'Review' AS title,
  'review' AS status,
  '#8B5CF6' AS color,
  2 AS position
FROM 
  auth.users
WHERE
  NOT EXISTS (
    SELECT 1 FROM public.todo_columns 
    WHERE public.todo_columns.user_id = auth.users.id AND position = 2
  );

INSERT INTO public.todo_columns (user_id, title, status, color, position)
SELECT 
  id AS user_id,
  'Completed' AS title,
  'completed' AS status,
  '#10B981' AS color,
  3 AS position
FROM 
  auth.users
WHERE
  NOT EXISTS (
    SELECT 1 FROM public.todo_columns 
    WHERE public.todo_columns.user_id = auth.users.id AND position = 3
  ); 