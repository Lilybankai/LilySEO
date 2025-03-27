-- INSTRUCTIONS:
-- 1. Log in to your Supabase dashboard
-- 2. Go to SQL Editor
-- 3. Copy this entire file
-- 4. Paste it into the SQL editor
-- 5. Click "Run" to execute the migration

-- First, check if the table has RLS enabled
DO $$
DECLARE
  has_rls BOOLEAN;
BEGIN
  SELECT obj_description(oid, 'pg_class')::jsonb->>'security_type' = 'row_level_security'
  INTO has_rls
  FROM pg_class
  WHERE relname = 'notifications' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
  
  IF NOT has_rls THEN
    RAISE NOTICE 'Enabling RLS for notifications table';
    EXECUTE 'ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;';
  END IF;
END $$;

-- Delete any broken policies
DROP POLICY IF EXISTS "Users can see their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- Create proper policies
CREATE POLICY "Users can see their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- Simpler policy for insert - just allow users to insert their own notifications
CREATE POLICY "Users can insert their own notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow service role to insert notifications for any user
CREATE POLICY "Service role can insert any notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (
  -- This is a more reliable way to check for service role in Supabase
  current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Insert a test notification for the current user
-- This command might only work when run as a service role
INSERT INTO public.notifications (
  user_id,
  title,
  message,
  is_read,
  created_at
)
SELECT
  auth.uid(),
  'Welcome to LilySEO!',
  'Your notification system is now working properly.',
  false,
  now()
WHERE 
  -- Only add if we have a valid user ID
  auth.uid() IS NOT NULL AND
  -- And the notification doesn't already exist
  NOT EXISTS (
    SELECT 1 FROM public.notifications 
    WHERE title = 'Welcome to LilySEO!'
    AND user_id = auth.uid()
  ); 