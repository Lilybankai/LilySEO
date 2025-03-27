import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function POST(req: NextRequest) {
  try {
    // Get the request body
    const { todoIds, assigneeId } = await req.json();

    // Validate input
    if (!todoIds || !Array.isArray(todoIds) || todoIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid todo IDs provided' },
        { status: 400 }
      );
    }

    if (!assigneeId || typeof assigneeId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid assignee ID provided' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current user's todos to verify ownership
    const { data: userTodos, error: todosError } = await supabase
      .from('todos')
      .select('id, userId')
      .in('id', todoIds);

    if (todosError) {
      console.error('Error fetching todos:', todosError);
      return NextResponse.json(
        { success: false, error: 'Failed to verify todo ownership' },
        { status: 500 }
      );
    }

    // Verify assignee is a valid team member
    const { data: teamMember, error: teamMemberError } = await supabase
      .from('team_members')
      .select('*')
      .eq('userId', assigneeId)
      .eq('status', 'active')
      .single();

    if (teamMemberError || !teamMember) {
      return NextResponse.json(
        { success: false, error: 'Invalid assignee. The user is not an active team member.' },
        { status: 400 }
      );
    }

    // Separate authorized and unauthorized todos
    const authorizedTodoIds = userTodos
      ?.filter(todo => todo.userId === user.id)
      .map(todo => todo.id) || [];
    
    const unauthorizedTodoIds = todoIds.filter(id => !authorizedTodoIds.includes(id));

    if (authorizedTodoIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to update any of these todos' },
        { status: 403 }
      );
    }

    // Update the authorized todos
    const { data: updatedTodos, error: updateError } = await supabase
      .from('todos')
      .update({
        assignedTo: assigneeId,
        updatedAt: new Date().toISOString()
      })
      .in('id', authorizedTodoIds)
      .select();

    if (updateError) {
      console.error('Error assigning todos:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to assign todos' },
        { status: 500 }
      );
    }

    // Create notifications for the assignee
    const notifications = authorizedTodoIds.map(todoId => ({
      userId: assigneeId,
      type: 'todo_assigned',
      content: `You have been assigned a new task`,
      metadata: { todoId },
      read: false,
      createdAt: new Date().toISOString(),
    }));

    await supabase.from('notifications').insert(notifications);

    return NextResponse.json({
      success: true,
      updated: authorizedTodoIds.length,
      todos: updatedTodos,
      unauthorized: unauthorizedTodoIds
    });
  } catch (error) {
    console.error('Error in batch assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 