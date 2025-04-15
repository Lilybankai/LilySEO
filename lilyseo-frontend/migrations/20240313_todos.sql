-- Create todos table
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'canceled')) DEFAULT 'pending',
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS todos_user_id_idx ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS todos_project_id_idx ON public.todos(project_id);
CREATE INDEX IF NOT EXISTS todos_status_idx ON public.todos(status);
CREATE INDEX IF NOT EXISTS todos_priority_idx ON public.todos(priority);
CREATE INDEX IF NOT EXISTS todos_due_date_idx ON public.todos(due_date);

-- Create RLS policies
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own todos
CREATE POLICY select_own_todos ON public.todos
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own todos
CREATE POLICY insert_own_todos ON public.todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own todos
CREATE POLICY update_own_todos ON public.todos
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own todos
CREATE POLICY delete_own_todos ON public.todos
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON public.todos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 