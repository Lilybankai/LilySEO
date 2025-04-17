import { getCrawlerServiceUrl } from "./api-config";
import { createClient } from "@/lib/supabase/server";

/**
 * Check if the crawler service is available
 * @returns A promise that resolves to a boolean indicating if the service is available
 */
export async function isCrawlerServiceAvailable(): Promise<boolean> {
  try {
    const response = await fetch(getCrawlerServiceUrl("/health"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Set a timeout to avoid hanging if the service is down
      signal: AbortSignal.timeout(5000),
    });

    return response.ok;
  } catch (error) {
    console.error("Error checking crawler service health:", error);
    return false;
  }
}

/**
 * Start an audit using the crawler service
 * @param projectId The ID of the project to audit
 * @param url The URL to audit
 * @param auditId The ID of the audit in the database
 * @param options Additional audit options
 * @returns A promise that resolves to the response from the crawler service
 */
export async function startAudit(
  projectId: string,
  url: string,
  auditId: string,
  options: Record<string, any> = {}
): Promise<Response> {
  return fetch(getCrawlerServiceUrl("/api/audit/start"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      projectId,
      url,
      auditId,
      options,
    }),
  });
}

/**
 * Get the status of an audit from the crawler service
 * @param auditId The ID of the audit
 * @returns A promise that resolves to the audit status
 */
export async function getAuditStatus(auditId: string): Promise<any> {
  const response = await fetch(
    getCrawlerServiceUrl(`/api/audit/status/${auditId}`),
    {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get audit status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Trigger a MOZ API update for a URL
 * @param url The URL to update MOZ data for
 * @returns A promise that resolves to the response from the crawler service
 */
export async function updateMozData(url: string): Promise<Response> {
  return fetch(getCrawlerServiceUrl("/api/moz/update"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ url }),
  });
}

/**
 * Trigger a PageSpeed API update for a URL
 * @param url The URL to update PageSpeed data for
 * @returns A promise that resolves to the response from the crawler service
 */
export async function updatePageSpeedData(url: string): Promise<Response> {
  return fetch(getCrawlerServiceUrl("/api/pagespeed/update"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ url }),
  });
}

/**
 * Start an audit process, updating the database and calling the crawler service
 * @param auditId The ID of the audit in the database
 * @param url The URL to audit
 * @param auditOptions The audit options
 * @param depth The audit depth
 * @returns A promise that resolves when the audit has been started
 */
export async function startAuditProcess(
  auditId: string,
  url: string,
  auditOptions: Record<string, boolean>,
  depth: string
): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Update the audit status to processing
    await supabase
      .from("audits")
      .update({ status: "processing" })
      .eq("id", auditId);
    
    // Start the audit with the crawler service
    const response = await startAudit(
      auditId, // Using auditId as projectId for the crawler service
      url,
      auditId,
      {
        ...auditOptions,
        depth,
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error starting audit with crawler service:", errorData);
      
      // Update the audit status to failed
      await supabase
        .from("audits")
        .update({ 
          status: "failed",
          error_message: errorData.error || response.statusText
        })
        .eq("id", auditId);
        
      throw new Error(errorData.error || "Failed to start audit with crawler service");
    }
    
    // The audit has been started successfully
    console.log(`Audit ${auditId} started successfully`);
  } catch (error) {
    console.error("Error in startAuditProcess:", error);
    
    // Update the audit status to failed
    const supabase = await createClient();
    await supabase
      .from("audits")
      .update({ 
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error"
      })
      .eq("id", auditId);
      
    throw error;
  }
} 