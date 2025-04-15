-- Create todos table
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT todos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT todos_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
  CONSTRAINT todos_status_check CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  CONSTRAINT todos_priority_check CHECK (priority IN ('low', 'medium', 'high', 'critical'))
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS todos_user_id_idx ON public.todos (user_id);

-- Create index on project_id
CREATE INDEX IF NOT EXISTS todos_project_id_idx ON public.todos (project_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS todos_status_idx ON public.todos (status);

-- Create index on priority for filtering
CREATE INDEX IF NOT EXISTS todos_priority_idx ON public.todos (priority);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS todos_created_at_idx ON public.todos (created_at DESC);

-- Set up Row Level Security (RLS)
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to select their own todos
CREATE POLICY todos_select_policy ON public.todos
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own todos
CREATE POLICY todos_insert_policy ON public.todos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own todos
CREATE POLICY todos_update_policy ON public.todos
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own todos
CREATE POLICY todos_delete_policy ON public.todos
  FOR DELETE
  USING (auth.uid() = user_id); 