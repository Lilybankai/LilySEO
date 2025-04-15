import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { cookies } from "next/headers";

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
 * GET handler for retrieving todos
 * @param request The incoming request
 * @returns A response with the todos
 */
export async function GET(request: NextRequest) {
  try {
    // Create supabase client - important to await it
    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get search params
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const search = url.searchParams.get("search");
    
    // Start building query
    let query = supabase
      .from("todos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    // Filter by project if provided
    if (projectId) {
      query = query.eq("project_id", projectId);
    }
    
    // Filter by search term if provided
    if (search && search.trim() !== "") {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching todos:", error);
      return NextResponse.json(
        { error: "Failed to fetch todos" },
        { status: 500 }
      );
    }
    
    // Map snake_case to camelCase for frontend consistency
    const mappedData = data?.map(mapDbFieldsToCamelCase) || [];
    console.log(`Mapped ${data?.length || 0} todos from DB, first item keys:`, 
      mappedData.length > 0 ? Object.keys(mappedData[0]).join(', ') : 'no data');
    
    return NextResponse.json(mappedData);
  } catch (error) {
    console.error("Unhandled error in GET /api/todos:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new todo
 * @param request The incoming request
 * @returns A response with the created todo
 */
export async function POST(request: Request) {
  try {
    // Get the user from the session - using createClient for proper async cookie handling
    const supabase = await createClient();
    
    // Log auth state for debugging
    console.log("Checking authentication...");
    
    // Get user data
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error("Authentication error:", authError.message);
      return NextResponse.json(
        { error: `Authentication error: ${authError.message}` },
        { status: 401 }
      );
    }
    
    if (!user) {
      console.error("No user found in session");
      return NextResponse.json(
        { error: "Unauthorized - No user in session" },
        { status: 401 }
      );
    }
    
    console.log("User authenticated:", user.id);

    // Parse the request body
    const body = await request.json();
    const { todoData, auditId } = body;
    
    console.log('Adding todo with:', { 
      todoDataKeys: Object.keys(todoData), 
      auditId,
      userId: user.id
    });

    try {
      // Try both column naming conventions to handle potential schema issues
      // First create the base todo data
      const todoBase = {
        ...todoData,
        user_id: user.id,
        // Convert projectId to project_id if needed
        project_id: todoData.project_id || todoData.projectId
      };
      
      // Create two versions - one with audit_id and one with auditId
      // The database will ignore fields that don't match column names
      const todoDataWithBothFormats = {
        ...todoBase,
        audit_id: auditId, // snake_case
        auditId: auditId   // camelCase
      };
      
      console.log('Inserting todo with data:', todoDataWithBothFormats);
      
      // Insert the todo item
      const { data: todo, error } = await supabase
        .from("todos")
        .insert(todoDataWithBothFormats)
        .select()
        .single();
        
      if (error) {
        console.error('Supabase error when adding todo:', error);
        
        // If error is specifically about auditId column, try direct SQL insert as a fallback
        if (error.message && error.message.includes('auditId')) {
          console.log('Trying fallback method with direct SQL...');
          
          // Prepare values for SQL query
          const todoValues = {
            title: todoData.title,
            description: todoData.description || '',
            priority: todoData.priority || 'medium',
            status: todoData.status || 'pending',
            project_id: todoData.project_id || todoData.projectId,
            user_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Build SQL query with both column name possibilities
          let sqlQuery = `
            INSERT INTO todos (
              title, description, priority, status, project_id, user_id, 
              created_at, updated_at
            `;
          
          // Add audit_id column if provided
          if (auditId) {
            sqlQuery += `, "auditId"`;
          }
          
          sqlQuery += `) VALUES (
            '${todoValues.title}', 
            '${todoValues.description}', 
            '${todoValues.priority}', 
            '${todoValues.status}', 
            '${todoValues.project_id}', 
            '${todoValues.user_id}',
            '${todoValues.created_at}', 
            '${todoValues.updated_at}'
          `;
          
          // Add audit_id value if provided
          if (auditId) {
            sqlQuery += `, '${auditId}'`;
          }
          
          sqlQuery += `) RETURNING *`;
          
          // Execute the SQL query
          const { data: sqlResult, error: sqlError } = await supabase.rpc('execute_sql', {
            query: sqlQuery
          });
          
          if (sqlError) {
            console.error('SQL fallback error:', sqlError);
            return NextResponse.json(
              { error: sqlError.message },
              { status: 500 }
            );
          }
          
          console.log('Successfully added todo via SQL fallback:', sqlResult);
          return NextResponse.json({ todo: sqlResult });
        }
        
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
      
      console.log('Successfully added todo:', todo);
      
      return NextResponse.json({ todo });
    } catch (error) {
      console.error('Error in todo creation:', error);
      return NextResponse.json(
        { error: "Failed to create todo item" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unhandled error in POST /api/todos:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 