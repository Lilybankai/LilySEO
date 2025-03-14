import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET handler for retrieving a specific todo
 * @param request The incoming request
 * @param params The route parameters
 * @returns A response with the todo
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
    
    // Get the todo
    const { data, error } = await supabase
      .from("todos")
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
        { error: "Todo not found" },
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
 * PATCH handler for updating a specific todo
 * @param request The incoming request
 * @param params The route parameters
 * @returns A response with the updated todo
 */
export async function PATCH(
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
    
    // Get request body
    const updates = await request.json();
    
    // Verify that the todo belongs to the user
    const { data: todo, error: todoError } = await supabase
      .from("todos")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();
    
    if (todoError || !todo) {
      return NextResponse.json(
        { error: "Todo not found or access denied" },
        { status: 404 }
      );
    }
    
    // Update the todo
    const { data: updatedTodo, error } = await supabase
      .from("todos")
      .update({
        title: updates.title,
        description: updates.description,
        status: updates.status,
        priority: updates.priority,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data: updatedTodo });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting a specific todo
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
    
    // Verify that the todo belongs to the user
    const { data: todo, error: todoError } = await supabase
      .from("todos")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();
    
    if (todoError || !todo) {
      return NextResponse.json(
        { error: "Todo not found or access denied" },
        { status: 404 }
      );
    }
    
    // Delete the todo
    const { error } = await supabase
      .from("todos")
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