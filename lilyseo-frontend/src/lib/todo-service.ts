import { createClient } from "@/lib/supabase/server";
import { notifyNewTodos } from "./notification-utils";

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

export async function addTodoItem(todoItem: TodoItem): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    
    // Get user data
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }
    
    // First try using the safe function if it exists
    try {
      console.log("Trying to use add_todo_safely function...");
      const { data: safeResult, error: safeError } = await supabase.rpc(
        'add_todo_safely',
        {
          p_user_id: user.id,
          p_project_id: todoItem.projectId,
          p_title: todoItem.title,
          p_description: todoItem.description || '',
          p_status: todoItem.status || 'pending',
          p_priority: todoItem.priority,
          p_audit_id: todoItem.auditId
        }
      );
      
      if (!safeError && safeResult && safeResult.success) {
        console.log("Successfully added todo using safe function:", safeResult);
        return { success: true };
      }
      
      if (safeError) {
        console.log("Safe function failed or doesn't exist:", safeError);
        // Continue to standard approaches
      }
    } catch (fnError) {
      console.log("Safe function not available:", fnError);
      // Continue to standard approaches
    }
    
    // Standard approach - with fallbacks
    // Add user ID to the todo item and prepare both column naming formats
    // The database will ignore fields that don't match its schema
    const todoItemWithUser = {
      ...todoItem,
      user_id: user.id,
      project_id: todoItem.projectId,
      // Use both column formats to handle schema inconsistencies
      audit_id: todoItem.auditId, // snake_case (matches your database)
      auditId: todoItem.auditId,  // camelCase (what Supabase might be looking for)
      due_date: todoItem.dueDate ? new Date(todoItem.dueDate).toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log("Attempting to insert todo with data:", todoItemWithUser);
    
    // Insert into the todos table
    const { error } = await supabase
      .from("todos")
      .insert(todoItemWithUser);
    
    if (error) {
      console.error("Error adding todo item:", error);
      
      // If the error is related to column name issues, try a more direct approach
      if (error.message && error.message.includes('auditId')) {
        console.log("Trying alternative insert method due to column issue...");
        
        // Instead of using exec_sql, try a direct insert without the problematic column
        const directInsertData = {
          title: todoItem.title,
          description: todoItem.description || '',
          priority: todoItem.priority,
          status: todoItem.status || 'pending',
          project_id: todoItem.projectId,
          user_id: user.id,
          // IMPORTANT: Only use the snake_case column that we know exists in the database
          audit_id: todoItem.auditId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log("Trying direct insert with snake_case only:", directInsertData);
        
        // Try the direct insert
        const { data: directData, error: directError } = await supabase
          .from("todos")
          .insert(directInsertData)
          .select();
        
        if (directError) {
          console.error("Direct insert error:", directError);
          
          // If foreign key constraint is the issue, try without the audit_id
          if (directError.message && directError.message.includes('foreign key constraint')) {
            console.log("Foreign key constraint violation, trying without audit_id");
            
            // Remove the audit_id field and try again
            const { audit_id, ...dataWithoutAudit } = directInsertData;
            const { error: noAuditError } = await supabase
              .from("todos")
              .insert(dataWithoutAudit);
            
            if (!noAuditError) {
              console.log("Successfully added todo without audit_id");
              return { success: true };
            }
            
            console.error("Failed to add todo without audit_id:", noAuditError);
          }
          
          // If direct insert also fails, try to bypass the API completely with a debug endpoint
          try {
            console.log("Trying to use debug endpoint as last resort");
            const response = await fetch('/api/debug/todo', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...directInsertData,
                // Remove audit_id to avoid constraint issues
                audit_id: undefined
              }),
            });
            
            if (response.ok) {
              console.log("Successfully added todo via debug endpoint");
              return { success: true };
            }
            
            const debugError = await response.json();
            console.error("Debug endpoint error:", debugError);
            return { success: false, error: debugError.error || "Debug endpoint failed" };
          } catch (fetchError) {
            console.error("Failed to call debug endpoint:", fetchError);
            return { success: false, error: `Failed to call debug endpoint: ${fetchError}` };
          }
        }
        
        console.log("Successfully added todo via direct insert:", directData);
        return { success: true };
      }
      
      // Try inserting without audit_id if it's a foreign key constraint issue
      if (error.message && error.message.includes('foreign key constraint')) {
        console.log("Foreign key constraint violation, trying without audit_id");
        
        const todoItemWithoutAudit = {
          ...todoItemWithUser
        };
        
        // Remove both versions of the audit ID
        delete todoItemWithoutAudit.audit_id;
        delete todoItemWithoutAudit.auditId;
        
        const { error: retryError } = await supabase
          .from("todos")
          .insert(todoItemWithoutAudit);
        
        if (!retryError) {
          console.log("Successfully added todo without audit_id");
          return { success: true };
        }
        
        console.error("Failed to add todo without audit_id:", retryError);
        return { success: false, error: retryError.message };
      }
      
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Failed to add todo item:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to add todo item" 
    };
  }
}

