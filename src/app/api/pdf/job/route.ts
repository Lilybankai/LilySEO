import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPdfGenerationJob, PdfGenerationParameters } from '@/services/pdf-job';
import { exportAuditToPdf } from '@/services/pdf-export';
import { generateUnifiedPdfContent } from '@/services/unified-ai-service';

/**
 * Create a new PDF generation job
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse request
    const body = await request.json();
    const { auditId, parameters } = body;
    
    if (!auditId) {
      return NextResponse.json(
        { error: 'Missing required parameter: auditId' },
        { status: 400 }
      );
    }

    // Check if the user has access to the audit
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select('id, user_id, project_id')
      .eq('id', auditId)
      .single();
    
    if (auditError || !audit) {
      return NextResponse.json(
        { error: 'Audit not found or access denied' },
        { status: 404 }
      );
    }
    
    // Create the job
    const jobId = await createPdfGenerationJob(auditId, parameters || {});
    
    // Trigger the job processing (this would typically be handled by a queue
    // or edge function, but for now we'll just start it async)
    const processingPromise = startJobProcessing(jobId, auditId, parameters);
    
    // Log the job details for debugging
    console.log(`Job ${jobId} created for audit ${auditId}`);

    return NextResponse.json({ jobId });
  } catch (error: any) {
    console.error('Error creating PDF generation job:', error);
    return NextResponse.json(
      { error: 'Failed to create PDF generation job' },
      { status: 500 }
    );
  }
}

/**
 * Start processing a PDF generation job (this would be called by a queue or edge function)
 */
