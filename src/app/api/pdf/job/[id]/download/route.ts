import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPdfGenerationJob } from '@/services/pdf-job';
import { exportAuditToPdf } from '@/services/pdf-export';
import { renderToString } from '@react-pdf/renderer';
import { SEOAuditReport } from '@/components/pdf';
import { PdfThemeProvider } from '@/context/ThemeContext';

interface Params {
  params: {
    id: string;
  };
}

/**
 * Download a generated PDF
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
    
    console.log(`Attempting to download PDF for job ID: ${jobId}`);
    
    // Get the job to check if it's completed
    const job = await getPdfGenerationJob(jobId);
    
    if (!job) {
      console.error(`Job not found: ${jobId}`);
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    if (job.status !== 'completed') {
      console.error(`Job status is not completed: ${job.status}`);
      return NextResponse.json(
        { error: 'PDF generation is not complete' },
        { status: 400 }
      );
    }
    
    // Get the audit ID from the job
    const auditId = job.audit_id;
    
    // Get the audit data to check project ID and generate file name
    const { data: audit } = await supabase
      .from('audits')
      .select('project_id, projects:project_id(name)')
      .eq('id', auditId)
      .single();
    
    if (!audit) {
      console.error(`Audit not found for job: ${auditId}`);
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      );
    }
    
    // Get the project ID and fetch the full audit data
    const projectId = audit.project_id;
    
    try {
      // Fetch complete audit data
      const result = await exportAuditToPdf({
        auditId,
        projectId,
        customLogo: job.parameters.customLogo,
        customColor: job.parameters.customColors?.primary,
        customCompanyName: job.parameters.clientInfo?.company,
        clientName: job.parameters.clientInfo?.name,
        clientEmail: job.parameters.clientInfo?.email,
        clientPhone: job.parameters.clientInfo?.phone,
        clientWebsite: job.parameters.clientInfo?.website,
        customNotes: job.parameters.customNotes,
        includeScreenshots: true,
        includeCharts: true,
        includeIssues: true,
        includeKeywords: true,
        includeBacklinks: true,
        includeCompetitors: true,
        includeGoogleData: true
      });
      
      // Get the project name for the filename
      const projectNameObj = audit.projects as { name?: string } | null;
      const projectName = projectNameObj?.name || 'SEO-Report';
      const safeProjectName = projectName.toString().replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const fileName = `${safeProjectName}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Since we don't have direct PDF blob generation, we need to use the API for now
      // This is a temporary solution - in production, we should either:
      // 1. Generate and store the PDF in storage when the job completes, or
      // 2. Use a server-side PDF generation service
      
      // For now, we'll just redirect to the existing PDF export endpoint
      return NextResponse.redirect(
        new URL(`/api/audits/${auditId}/export/pdf`, request.url)
      );
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      return NextResponse.json(
        { error: 'Failed to generate PDF' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error downloading PDF:', error);
    return NextResponse.json(
      { error: 'Failed to download PDF' },
      { status: 500 }
    );
  }
} 