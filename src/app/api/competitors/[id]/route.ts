import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET handler for retrieving a specific competitor analysis
 * @param request The incoming request
 * @param params The route parameters
 * @returns A response with the competitor analysis
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Get the competitor data
    const { data, error } = await supabase
      .from("competitor_data")
      .select(`
        *,
        projects:project_id (
          id,
          name,
          url
        )
      `)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { error: "Competitor analysis not found" },
        { status: 404 }
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
 * DELETE handler for deleting a specific competitor analysis
 * @param request The incoming request
 * @param params The route parameters
 * @returns A response indicating success or failure
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Verify that the competitor data belongs to the user
    const { data: competitorData, error: competitorError } = await supabase
      .from("competitor_data")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();
    
    if (competitorError || !competitorData) {
      return NextResponse.json(
        { error: "Competitor analysis not found or access denied" },
        { status: 404 }
      );
    }
    
    // Delete the competitor data
    const { error } = await supabase
      .from("competitor_data")
      .delete()
      .eq("id", params.id);
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
} 