async function startJobProcessing(
  jobId: string,
  auditId: string, 
  parameters: PdfGenerationParameters
) {
  const supabase = await createClient();
  const processingStartTime = Date.now(); // Track processing time
  let content: any = null;
  
  console.log(`[PDF Job ${jobId}] Starting job processing for audit ${auditId}`);
  
  try {
    // Update job status to processing
    await supabase.rpc('update_pdf_generation_job_status', {
      p_job_id: jobId,
      p_status: 'processing',
      p_progress: 10
    });
    
    // Get the project ID for the audit
    const { data: audit } = await supabase
      .from('audits')
      .select('project_id')
      .eq('id', auditId)
      .single();
    
    if (!audit) {
      console.error(`[PDF Job ${jobId}] Audit not found: ${auditId}`);
      throw new Error('Audit not found');
    }
    
    console.log(`[PDF Job ${jobId}] Processing job for audit ${auditId} in project ${audit.project_id}`);
    
    // Update progress to 20% - fetching audit data
    await supabase.rpc('update_pdf_generation_job_status', {
      p_job_id: jobId,
      p_status: 'processing',
      p_progress: 20
    });
    
    // Fetch the audit data
    console.log(`[PDF Job ${jobId}] Fetching audit data...`);
    const { auditData, whiteLabel } = await exportAuditToPdf({
      auditId,
      projectId: audit.project_id,
      customLogo: parameters.customLogo,
      customColor: parameters.customColors?.primary,
      customCompanyName: parameters.clientInfo?.company,
      clientName: parameters.clientInfo?.name,
      clientEmail: parameters.clientInfo?.email,
      clientPhone: parameters.clientInfo?.phone,
      clientWebsite: parameters.clientInfo?.website,
      customNotes: parameters.customNotes,
      includeScreenshots: true,
      includeCharts: true,
      includeIssues: true,
      includeKeywords: true,
      includeBacklinks: true,
      includeCompetitors: true,
      includeGoogleData: true
    });
    
    // Verify we have audit data
    if (!auditData) {
      console.error(`[PDF Job ${jobId}] Failed to fetch audit data for audit ${auditId}`);
      throw new Error('Failed to fetch audit data');
    }
    
    console.log(`[PDF Job ${jobId}] Audit data fetched successfully. URL: ${auditData.url || 'N/A'}`);
    
    // Update progress to 30% - preliminary processing
    await supabase.rpc('update_pdf_generation_job_status', {
      p_job_id: jobId,
      p_status: 'processing',
      p_progress: 30
    });
    
    // Process the parameters
    console.log(`[PDF Job ${jobId}] Processing job parameters:`, {
      template: parameters.template,
      useAiContent: parameters.useAiContent,
      hasClientInfo: !!parameters.clientInfo,
      whiteLabelProfileId: parameters.whiteLabelProfileId || 'default'
    });
    
    // Generate AI content if needed
    if (parameters.useAiContent) {
      try {
        // Set progress to 50% - starting AI content generation
        await supabase.rpc('update_pdf_generation_job_status', {
          p_job_id: jobId,
          p_status: 'processing',
          p_progress: 50,
          p_error_message: null
        });
        
        console.log(`[PDF Job ${jobId}] Generating unified AI content...`);
        
        // Add diagnostic log for auditData content
        console.log(`[PDF Job ${jobId}] AI Generation - Audit data check:`, {
          hasAuditData: !!auditData,
          hasReportData: !!auditData?.report,
          reportKeys: auditData?.report ? Object.keys(auditData.report) : [],
          hasUrl: !!auditData?.url,
          hasProjectUrl: !!auditData?.projects?.url,
          effectiveUrl: auditData?.url || auditData?.projects?.url,
          score: auditData?.score || auditData?.report?.score?.overall,
          hasIssues: !!auditData?.report?.issues,
          issuesType: auditData?.report?.issues ? typeof auditData.report.issues : null,
          issuesCount: typeof auditData?.report?.issues === 'object' ? 
            Object.keys(auditData.report.issues).length : 'N/A'
        });
        
        // Save env vars availability for debugging
        const azureConfigCheck = {
          hasEndpoint: !!process.env.AZURE_OPENAI_ENDPOINT,
          hasApiKey: !!process.env.AZURE_OPENAI_API_KEY,
          hasDeploymentName: !!process.env.AZURE_OPENAI_DEPLOYMENT_NAME
        };
        console.log(`[PDF Job ${jobId}] AI Generation - Azure config check:`, azureConfigCheck);
        
        // If Azure OpenAI credentials are missing, log and throw error
        if (!azureConfigCheck.hasEndpoint || !azureConfigCheck.hasApiKey || !azureConfigCheck.hasDeploymentName) {
          throw new Error('Azure OpenAI credentials not fully configured');
        }
        
        // Track AI generation time
        const aiStartTime = Date.now();
        
        // Call the AI service
        console.log(`[PDF Job ${jobId}] Calling unified AI service...`);
        content = await generateUnifiedPdfContent(auditData);
        
        // Calculate AI generation time
        const aiDuration = Date.now() - aiStartTime;
        console.log(`[PDF Job ${jobId}] AI content generation completed in ${aiDuration}ms`);
        
        // Log the content structure for debugging
        console.log(`[PDF Job ${jobId}] AI content generated:`, {
          hasExecutiveSummary: !!content.executiveSummary,
          executiveSummaryLength: content.executiveSummary?.length || 0,
          recommendationsCount: content.recommendations?.length || 0,
          technicalExplanationsCount: Object.keys(content.technicalExplanations || {}).length || 0,
          generatedAt: content.generatedAt
        });
        
        // Sample of content for debugging
        if (content.executiveSummary) {
          console.log(`[PDF Job ${jobId}] Executive summary sample: "${content.executiveSummary.substring(0, 100)}..."`);
        }
        
        if (!content.executiveSummary || content.executiveSummary.length < 50) {
          console.warn(`[PDF Job ${jobId}] Warning: Executive summary is missing or too short`);
        }
        
        // Update progress to 70% - AI content generated
        await supabase.rpc('update_pdf_generation_job_status', {
          p_job_id: jobId,
          p_status: 'processing',
          p_progress: 70,
          p_error_message: null
        });
      } catch (aiError: Error | any) {
        console.error(`[PDF Job ${jobId}] Error generating AI content:`, aiError);
        
        // Update job with AI error but continue
        await supabase.rpc('update_pdf_generation_job_status', {
          p_job_id: jobId,
          p_status: 'processing',
          p_progress: 70,
          p_error_message: `AI content generation failed: ${aiError.message || 'Unknown error'}`
        });
        
        // Create fallback content
        console.log(`[PDF Job ${jobId}] Using fallback content due to AI generation error`);
        content = {
          executiveSummary: "The AI content generation service encountered an error. This is a fallback summary for your SEO audit report. The report still contains all of your audit data and analysis.",
          recommendations: [
            "Ensure all pages have unique, descriptive title tags and meta descriptions.",
            "Improve page loading speed by optimizing images and reducing render-blocking resources.",
            "Fix any broken links and improve internal linking structure.",
            "Create mobile-friendly pages with responsive design.",
            "Add structured data markup where appropriate."
          ],
          technicalExplanations: {},
          generatedAt: new Date().toISOString(),
          isFallback: true
        };
      }
    } else {
      // No AI content requested
      console.log(`[PDF Job ${jobId}] AI content generation skipped as per parameters`);
      // Update progress directly to 70%
      await supabase.rpc('update_pdf_generation_job_status', {
        p_job_id: jobId,
        p_status: 'processing',
        p_progress: 70
      });
    }
    
    // Final steps to complete the job
    // Set progress to 90%
    await supabase.rpc('update_pdf_generation_job_status', {
      p_job_id: jobId,
      p_status: 'processing',
      p_progress: 90
    });
    
    // Set the preview URL (if we were to generate an actual PDF file)
    // This would be implemented in a production system
    const pdfUrl = null; // In a real implementation, this would be the URL to the generated PDF
    
    // Total processing time
    const totalProcessingTime = Date.now() - processingStartTime;
    console.log(`[PDF Job ${jobId}] Job processing completed in ${totalProcessingTime}ms`);
    
    // Update job status to completed
    const { data, error } = await supabase.rpc('update_pdf_generation_job_status', {
      p_job_id: jobId,
      p_status: 'completed',
      p_progress: 100,
      p_content: content
    });
    
    if (error) {
      console.error(`[PDF Job ${jobId}] Error updating job status to completed:`, error);
    } else {
      console.log(`[PDF Job ${jobId}] Job completed successfully with status:`, data);
    }
    
    return true;
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error';
    console.error(`[PDF Job ${jobId}] Error processing PDF generation job:`, error);
    
    // Try to get detailed error information
    let detailedError = errorMessage;
    if (error.stack) {
      console.error(`[PDF Job ${jobId}] Error stack trace:`, error.stack);
    }
    
    // Additional error context based on where in the process we failed
    if (!content && parameters.useAiContent) {
      detailedError = `AI content generation failed: ${errorMessage}`;
    }
    
    // Update job status to failed
    try {
      const { error: updateError } = await supabase.rpc('update_pdf_generation_job_status', {
        p_job_id: jobId,
        p_status: 'failed',
        p_error_message: detailedError
      });
      
      if (updateError) {
        console.error(`[PDF Job ${jobId}] Error updating job status to failed:`, updateError);
      }
    } catch (updateError) {
      console.error(`[PDF Job ${jobId}] Critical error updating job status:`, updateError);
    }
    
    return false;
  }
} 