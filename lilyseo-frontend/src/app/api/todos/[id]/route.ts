import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Converts snake_case field names to camelCase for consistent frontend usage
 */
function mapDbFieldsToCamelCase(item: any) {
  if (!item) return null;
  
  const result: any = { ...item };
  
  // Map common snake_case fields to camelCase
  const fieldMappings: Record<string, string> = {
    'user_id': 'userId',
    'project_id': 'projectId',
    'audit_id': 'auditId',
    'due_date': 'dueDate',
    'time_spent': 'timeSpent',
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
    'assigned_to': 'assignedTo',
    'scheduled_for': 'scheduledFor',
    'time_tracked_at': 'timeTrackedAt',
  };
  
  // Apply mappings - both copy the value to the camelCase field
  // and keep the original snake_case field for compatibility
  Object.entries(fieldMappings).forEach(([snakeCase, camelCase]) => {
    if (snakeCase in result && !(camelCase in result)) {
      result[camelCase] = result[snakeCase];
    }
  });
  
  return result;
}

/**
 * GET handler for retrieving a specific todo
 * @param request The incoming request
 * @param context The route context with params
 * @returns A response with the todo
 */
export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    // Ensure params are properly awaited in Next.js 13+
    const { id } = context.params;
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
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    
    if (error) {
      console.error('Error fetching todo:', error);
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
    
    // Map fields to camelCase for frontend consistency
    const mappedData = mapDbFieldsToCamelCase(data);
    console.log('Mapped todo data:', {
      id: mappedData.id,
      keys: Object.keys(mappedData).join(', ')
    });
    
    return NextResponse.json(mappedData);
  } catch (error: any) {
    console.error('Unhandled error in GET /api/todos/[id]:', error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler for updating a specific todo
 * @param request The incoming request
 * @param context The route context with params
 * @returns A response with the updated todo
 */
export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  try {
    // Ensure params are properly awaited in Next.js 13+
    const { id } = context.params;
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
      .eq("id", id)
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
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    // Map fields to camelCase for frontend consistency
    const mappedData = mapDbFieldsToCamelCase(updatedTodo);
    
    return NextResponse.json(mappedData);
  } catch (error: any) {
    console.error('Unhandled error in PATCH /api/todos/[id]:', error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting a specific todo
 * @param request The incoming request
 * @param context The route context with params
 * @returns A response indicating success or failure
 */
export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  try {
    // Ensure params are properly awaited in Next.js 13+
    const { id } = context.params;
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
      .eq("id", id)
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
      .eq("id", id);
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Unhandled error in DELETE /api/todos/[id]:', error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
} 