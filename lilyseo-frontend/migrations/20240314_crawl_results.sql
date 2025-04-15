-- Create enum for crawl status
CREATE TYPE public.crawl_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'failed'
);

-- Create table for crawl jobs
CREATE TABLE IF NOT EXISTS public.crawl_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status public.crawl_status DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create table for crawl results
CREATE TABLE IF NOT EXISTS public.crawl_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crawl_job_id UUID NOT NULL REFERENCES public.crawl_jobs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status_code INTEGER,
  title TEXT,
  meta_description TEXT,
  h1_tags TEXT[],
  canonical_url TEXT,
  robots_txt TEXT,
  load_time_ms INTEGER,
  page_size_bytes INTEGER,
  internal_links TEXT[],
  external_links TEXT[],
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create table for page SEO metrics
CREATE TABLE IF NOT EXISTS public.page_seo_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crawl_result_id UUID NOT NULL REFERENCES public.crawl_results(id) ON DELETE CASCADE,
  title_length INTEGER,
  meta_description_length INTEGER,
  has_viewport_meta BOOLEAN,
  has_favicon BOOLEAN,
  has_structured_data BOOLEAN,
  mobile_friendly BOOLEAN,
  page_speed_score DECIMAL,
  accessibility_score DECIMAL,
  seo_score DECIMAL,
  best_practices_score DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_project_id ON public.crawl_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_status ON public.crawl_jobs(status);
CREATE INDEX IF NOT EXISTS idx_crawl_results_crawl_job_id ON public.crawl_results(crawl_job_id);
CREATE INDEX IF NOT EXISTS idx_crawl_results_url ON public.crawl_results(url);
CREATE INDEX IF NOT EXISTS idx_page_seo_metrics_crawl_result_id ON public.page_seo_metrics(crawl_result_id);

-- Add RLS policies
ALTER TABLE public.crawl_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawl_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_seo_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for crawl_jobs
CREATE POLICY "Users can view their own project's crawl jobs"
  ON public.crawl_jobs FOR SELECT
  USING (project_id IN (
    SELECT id FROM public.projects
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create crawl jobs for their own projects"
  ON public.crawl_jobs FOR INSERT
  WITH CHECK (project_id IN (
    SELECT id FROM public.projects
    WHERE user_id = auth.uid()
  ));

-- Policies for crawl_results
CREATE POLICY "Users can view crawl results for their own projects"
  ON public.crawl_results FOR SELECT
  USING (crawl_job_id IN (
    SELECT id FROM public.crawl_jobs
    WHERE project_id IN (
      SELECT id FROM public.projects
      WHERE user_id = auth.uid()
    )
  ));

-- Policies for page_seo_metrics
CREATE POLICY "Users can view SEO metrics for their own projects"
  ON public.page_seo_metrics FOR SELECT
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