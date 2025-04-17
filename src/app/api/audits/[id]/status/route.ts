import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCrawlerServiceUrl } from "@/lib/api-config";

/**
 * GET handler for retrieving audit status from the crawler service
 * @param request The incoming request
 * @param context The route context with params
 * @returns A response with the audit status
 */
export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    // Fix for "params should be awaited" warning - use Promise.resolve
    const { id } = await Promise.resolve(context.params);
    const auditId = id;
    
    // Get the current user
    const supabase = await createClient();
    // Use getUser() instead of getSession()
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if the audit exists and belongs to the user
    const { data: audit, error: auditError } = await supabase
      .from("audits")
      .select("*") // Select only necessary fields? e.g., "project_id, status"
      .eq("id", auditId)
      .eq("user_id", user.id) // Use user.id directly
      .single();

    if (auditError || !audit) {
      return NextResponse.json(
        { error: "Audit not found" },
        { status: 404 }
      );
    }

    // Check the status from the crawler service using the correct auditId
    try {
      console.log(`[API Audit Status] Fetching crawler status for auditId: ${auditId}`);
      const crawlerResponse = await fetch(
        getCrawlerServiceUrl(`/api/audit/status/${auditId}`) // Correct: Use auditId
      );

      if (!crawlerResponse.ok) {
        const errorText = await crawlerResponse.text();
        console.error(`[API Audit Status] Crawler service error: ${crawlerResponse.status} ${crawlerResponse.statusText}. Body: ${errorText}`)
        throw new Error(`Failed to get audit status: ${crawlerResponse.statusText}`);
      }

      const crawlerStatus = await crawlerResponse.json();
      
      // Log the actual response from the crawler for debugging
      console.log(`[API Audit Status] Crawler status response for auditId ${auditId}:`, JSON.stringify(crawlerStatus));

      // Update the audit status in the database only if the crawler service reports a terminal state
      // Let the webhook handle the final update with results
      // Possible crawler statuses: 'pending', 'processing', 'completed', 'failed'
      const newStatus = crawlerStatus.status;

      // Only update if the status from crawler is different *and* is a terminal state ('completed' or 'failed')
      // Avoid overwriting 'processing' based on intermediate crawler checks.
      // Let the webhook be the primary source of truth for 'completed' status along with results.
      if ((newStatus === 'completed' || newStatus === 'failed') && newStatus !== audit.status) {
        console.log(`[API Audit Status] Updating audit ${auditId} status from ${audit.status} to ${newStatus} based on crawler check.`);
        await supabase
          .from("audits")
          .update({ status: newStatus }) // Only update status here, not results
          .eq("id", auditId);
        
        // Return the updated status immediately
        return NextResponse.json({ 
          ...audit, // Return original audit data 
          status: newStatus // Reflect the updated status
        });
      } else if (newStatus !== audit.status) {
        // Log if status differs but is not terminal (e.g., pending -> processing)
        console.log(`[API Audit Status] Audit ${auditId} status differs (${audit.status} -> ${newStatus}) but not updating DB via status check.`);
      }
      
      // Return the current status from the database (or the fetched status if it reflects progress)
      // This ensures the frontend sees 'processing' until the webhook confirms completion.
      return NextResponse.json({ 
          ...audit, // Return audit data from DB
          status: audit.status // Return the DB status primarily
      });

    } catch (crawlerError) {
      console.error(`[API Audit Status] Error fetching/processing crawler status for auditId ${auditId}:`, crawlerError);
      // Return the current audit status from DB if crawler check fails
      return NextResponse.json(audit); 
    }

  } catch (error) {
    console.error("[API Audit Status] General error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 