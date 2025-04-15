import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for PDF generation parameters
 */
export interface PdfGenerationParameters {
  template?: string;
  useAiContent?: boolean;
  clientInfo?: {
    name?: string;
    company?: string;
    email?: string;
    phone?: string;
    website?: string;
  };
  whiteLabelProfileId?: string;
  customColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  customLogo?: string;
  customNotes?: string;
  sections?: string[];
}

/**
 * Interface for PDF generation job content
 */
export interface PdfGenerationContent {
  executiveSummary?: string;
  recommendations?: string[];
  technicalExplanations?: Record<string, string>;
  generatedAt?: string;
}

/**
 * Interface for PDF generation job
 */
export interface PdfGenerationJob {
  id: string;
  created_at: string;
  updated_at: string;
  audit_id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  parameters: PdfGenerationParameters;
  error_message: string | null;
  expires_at: string;
  content: PdfGenerationContent | null;
}

/**
 * Create a new PDF generation job
 */
export async function createPdfGenerationJob(
  auditId: string,
  parameters: PdfGenerationParameters
): Promise<string> {
  console.log('Creating PDF generation job for audit:', auditId);
  
  const supabase = await createClient();
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      throw new Error('Authentication required');
    }
    
    console.log('User authenticated:', user.id);
    
    // Create a job record
    const jobId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days from now
    
    console.log('Job ID generated:', jobId);
    console.log('Parameters:', JSON.stringify(parameters));
    
    // Attempt to insert the record
    const { data, error } = await supabase
      .from('pdf_generation_jobs')
      .insert({
        id: jobId,
        audit_id: auditId,
        user_id: user.id,
        status: 'pending',
        progress: 0,
        parameters,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating PDF generation job:', error);
      // Check for permission errors
      if (error.code === '42501') {
        console.error('Permission denied - check RLS policies');
      }
      // Check for foreign key constraint failures
      else if (error.code === '23503') {
        console.error('Foreign key constraint failed - check audit_id exists and is accessible');
      }
      throw new Error(`Failed to create PDF generation job: ${error.message}`);
    }
    
    console.log('PDF generation job created successfully:', data);
    
    return jobId;
  } catch (error: any) {
    console.error('Exception creating PDF generation job:', error);
    throw new Error(`Failed to create PDF generation job: ${error.message}`);
  }
}

/**
 * Get a PDF generation job by ID
 */
export async function getPdfGenerationJob(jobId: string): Promise<PdfGenerationJob | null> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('pdf_generation_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (error) {
      console.error('Error getting PDF generation job:', error);
      throw new Error(`Failed to get PDF generation job: ${error.message}`);
    }
    
    return data;
  } catch (error: any) {
    console.error('Exception getting PDF generation job:', error);
    throw new Error(`Failed to get PDF generation job: ${error.message}`);
  }
}

/**
 * Update PDF generation job status
 */
export async function updatePdfGenerationJobStatus(
  jobId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  progress: number,
  errorMessage?: string
): Promise<boolean> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase.rpc('update_pdf_generation_job_status', {
      p_job_id: jobId,
      p_status: status,
      p_progress: progress,
      p_error_message: errorMessage
    });
    
    if (error) {
      console.error('Error updating PDF generation job status:', error);
      throw new Error(`Failed to update PDF generation job status: ${error.message}`);
    }
    
    return true;
  } catch (error: any) {
    console.error('Exception updating PDF generation job status:', error);
    throw new Error(`Failed to update PDF generation job status: ${error.message}`);
  }
}

/**
 * Update PDF generation job content
 */
export async function updatePdfGenerationJobContent(
  jobId: string,
  content: PdfGenerationContent
): Promise<boolean> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase.rpc('update_pdf_generation_job_content', {
      p_job_id: jobId,
      p_content: content
    });
    
    if (error) {
      console.error('Error updating PDF generation job content:', error);
      throw new Error(`Failed to update PDF generation job content: ${error.message}`);
    }
    
    return true;
  } catch (error: any) {
    console.error('Exception updating PDF generation job content:', error);
    throw new Error(`Failed to update PDF generation job content: ${error.message}`);
  }
}

/**
 * Get all PDF generation jobs for an audit
 */
export async function getPdfGenerationJobsByAuditId(auditId: string): Promise<PdfGenerationJob[]> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('pdf_generation_jobs')
      .select('*')
      .eq('audit_id', auditId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting PDF generation jobs:', error);
      throw new Error(`Failed to get PDF generation jobs: ${error.message}`);
    }

    return data || [];
  } catch (error: any) {
    console.error('Exception getting PDF generation jobs:', error);
    throw new Error(`Failed to get PDF generation jobs: ${error.message}`);
  }
}

/**
 * Delete a PDF generation job
 */
export async function deletePdfGenerationJob(jobId: string): Promise<boolean> {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase
      .from('pdf_generation_jobs')
      .delete()
      .eq('id', jobId);
    
    if (error) {
      console.error('Error deleting PDF generation job:', error);
      throw new Error(`Failed to delete PDF generation job: ${error.message}`);
    }
    
    return true;
  } catch (error: any) {
    console.error('Exception deleting PDF generation job:', error);
    throw new Error(`Failed to delete PDF generation job: ${error.message}`);
  }
}

/**
 * Generate and process content for a PDF job
 * This will be called by a serverless function to process the job
 */
export async function processPdfGenerationJob(jobId: string): Promise<boolean> {
  // This function will be implemented in the API route
  // It will handle fetching audit data, generating content, and updating the job status
  return true;
} 