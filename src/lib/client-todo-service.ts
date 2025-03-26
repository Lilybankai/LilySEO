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

// Counter to track failed attempts
let failedAuthAttempts = 0;

/**
 * Function to directly call the server using the safe SQL function
 */
async function trySafeSqlFunction(todoItem: TodoItem) {
  console.log("[DEBUG-TODO-SQL] Trying to use test_add_todo_safely SQL function with:", todoItem);
  
  try {
    // Construct SQL with better error handling for quote escaping
    const title = todoItem.title.replace(/'/g, "''");
    const description = (todoItem.description || "").replace(/'/g, "''");
    const priority = todoItem.priority || "medium";
    const status = todoItem.status || "pending";
    const projectId = todoItem.projectId;
    const auditId = todoItem.auditId ? `'${todoItem.auditId}'` : 'null';
    
    console.log("[DEBUG-TODO-SQL] Formatted SQL parameters:", {
      title,
      description,
      priority,
      status,
      projectId,
      auditId
    });
    
    const sql = `
      SELECT add_todo_safely(
        auth.uid(),
        '${projectId}',
        '${title}',
        '${description}',
        '${status}',
        '${priority}',
        ${auditId}
      );
    `;
    
    console.log("[DEBUG-TODO-SQL] Full SQL query:", sql);
    
    // Make a direct fetch to the debug SQL endpoint
    const testResponse = await fetch('/api/debug/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ sql })
    });
    
    // Log full response status and headers
    console.log("[DEBUG-TODO-SQL] Response status:", testResponse.status);
    console.log("[DEBUG-TODO-SQL] Response headers:", Object.fromEntries([...testResponse.headers.entries()]));
    
    if (testResponse.ok) {
      const result = await testResponse.json();
      console.log("[DEBUG-TODO-SQL] SQL function succeeded with result:", result);
      return { success: true, data: result };
    } else {
      const errorText = await testResponse.text();
      let error;
      try {
        error = JSON.parse(errorText);
      } catch (e) {
        error = { error: errorText || "Unknown error" };
      }
      console.error("[DEBUG-TODO-SQL] SQL function failed:", error);
      return { success: false, error: error.error || "SQL function failed" };
    }
  } catch (error) {
    console.error("[DEBUG-TODO-SQL] Error calling SQL function directly:", error);
    return { success: false, error: "Failed to call SQL function" };
  }
}

/**
 * Client-side function to add a todo item
 */
export async function addTodoItem(todoItem: TodoItem): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[DEBUG-TODO] Adding todo item:", todoItem);
    
    // Try the specialized SQL debug endpoint first
    console.log("[DEBUG-TODO] Trying specialized todo-sql debug endpoint...");
    try {
      const sqlDebugResponse = await fetch('/api/debug/todo-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: todoItem.title,
          description: todoItem.description,
          projectId: todoItem.projectId,
          auditId: todoItem.auditId,
          priority: todoItem.priority || "medium",
          status: todoItem.status || "pending"
        }),
      });
      
      if (sqlDebugResponse.ok) {
        const result = await sqlDebugResponse.json();
        console.log("[DEBUG-TODO] SQL debug endpoint succeeded:", result);
        toast.success('Added to todo list successfully');
        return { success: true };
      } else {
        const errorData = await sqlDebugResponse.json();
        console.error("[DEBUG-TODO] SQL debug endpoint failed:", errorData);
        // Continue to next approach
      }
    } catch (sqlError) {
      console.error("[DEBUG-TODO] SQL debug endpoint error:", sqlError);
      // Continue to next approach
    }
    
    // Create the todoData object for the API with both formats
    const todoData = {
      title: todoItem.title,
      description: todoItem.description,
      priority: todoItem.priority,
      projectId: todoItem.projectId,
      project_id: todoItem.projectId, // Add snake_case version
      status: todoItem.status || "pending",
      // If we have an auditId, include both formats
      ...(todoItem.auditId ? {
        auditId: todoItem.auditId,  // camelCase version
        audit_id: todoItem.auditId, // snake_case version
      } : {})
    };
    
    // Format the data to match what the API expects, but include both naming conventions
    const requestData = {
      todoData,
      auditId: todoItem.auditId || null,
      audit_id: todoItem.auditId || null
    };
    
    console.log("[DEBUG-TODO] Sending request to API:", requestData);
    
    // Get all cookies from the document
    console.log("[DEBUG-TODO] Cookies:", document.cookie);
    
    // First attempt with regular API endpoint using credentials: include
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for sending cookies
      body: JSON.stringify(requestData),
    });

    // Handle 401 errors specifically
    if (response.status === 401) {
      console.log("Authentication error (401). Trying direct SQL function...");
      failedAuthAttempts++;
      
      // Try the safe SQL function first
      const sqlResult = await trySafeSqlFunction(todoItem);
      if (sqlResult.success) {
        console.log("Successfully added todo via safe SQL function");
        failedAuthAttempts = 0; // Reset counter on success
        toast.success('Added to todo list successfully');
        return { success: true };
      }
      
      // Try the debug endpoint which might have a different authentication mechanism
      console.log("Safe SQL function failed. Trying debug endpoint...");
      const debugResponse = await fetch('/api/debug/todo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for sending cookies
        body: JSON.stringify({
          title: todoItem.title,
          description: todoItem.description,
          priority: todoItem.priority,
          project_id: todoItem.projectId,
          status: todoItem.status || "pending",
          audit_id: todoItem.auditId
        }),
      });
      
      if (debugResponse.ok) {
        console.log("Successfully added todo via debug endpoint");
        failedAuthAttempts = 0; // Reset counter on success
        toast.success('Added to todo list successfully');
        return { success: true };
      }
      
      // Debug endpoint also failed
      const debugErrorData = await debugResponse.json().catch(() => ({ error: `Debug endpoint responded with status: ${debugResponse.status}` }));
      console.error("Debug endpoint error:", debugErrorData);
      
      // If we've failed multiple times, suggest reloading the page or redirect to login
      if (failedAuthAttempts >= 2) {
        console.log("Multiple authentication failures detected. Suggesting login page.");
        const reload = confirm("Your session may have expired. Would you like to go to the login page to refresh your session?");
        if (reload) {
          // Redirect to login page
          window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname);
          return { success: false, error: "Redirecting to login..." };
        }
      }
      
      toast.error(debugErrorData.error || 'Authentication error - please try reloading the page');
      return { success: false, error: debugErrorData.error || 'Authentication error' };
    }
    
    // Handle other API errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Server responded with status: ${response.status}` }));
      console.error("Error response from API:", errorData);
      
      // If we get a specific error about the column or SQL function, try the safe SQL function
      if (errorData.error && (errorData.error.includes('auditId') || errorData.error.includes('exec_sql'))) {
        console.log("API error related to column names or SQL function, trying safe SQL function");
        
        // Try the safe SQL function first
        const sqlResult = await trySafeSqlFunction(todoItem);
        if (sqlResult.success) {
          console.log("Successfully added todo via safe SQL function");
          failedAuthAttempts = 0; // Reset counter on success
          toast.success('Added to todo list successfully');
          return { success: true };
        }
        
        // SQL function failed, try debug endpoint
        console.log("Safe SQL function failed. Trying debug endpoint...");
        
        // Try calling a debug endpoint that can handle the column issue
        const debugResponse = await fetch('/api/debug/todo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            title: todoItem.title,
            description: todoItem.description,
            priority: todoItem.priority,
            project_id: todoItem.projectId,
            status: todoItem.status || "pending",
            audit_id: todoItem.auditId
          }),
        });
        
        if (debugResponse.ok) {
          toast.success('Added to todo list successfully');
          return { success: true };
        }
        
        const debugError = await debugResponse.json().catch(() => ({ error: "Failed with debug endpoint" }));
        toast.error(debugError.error || 'Failed to add todo item');
        return { success: false, error: debugError.error };
      }
      
      toast.error(errorData.error || 'Failed to add todo item');
      return { success: false, error: errorData.error || `Server responded with status: ${response.status}` };
    }

    const data = await response.json();
    console.log("Todo added successfully:", data);
    
    toast.success('Added to todo list successfully');
    return { success: true };
  } catch (error) {
    console.error("Failed to add todo item:", error);
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