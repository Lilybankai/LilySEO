"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { PlusCircle, CheckCircle, Timer, RefreshCw } from "lucide-react"
import { addTodoItem, TodoItem } from "@/lib/client-todo-service"
import { useRouter } from "next/navigation"

export interface TodoButtonProps {
  issueId?: string
  recommendation?: string
  projectId: string
  auditId?: string
  onComplete?: () => void
  className?: string
}

export function TodoButton({
  issueId,
  recommendation,
  projectId,
  auditId,
  onComplete,
  className,
}: TodoButtonProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const router = useRouter()

  const handleClick = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const todoTitle = recommendation
        ? `Implement: ${recommendation.substring(0, 100)}`
        : "Address this issue"

      const todoDescription = recommendation
        ? recommendation
        : "Implement the recommended changes to address this issue."

      console.log("[DEBUG-TODO] Adding todo - full details:", {
        title: todoTitle,
        description: todoDescription,
        projectId,
        issueId,
        auditId,
      })

      // Check if both projectId and auditId are valid UUIDs
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isValidProjectId = uuidPattern.test(projectId);
      const isValidAuditId = auditId ? uuidPattern.test(auditId) : true;
      
      console.log("[DEBUG-TODO] UUID validation:", {
        isValidProjectId,
        isValidAuditId,
        projectId,
        auditId
      });

      const todoItem: TodoItem = {
        title: todoTitle,
        description: todoDescription,
        status: "pending",
        priority: "medium",
        projectId,
      }
      
      if (auditId) todoItem.auditId = auditId

      console.log("[DEBUG-TODO] Final todoItem being sent:", todoItem);
      
      const response = await addTodoItem(todoItem)
      
      console.log("[DEBUG-TODO] Response from addTodoItem:", response);

      if (response.error) {
        console.error("[DEBUG-TODO] TodoButton error:", response.error)
        setError(response.error)
        
        if (response.error.includes("authentication") || response.error.includes("Unauthorized")) {
          toast.error("Session expired. Please refresh the page to continue.", {
            action: {
              label: "Refresh",
              onClick: () => window.location.reload(),
            },
          })
        } else {
          toast.error(`Failed to add todo: ${response.error}`)
        }
      } else {
        console.log("Todo added successfully:", response)
        setSuccess(true)
        toast.success("Todo added to your action plan")
        if (onComplete) onComplete()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      console.error("TodoButton caught error:", errorMessage)
      setError(errorMessage)
      
      toast.error(`Error adding todo: ${errorMessage}`, {
        action: {
          label: "Retry",
          onClick: () => {
            setRetryCount(prev => prev + 1)
            handleClick()
          },
        },
      })
    } finally {
      // Always set loading to false when the operation completes
      setLoading(false)
    }
  }

  if (error && retryCount >= 2) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className={`text-red-500 border-red-300 ${className}`}
        onClick={() => {
          // Redirect to test page for direct debugging
          router.push(`/projects/${projectId}/audits/${auditId}/test-todo-button`)
        }}
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        <span>Debug Todo</span>
      </Button>
    )
  }

  // Show success state for already added todos
  if (success) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className={`text-green-600 border-green-300 ${className}`}
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        <span>Added to Plan</span>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <>
          <Timer className="h-4 w-4 mr-2 animate-spin" />
          <span>Adding...</span>
        </>
      ) : (
        <>
          <PlusCircle className="h-4 w-4 mr-2" />
          <span>Add to Action Plan</span>
        </>
      )}
    </Button>
  )
} 