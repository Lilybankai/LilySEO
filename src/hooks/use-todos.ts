import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Todo, TodoStatus, KanbanColumn } from '@/types/todos';

// API functions
async function fetchTodos(projectId?: string, searchTerm?: string): Promise<Todo[]> {
  let url = '/api/todos';
  
  // Add query parameters
  const params = new URLSearchParams();
  if (projectId) {
    params.append('projectId', projectId);
  }
  if (searchTerm && searchTerm.trim() !== '') {
    params.append('search', searchTerm.trim());
  }
  
  // Append params to URL if any exist
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch todos');
  }
  const result = await response.json();
  
  // Check if result has a data property (API might return { data: [...] })
  if (result && typeof result === 'object' && 'data' in result) {
    console.log("API returned data in 'data' property, length:", result.data?.length);
    return result.data || [];
  }
  
  // If it's already an array, return it directly
  if (Array.isArray(result)) {
    console.log("API returned data directly as array, length:", result.length);
    return result;
  }
  
  console.warn("Unexpected API response format:", result);
  return [];
}

async function fetchTodoById(id: string): Promise<Todo> {
  const response = await fetch(`/api/todos/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch todo');
  }
  return response.json();
}

async function fetchCustomColumns(): Promise<Partial<KanbanColumn>[]> {
  const response = await fetch('/api/todos/columns');
  if (!response.ok) {
    throw new Error('Failed to fetch custom columns');
  }
  
  const result = await response.json();
  console.log("Custom columns API response:", result);
  
  // Return the result directly as it should already be an array
  // (based on how the API is implemented)
  if (Array.isArray(result)) {
    return result;
  }
  
  // If there's a data property, use that
  if (result && typeof result === 'object' && 'data' in result) {
    return Array.isArray(result.data) ? result.data : [];
  }
  
  // Fallback to default columns
  console.warn("Unexpected columns API response format:", result);
  return [];
}

// Create default columns with empty items arrays
function createDefaultColumns(): KanbanColumn[] {
  return [
    { id: 'col-1', title: 'To Do', status: 'pending', color: '#3B82F6', items: [] },
    { id: 'col-2', title: 'In Progress', status: 'in_progress', color: '#F59E0B', items: [] },
    { id: 'col-3', title: 'Review', status: 'review', color: '#8B5CF6', items: [] },
    { id: 'col-4', title: 'Completed', status: 'completed', color: '#10B981', items: [] },
  ];
}

// Organize todos into kanban columns
function organizeTodosIntoColumns(todos: Todo[] | any, customColumns: KanbanColumn[]): KanbanColumn[] {
  console.log("organizeTodosIntoColumns called with:", { 
    todos: todos, 
    isArray: Array.isArray(todos),
    todosType: typeof todos,
    customColumns 
  });
  
  const columns = [...customColumns];
  
  // Ensure all default statuses are present
  const defaultStatuses: TodoStatus[] = ['pending', 'in_progress', 'review', 'completed'];
  defaultStatuses.forEach((status, index) => {
    if (!columns.some(col => col.status === status)) {
      columns.push({
        id: `col-${index + 1}`,
        title: status === 'pending' ? 'To Do' : 
               status === 'in_progress' ? 'In Progress' : 
               status.charAt(0).toUpperCase() + status.slice(1),
        status,
        color: status === 'pending' ? '#3B82F6' : 
               status === 'in_progress' ? '#F59E0B' : 
               status === 'review' ? '#8B5CF6' : 
               '#10B981',
        items: []
      });
    }
  });
  
  // Process and normalize todos before adding to columns
  const processTodo = (todo: any) => {
    // Log the first few todos for debugging
    if (columns[0].items.length < 3) {
      console.log("Processing todo item:", {
        id: todo.id,
        title: todo.title?.substring(0, 30),
        dueDate: todo.dueDate,
        due_date: todo.due_date,
        dueDateType: todo.dueDate ? typeof todo.dueDate : undefined,
        dueDatePropertyExists: 'dueDate' in todo
      });
    }
    
    // Ensure dueDate is properly set - handle potential snake_case to camelCase conversion
    if (todo.due_date !== undefined && todo.dueDate === undefined) {
      todo.dueDate = todo.due_date;
    }
    
    // Find the appropriate column
    const targetColumn = columns.find(col => col.status === todo.status) || columns[0];
    
    // Add the normalized todo to the column
    targetColumn.items.push(todo);
  };
  
  // Distribute todos into columns - ensure todos is an array before using forEach
  if (Array.isArray(todos)) {
    todos.forEach(processTodo);
  } else if (todos && typeof todos === 'object' && 'data' in todos) {
    // Handle case where todos is wrapped in a data property
    const todosArray = (todos as { data: any[] }).data;
    if (Array.isArray(todosArray)) {
      console.log("Using todos.data which is an array with length:", todosArray.length);
      todosArray.forEach(processTodo);
    } else {
      console.error("todos.data is not an array:", todosArray);
    }
  } else {
    console.error("Todos is not an array and doesn't have a data property:", todos);
  }
  
  return columns;
}

// React Query hooks
export function useTodos(projectId?: string, searchTerm?: string) {
  return useQuery({
    queryKey: ['todos', { projectId, searchTerm }],
    queryFn: () => fetchTodos(projectId, searchTerm),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useTodoById(id: string) {
  return useQuery({
    queryKey: ['todo', id],
    queryFn: () => fetchTodoById(id),
    enabled: !!id,
  });
}

export function useKanbanColumns(projectId?: string, searchTerm?: string) {
  const { data: todos, isLoading: isTodosLoading, error: todosError } = useTodos(projectId, searchTerm);
  const { 
    data: customColumnsData, 
    isLoading: isColumnsLoading,
    error: columnsError 
  } = useQuery({
    queryKey: ['columns'],
    queryFn: fetchCustomColumns,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const isLoading = isTodosLoading || isColumnsLoading;
  const error = todosError || columnsError;
  
  let columns: KanbanColumn[] = [];
  
  if (!isLoading && !error) {
    const baseColumns = customColumnsData?.length ? 
      customColumnsData.map(col => ({ ...col, items: [] } as KanbanColumn)) : 
      createDefaultColumns();
    
    // Ensure todos is an array (even if empty) before passing to organizeTodosIntoColumns
    const todosArray = Array.isArray(todos) ? todos : [];
    console.log("useKanbanColumns - preparing to organize todos:", { 
      todosArray,
      isArray: Array.isArray(todosArray),
      length: todosArray?.length, 
      customColumnsLength: customColumnsData?.length 
    });
    
    columns = organizeTodosIntoColumns(todosArray, baseColumns);
  }
  
  return {
    columns,
    isLoading,
    error,
  };
}

export function useUpdateTodoStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      todoId, 
      newStatus 
    }: { 
      todoId: string; 
      newStatus: TodoStatus;
    }) => {
      try {
        console.log(`Updating todo ${todoId} to status: ${newStatus}`);
        
        const response = await fetch(`/api/todos/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ todoId, status: newStatus }),
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
          // Log the error details for debugging
          console.error('Error updating todo status:', responseData);
          throw new Error(responseData.error || 'Failed to update todo status');
        }
        
        return responseData;
      } catch (error) {
        console.error('Error in useUpdateTodoStatus:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (todoData: Partial<Todo>) => {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(todoData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create todo');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      todoId, 
      todoData 
    }: { 
      todoId: string; 
      todoData: Partial<Todo>;
    }) => {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(todoData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update todo');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['todo', variables.todoId] });
    },
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (todoId: string) => {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete todo');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}

export function useAssignTodo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      todoId, 
      assigneeId 
    }: { 
      todoId: string; 
      assigneeId: string;
    }) => {
      const response = await fetch(`/api/todos/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ todoId, assigneeId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to assign todo');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}

// Batch operation hooks
export function useBatchUpdateStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      todoIds, 
      status 
    }: { 
      todoIds: string[]; 
      status: TodoStatus;
    }) => {
      const response = await fetch('/api/todos/batch/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ todoIds, status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update todo statuses');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}

export function useBatchAssignTodos() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      todoIds, 
      assigneeId 
    }: { 
      todoIds: string[]; 
      assigneeId: string;
    }) => {
      const response = await fetch('/api/todos/batch/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ todoIds, assigneeId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to assign todos');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}

export function useBatchDeleteTodos() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (todoIds: string[]) => {
      const response = await fetch('/api/todos/batch/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ todoIds }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete todos');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}

/**
 * Hook for fetching todos with a calendar-focused format
 * Optimized for calendar view with structured date grouping
 */
export function useCalendarTodos(projectId?: string) {
  return useQuery({
    queryKey: ['todos', 'calendar', { projectId }],
    queryFn: async () => {
      const todos = await fetchTodos(projectId);
      // We specifically filter for todos that have a scheduledFor date
      return todos.filter(todo => todo.scheduledFor);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
} 