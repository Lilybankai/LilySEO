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
      
    // Assuming projectId and auditId come from the component's context or options
    const projectId = window.location.pathname.split('/')[2]; // Extract from URL
    const auditId = window.location.pathname.split('/')[4]; // Extract from URL
    
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

    const response = await addTodoItem(todoItem);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    // Don't return the response as it doesn't match the expected void return type
    return;
  } catch (error) {
    console.error("Error adding todo:", error);
    throw error;
  }
}; 