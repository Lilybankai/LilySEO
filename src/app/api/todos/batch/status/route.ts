import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function POST(req: NextRequest) {
  try {
    // Get the request body
    const { todoIds, status, timeSpent } = await req.json();

    // Validate input
    if (!todoIds || !Array.isArray(todoIds) || todoIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid todo IDs provided' },
        { status: 400 }
      );
    }

    if (!status || typeof status !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid status provided' },
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

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString()
    };

    // Add time spent if provided
    if (timeSpent && typeof timeSpent === 'number') {
      updateData.timeSpent = timeSpent;
      updateData.timeTrackedAt = new Date().toISOString();
    }

    // Update the authorized todos
    const { data: updatedTodos, error: updateError } = await supabase
      .from('todos')
      .update(updateData)
      .in('id', authorizedTodoIds)
      .select();

    if (updateError) {
      console.error('Error updating todos:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update todos' },
        { status: 500 }
      );
    }

    // Create notifications for completed todos
    if (status === 'completed') {
      // Get team owner for notifications if the user is not the team owner
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('teamOwnerId')
        .eq('userId', user.id)
        .single();

      if (teamMember && teamMember.teamOwnerId !== user.id) {
        // Create notifications for the team owner
        const notifications = authorizedTodoIds.map(todoId => ({
          userId: teamMember.teamOwnerId,
          type: 'todo_completed',
          content: `A team member has completed a task`,
          metadata: { todoId },
          read: false,
          createdAt: new Date().toISOString(),
        }));

        await supabase.from('notifications').insert(notifications);
      }
    }

    return NextResponse.json({
      success: true,
      updated: authorizedTodoIds.length,
      todos: updatedTodos,
      unauthorized: unauthorizedTodoIds
    });
  } catch (error) {
    console.error('Error in batch status update:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 