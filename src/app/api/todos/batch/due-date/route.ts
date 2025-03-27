import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
 * POST /api/todos/batch/due-date
 * Updates the due dates for multiple todos at once
 */
export async function POST(req: NextRequest) {
  try {
    // Get the request body
    const { todoIds, dueDate } = await req.json();

    // Validate input
    if (!todoIds || !Array.isArray(todoIds) || todoIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid todo IDs provided' },
        { status: 400 }
      );
    }

    // Validate due date (can be null to clear the due date)
    if (dueDate !== null && dueDate !== undefined) {
      // Check if dueDate is a valid date string
      const parsedDate = new Date(dueDate);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid due date provided' },
          { status: 400 }
        );
      }
    }

    // Initialize Supabase client
    const supabase = await createClient();

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get current user's todos to verify ownership
    const { data: userTodos, error: todosError } = await supabase
      .from('todos')
      .select('id, user_id')
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
      ?.filter(todo => todo.user_id === userId)
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
      due_date: dueDate === null ? null : dueDate,  // Allow clearing the due date
      updated_at: new Date().toISOString()
    };

    console.log('Updating todos with due_date:', {
      due_date: updateData.due_date,
      type: typeof updateData.due_date,
      authorizedTodoCount: authorizedTodoIds.length
    });

    // Update the authorized todos
    const { data: updatedTodos, error: updateError } = await supabase
      .from('todos')
      .update(updateData)
      .in('id', authorizedTodoIds)
      .select();

    if (updateError) {
      console.error('Error updating todos:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update todo due dates' },
        { status: 500 }
      );
    }

    // Map the updated todos to camelCase for frontend consistency
    const mappedTodos = updatedTodos?.map(mapDbFieldsToCamelCase) || [];
    
    // Log the first todo for debugging
    if (mappedTodos.length > 0) {
      console.log('First updated todo with mapped fields:', {
        id: mappedTodos[0].id,
        dueDate: mappedTodos[0].dueDate,
        due_date: mappedTodos[0].due_date,
        hasCorrectCamelCase: 'dueDate' in mappedTodos[0]
      });
    }

    return NextResponse.json({
      success: true,
      updated: authorizedTodoIds.length,
      todos: mappedTodos,
      unauthorized: unauthorizedTodoIds
    });
  } catch (error) {
    console.error('Error in batch update due dates API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 