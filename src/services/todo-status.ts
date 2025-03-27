import { handleApiResponse } from './api-utils';

/**
 * Updates the status of a todo item
 * @param todoId - The ID of the todo to update
 * @param status - The new status to set
 * @param timeSpent - Optional time spent on the task (in minutes)
 * @returns Promise with the updated todo or error
 */
export async function updateTodoStatus(
  todoId: string, 
  status: string,
  timeSpent?: number
): Promise<{ success: boolean; todo?: any; error?: string }> {
  try {
    const response = await fetch('/api/todos/status', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        todoId,
        status,
        timeSpent,
      }),
    });

    return await handleApiResponse(response);
  } catch (error) {
    console.error('Error updating todo status:', error);
    return { 
      success: false, 
      error: 'Failed to update todo status. Please try again.' 
    };
  }
}

/**
 * Reassigns a todo to a different team member
 * @param todoId - The ID of the todo to reassign
 * @param assigneeId - The ID of the team member to assign to
 * @returns Promise with the updated todo or error
 */
export async function reassignTodo(
  todoId: string,
  assigneeId: string
): Promise<{ success: boolean; todo?: any; error?: string }> {
  try {
    const response = await fetch('/api/todos/reassign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        todoId,
        assigneeId,
      }),
    });

    return await handleApiResponse(response);
  } catch (error) {
    console.error('Error reassigning todo:', error);
    return { 
      success: false, 
      error: 'Failed to reassign todo. Please try again.' 
    };
  }
}

/**
 * Completes a todo item
 * @param todoId - The ID of the todo to complete
 * @param timeSpent - Optional time spent on the task (in minutes)
 * @returns Promise with the updated todo or error
 */
export async function completeTodo(
  todoId: string,
  timeSpent?: number
): Promise<{ success: boolean; todo?: any; error?: string }> {
  return updateTodoStatus(todoId, 'completed', timeSpent);
}

/**
 * Marks a todo as in progress
 * @param todoId - The ID of the todo to update
 * @returns Promise with the updated todo or error
 */
export async function startTodo(
  todoId: string
): Promise<{ success: boolean; todo?: any; error?: string }> {
  return updateTodoStatus(todoId, 'in-progress');
}

/**
 * Returns a todo to the 'to-do' status
 * @param todoId - The ID of the todo to reset
 * @returns Promise with the updated todo or error
 */
export async function resetTodo(
  todoId: string
): Promise<{ success: boolean; todo?: any; error?: string }> {
  return updateTodoStatus(todoId, 'to-do');
}

/**
 * Log time spent on a todo without changing its status
 * @param todoId - The ID of the todo to log time for
 * @param timeSpent - Time spent on the task (in minutes)
 * @returns Promise with the updated todo or error
 */
export async function logTimeSpent(
  todoId: string,
  timeSpent: number
): Promise<{ success: boolean; todo?: any; error?: string }> {
  try {
    // Get current todo to retrieve its status
    const todoResponse = await fetch(`/api/todos/${todoId}`);
    const todoData = await todoResponse.json();
    
    if (!todoData.success || !todoData.todo) {
      return { 
        success: false, 
        error: 'Failed to retrieve todo information.' 
      };
    }
    
    // Update with the same status but add time spent
    return updateTodoStatus(todoId, todoData.todo.status, timeSpent);
  } catch (error) {
    console.error('Error logging time spent:', error);
    return { 
      success: false, 
      error: 'Failed to log time spent. Please try again.' 
    };
  }
} 