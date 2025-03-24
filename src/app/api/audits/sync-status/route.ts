import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCrawlerServiceUrl } from "@/lib/api-config";

/**
 * POST handler to sync audit status from crawler service to frontend database
 * @param request The incoming request
 * @returns A response with the updated audit status
 */
export async function POST(request: NextRequest) {
  try {
    const { projectId, auditId } = await request.json();
    
    if (!projectId || !auditId) {
      return NextResponse.json(
        { error: "Project ID and Audit ID are required" },
        { status: 400 }
      );
    }
    
    // Get the current user's session
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if the audit exists and belongs to the user
    const { data: audit, error: auditError } = await supabase
      .from("audits")
      .select("*")
      .eq("id", auditId)
      .eq("user_id", session.user.id)
      .single();

    if (auditError || !audit) {
      return NextResponse.json(
        { error: "Audit not found" },
        { status: 404 }
      );
    }

    // Fetch the status from the crawler service
    const crawlerResponse = await fetch(
      getCrawlerServiceUrl(`/api/audit/status/${projectId}`)
    );

    if (!crawlerResponse.ok) {
      return NextResponse.json(
        { error: "Failed to get status from crawler service" },
        { status: 500 }
      );
    }

    const crawlerData = await crawlerResponse.json();
    
    // Map crawler service status to frontend status
    let frontendStatus = "pending";
    switch (crawlerData.status) {
      case "pending":
        frontendStatus = "pending";
        break;
      case "in_progress":
        frontendStatus = "processing";
        break;
      case "completed":
        frontendStatus = "completed";
        break;
      case "failed":
        frontendStatus = "failed";
        break;
    }
    
    // Only update if the status is different
    if (audit.status !== frontendStatus) {
      const { error: updateError } = await supabase
        .from("audits")
        .update({ 
          status: frontendStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", auditId);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to update audit status" },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({
      auditId,
      oldStatus: audit.status,
      newStatus: frontendStatus,
      updated: audit.status !== frontendStatus
    });
  } catch (error) {
    console.error("Error syncing audit status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 