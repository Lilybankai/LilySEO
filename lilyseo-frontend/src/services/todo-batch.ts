import { handleApiResponse } from './api-utils';

/**
 * Updates the status of multiple todo items at once
 * @param todoIds - Array of todo IDs to update
 * @param status - The new status to set
 * @param timeSpent - Optional time spent on the tasks (in minutes)
 * @returns Promise with the updated todos or error
 */
export async function updateTodosStatus(
  todoIds: string[], 
  status: string,
  timeSpent?: number
): Promise<{ success: boolean; todos?: any[]; unauthorized?: string[]; error?: string }> {
  try {
    const response = await fetch('/api/todos/batch/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        todoIds,
        status,
        timeSpent,
      }),
    });

    return await handleApiResponse(response);
  } catch (error) {
    console.error('Error updating todos status in batch:', error);
    return { 
      success: false, 
      error: 'Failed to update todo statuses. Please try again.' 
    };
  }
}

/**
 * Assigns multiple todos to a team member
 * @param todoIds - Array of todo IDs to assign
 * @param assigneeId - The ID of the team member to assign to
 * @returns Promise with the updated todos or error
 */
export async function assignTodos(
  todoIds: string[],
  assigneeId: string
): Promise<{ success: boolean; todos?: any[]; unauthorized?: string[]; error?: string }> {
  try {
    const response = await fetch('/api/todos/batch/assign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        todoIds,
        assigneeId,
      }),
    });

    return await handleApiResponse(response);
  } catch (error) {
    console.error('Error assigning todos in batch:', error);
    return { 
      success: false, 
      error: 'Failed to assign todos. Please try again.' 
    };
  }
}

/**
 * Deletes multiple todos
 * @param todoIds - Array of todo IDs to delete
 * @returns Promise with result information
 */
export async function deleteTodos(
  todoIds: string[]
): Promise<{ success: boolean; deleted?: number; unauthorized?: string[]; error?: string }> {
  try {
    const response = await fetch('/api/todos/batch/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        todoIds,
      }),
    });

    return await handleApiResponse(response);
  } catch (error) {
    console.error('Error deleting todos in batch:', error);
    return { 
      success: false, 
      error: 'Failed to delete todos. Please try again.' 
    };
  }
}

/**
 * Completes multiple todo items
 * @param todoIds - Array of todo IDs to complete
 * @param timeSpent - Optional time spent on the tasks (in minutes)
 * @returns Promise with the updated todos or error
 */
export async function completeTodos(
  todoIds: string[],
  timeSpent?: number
): Promise<{ success: boolean; todos?: any[]; unauthorized?: string[]; error?: string }> {
  return updateTodosStatus(todoIds, 'completed', timeSpent);
}

/**
 * Marks multiple todos as in progress
 * @param todoIds - Array of todo IDs to update
 * @returns Promise with the updated todos or error
 */
export async function startTodos(
  todoIds: string[]
): Promise<{ success: boolean; todos?: any[]; unauthorized?: string[]; error?: string }> {
  return updateTodosStatus(todoIds, 'in_progress');
}

/**
 * Returns multiple todos to the 'to-do' status
 * @param todoIds - Array of todo IDs to reset
 * @returns Promise with the updated todos or error
 */
export async function resetTodos(
  todoIds: string[]
): Promise<{ success: boolean; todos?: any[]; unauthorized?: string[]; error?: string }> {
  return updateTodosStatus(todoIds, 'to-do');
}

/**
 * Updates the due dates for multiple todo items at once
 * @param todoIds - Array of todo IDs to update
 * @param dueDate - The new due date to set (or null/undefined to clear)
 * @returns Promise with the updated todos or error
 */
export async function updateTodosDueDate(
  todoIds: string[], 
  dueDate: Date | string | null | undefined
): Promise<{ success: boolean; todos?: any[]; unauthorized?: string[]; updated?: number; error?: string }> {
  try {
    console.log('updateTodosDueDate called with:', { todoIds, dueDate, dateType: dueDate ? typeof dueDate : 'null/undefined' });
    
    // Format date as ISO string if it's a Date object, or null if undefined/null
    const formattedDueDate = dueDate instanceof Date 
      ? dueDate.toISOString() 
      : (dueDate === undefined ? null : dueDate);
    
    console.log('Formatted due date:', formattedDueDate);
    
    const response = await fetch('/api/todos/batch/due-date', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        todoIds,
        dueDate: formattedDueDate,
      }),
    });

    const result = await handleApiResponse(response);
    console.log('API response for updateTodosDueDate:', result);
    
    return result;
  } catch (error) {
    console.error('Error updating todo due dates in batch:', error);
    return { 
      success: false, 
      error: 'Failed to update todo due dates. Please try again.' 
    };
  }
} 