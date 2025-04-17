"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

interface ExportPdfOptions {
  projectId: string;
  auditId: string;
  includeScreenshots?: boolean;
  includeCharts?: boolean;
  includeIssues?: boolean;
  includeKeywords?: boolean;
  includeBacklinks?: boolean;
  includeCompetitors?: boolean;
  includeGoogleData?: boolean;
  customLogo?: string;
  customColor?: string;
  customCompanyName?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientWebsite?: string;
  customNotes?: string;
}

/**
 * Exports an audit report to PDF using React-PDF renderer
 * This function now returns the audit data for client-side rendering
 * @param options Export options
 * @returns Object containing audit data and white label settings
 */
export async function exportAuditToPdf(options: ExportPdfOptions): Promise<{ auditData: any; whiteLabel: any }> {
  try {
    const supabase = await createClient();
    
    console.log('[exportAuditToPdf] Fetching audit details:', options.auditId);
    // Fetch the main audit data and project info first
    const { data: audit, error: auditError } = await supabase
      .from("audits")
      .select("*, projects:project_id(*)") // Select audit fields and related project
      .eq("id", options.auditId)
      .eq("project_id", options.projectId)
      .single();
    
    if (auditError || !audit) {
      console.error('[exportAuditToPdf] Error fetching audit details:', auditError);
      throw new Error(auditError?.message || "Audit not found");
    }
    console.log('[exportAuditToPdf] Audit details fetched successfully.');

    // Now fetch the related audit report data separately
    console.log(`[exportAuditToPdf] Fetching latest audit report for project ID: ${audit.project_id} and URL: ${audit.url}`);
    const { data: reportData, error: reportError } = await supabase
      .from("audit_reports") // Query the audit_reports table directly
      .select("*")
      .eq("project_id", audit.project_id) // Filter by project ID
      .eq("url", audit.url) // Filter by URL
      .order("created_at", { ascending: false }) // Get the latest report first
      .limit(1) // We only want the single latest report
      .maybeSingle(); // Use maybeSingle as a report might not always exist

    if (reportError) {
      console.error('[exportAuditToPdf] Error fetching audit report:', reportError);
      // Decide if this is critical. Maybe log and continue without report?
      // For now, let's throw an error if the fetch fails.
      throw new Error(reportError.message || "Failed to fetch audit report");
    }
    
    if (!reportData) {
        console.warn(`[exportAuditToPdf] No audit report found for project ${audit.project_id} and URL ${audit.url}. AI content generation might be limited.`);
        // Decide if we should throw an error or proceed with potentially limited data
        // For now, we'll proceed but AI content might fail later if it relies on reportData
    }

    // Combine the audit data with its report data
    // **Unpack the nested report_data if it exists**
    let unpackedReportData = reportData;
    if (reportData && typeof reportData.report_data === 'object' && reportData.report_data !== null) {
      console.log(`[exportAuditToPdf] Unpacking nested report_data JSON...`);
      unpackedReportData = {
        ...reportData,       // Keep original report fields (id, created_at, etc.)
        ...reportData.report_data // Merge fields from the JSON blob (summary, issues, pageSpeed, etc.)
      };
      // Optionally remove the original blob to avoid confusion, or keep it
      // delete unpackedReportData.report_data; 
    } else if (reportData) {
      console.warn(`[exportAuditToPdf] report_data column is missing or not an object in the fetched report. Expected JSON data.`);
    }
    
    const combinedAuditData = {
      ...audit,
      report: unpackedReportData // Embed the potentially unpacked report data
    };
    
    // Log keys *after* potential unpacking
    console.log('[exportAuditToPdf] Final combined report keys:', combinedAuditData.report ? Object.keys(combinedAuditData.report) : 'No report data found');
    if (combinedAuditData.report && typeof combinedAuditData.report.issues === 'object' && combinedAuditData.report.issues !== null) {
      console.log('[exportAuditToPdf] Audit issues keys (post-unpack):', Object.keys(combinedAuditData.report.issues));
    } else {
      console.log('[exportAuditToPdf] Audit issues type (post-unpack):', typeof combinedAuditData.report?.issues);
    }

    // Fetch white label settings if user is a pro user
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan_id")
      .eq("status", "active")
      .single();
    
    const isPro = subscription?.plan_id?.includes("pro");
    console.log('[exportAuditToPdf] User is pro:', isPro);
    
    let whiteLabel = null;
    
    if (isPro) {
      console.log('[exportAuditToPdf] Fetching white label settings...');
      const { data: whiteLabelData } = await supabase
        .from("white_label_settings")
        .select("*")
        .eq("user_id", audit.user_id) // Ensure we use the correct user ID
        .eq("is_active", true)
        .maybeSingle(); // Use maybeSingle as settings might not exist
      
      if (whiteLabelData) {
        console.log('[exportAuditToPdf] White label settings found.');
        whiteLabel = {
          ...whiteLabelData,
          logo_url: options.customLogo || whiteLabelData.logo_url,
          primary_color: options.customColor || whiteLabelData.primary_color,
          company_name: options.customCompanyName || whiteLabelData.company_name
        };
      } else {
        console.log('[exportAuditToPdf] No active white label settings found.');
      }
    }
    
    console.log('[exportAuditToPdf] Returning combined auditData and whiteLabel');
    return {
      auditData: combinedAuditData, // Return the combined data
      whiteLabel
    };
  } catch (error) {
    console.error("[exportAuditToPdf] Error:", error);
    throw error;
  }
}

/**
 * Checks if user has pro access for premium PDF features
 * @returns Whether the user has pro access
 */
export async function checkPdfProAccess(): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }
    
    // Check subscription tier in profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, subscription_status")
      .eq("id", user.id)
      .single();
    
    // Only consider 'pro' or 'enterprise' tiers with 'active' status
    return !!profile && 
           profile.subscription_status === 'active' && 
           (profile.subscription_tier === 'pro' || profile.subscription_tier === 'enterprise');
  } catch (error) {
    console.error("Error checking PDF pro access:", error);
    return false;
  }
}

/**
 * Checks the status of a PDF export job
 * @param jobId The ID of the export job
 * @returns The status and PDF URL if available
 */
export async function checkPdfExportStatus(jobId: string): Promise<{ status: string; pdfUrl?: string }> {
  try {
    // Get auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      throw new Error("Authentication required");
    }

    // Call the Crawler service API to check status
    const response = await fetch(`${process.env.CRAWLER_SERVICE_URL}/api/export/status/${jobId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to check PDF status");
    }

    return await response.json();
  } catch (error) {
    console.error("PDF status check error:", error);
    throw error;
  }
}

/**
 * Gets a blob from a previously generated PDF (used by the download endpoint)
 * @param auditData The audit data to render into a PDF
 * @param whiteLabel White label settings to apply
 * @param aiContent Optional AI content to include
 * @returns The generated PDF as a blob
 */
export async function getBlobFromGenerated(
  auditData: any, 
  whiteLabel: any, 
  aiContent?: any
): Promise<Blob> {
  try {
    // Here we would generate the PDF blob
    // For now, we'll return a placeholder PDF to be replaced with actual implementation
    
    // In a real implementation, this would use react-pdf's pdf functionality
    // to generate a blob on the server side
    
    // Create a simple placeholder PDF
    const placeholderPdf = new Blob(['PDF content would go here'], { type: 'application/pdf' });
    return placeholderPdf;
  } catch (error) {
    console.error("Error creating PDF blob:", error);
    throw error;
  }
} 