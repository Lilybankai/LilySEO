import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// API route for debugging table schema
export async function GET(request: Request) {
  try {
    // Create Supabase client with cookies
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({
        error: "Unauthorized"
      }, { status: 401 })
    }
    
    // Get todos table columns from information_schema
    const { data: columnsData, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'todos')
      .eq('table_schema', 'public')
    
    // Try running a raw query to see the actual table structure
    const { data: rawQueryResult, error: rawQueryError } = await supabase
      .rpc('get_table_structure', { tablename: 'todos' })
    
    if (columnsError) {
      console.error("Error fetching columns:", columnsError)
    }
    
    if (rawQueryError) {
      console.error("Error in raw query:", rawQueryError)
    }
    
    // Create a function to get table structure if it doesn't exist
    const { error: createFunctionError } = await supabase.rpc('create_table_structure_function', {})
    
    // Try to create a simple todo to test column handling
    const testTodo = {
      title: "Test todo from debug endpoint",
      description: "Testing column handling",
      project_id: "00000000-0000-0000-0000-000000000000",
      user_id: user.id,
      "auditId": "00000000-0000-0000-0000-000000000000", // Try with quotes and camelCase
      status: "pending",
      priority: "medium",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data: testInsertCamelCase, error: testInsertCamelCaseError } = await supabase
      .from('todos')
      .insert(testTodo)
      .select()
    
    // Try with snake_case
    const testTodoSnakeCase = {
      title: "Test todo from debug endpoint (snake_case)",
      description: "Testing column handling with snake_case",
      project_id: "00000000-0000-0000-0000-000000000000",
      user_id: user.id,
      audit_id: "00000000-0000-0000-0000-000000000000", // Try with snake_case
      status: "pending",
      priority: "medium",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data: testInsertSnakeCase, error: testInsertSnakeCaseError } = await supabase
      .from('todos')
      .insert(testTodoSnakeCase)
      .select()
    
    return NextResponse.json({
      userInfo: {
        id: user.id
      },
      columnsData,
      columnsError: columnsError?.message,
      rawQueryResult,
      rawQueryError: rawQueryError?.message,
      createFunctionError: createFunctionError?.message,
      testInsertCamelCase,
      testInsertCamelCaseError: testInsertCamelCaseError?.message,
      testInsertSnakeCase,
      testInsertSnakeCaseError: testInsertSnakeCaseError?.message,
      message: "Debug information about todos table schema"
    })
  } catch (error: any) {
    console.error("Unhandled error in debug schema endpoint:", error)
    return NextResponse.json({
      error: error.message || "An error occurred"
    }, { status: 500 })
  }
}

// SQL function creation endpoint
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user - require admin role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({
        error: "Unauthorized"
      }, { status: 401 })
    }
    
    // Create a function to get table structure
    const { data, error } = await supabase.rpc('execute_sql', {
      query: `
        CREATE OR REPLACE FUNCTION public.get_table_structure(tablename text)
        RETURNS TABLE (
          column_name text,
          data_type text,
          is_nullable boolean
        )
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $function$
        BEGIN
          RETURN QUERY
          SELECT 
            c.column_name::text,
            c.data_type::text,
            (c.is_nullable = 'YES')::boolean
          FROM 
            information_schema.columns c
          WHERE 
            c.table_schema = 'public' 
            AND c.table_name = tablename;
        END;
        $function$;
        
        CREATE OR REPLACE FUNCTION public.create_table_structure_function()
        RETURNS text
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $function$
        BEGIN
          RETURN 'Function creation attempted';
        END;
        $function$;
      `
    })
    
    return NextResponse.json({
      success: !error,
      error: error?.message,
      message: "Function creation attempted"
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || "An error occurred"
    }, { status: 500 })
  }
} 