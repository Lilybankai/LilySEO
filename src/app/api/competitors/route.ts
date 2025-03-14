import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeCompetitor } from "@/services/competitor-analysis";

/**
 * GET handler for retrieving competitor data
 * @param request The incoming request
 * @returns A response with the competitor data
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get user data
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get URL parameters
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    
    // Build query
    let query = supabase
      .from("competitor_data")
      .select(`
        *,
        projects:project_id (
          id,
          name,
          url
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    // Filter by project if provided
    if (projectId) {
      query = query.eq("project_id", projectId);
    }
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new competitor analysis
 * @param request The incoming request
 * @returns A response with the created competitor analysis
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get user data
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get request body
    const { competitorUrl, projectId } = await request.json();
    
    if (!competitorUrl || !projectId) {
      return NextResponse.json(
        { error: "Competitor URL and project ID are required" },
        { status: 400 }
      );
    }
    
    // Verify that the project belongs to the user
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, url")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();
    
    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }
    
    // Run the competitor analysis
    const analysis = await analyzeCompetitor(competitorUrl, project.url);
    
    // Create the competitor data in the database
    const { data: competitorData, error } = await supabase
      .from("competitor_data")
      .insert({
        user_id: user.id,
        project_id: projectId,
        competitor_url: competitorUrl,
        analysis_data: analysis,
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data: competitorData });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
} 