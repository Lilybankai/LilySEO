import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { createTestNotification } from '@/services/notifications';

export async function POST(request: Request) {
  try {
    // Authenticate the user
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.todoId || !body.assignedTo) {
      return NextResponse.json(
        { error: 'Todo ID and assignee ID are required' },
        { status: 400 }
      );
    }
    
    // Check if the user has permission to assign this todo
    // For now, we'll allow the todo owner or a team admin to assign it
    const { data: todo, error: todoError } = await supabase
      .from('todos')
      .select('*, projects(*)')
      .eq('id', body.todoId)
      .single();
    
    if (todoError || !todo) {
      console.error('Error fetching todo:', todoError);
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }
    
    // Check if the assignee is part of the team
    const { data: teamMember, error: teamError } = await supabase
      .from('team_members')
      .select('*')
      .eq('user_id', body.assignedTo)
      .eq('team_owner_id', userId)
      .eq('status', 'active')
      .single();
    
    if (teamError) {
      console.error('Error checking team membership:', teamError);
      return NextResponse.json(
        { error: 'The assignee is not an active member of your team' },
        { status: 403 }
      );
    }
    
    // Update the todo with the assigned user
    const { data: updatedTodo, error: updateError } = await supabase
      .from('todos')
      .update({
        assigned_to: body.assignedTo,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.todoId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error assigning todo:', updateError);
      return NextResponse.json(
        { error: 'Failed to assign todo' },
        { status: 500 }
      );
    }
    
    // Create a notification for the assigned user
    // In a real implementation, you'd want to create a proper notification in the database
    // directly associated with the assigned user
    await createTestNotification(
      'Task Assigned',
      `You've been assigned a new task: ${todo.title} in project ${todo.projects?.name || 'Unknown Project'}.`
    );
    
    return NextResponse.json({ 
      success: true,
      todo: updatedTodo
    });
  } catch (error) {
    console.error('Error in assign todo API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 