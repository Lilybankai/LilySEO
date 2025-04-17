import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Converts snake_case field names to camelCase for consistent frontend usage
 */
function mapDbFieldsToCamelCase(items: any[]) {
  if (!items || !Array.isArray(items)) return [];
  
  return items.map(item => {
    const result: any = { ...item };
    
    // Map common snake_case fields to camelCase
    const fieldMappings: Record<string, string> = {
      'project_id': 'projectId',
      'user_id': 'userId',
      'todos_created': 'todosCreated',
      'todos_completed': 'todosCompleted',
      'average_completion_time': 'averageCompletionTime',
      'total_time_spent': 'totalTimeSpent',
      'created_at': 'createdAt',
      'updated_at': 'updatedAt',
    };
    
    // Apply mappings - both copy the value to the camelCase field
    // and keep the original snake_case field for compatibility
    Object.entries(fieldMappings).forEach(([snakeCase, camelCase]) => {
      if (snakeCase in result && !(camelCase in result)) {
        result[camelCase] = result[snakeCase];
      }
    });
    
    return result;
  });
}

/**
 * GET handler for retrieving todo metrics
 * @param request The incoming request
 * @returns A response with the metrics data
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    
    // Authenticate the user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Build the query
    let query = supabase
      .from("todo_metrics")
      .select("*")
      .eq("user_id", user.id);
    
    // Add project filter if provided
    if (projectId) {
      query = query.eq("project_id", projectId);
    }
    
    // Execute the query
    const { data, error } = await query
      .order("month", { ascending: false })
      .limit(12); // Last 12 months
    
    if (error) {
      console.error('Error fetching todo metrics:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    // Map snake_case to camelCase for frontend
    const mappedData = mapDbFieldsToCamelCase(data || []);
    
    console.log(`Fetched ${mappedData.length} todo metrics records`);
    
    return NextResponse.json(mappedData);
  } catch (error: any) {
    console.error('Unhandled error in GET /api/todos/metrics:', error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
} 