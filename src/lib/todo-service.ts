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
    
    // Add user ID to the todo item
    const todoItemWithUser = {
      ...todoItem,
      user_id: user.id,
      project_id: todoItem.projectId,
      audit_id: todoItem.auditId,
      due_date: todoItem.dueDate ? new Date(todoItem.dueDate).toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insert into the todos table
    const { error } = await supabase
      .from("todos")
      .insert(todoItemWithUser);
    
    if (error) {
      console.error("Error adding todo item:", error);
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
    
    // Format the items for the database
    const formattedItems = todoItems.map(item => ({
      user_id: user.id,
      project_id: item.projectId,
      audit_id: item.auditId,
      title: item.title,
      description: item.description,
      status: item.status,
      priority: item.priority,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    // Insert the todo items in a batch
    const { error } = await supabase
      .from("todos")
      .insert(formattedItems);
    
    if (error) {
      console.error("Error adding todo items from audit:", error);
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