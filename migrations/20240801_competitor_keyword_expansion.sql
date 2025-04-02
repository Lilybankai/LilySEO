-- Migration: Expand competitor analysis with enhanced keyword capabilities
-- Description: This migration adds tables and functions for enhanced keyword analysis
-- and integrates these capabilities into the project setup workflow

-- Create tables for expanded keyword data
CREATE TABLE IF NOT EXISTS public.competitor_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  position INTEGER,
  volume INTEGER,
  difficulty FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS competitor_keywords_competitor_id_idx 
  ON public.competitor_keywords(competitor_id);
CREATE INDEX IF NOT EXISTS competitor_keywords_keyword_idx 
  ON public.competitor_keywords(keyword);

-- Create table for keyword opportunities  
CREATE TABLE IF NOT EXISTS public.keyword_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES public.competitors(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  opportunity_score INTEGER NOT NULL,
  difficulty FLOAT,
  volume INTEGER,
  recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS keyword_opportunities_project_id_idx 
  ON public.keyword_opportunities(project_id);
CREATE INDEX IF NOT EXISTS keyword_opportunities_competitor_id_idx 
  ON public.keyword_opportunities(competitor_id);

-- Modify the competitors table to include a setup_reminder_sent field
ALTER TABLE public.competitors 
  ADD COLUMN IF NOT EXISTS setup_reminder_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS setup_reminder_date TIMESTAMP WITH TIME ZONE;

-- Create a function to generate keyword opportunities based on competitor keywords and project keywords
CREATE OR REPLACE FUNCTION public.generate_keyword_opportunities(p_project_id UUID)
RETURNS VOID AS $$
DECLARE
  v_competitor_id UUID;
  v_keyword RECORD;
  v_competitor_keywords TEXT[];
  v_project_keywords TEXT[];
  v_intersection TEXT[];
  v_diff TEXT[];
BEGIN
  -- Get project keywords
  SELECT ARRAY_AGG(keyword) INTO v_project_keywords
  FROM public.project_keywords
  WHERE project_id = p_project_id;
  
  -- If no project keywords, no opportunities
  IF v_project_keywords IS NULL OR ARRAY_LENGTH(v_project_keywords, 1) = 0 THEN
    RETURN;
  END IF;
  
  -- For each competitor
  FOR v_competitor_id IN 
    SELECT id FROM public.competitors WHERE project_id = p_project_id
  LOOP
    -- Get competitor keywords
    SELECT ARRAY_AGG(keyword) INTO v_competitor_keywords
    FROM public.competitor_keywords
    WHERE competitor_id = v_competitor_id;
    
    -- If no competitor keywords, skip
    IF v_competitor_keywords IS NULL OR ARRAY_LENGTH(v_competitor_keywords, 1) = 0 THEN
      CONTINUE;
    END IF;
    
    -- Find keywords that competitor ranks for but project doesn't
    SELECT ARRAY(SELECT UNNEST(v_competitor_keywords) EXCEPT SELECT UNNEST(v_project_keywords)) INTO v_diff;
    
    -- Find common keywords
    SELECT ARRAY(SELECT UNNEST(v_competitor_keywords) INTERSECT SELECT UNNEST(v_project_keywords)) INTO v_intersection;
    
    -- Insert opportunities for keywords that competitor ranks for but project doesn't
    FOREACH v_keyword IN ARRAY v_diff
    LOOP
      INSERT INTO public.keyword_opportunities (
        project_id,
        competitor_id,
        keyword,
        opportunity_score,
        recommendation
      )
      SELECT 
        p_project_id,
        v_competitor_id,
        v_keyword,
        -- Higher opportunity score for high volume, low difficulty
        GREATEST(10, LEAST(100, COALESCE(ck.volume, 50) / GREATEST(1, COALESCE(ck.difficulty, 50)) * 100))::INTEGER,
        'Competitor ranks for this keyword but your site does not. Consider targeting this keyword.'
      FROM public.competitor_keywords ck
      WHERE ck.competitor_id = v_competitor_id AND ck.keyword = v_keyword
      ON CONFLICT (project_id, competitor_id, keyword) DO NOTHING;
    END LOOP;
    
    -- Insert opportunities for common keywords where competitor ranks higher
    FOREACH v_keyword IN ARRAY v_intersection
    LOOP
      INSERT INTO public.keyword_opportunities (
        project_id,
        competitor_id,
        keyword,
        opportunity_score,
        recommendation
      )
      SELECT 
        p_project_id,
        v_competitor_id,
        v_keyword,
        -- Moderate opportunity score for improving existing rankings
        GREATEST(10, LEAST(80, (pk.position - ck.position) * 10))::INTEGER,
        'Both you and competitor rank for this keyword, but competitor ranks higher. Consider improving your content.'
      FROM public.competitor_keywords ck
      JOIN public.project_keywords pk ON pk.keyword = ck.keyword AND pk.project_id = p_project_id
      WHERE ck.competitor_id = v_competitor_id AND ck.keyword = v_keyword AND ck.position < pk.position
      ON CONFLICT (project_id, competitor_id, keyword) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to send reminders for projects without competitors
CREATE OR REPLACE FUNCTION public.check_competitor_setup_reminders()
RETURNS VOID AS $$
DECLARE
  v_project RECORD;
  v_competitor_count INTEGER;
BEGIN
  -- Find projects without competitors
  FOR v_project IN 
    SELECT p.id, p.name, p.user_id
    FROM public.projects p
    WHERE p.created_at < NOW() - INTERVAL '1 day'
    AND p.status = 'active'
  LOOP
    -- Count competitors
    SELECT COUNT(*) INTO v_competitor_count
    FROM public.competitors
    WHERE project_id = v_project.id;
    
    -- If no competitors and no reminder sent yet
    IF v_competitor_count = 0 THEN
      -- Check if we've already sent a reminder
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications 
        WHERE user_id = v_project.user_id 
        AND project_id = v_project.id
        AND type = 'competitor_setup_reminder'
      ) THEN
        -- Insert notification
        INSERT INTO public.notifications (
          user_id,
          project_id,
          title,
          message,
          type,
          read,
          action_url
        ) VALUES (
          v_project.user_id,
          v_project.id,
          'Add competitors to ' || v_project.name,
          'Adding competitors will help you track your SEO performance against similar websites. Get insights into keyword gaps, content opportunities, and more.',
          'competitor_setup_reminder',
          FALSE,
          '/projects/' || v_project.id || '/competitors'
        );
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the reminder check to run daily
SELECT cron.schedule(
  'check-competitor-setup-reminders',
  '0 12 * * *', -- Run at noon every day
  $$SELECT public.check_competitor_setup_reminders()$$
);

