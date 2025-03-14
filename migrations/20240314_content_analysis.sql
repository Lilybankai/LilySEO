-- Create enum for content quality score
CREATE TYPE public.content_quality AS ENUM (
  'poor',
  'fair',
  'good',
  'excellent'
);

-- Create table for content analysis results
CREATE TABLE IF NOT EXISTS public.content_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crawl_result_id UUID NOT NULL REFERENCES public.crawl_results(id) ON DELETE CASCADE,
  word_count INTEGER,
  reading_time INTEGER, -- in seconds
  readability_score DECIMAL, -- Flesch-Kincaid score
  content_quality public.content_quality,
  keyword_density JSONB, -- Store keyword frequencies
  sentiment_score DECIMAL,
  topics TEXT[],
  main_keywords TEXT[],
  suggested_keywords TEXT[],
  content_gaps TEXT[],
  improvement_suggestions TEXT[],
  ai_recommendations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create table for content history
CREATE TABLE IF NOT EXISTS public.content_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crawl_result_id UUID NOT NULL REFERENCES public.crawl_results(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL, -- MD5 hash of the content
  content_snapshot TEXT NOT NULL, -- Store the actual content
  word_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_content_analysis_crawl_result_id ON public.content_analysis(crawl_result_id);
CREATE INDEX IF NOT EXISTS idx_content_history_crawl_result_id ON public.content_history(crawl_result_id);
CREATE INDEX IF NOT EXISTS idx_content_history_content_hash ON public.content_history(content_hash);

-- Add RLS policies
ALTER TABLE public.content_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_history ENABLE ROW LEVEL SECURITY;

-- Policies for content_analysis
CREATE POLICY "Users can view content analysis for their own projects"
  ON public.content_analysis FOR SELECT
  USING (crawl_result_id IN (
    SELECT id FROM public.crawl_results
    WHERE crawl_job_id IN (
      SELECT id FROM public.crawl_jobs
      WHERE project_id IN (
        SELECT id FROM public.projects
        WHERE user_id = auth.uid()
      )
    )
  ));

-- Policies for content_history
CREATE POLICY "Users can view content history for their own projects"
  ON public.content_history FOR SELECT
  USING (crawl_result_id IN (
    SELECT id FROM public.crawl_results
    WHERE crawl_job_id IN (
      SELECT id FROM public.crawl_jobs
      WHERE project_id IN (
        SELECT id FROM public.projects
        WHERE user_id = auth.uid()
      )
    )
  )); 