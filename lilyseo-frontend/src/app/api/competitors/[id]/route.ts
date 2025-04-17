import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET handler for retrieving a specific competitor analysis
 * @param request The incoming request
 * @param context The route context with params
 * @returns A response with the competitor analysis
 */
export async function GET(request: NextRequest, context: { params: { id: string } }) {
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
    
    // Get the competitor data
    const { data, error } = await supabase
      .from("competitors")
      .select(`
        *,
        projects:project_id (
          id,
          name,
          url
        )
      `)
      .eq("id", id)
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
        { error: "Competitor not found" },
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
 * DELETE handler for deleting a specific competitor
 * @param request The incoming request
 * @param context The route context with params
 * @returns A response indicating success or failure
 */
export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
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
    
    // Verify that the competitor belongs to the user
    const { data: competitor, error: competitorError } = await supabase
      .from("competitors")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    
    if (competitorError || !competitor) {
      return NextResponse.json(
        { error: "Competitor not found or access denied" },
        { status: 404 }
      );
    }
    
    // Delete the competitor
    const { error } = await supabase
      .from("competitors")
      .delete()
      .eq("id", id);
    
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