import { getCrawlerServiceUrl } from "./api-config";
import { createClient } from "@/lib/supabase/client";

/**
 * Client-side functions for interacting with the crawler service via Next.js API routes
 */

/**
 * Check if the crawler service is available
 * @returns A promise that resolves to a boolean indicating if the service is available
 */
export async function isCrawlerServiceAvailable(): Promise<boolean> {
  try {
    const response = await fetch("/api/crawler/health", {
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
 * @param auditOptions The audit options
 * @param auditDepth The audit depth
 * @returns A promise that resolves to the created audit
 */
export async function startAudit(
  projectId: string,
  auditOptions: Record<string, boolean> = {},
  auditDepth: string = "standard"
): Promise<any> {
  const response = await fetch("/api/audits", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      projectId,
      auditOptions,
      auditDepth,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to start audit");
  }

  return response.json();
}

/**
 * Get the status of an audit
 * @param auditId The ID of the audit
 * @returns A promise that resolves to the audit status
 */
export async function getAuditStatus(auditId: string): Promise<any> {
  const response = await fetch(`/api/audits/${auditId}/status`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get audit status");
  }

  return response.json();
}

/**
 * Get the results of an audit
 * @param auditId The ID of the audit
 * @returns A promise that resolves to the audit results
 */
export async function getAuditResults(auditId: string): Promise<any> {
  const response = await fetch(`/api/audits/${auditId}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get audit results");
  }

  return response.json();
}

/**
 * Update the webhook URL for a project
 * @param projectId The ID of the project
 * @param webhookUrl The URL to receive webhook notifications
 * @returns A promise that resolves to true if successful
 */
export async function setProjectWebhookUrl(
  projectId: string,
  webhookUrl: string
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from("projects")
      .update({ webhook_url: webhookUrl })
      .eq("id", projectId);
    
    if (error) {
      console.error("Error updating project webhook URL:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in setProjectWebhookUrl:", error);
    return false;
  }
} 