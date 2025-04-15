import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// API route for executing SQL queries with proper auth
export async function POST(request: Request) {
  try {
    const { sql } = await request.json()
    
    if (!sql) {
      console.error('No SQL query provided')
      return NextResponse.json({ error: 'No SQL query provided' }, { status: 400 })
    }
    
    console.log('Debug SQL endpoint called with query:', sql.trim())
    
    // Create authenticated supabase client
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('User not authenticated:', authError?.message || 'No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('User authenticated:', user.id)
    
    try {
      // First, try to execute the SQL directly
      console.log('Attempting to execute SQL directly...')
      const { data, error } = await supabase.rpc('execute_sql', { query: sql })
      
      if (error) {
        console.error('SQL execution failed:', error.message)
        
        // If it's a test_add_todo_safely function call, try to extract parameters and call directly
        if (sql.includes('test_add_todo_safely')) {
          console.log('Trying to call test_add_todo_safely directly...')
          
          // Extract parameters from SQL
          const regex = /test_add_todo_safely\s*\(\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*([^,]*)\s*,\s*([^)]*)\s*\)/
          const match = sql.match(regex)
          
          if (match) {
            const params = match.slice(1).map((param: string) => {
              if (param.trim() === 'null') return null
              return param.trim().replace(/^'|'$/g, '') // Remove surrounding quotes if present
            })
            
            const [title, description, priority, status, projectId, issueId, auditId] = params
            
            console.log('Extracted parameters:', { title, description, priority, status, projectId, issueId, auditId })
            
            const { data: rpcData, error: rpcError } = await supabase.rpc('test_add_todo_safely', {
              p_title: title,
              p_description: description,
              p_priority: priority,
              p_status: status,
              p_project_id: projectId,
              p_issue_id: issueId,
              p_audit_id: auditId
            })
            
            if (rpcError) {
              console.error('Direct RPC call failed:', rpcError.message)
              return NextResponse.json({ error: rpcError.message }, { status: 500 })
            }
            
            console.log('Direct RPC call successful:', rpcData)
            return NextResponse.json({ success: true, data: rpcData })
          } else {
            console.error('Failed to extract parameters from SQL')
            return NextResponse.json({ error: 'Failed to extract parameters from SQL' }, { status: 400 })
          }
        }
        
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      console.log('SQL executed successfully')
      return NextResponse.json({ success: true, data })
    } catch (execError: any) {
      console.error('SQL execution exception:', execError.message)
      return NextResponse.json({ error: execError.message }, { status: 500 })
    }
  } catch (e: any) {
    console.error('Debug SQL endpoint error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Create function to list columns
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({
        error: "Unauthorized"
      }, { status: 401 })
    }
    
    // Get the table name from the request
    const { searchParams } = new URL(request.url)
    const table = searchParams.get('table')
    
    if (!table) {
      return NextResponse.json({
        success: false,
        message: "No table name provided"
      }, { status: 400 })
    }
    
    // Create a SQL query to get the column names and types
    const sql = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable 
      FROM 
        information_schema.columns 
      WHERE 
        table_schema = 'public' 
        AND table_name = '${table}'
      ORDER BY 
        ordinal_position
    `
    
    // Execute the SQL statement
    const { data, error } = await supabase
      .rpc('execute_sql', {
        query: sql
      })
    
    if (error) {
      return NextResponse.json({
        success: false,
        message: "Failed to get column information",
        error: error.message
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      table,
      columns: data
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Unhandled error",
      error: error.message || "An error occurred"
    }, { status: 500 })
  }
} 