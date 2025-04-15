import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// API route for debugging todo SQL operations
export async function POST(request: Request) {
  try {
    // Create Supabase client with proper async cookie handling
    const supabase = await createClient();
    
    // Log auth state for debugging
    console.log("TodoSQL debug endpoint: Checking authentication...");
    
    // Get the current user with error handling
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error("TodoSQL debug endpoint: Authentication error:", authError.message);
      return NextResponse.json({
        error: `Authentication error: ${authError.message}`
      }, { status: 401 });
    }
    
    if (!user) {
      console.error("TodoSQL debug endpoint: No user found in session");
      return NextResponse.json({
        error: "Unauthorized - No user in session"
      }, { status: 401 });
    }
    
    console.log("TodoSQL debug endpoint: User authenticated:", user.id);
    
    // Parse the request body
    const { title, description, projectId, auditId, priority, status } = await request.json();
    
    console.log("TodoSQL debug endpoint parameters:", {
      title, 
      description, 
      projectId, 
      auditId,
      priority: priority || "medium",
      status: status || "pending"
    });
    
    // Check schema to see what columns exist in todos table
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'todos')
      .eq('table_schema', 'public');
      
    if (schemaError) {
      console.error("TodoSQL debug endpoint: Schema lookup error:", schemaError.message);
    } else {
      console.log("TodoSQL debug endpoint: Todos table columns:", 
        schemaData.map((col: any) => col.column_name));
    }
    
    // Try the add_todo_safely function
    console.log("TodoSQL debug endpoint: Trying add_todo_safely function...");
    
    const { data: safeResult, error: safeError } = await supabase.rpc(
      'add_todo_safely',
      {
        p_user_id: user.id,
        p_project_id: projectId,
        p_title: title,
        p_description: description || "",
        p_status: status || "pending",
        p_priority: priority || "medium",
        p_audit_id: auditId || null
      }
    );
    
    if (safeError) {
      console.error("TodoSQL debug endpoint: Safe function error:", safeError.message);
      
      // Try direct SQL statement as a fallback
      console.log("TodoSQL debug endpoint: Trying direct SQL...");
      
      const sql = `
        SELECT add_todo_safely(
          '${user.id}',
          '${projectId}',
          '${(title || "").replace(/'/g, "''")}',
          '${(description || "").replace(/'/g, "''")}',
          '${status || "pending"}',
          '${priority || "medium"}',
          ${auditId ? `'${auditId}'` : 'NULL'}
        );
      `;
      
      console.log("TodoSQL debug endpoint: SQL query:", sql);
      
      // Execute the SQL
      const { data: sqlResult, error: sqlError } = await supabase.rpc(
        'execute_sql',
        { query: sql }
      );
      
      if (sqlError) {
        console.error("TodoSQL debug endpoint: SQL execution error:", sqlError.message);
        
        // As a last resort, try a direct insert
        console.log("TodoSQL debug endpoint: Trying direct insert as last resort...");
        
        const { data: insertData, error: insertError } = await supabase
          .from('todos')
          .insert({
            user_id: user.id,
            project_id: projectId,
            title: title,
            description: description || "",
            status: status || "pending",
            priority: priority || "medium",
            audit_id: auditId || null,
            "auditId": auditId || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
          
        if (insertError) {
          console.error("TodoSQL debug endpoint: Direct insert error:", insertError.message);
          return NextResponse.json({
            success: false,
            error: "All attempts failed",
            details: {
              safeError: safeError.message,
              sqlError: sqlError.message,
              insertError: insertError.message
            }
          }, { status: 500 });
        }
        
        console.log("TodoSQL debug endpoint: Direct insert successful:", insertData);
        return NextResponse.json({
          success: true,
          method: "direct_insert",
          data: insertData
        });
      }
      
      console.log("TodoSQL debug endpoint: SQL execution successful:", sqlResult);
      return NextResponse.json({
        success: true,
        method: "sql_execution",
        data: sqlResult
      });
    }
    
    console.log("TodoSQL debug endpoint: Safe function successful:", safeResult);
    return NextResponse.json({
      success: true,
      method: "safe_function",
      data: safeResult
    });
    
  } catch (error: any) {
    console.error("TodoSQL debug endpoint: Unhandled error:", error.message);
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error occurred"
    }, { status: 500 });
  }
} 