import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function POST(req: NextRequest) {
  try {
    // Get the request body
    const { todoIds } = await req.json();

    // Validate input
    if (!todoIds || !Array.isArray(todoIds) || todoIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid todo IDs provided' },
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
      .select('id, userId, assignedTo')
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
        { success: false, error: 'You do not have permission to delete any of these todos' },
        { status: 403 }
      );
    }

    // Get assignees for notifications before deletion
    const assigneesToNotify = new Set<string>();
    userTodos?.forEach(todo => {
      if (todo.assignedTo && todo.assignedTo !== user.id) {
        assigneesToNotify.add(todo.assignedTo);
      }
    });

    // Delete the authorized todos
    const { data: deletedTodos, error: deleteError } = await supabase
      .from('todos')
      .delete()
      .in('id', authorizedTodoIds)
      .select();

    if (deleteError) {
      console.error('Error deleting todos:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete todos' },
        { status: 500 }
      );
    }

    // Create notifications for assignees
    if (assigneesToNotify.size > 0) {
      const now = new Date().toISOString();
      const notifications = Array.from(assigneesToNotify).map(assigneeId => ({
        userId: assigneeId,
        type: 'todo_removed',
        content: `Tasks assigned to you have been deleted`,
        metadata: { count: authorizedTodoIds.length },
        read: false,
        createdAt: now,
      }));

      await supabase.from('notifications').insert(notifications);
    }

    return NextResponse.json({
      success: true,
      deleted: authorizedTodoIds.length,
      unauthorized: unauthorizedTodoIds
    });
  } catch (error) {
    console.error('Error in batch deletion:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 