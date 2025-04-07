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
    // Get auth token from cookies
    const cookieStore = await cookies();
    const supabase = await createClient();
    
    // Fetch the audit data
    const { data: audit, error: auditError } = await supabase
      .from("audits")
      .select("*, projects:project_id(*)")
      .eq("id", options.auditId)
      .eq("project_id", options.projectId)
      .single();
    
    if (auditError || !audit) {
      throw new Error(auditError?.message || "Audit not found");
    }
    
    // Fetch white label settings if user is a pro user
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan_id")
      .eq("status", "active")
      .single();
    
    const isPro = subscription?.plan_id?.includes("pro");
    
    let whiteLabel = null;
    
    if (isPro) {
      const { data: whiteLabelData } = await supabase
        .from("white_label_settings")
        .select("*")
        .eq("is_active", true)
        .single();
      
      if (whiteLabelData) {
        whiteLabel = {
          ...whiteLabelData,
          // Override with any custom values provided
          logo_url: options.customLogo || whiteLabelData.logo_url,
          primary_color: options.customColor || whiteLabelData.primary_color,
          company_name: options.customCompanyName || whiteLabelData.company_name
        };
      }
    }
    
    // Return the data for client-side PDF rendering
    return {
      auditData: audit,
      whiteLabel
    };
  } catch (error) {
    console.error("PDF export error:", error);
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