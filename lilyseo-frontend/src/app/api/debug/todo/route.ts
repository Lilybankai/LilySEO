import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// API route for debugging todos table
export async function GET() {
  try {
    // Create Supabase client with proper async cookie handling
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({
        error: "Unauthorized"
      }, { status: 401 });
    }
    
    // Get table info
    const { data: tableInfo, error: tableError } = await supabase
      .from('todos')
      .select()
      .limit(1);
    
    // Get raw column info
    const { data: rawColumnInfo, error: columnError } = await supabase
      .rpc('debug_get_column_names', {
        table_name: 'todos'
      });
      
    // Try to add a simple todo item with audit_id
    const testTodo = {
      title: "Debug test todo",
      description: "Testing audit_id field",
      priority: "medium",
      status: "pending",
      project_id: "00000000-0000-0000-0000-000000000000",
      user_id: user.id,
      audit_id: "00000000-0000-0000-0000-000000000000",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Test the insert
    const { data: testInsertResult, error: testInsertError } = await supabase
      .from('todos')
      .insert(testTodo)
      .select();
    
    return NextResponse.json({
      userInfo: {
        id: user.id
      },
      tableInfo: tableInfo && tableInfo.length > 0 
        ? { columns: Object.keys(tableInfo[0]) }
        : { columns: [], message: "No data in todos table" },
      rawColumnInfo,
      testInsert: {
        success: !testInsertError,
        data: testInsertResult,
        error: testInsertError?.message
      },
      message: "Debug information about todos table"
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || "An error occurred"
    }, { status: 500 });
  }
}

// Add a POST handler for direct todo creation
export async function POST(request: Request) {
  try {
    // Create Supabase client with proper async cookie handling
    const supabase = await createClient();
    
    // Log auth state for debugging
    console.log("Debug endpoint: Checking authentication...");
    
    // Get the current user with error handling
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error("Debug endpoint: Authentication error:", authError.message);
      return NextResponse.json({
        error: `Authentication error: ${authError.message}`
      }, { status: 401 });
    }
    
    if (!user) {
      console.error("Debug endpoint: No user found in session");
      return NextResponse.json({
        error: "Unauthorized - No user in session"
      }, { status: 401 });
    }
    
    console.log("Debug endpoint: User authenticated:", user.id);
    
    // Parse the request body
    const todoData = await request.json();
    
    // Ensure user_id is set
    todoData.user_id = user.id;
    
    // Add timestamps if not provided
    if (!todoData.created_at) {
      todoData.created_at = new Date().toISOString();
    }
    
    if (!todoData.updated_at) {
      todoData.updated_at = new Date().toISOString();
    }
    
    console.log("Debug endpoint trying to insert todo:", todoData);
    
    // Try a direct insert first - should work if column exists
    console.log("Trying direct insert first...");
    const { data: directData, error: directError } = await supabase
      .from('todos')
      .insert(todoData)
      .select();
      
    if (!directError) {
      console.log("Direct insert successful:", directData);
      return NextResponse.json({
        success: true,
        data: directData,
        method: "direct insert"
      });
    }
    
    console.error("Direct insert failed:", directError);
    
    // If the direct approach failed, try an insert without auditId
    if (directError.message && directError.message.includes('auditId')) {
      console.log("Error related to auditId column, trying insert without problematic fields")
      
      // Create a clean object with only columns we know exist
      const cleanTodoData: Record<string, any> = {
        title: todoData.title,
        description: todoData.description || "",
        priority: todoData.priority,
        status: todoData.status,
        project_id: todoData.project_id,
        user_id: todoData.user_id,
        audit_id: todoData.audit_id, // Use only snake_case
        created_at: todoData.created_at,
        updated_at: todoData.updated_at
      }
      
      // Remove any undefined or null values
      Object.keys(cleanTodoData).forEach(key => {
        if (cleanTodoData[key] === undefined || cleanTodoData[key] === null) {
          delete cleanTodoData[key]
        }
      })
      
      console.log("Trying clean insert with:", cleanTodoData)
      
      const { data: cleanData, error: cleanError } = await supabase
        .from('todos')
        .insert(cleanTodoData)
        .select()
        
      if (!cleanError) {
        console.log("Clean insert successful:", cleanData)
        return NextResponse.json({
          success: true,
          data: cleanData,
          method: "clean insert"
        })
      }
      
      console.error("Clean insert failed:", cleanError)
    }
    
    // As a last resort, try the Supabase rpc approach if exec_sql is available
    try {
      console.log("Trying Supabase RPC as last resort...")
      
      // First create table fields string
      const fields = Object.keys(todoData)
        .filter(k => todoData[k] !== undefined && todoData[k] !== null)
        .join(", ")
      
      // Then create values string
      const values = Object.keys(todoData)
        .filter(k => todoData[k] !== undefined && todoData[k] !== null)
        .map(k => {
          const val = todoData[k]
          if (typeof val === 'string') {
            return `'${val.replace(/'/g, "''")}'` // Escape single quotes
          }
          return val
        })
        .join(", ")
      
      // Try alternative Supabase functions that might exist
      const functionNames = ['exec_sql', 'execute_sql', 'run_sql']
      
      for (const funcName of functionNames) {
        try {
          // Create the correct parameter object based on function name
          const params = funcName === 'execute_sql' 
            ? { query: `
                INSERT INTO todos (${fields})
                VALUES (${values})
                RETURNING *
              `} 
            : { sql_statement: `
                INSERT INTO todos (${fields})
                VALUES (${values})
                RETURNING *
              `};
              
          const { data: rpcData, error: rpcError } = await supabase.rpc(funcName, params);
          
          if (!rpcError) {
            console.log(`${funcName} successful:`, rpcData)
            return NextResponse.json({
              success: true,
              data: rpcData,
              method: funcName
            })
          }
          
          console.log(`${funcName} failed:`, rpcError)
        } catch (e) {
          console.log(`${funcName} not available:`, e)
        }
      }
    } catch (rpcError) {
      console.error("RPC approaches failed:", rpcError)
    }
    
    // If we reached here, all insert attempts failed
    return NextResponse.json({
      success: false,
      error: "All insert methods failed",
      originalError: directError.message
    }, { status: 500 })
  } catch (error: any) {
    console.error("Unhandled error in debug todo endpoint:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "An error occurred"
    }, { status: 500 })
  }
} 