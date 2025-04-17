-- Add subscription_tier column to projects table
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'projects' 
    AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN subscription_tier TEXT DEFAULT 'free';
    
    -- Create an index for performance
    CREATE INDEX IF NOT EXISTS projects_subscription_tier_idx ON public.projects(subscription_tier);
    
    -- Update existing projects with subscription tier from user profiles
    UPDATE public.projects p
    SET subscription_tier = COALESCE(
      (SELECT subscription_tier FROM public.profiles WHERE id = p.user_id),
      'free'
    );
    
    -- Make sure subscription_tier is included in the schema cache
    NOTIFY pgrst, 'reload schema';
  END IF;
END $$; 