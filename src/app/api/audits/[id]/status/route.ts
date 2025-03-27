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
      
      console.log('Crawler status response:', JSON.stringify(crawlerStatus));

      // Update the audit status in the database if it's different
      // Also handle the case where we see results but status isn't explicitly updated
      const newStatus = crawlerStatus.status || (crawlerStatus.results ? "completed" : audit.status);
      
      // If the status needs to be updated OR if we have results but still showing processing
      if (newStatus !== audit.status || (newStatus === "completed" && audit.status === "processing")) {
        console.log(`Updating audit status from ${audit.status} to ${newStatus}`);
        
        await supabase
          .from("audits")
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", auditId);

        // If the audit is complete, update the report data
        if ((newStatus === "completed" || crawlerStatus.results) && crawlerStatus.results) {
          // Extract score from results, ensuring it's a valid number between 0-100
          let scoreValue = 0;
          let fixesNeeded = 0;
          
          // Try to extract the score from different possible structures
          if (typeof crawlerStatus.results.score === 'number') {
            scoreValue = crawlerStatus.results.score;
          } else if (crawlerStatus.results.summary?.score) {
            scoreValue = crawlerStatus.results.summary.score;
          } else if (crawlerStatus.results.score?.overall) {
            scoreValue = crawlerStatus.results.score.overall;
          }
          
          // Calculate total fixes needed from issues or recommendations
          if (crawlerStatus.results.issues) {
            // Sum all issues across categories
            Object.values(crawlerStatus.results.issues).forEach((issues: any) => {
              if (Array.isArray(issues)) {
                fixesNeeded += issues.length;
              }
            });
          } else if (crawlerStatus.results.recommendations) {
            fixesNeeded = Array.isArray(crawlerStatus.results.recommendations) 
              ? crawlerStatus.results.recommendations.length 
              : 0;
          } else if (crawlerStatus.results.summary?.totalIssues) {
            fixesNeeded = crawlerStatus.results.summary.totalIssues;
          }
          
          // Ensure score is between 0-100
          scoreValue = Math.max(0, Math.min(100, Math.round(scoreValue)));
          
          console.log('Updating audit with score:', scoreValue, 'and fixes needed:', fixesNeeded);
          
          // Store both score and fixes_needed in the database
          await supabase
            .from("audits")
            .update({
              score: scoreValue,
              report: crawlerStatus.results,
              // Store fixes_needed count in a JSON field to avoid schema changes
              metadata: { fixes_needed: fixesNeeded },
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