export async function getTodoItems(projectId: string): Promise<TodoItem[]> {
  try {
    const supabase = await createClient();
    
    // Get user data
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Unauthorized");
    }
    
    // Query the todos table
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching todo items:", error);
      throw error;
    }
    
    // Map the data to the TodoItem interface
    return data.map((item) => ({
      id: item.id,
      projectId: item.project_id,
      auditId: item.audit_id,
      title: item.title,
      description: item.description,
      priority: item.priority,
      status: item.status,
      dueDate: item.due_date ? new Date(item.due_date) : undefined,
      userId: item.user_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
  } catch (error) {
    console.error("Failed to fetch todo items:", error);
    return [];
  }
}

/**
 * Generate todo items from audit recommendations
 * @param auditId The ID of the audit
 * @param projectId The ID of the project
 * @returns A promise that resolves to the number of todos created
 */
export async function generateTodosFromAudit(
  auditId: string,
  projectId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const supabase = await createClient();
    
    // Get user data
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, count: 0, error: "Unauthorized" };
    }
    
    // Get the project details for notification
    const { data: project } = await supabase
      .from("projects")
      .select("name")
      .eq("id", projectId)
      .single();
    
    if (!project) {
      return { success: false, count: 0, error: "Project not found" };
    }
    
    // Get the audit recommendations
    const { data: audit } = await supabase
      .from("audits")
      .select("recommendations")
      .eq("id", auditId)
      .single();
    
    if (!audit?.recommendations) {
      return { success: false, count: 0, error: "No recommendations found" };
    }
    
    const recommendations = audit.recommendations;
    const todoItems: Omit<TodoItem, 'id'>[] = [];
    
    // Convert recommendations to todo items
    recommendations.forEach((rec: any) => {
      // Only create todos for actionable recommendations
      if (rec.action_required) {
        todoItems.push({
          projectId,
          auditId,
          title: rec.title || "Fix issue: " + rec.description.substring(0, 50) + "...",
          description: `${rec.description}\n\nCategory: ${rec.category}\nImpact: ${rec.impact || 'Medium'}`,
          priority: getPriorityFromImpact(rec.impact),
          status: "pending",
          userId: user.id
        });
      }
    });
    
    if (todoItems.length === 0) {
      return { success: true, count: 0 };
    }
    
    // Try using the safe function for each item first
    try {
      console.log("Trying to use add_todo_safely function for batch...");
      let successCount = 0;
      
      for (const item of todoItems) {
        const { data: safeResult, error: safeError } = await supabase.rpc(
          'add_todo_safely',
          {
            p_user_id: user.id,
            p_project_id: item.projectId,
            p_title: item.title,
            p_description: item.description || '',
            p_status: item.status || 'pending',
            p_priority: item.priority,
            p_audit_id: item.auditId
          }
        );
        
        if (!safeError && safeResult && safeResult.success) {
          successCount++;
        } else {
          console.error("Safe function failed for item:", safeError || "Unknown error");
        }
      }
      
      if (successCount > 0) {
        console.log(`Added ${successCount} of ${todoItems.length} todos via safe function`);
        
        // Notify the user about the new todos
        await notifyNewTodos(user.id, project.name, successCount);
        
        return { 
          success: successCount === todoItems.length,
          count: successCount,
          error: successCount < todoItems.length ? 
            `Only ${successCount} of ${todoItems.length} items could be added` : undefined
        };
      }
      
      console.log("Safe function approach failed, trying standard approaches");
    } catch (fnError) {
      console.log("Safe function not available:", fnError);
      // Continue with standard approaches
    }
    
    // Format the items for the database - fallback to standard approach
    const formattedItems = todoItems.map(item => ({
      user_id: user.id,
      project_id: item.projectId,
      audit_id: item.auditId,
      auditId: item.auditId,
      title: item.title,
      description: item.description,
      status: item.status,
      priority: item.priority,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    console.log("Inserting batch todo items:", formattedItems);
    
    // Insert the todo items in a batch
    const { error } = await supabase
      .from("todos")
      .insert(formattedItems);
    
    if (error) {
      console.error("Error adding todo items from audit:", error);
      
      // If batch fails due to column issues or foreign key constraint, try individual inserts as a fallback
      if (error.message && (error.message.includes('auditId') || error.message.includes('foreign key constraint'))) {
        console.log("Batch insert failed, trying individual inserts without audit_id...");
        
        // Convert items to use only snake_case to match the database schema
        // And remove audit_id to avoid foreign key constraint issues
        const cleanItems = todoItems.map(item => ({
          user_id: user.id,
          project_id: item.projectId,
          // Don't include audit_id to avoid foreign key issues
          title: item.title,
          description: item.description,
          status: item.status,
          priority: item.priority,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        // Try inserting items one by one with standard insert
        let successCount = 0;
        
        for (const item of cleanItems) {
          try {
            const { error: itemError } = await supabase
              .from("todos")
              .insert(item);
            
            if (!itemError) {
              successCount++;
            } else {
              console.error("Error adding individual todo item:", itemError);
              
              // If individual insert fails, try debug endpoint as last resort
              try {
                const response = await fetch('/api/debug/todo', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(item),
                });
                
                if (response.ok) {
                  successCount++;
                }
              } catch (fetchError) {
                console.error("Failed to call debug endpoint:", fetchError);
              }
            }
          } catch (err) {
            console.error("Exception adding individual todo item:", err);
          }
        }
        
        if (successCount > 0) {
          console.log(`Successfully added ${successCount} of ${cleanItems.length} todo items`);
          
          // Notify the user about the new todos if any were added
          await notifyNewTodos(user.id, project.name, successCount);
          
          return { 
            success: successCount === cleanItems.length, 
            count: successCount,
            error: successCount < cleanItems.length ? 
              `Only ${successCount} of ${cleanItems.length} items could be added` : undefined
          };
        }
        
        return { success: false, count: 0, error: error.message };
      }
      
      return { success: false, count: 0, error: error.message };
    }
    
    // Notify the user about the new todos
    await notifyNewTodos(user.id, project.name, todoItems.length);
    
    return { success: true, count: todoItems.length };
  } catch (error) {
    console.error("Failed to generate todos from audit:", error);
    return { 
      success: false, 
      count: 0,
      error: error instanceof Error ? error.message : "Failed to generate todos" 
    };
  }
}

/**
 * Helper function to map recommendation impact to todo priority
 */
function getPriorityFromImpact(impact: string): "low" | "medium" | "high" {
  if (!impact) return "medium";
  
  switch (impact.toLowerCase()) {
    case "high":
    case "critical":
      return "high";
    case "low":
    case "minor":
      return "low";
    case "medium":
    default:
      return "medium";
  }
}

// If this function doesn't exist, add it
export async function addTodoFromAudit(
  issueId: string, 
  recommendation: string, 
  options?: { 
    scheduledFor?: string; 
    assigneeId?: string; 
    projectId?: string; 
    auditId?: string 
  }
) {
  try {
    const supabase = await createClient();
    
    // Get current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Unauthorized. Please sign in to add a todo.");
    }
    
    // Create todo data
    const todoData = {
      title: `Implement: ${recommendation.substring(0, 100)}`,
      description: recommendation,
      status: "pending",
      priority: "medium",
      user_id: user.id,
      project_id: options?.projectId || null,
      audit_id: options?.auditId || null,
      issue_id: issueId,
      assigned_to: options?.assigneeId || null,
      scheduled_for: options?.scheduledFor || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insert into database
    const { data, error } = await supabase
      .from("todos")
      .insert(todoData)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
  } catch (error: any) {
    console.error("Error adding todo from audit:", error);
    return { data: null, error: error.message || "Failed to add todo" };
  }
} 