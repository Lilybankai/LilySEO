import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPdfGenerationJob, deletePdfGenerationJob } from '@/services/pdf-job';

interface Params {
  params: {
    id: string;
  };
}

/**
 * Get a PDF generation job by ID
 */
export async function GET(request: Request, { params }: Params) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const jobId = params.id;
    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }
    
    console.log(`[PDF Job API] Fetching job status for job ID: ${jobId}`);
    const job = await getPdfGenerationJob(jobId);
    
    if (!job) {
      console.log(`[PDF Job API] Job not found: ${jobId}`);
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Log the job content
    console.log(`[PDF Job API] Job status retrieved:`, {
      jobId,
      status: job.status,
      progress: job.progress,
      contentPresent: !!job.content,
      hasErrorMessage: !!job.error_message,
      errorMessage: job.error_message
    });
    
    return NextResponse.json({ job });
  } catch (error: any) {
    console.error('[PDF Job API] Error getting PDF generation job:', error);
    return NextResponse.json(
      { error: 'Failed to get PDF generation job' },
      { status: 500 }
    );
  }
}

/**
 * Delete a PDF generation job
 */
export async function DELETE(request: Request, { params }: Params) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const jobId = params.id;
    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }
    
    const result = await deletePdfGenerationJob(jobId);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Failed to delete job' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting PDF generation job:', error);
    return NextResponse.json(
      { error: 'Failed to delete PDF generation job' },
      { status: 500 }
    );
  }
} 