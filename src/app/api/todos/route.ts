import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET handler for retrieving todos
 * @param request The incoming request
 * @returns A response with the todos
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
    const status = url.searchParams.get("status");
    const priority = url.searchParams.get("priority");
    
    // Build query
    let query = supabase
      .from("todos")
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
    
    // Apply filters if provided
    if (projectId) {
      query = query.eq("project_id", projectId);
    }
    
    if (status) {
      query = query.eq("status", status);
    }
    
    if (priority) {
      query = query.eq("priority", priority);
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
 * POST handler for creating a new todo
 * @param request The incoming request
 * @returns A response with the created todo
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
    const { title, description, priority, projectId } = await request.json();
    
    if (!title || !projectId) {
      return NextResponse.json(
        { error: "Title and project ID are required" },
        { status: 400 }
      );
    }
    
    // Verify that the project belongs to the user
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();
    
    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }
    
    // Create the todo
    const { data: todo, error } = await supabase
      .from("todos")
      .insert({
        user_id: user.id,
        project_id: projectId,
        title,
        description: description || null,
        status: "pending",
        priority: priority || "medium",
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data: todo });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
} 