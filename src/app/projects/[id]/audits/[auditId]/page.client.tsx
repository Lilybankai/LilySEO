"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { TodoButton } from "@/components/ui/todo-button"
import { ArrowRight, AlertCircle, CheckCircle, Loader2, Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { addTodoItem } from "@/lib/client-todo-service"

// Export the component using the shared TodoButton
// This maintains compatibility with existing code that imports it
export { TodoButton } 

// Export a helper function to add todos from audit issues
export const addTodo = async (issueId: string, recommendation: string, options?: { scheduledFor?: string; assigneeId?: string }): Promise<void> => {
  try {
    const todoTitle = recommendation
      ? `Implement: ${recommendation.substring(0, 100)}`
      : "Address this issue"

    const todoDescription = recommendation
      ? recommendation
      : "Implement the recommended changes to address this issue."
      
    // Extract projectId and auditId from the URL
    const pathname = window.location.pathname;
    const segments = pathname.split('/').filter(Boolean);
    
    // Safe extraction with fallbacks and logging
    let projectId = '';
    let auditId = '';
    
    if (segments.length >= 4 && segments[0] === 'projects' && segments[2] === 'audits') {
      projectId = segments[1];
      auditId = segments[3];
    }
    
    console.log("[DEBUG-BULK-TODO] Adding todo for issue:", {
      issueId,
      recommendation: recommendation.substring(0, 50) + "...",
      projectId,
      auditId
    });
    
    if (!projectId || !auditId) {
      console.error("[DEBUG-BULK-TODO] Failed to extract projectId or auditId from URL:", pathname);
      throw new Error("Missing project ID or audit ID");
    }
    
    const todoItem = {
      title: todoTitle,
      description: todoDescription,
      status: "pending" as "pending" | "in_progress" | "completed",
      priority: "medium" as "medium" | "low" | "high",
      projectId,
      auditId,
      scheduledFor: options?.scheduledFor,
      assignedTo: options?.assigneeId
    };

    console.log("[DEBUG-BULK-TODO] Sending todo item to API:", {
      ...todoItem,
      description: todoItem.description.substring(0, 50) + "..."
    });

    const response = await addTodoItem(todoItem);
    
    console.log("[DEBUG-BULK-TODO] API response:", response);
    
    if (response.error) {
      console.error("[DEBUG-BULK-TODO] Error response:", response.error);
      throw new Error(response.error);
    }
    
    // Return immediately to match expected Promise<void> return type
    return;
  } catch (error) {
    console.error("[DEBUG-BULK-TODO] Exception in addTodo:", error);
    throw error;
  }
}; 