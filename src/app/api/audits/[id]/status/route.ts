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

    // Check the status from the crawler service
    try {
      const crawlerResponse = await fetch(
        getCrawlerServiceUrl(`/api/audit/status/${audit.project_id}`)
      );

      if (!crawlerResponse.ok) {
        throw new Error(`Failed to get audit status: ${crawlerResponse.statusText}`);
      }

      const crawlerStatus = await crawlerResponse.json();

      // Update the audit status in the database if it's different
      if (crawlerStatus.status && crawlerStatus.status !== audit.status) {
        await supabase
          .from("audits")
          .update({
            status: crawlerStatus.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", auditId);

        // If the audit is complete, update the report data
        if (crawlerStatus.status === "completed" && crawlerStatus.results) {
          await supabase
            .from("audits")
            .update({
              score: crawlerStatus.results.score || 0,
              report: crawlerStatus.results,
              updated_at: new Date().toISOString(),
            })
            .eq("id", auditId);
        }
      }

      return NextResponse.json({
        status: crawlerStatus.status || audit.status,
        crawlerStatus,
        audit,
      });
    } catch (error) {
      console.error("Error fetching status from crawler service:", error);
      
      // Return the current status from the database
      return NextResponse.json({
        status: audit.status,
        message: "Using database status as crawler service is unavailable",
        audit,
      });
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 