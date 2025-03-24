import { toast } from "sonner";

export interface TodoItem {
  id?: string;
  projectId: string;
  auditId?: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed";
  dueDate?: Date;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Client-side function to add a todo item
 */
export async function addTodoItem(todoItem: TodoItem): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: todoItem.title,
        description: todoItem.description,
        priority: todoItem.priority,
        projectId: todoItem.projectId,
        auditId: todoItem.auditId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.error || 'Failed to add todo item');
      return { success: false, error: data.error };
    }

    toast.success('Added to todo list successfully');
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to add todo item';
    toast.error(errorMessage);
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

/**
 * Client-side function to get todo items for a project
 */
export async function getTodoItems(projectId: string): Promise<TodoItem[]> {
  try {
    const response = await fetch(`/api/todos?projectId=${projectId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch todo items');
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching todo items:', error);
    toast.error('Failed to load todo items');
    return [];
  }
} 