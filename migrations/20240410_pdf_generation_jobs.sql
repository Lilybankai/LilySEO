-- Migration: PDF Generation Jobs System
-- Description: Creates tables and functions for managing PDF generation jobs
-- Date: 2024-04-10

-- Enable UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the pdf_generation_jobs table
CREATE TABLE IF NOT EXISTS public.pdf_generation_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    parameters JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    content JSONB
);

-- Add indexes
CREATE INDEX pdf_generation_jobs_audit_id_idx ON public.pdf_generation_jobs(audit_id);
CREATE INDEX pdf_generation_jobs_user_id_idx ON public.pdf_generation_jobs(user_id);
CREATE INDEX pdf_generation_jobs_status_idx ON public.pdf_generation_jobs(status);
CREATE INDEX pdf_generation_jobs_expires_at_idx ON public.pdf_generation_jobs(expires_at);

-- Add RLS policies
ALTER TABLE public.pdf_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Policy for select: users can only view their own jobs
CREATE POLICY pdf_generation_jobs_select_policy
    ON public.pdf_generation_jobs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy for insert: users can only create jobs for themselves
CREATE POLICY pdf_generation_jobs_insert_policy
    ON public.pdf_generation_jobs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy for update: users can only update their own jobs
CREATE POLICY pdf_generation_jobs_update_policy
    ON public.pdf_generation_jobs
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy for delete: users can only delete their own jobs
CREATE POLICY pdf_generation_jobs_delete_policy
    ON public.pdf_generation_jobs
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to create a new PDF generation job
CREATE OR REPLACE FUNCTION public.create_pdf_generation_job(
    p_audit_id UUID,
    p_parameters JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_job_id UUID;
BEGIN
    -- Get the current user ID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to create a PDF generation job';
    END IF;
    
    -- Insert the new job
    INSERT INTO public.pdf_generation_jobs (
        audit_id,
        user_id,
        status,
        parameters
    ) VALUES (
        p_audit_id,
        v_user_id,
        'pending',
        p_parameters
    )
    RETURNING id INTO v_job_id;
    
    RETURN v_job_id;
END;
$$;

-- Create function to update a PDF generation job status
CREATE OR REPLACE FUNCTION public.update_pdf_generation_job_status(
    p_job_id UUID,
    p_status VARCHAR(20),
    p_progress INTEGER DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_content JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_job_exists BOOLEAN;
BEGIN
    -- Get the current user ID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to update a PDF generation job';
    END IF;
    
    -- Check if the job exists and belongs to the user
    SELECT EXISTS (
        SELECT 1 FROM public.pdf_generation_jobs
        WHERE id = p_job_id AND user_id = v_user_id
    ) INTO v_job_exists;
    
    IF NOT v_job_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Update the job
    UPDATE public.pdf_generation_jobs
    SET
        status = p_status,
        progress = COALESCE(p_progress, progress),
        error_message = COALESCE(p_error_message, error_message),
        content = COALESCE(p_content, content),
        updated_at = NOW()
    WHERE id = p_job_id;
    
    RETURN TRUE;
END;
$$;

-- Create function to get a PDF generation job
CREATE OR REPLACE FUNCTION public.get_pdf_generation_job(
    p_job_id UUID
)
RETURNS SETOF public.pdf_generation_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the current user ID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to get a PDF generation job';
    END IF;
    
    -- Return the job if it belongs to the user
    RETURN QUERY
    SELECT * FROM public.pdf_generation_jobs
    WHERE id = p_job_id AND user_id = v_user_id;
END;
$$;

-- Create function to clean up expired jobs
CREATE OR REPLACE FUNCTION public.cleanup_expired_pdf_generation_jobs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Delete expired jobs
    WITH deleted AS (
        DELETE FROM public.pdf_generation_jobs
        WHERE expires_at < NOW()
        RETURNING id
    )
    SELECT COUNT(*) FROM deleted INTO v_deleted_count;
    
    RETURN v_deleted_count;
END;
$$;

-- Create a cron job to clean up expired jobs (if pg_cron is available)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) THEN
        EXECUTE 'SELECT cron.schedule(''@daily'', ''SELECT public.cleanup_expired_pdf_generation_jobs()'')';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pg_cron extension is not available. Manual cleanup will be required.';
END;
$$; 