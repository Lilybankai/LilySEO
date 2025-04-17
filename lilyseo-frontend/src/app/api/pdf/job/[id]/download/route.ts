import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPdfGenerationJob } from '@/services/pdf-job';
import { exportAuditToPdf } from '@/services/pdf-export';
// Import React for JSX support
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
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
      const { auditData, whiteLabel } = await exportAuditToPdf({
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
      
      // Now we'll generate the PDF directly instead of redirecting
      console.log(`Generating PDF for job ${jobId} directly in the download endpoint`);
      
      // Get the job content for the enhanced data
      let enhancedData = { ...auditData };
      
      // If the job has content, merge it with the audit data
      if (job.content) {
        // Extract content into a familiar shape
        const jobContent = job.content || {};
        console.log(`Job content includes: ${Object.keys(jobContent).join(', ')}`);
        
        // Add the job content to the enhanced data with familiar keys
        enhancedData.ai_content = {
          executive_summary: jobContent.executiveSummary || '',
          recommendations: jobContent.recommendations || [],
          technical_explanations: jobContent.technicalExplanations || {},
          generated_at: jobContent.generatedAt || new Date().toISOString()
        };
        
        // Add the flag to indicate AI content is enabled
        enhancedData.ai_content_enabled = job.parameters.useAiContent;
      }
      
      // Create theme settings object
      const themeSettings = {
        primaryColor: job.parameters.customColors?.primary || '#3b82f6',
        secondaryColor: job.parameters.customColors?.secondary || '#4b5563',
        logoUrl: job.parameters.customLogo || '',
        companyName: job.parameters.clientInfo?.company || 'LilySEO',
        contactInfo: job.parameters.clientInfo?.email || '',
        fontFamily: 'Helvetica',
        pageSize: 'A4',
        footerText: `© ${new Date().getFullYear()} ${job.parameters.clientInfo?.company || 'LilySEO'}. All rights reserved.`,
        includeOptions: {
          coverPage: true,
          executiveSummary: true,
          issuesSummary: true,
          performance: true,
          onPageSEO: true,
          technicalSEO: true,
          structuredData: true,
          internalLinks: true,
          customNotes: !!job.parameters.customNotes
        }
      };
      
      // Create a PDF buffer directly using React PDF
      const pdfBuffer = await renderToBuffer(
        React.createElement(
          PdfThemeProvider,
          { themeSettings },
          React.createElement(SEOAuditReport, {
            auditData: enhancedData,
            clientInfo: job.parameters.clientInfo,
            includeRecommendations: true,
            customNotes: job.parameters.customNotes || '',
            templateId: job.parameters.template || 'default',
            useAiContent: job.parameters.useAiContent || false,
          })
        )
      );
      
      console.log(`PDF buffer created, size: ${pdfBuffer.length} bytes`);
      
      // Return the PDF with proper headers
      const headers = new Headers();
      headers.set("Content-Type", "application/pdf");
      headers.set(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers,
      });
      
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