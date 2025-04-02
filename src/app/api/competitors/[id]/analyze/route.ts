import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeCompetitor } from "@/services/competitor-analysis";

/**
 * POST handler for starting the analysis of a specific competitor
 * @param request The incoming request
 * @param context The route context with params
 * @returns A response indicating success or failure
 */
export async function POST(request: NextRequest, context: { params: { id: string } }) {
  try {
    const id = context.params.id;
    const supabase = await createClient();
    
    // Get user data
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Verify that the competitor data belongs to the user and get project URL
    const { data: competitorData, error: competitorError } = await supabase
      .from("competitor_data")
      .select(`
        *,
        projects:project_id (
          id,
          url
        )
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    
    if (competitorError || !competitorData) {
      return NextResponse.json(
        { error: "Competitor analysis not found or access denied" },
        { status: 404 }
      );
    }
    
    // Update status to in_progress
    const { error: updateError } = await supabase
      .from("competitor_data")
      .update({
        status: "in_progress",
        last_analyzed_at: new Date().toISOString(),
        error_message: null
      })
      .eq("id", id);
    
    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Start the analysis in the background
    // In a real implementation, this would be handled by a queue system
    // For now, we'll simulate the background process with setTimeout
    setTimeout(async () => {
      try {
        // Run the analysis
        const analysis = await analyzeCompetitor(
          competitorData.competitor_url,
          competitorData.projects.url
        );
        
        // Update the competitor data with the analysis results
        await supabase
          .from("competitor_data")
          .update({
            status: "completed",
            analysis_data: analysis,
            last_analyzed_at: new Date().toISOString()
          })
          .eq("id", id);
      } catch (error: any) {
        // Update with error status if analysis fails
        await supabase
          .from("competitor_data")
          .update({
            status: "error",
            error_message: error.message || "An error occurred during analysis"
          })
          .eq("id", id);
      }
    }, 100); // Small delay to ensure response is sent first
    
    return NextResponse.json({ 
      success: true,
      message: "Analysis started"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
} 