-- Migration: Add team management and enhanced todos functionality
-- Date: 2024-06-27

-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  team_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  permissions TEXT NOT NULL DEFAULT 'member', -- 'admin', 'member', 'viewer'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'inactive'
  invite_token TEXT,
  invite_expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(team_owner_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS team_members_team_owner_id_idx ON public.team_members(team_owner_id);
CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS team_members_status_idx ON public.team_members(status);

-- Set up Row Level Security (RLS)
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create policy to allow team owners to manage their team members
CREATE POLICY team_members_team_owner_policy ON public.team_members
  FOR ALL
  USING (auth.uid() = team_owner_id);

-- Create policy to allow users to view teams they belong to
CREATE POLICY team_members_team_member_policy ON public.team_members
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create subscription_limits table
CREATE TABLE IF NOT EXISTS public.subscription_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_tier TEXT NOT NULL UNIQUE,
  team_member_limit INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default values for subscription limits
INSERT INTO public.subscription_limits (subscription_tier, team_member_limit)
VALUES 
  ('free', 0),
  ('pro', 5),
  ('enterprise', 15)
ON CONFLICT (subscription_tier) 
DO UPDATE SET 
  team_member_limit = EXCLUDED.team_member_limit,
  updated_at = NOW();

-- Update todos table with new fields
DO $$ 
BEGIN 
  -- Add assigned_to column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'todos' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE public.todos ADD COLUMN assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS todos_assigned_to_idx ON public.todos(assigned_to);
  END IF;
  
  -- Add custom_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'todos' AND column_name = 'custom_status'
  ) THEN
    ALTER TABLE public.todos ADD COLUMN custom_status TEXT;
  END IF;
  
  -- Add time_spent column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'todos' AND column_name = 'time_spent'
  ) THEN
    ALTER TABLE public.todos ADD COLUMN time_spent INTEGER DEFAULT 0;
  END IF;
  
  -- Add time_tracked_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'todos' AND column_name = 'time_tracked_at'
  ) THEN
    ALTER TABLE public.todos ADD COLUMN time_tracked_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add ai_recommendations column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'todos' AND column_name = 'ai_recommendations'
  ) THEN
    ALTER TABLE public.todos ADD COLUMN ai_recommendations JSONB;
  END IF;
  
  -- Add scheduled_for column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'todos' AND column_name = 'scheduled_for'
  ) THEN
    ALTER TABLE public.todos ADD COLUMN scheduled_for TIMESTAMP WITH TIME ZONE;
    CREATE INDEX IF NOT EXISTS todos_scheduled_for_idx ON public.todos(scheduled_for);
  END IF;
END $$;

-- Create custom_statuses table
CREATE TABLE IF NOT EXISTS public.custom_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS custom_statuses_user_id_idx ON public.custom_statuses(user_id);
CREATE INDEX IF NOT EXISTS custom_statuses_position_idx ON public.custom_statuses(position);

-- Set up Row Level Security (RLS)
ALTER TABLE public.custom_statuses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their custom statuses
CREATE POLICY custom_statuses_owner_policy ON public.custom_statuses
  FOR ALL
  USING (auth.uid() = user_id);

-- Create todo_metrics table
CREATE TABLE IF NOT EXISTS public.todo_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- Store just year-month for monthly metrics
  todos_created INTEGER DEFAULT 0,
  todos_completed INTEGER DEFAULT 0,
  average_completion_time INTEGER DEFAULT 0, -- In seconds
  total_time_spent INTEGER DEFAULT 0, -- In seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id, month)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS todo_metrics_project_id_idx ON public.todo_metrics(project_id);
CREATE INDEX IF NOT EXISTS todo_metrics_user_id_idx ON public.todo_metrics(user_id);
CREATE INDEX IF NOT EXISTS todo_metrics_month_idx ON public.todo_metrics(month);

-- Set up Row Level Security (RLS)
ALTER TABLE public.todo_metrics ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their metrics
CREATE POLICY todo_metrics_owner_policy ON public.todo_metrics
  FOR ALL
  USING (auth.uid() = user_id);

-- Create function to update todo metrics when a todo is created
CREATE OR REPLACE FUNCTION update_todo_created_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract year and month from creation timestamp
  DECLARE
    todo_month DATE := date_trunc('month', NEW.created_at)::date;
  BEGIN
    -- Try to update existing record
    UPDATE public.todo_metrics
    SET 
      todos_created = todos_created + 1,
      updated_at = NOW()
    WHERE 
      project_id = NEW.project_id 
      AND user_id = NEW.user_id 
      AND month = todo_month;
    
    -- If no record was updated (no record exists), insert a new one
    IF NOT FOUND THEN
      INSERT INTO public.todo_metrics (
        project_id, 
        user_id, 
        month, 
        todos_created
      ) VALUES (
        NEW.project_id,
        NEW.user_id,
        todo_month,
        1
      );
    END IF;
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for todo creation
DROP TRIGGER IF EXISTS update_todo_created_metrics_trigger ON public.todos;
CREATE TRIGGER update_todo_created_metrics_trigger
AFTER INSERT ON public.todos
FOR EACH ROW
EXECUTE FUNCTION update_todo_created_metrics();

