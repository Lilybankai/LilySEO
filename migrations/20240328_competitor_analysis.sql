-- Add status field to competitors table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'competitors'
                  AND column_name = 'status') THEN
        ALTER TABLE public.competitors 
        ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
    END IF;
END $$;

-- Add error_message field to competitors table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'competitors'
                  AND column_name = 'error_message') THEN
        ALTER TABLE public.competitors 
        ADD COLUMN error_message TEXT;
    END IF;
END $$;

-- Rename last_analysis_date to last_analyzed_at if it exists for consistency
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'competitors'
              AND column_name = 'last_analysis_date') THEN
        ALTER TABLE public.competitors 
        RENAME COLUMN last_analysis_date TO last_analyzed_at;
    END IF;
END $$;

-- Create competitor_analysis table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.competitor_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  competitor_id UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_data JSONB NOT NULL,
  seo_metrics JSONB,
  technical_metrics JSONB,
  content_metrics JSONB,
  keyword_gaps JSONB,
  backlink_opportunities JSONB,
  insights JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS competitor_analysis_competitor_id_idx ON public.competitor_analysis(competitor_id);
CREATE INDEX IF NOT EXISTS competitor_analysis_project_id_idx ON public.competitor_analysis(project_id);
CREATE INDEX IF NOT EXISTS competitor_analysis_user_id_idx ON public.competitor_analysis(user_id);
CREATE INDEX IF NOT EXISTS competitor_analysis_created_at_idx ON public.competitor_analysis(created_at DESC);

-- Add RLS policies
ALTER TABLE public.competitor_analysis ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own competitor analysis
CREATE POLICY select_own_competitor_analysis ON public.competitor_analysis
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own competitor analysis
CREATE POLICY insert_own_competitor_analysis ON public.competitor_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own competitor analysis
CREATE POLICY update_own_competitor_analysis ON public.competitor_analysis
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own competitor analysis
CREATE POLICY delete_own_competitor_analysis ON public.competitor_analysis
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_competitor_analysis_updated_at
  BEFORE UPDATE ON public.competitor_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add competitor_limit field to projects table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'projects'
                  AND column_name = 'competitor_limit') THEN
        ALTER TABLE public.projects 
        ADD COLUMN competitor_limit INTEGER DEFAULT 1;
    END IF;
END $$;

-- Function to set competitor limit based on user's subscription tier
CREATE OR REPLACE FUNCTION set_competitor_limit_from_tier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.settings IS NOT NULL AND NEW.settings->>'tier' IS NOT NULL THEN
    IF NEW.settings->>'tier' = 'free' THEN
      NEW.competitor_limit := 1;
    ELSIF NEW.settings->>'tier' = 'pro' THEN
      NEW.competitor_limit := 5;
    ELSIF NEW.settings->>'tier' = 'enterprise' THEN
      NEW.competitor_limit := 10;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set competitor limit when project is created/updated
DROP TRIGGER IF EXISTS set_project_competitor_limit ON public.projects;
CREATE TRIGGER set_project_competitor_limit
  BEFORE INSERT OR UPDATE OF settings ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION set_competitor_limit_from_tier();

-- Update existing projects with competitor limits based on tier
DO $$
DECLARE
  project_record RECORD;
BEGIN
  FOR project_record IN SELECT id, settings FROM public.projects LOOP
    IF project_record.settings IS NOT NULL AND project_record.settings->>'tier' IS NOT NULL THEN
      IF project_record.settings->>'tier' = 'free' THEN
        UPDATE public.projects SET competitor_limit = 1 WHERE id = project_record.id;
      ELSIF project_record.settings->>'tier' = 'pro' THEN
        UPDATE public.projects SET competitor_limit = 5 WHERE id = project_record.id;
      ELSIF project_record.settings->>'tier' = 'enterprise' THEN
        UPDATE public.projects SET competitor_limit = 10 WHERE id = project_record.id;
      END IF;
    ELSE
      -- Default to free tier if no tier is set
      UPDATE public.projects SET competitor_limit = 1 WHERE id = project_record.id;
    END IF;
  END LOOP;
END $$; 