-- Create table for notifications if it doesn't exist yet
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_project_id_idx ON public.notifications(project_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications(read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at);

-- Create or replace project_keywords table to track rankings
CREATE TABLE IF NOT EXISTS public.project_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  position INTEGER,
  volume INTEGER,
  difficulty FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, keyword)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS project_keywords_project_id_idx ON public.project_keywords(project_id);
CREATE INDEX IF NOT EXISTS project_keywords_keyword_idx ON public.project_keywords(keyword);

-- Create a trigger function to automatically generate opportunities when keywords are updated
CREATE OR REPLACE FUNCTION public.trigger_generate_keyword_opportunities()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.generate_keyword_opportunities(NEW.project_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to generate opportunities when keywords are updated
DROP TRIGGER IF EXISTS trigger_project_keywords_opportunities ON public.project_keywords;
CREATE TRIGGER trigger_project_keywords_opportunities
AFTER INSERT OR UPDATE ON public.project_keywords
FOR EACH ROW
EXECUTE FUNCTION public.trigger_generate_keyword_opportunities();

DROP TRIGGER IF EXISTS trigger_competitor_keywords_opportunities ON public.competitor_keywords;
CREATE TRIGGER trigger_competitor_keywords_opportunities
AFTER INSERT OR UPDATE ON public.competitor_keywords
FOR EACH ROW
EXECUTE FUNCTION public.trigger_generate_keyword_opportunities();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competitor_keywords TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.keyword_opportunities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_keywords TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_keyword_opportunities TO authenticated; 