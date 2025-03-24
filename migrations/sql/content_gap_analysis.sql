-- Content gap analysis storage schema
-- This will allow storing analyzed content gaps and recommendations

-- Add content_gap_analysis table to store analysis results
CREATE TABLE IF NOT EXISTS public.content_gap_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  missing_topics JSONB DEFAULT '[]'::JSONB,
  suggested_content JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add content_rewrites table to track AI content optimizations
CREATE TABLE IF NOT EXISTS public.content_rewrites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  original_text TEXT NOT NULL,
  rewritten_text TEXT NOT NULL,
  optimization_type VARCHAR(50) NOT NULL DEFAULT 'seo', -- seo, readability, keywords, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create RLS policies for content_gap_analysis
ALTER TABLE public.content_gap_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own content gap analyses"
  ON public.content_gap_analysis
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own content gap analyses"
  ON public.content_gap_analysis
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content gap analyses"
  ON public.content_gap_analysis
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content gap analyses"
  ON public.content_gap_analysis
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for content_rewrites
ALTER TABLE public.content_rewrites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own content rewrites"
  ON public.content_rewrites
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own content rewrites"
  ON public.content_rewrites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content rewrites"
  ON public.content_rewrites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add audit_recommendations table for structured storage of AI recommendations
CREATE TABLE IF NOT EXISTS public.audit_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  impact TEXT,
  implementation TEXT,
  cms_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create RLS policies for audit_recommendations
ALTER TABLE public.audit_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view audit recommendations"
  ON public.audit_recommendations
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert audit recommendations"
  ON public.audit_recommendations
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_content_gap_analysis_audit_id ON public.content_gap_analysis(audit_id);
CREATE INDEX IF NOT EXISTS idx_content_gap_analysis_project_id ON public.content_gap_analysis(project_id);
CREATE INDEX IF NOT EXISTS idx_content_rewrites_user_id ON public.content_rewrites(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_recommendations_audit_id ON public.audit_recommendations(audit_id); 