-- Create function to update todo metrics when a todo is completed
CREATE OR REPLACE FUNCTION update_todo_completed_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'completed'
  IF NEW.status = 'completed' AND (OLD.status != 'completed' OR OLD.status IS NULL) THEN
    -- Extract year and month from completion timestamp
    DECLARE
      completion_month DATE := date_trunc('month', NOW())::date;
      completion_time INTEGER := 0;
    BEGIN
      -- Calculate completion time if we have created_at
      IF NEW.created_at IS NOT NULL THEN
        completion_time := EXTRACT(EPOCH FROM (NOW() - NEW.created_at))::INTEGER;
      END IF;
      
      -- Try to update existing record
      UPDATE public.todo_metrics
      SET 
        todos_completed = todos_completed + 1,
        total_time_spent = total_time_spent + NEW.time_spent,
        average_completion_time = CASE
          WHEN todos_completed = 0 THEN completion_time
          ELSE (average_completion_time * todos_completed + completion_time) / (todos_completed + 1)
        END,
        updated_at = NOW()
      WHERE 
        project_id = NEW.project_id 
        AND user_id = NEW.user_id 
        AND month = completion_month;
      
      -- If no record was updated (no record exists), insert a new one
      IF NOT FOUND THEN
        INSERT INTO public.todo_metrics (
          project_id, 
          user_id, 
          month, 
          todos_completed,
          average_completion_time,
          total_time_spent
        ) VALUES (
          NEW.project_id,
          NEW.user_id,
          completion_month,
          1,
          completion_time,
          NEW.time_spent
        );
      END IF;
      
      RETURN NEW;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for todo completion
DROP TRIGGER IF EXISTS update_todo_completed_metrics_trigger ON public.todos;
CREATE TRIGGER update_todo_completed_metrics_trigger
AFTER UPDATE ON public.todos
FOR EACH ROW
EXECUTE FUNCTION update_todo_completed_metrics();

-- Create a function to check team member limits
CREATE OR REPLACE FUNCTION check_team_member_limit(p_team_owner_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription_tier TEXT;
  v_team_member_limit INTEGER;
  v_current_member_count INTEGER;
BEGIN
  -- Get the user's subscription tier
  SELECT subscription_tier INTO v_subscription_tier
  FROM profiles
  WHERE id = p_team_owner_id;
  
  -- Default to 'free' if not found
  IF v_subscription_tier IS NULL THEN
    v_subscription_tier := 'free';
  END IF;
  
  -- Get the team member limit for this tier
  SELECT team_member_limit INTO v_team_member_limit
  FROM subscription_limits
  WHERE subscription_tier = v_subscription_tier;
  
  -- Default to 0 if not found
  IF v_team_member_limit IS NULL THEN
    v_team_member_limit := 0;
  END IF;
  
  -- Count current team members
  SELECT COUNT(*) INTO v_current_member_count
  FROM team_members
  WHERE team_owner_id = p_team_owner_id;
  
  -- Return true if below limit, false if at or above limit
  RETURN v_current_member_count < v_team_member_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add team member with limit check
CREATE OR REPLACE FUNCTION add_team_member(
  p_team_owner_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_permissions TEXT DEFAULT 'member'
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  permissions TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_user_id UUID;
  v_invite_token TEXT;
  v_team_member_id UUID;
BEGIN
  -- Check if under team member limit
  IF NOT check_team_member_limit(p_team_owner_id) THEN
    RAISE EXCEPTION 'Team member limit reached for your subscription tier';
  END IF;
  
  -- Check if user already exists by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;
  
  -- Generate invite token (simple UUID for now)
  v_invite_token := uuid_generate_v4()::TEXT;
  
  -- Insert team member
  INSERT INTO team_members (
    team_owner_id,
    user_id,
    email,
    name,
    permissions,
    status,
    invite_token,
    invite_expires_at
  ) VALUES (
    p_team_owner_id,
    COALESCE(v_user_id, '00000000-0000-0000-0000-000000000000'::UUID), -- Placeholder if user doesn't exist yet
    p_email,
    p_name,
    p_permissions,
    'pending',
    v_invite_token,
    NOW() + INTERVAL '7 days'
  )
  RETURNING id, email, name, permissions, status, created_at INTO v_team_member_id, p_email, p_name, p_permissions, status, created_at;
  
  RETURN QUERY
  SELECT 
    v_team_member_id,
    p_email,
    p_name,
    p_permissions,
    'pending'::TEXT,
    created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 