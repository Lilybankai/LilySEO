"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { addTodoItem } from "@/lib/client-todo-service"
import { ArrowRight } from "lucide-react"

interface TodoButtonProps {
  issueId: string
  recommendation: string
  projectId: string
  auditId: string
}

export function TodoButton({ issueId, recommendation, projectId, auditId }: TodoButtonProps) {
  const [isAdding, setIsAdding] = useState(false)

  const handleClick = async () => {
    setIsAdding(true)
    try {
      await addTodoItem({
        projectId,
        auditId,
        title: `Fix: ${issueId}`,
        description: recommendation,
        priority: "medium",
        status: "pending"
      })
    } catch (error) {
      console.error("Failed to add todo item:", error)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isAdding}
    >
      {isAdding ? "Adding..." : "Add to Todo"}
      {!isAdding && <ArrowRight className="ml-2 h-4 w-4" />}
    </Button>
  )
} 