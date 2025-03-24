"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface AuditStatusDisplayProps {
  auditId: string
  projectId: string
  onComplete?: () => void
}

export function AuditStatusDisplay({ auditId, projectId, onComplete }: AuditStatusDisplayProps) {
  const [status, setStatus] = useState<string>("pending")
  const [progress, setProgress] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    let isMounted = true
    let intervalId: NodeJS.Timeout
    let progressSteps = 0

    const fetchStatus = async () => {
      if (!isMounted) return
      
      try {
        setIsLoading(true)
        const response = await fetch(`/api/audits/${auditId}/status`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch audit status")
        }
        
        const data = await response.json()
        
        if (isMounted) {
          setStatus(data.status)
          
          // Calculate progress based on status
          if (data.status === "completed") {
            setProgress(100)
            if (onComplete) onComplete()
            clearInterval(intervalId)
          } else if (data.status === "processing") {
            // If we have progress information from API, use it
            if (data.progress) {
              setProgress(data.progress)
            } else {
              // Otherwise use a stepped approach that increases faster at the beginning
              // and slower near the end to create a more realistic progress simulation
              progressSteps++
              
              // Sigmoid-like progress curve - faster at start, slower near end
              const maxSteps = 20 // Expected number of progress checks before completion
              const maxProgress = 90 // Max progress before completion
              const newProgress = Math.min(
                (1 / (1 + Math.exp(-0.5 * (progressSteps - maxSteps / 2)))) * maxProgress,
                maxProgress
              )
              
              setProgress(Math.ceil(newProgress))
            }
          } else if (data.status === "pending") {
            setProgress(5 + (progressSteps * 2)) // Slowly increase even in pending
            progressSteps++
          } else if (data.status === "failed") {
            clearInterval(intervalId)
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "An error occurred")
          toast({
            title: "Error",
            description: err instanceof Error ? err.message : "Failed to fetch audit status",
            variant: "destructive",
          })
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    // Check immediately
    fetchStatus()
    
    // Then poll every 3 seconds if the status is pending or processing
    intervalId = setInterval(fetchStatus, 3000)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [auditId, projectId, onComplete]) // Remove progress dependency to avoid restarting the timer

  const getStatusDisplay = () => {
    switch (status) {
      case "completed":
        return {
          title: "Audit Completed",
          description: "Your audit has been completed successfully",
          icon: CheckCircle2,
          iconClass: "text-green-500",
          badgeVariant: "default" as const,
          badgeClass: "bg-green-100 text-green-800",
          badgeLabel: "Completed"
        }
      case "processing":
        return {
          title: "Audit in Progress",
          description: "Your audit is currently running",
          icon: Loader2,
          iconClass: "text-blue-500 animate-spin",
          badgeVariant: "default" as const,
          badgeClass: "bg-blue-100 text-blue-800",
          badgeLabel: "Processing"
        }
      case "pending":
        return {
          title: "Audit Pending",
          description: "Your audit is queued and waiting to start",
          icon: Clock,
          iconClass: "text-yellow-500",
          badgeVariant: "secondary" as const,
          badgeClass: "",
          badgeLabel: "Pending"
        }
      case "failed":
        return {
          title: "Audit Failed",
          description: "There was an error processing your audit",
          icon: AlertCircle,
          iconClass: "text-red-500",
          badgeVariant: "destructive" as const,
          badgeClass: "",
          badgeLabel: "Failed"
        }
      default:
        return {
          title: "Unknown Status",
          description: "The status of your audit is unknown",
          icon: Clock,
          iconClass: "text-gray-500",
          badgeVariant: "outline" as const,
          badgeClass: "",
          badgeLabel: status || "Unknown"
        }
    }
  }

  const statusDisplay = getStatusDisplay()
  const { icon: Icon } = statusDisplay

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${statusDisplay.iconClass}`} />
            <CardTitle>{statusDisplay.title}</CardTitle>
          </div>
          <Badge variant={statusDisplay.badgeVariant} className={statusDisplay.badgeClass}>
            {statusDisplay.badgeLabel}
          </Badge>
        </div>
        <CardDescription>{statusDisplay.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {status === "processing" && `Progress: ${progress}%`}
            {status === "pending" && "Waiting to start..."}
            {status === "completed" && "Audit completed successfully!"}
            {status === "failed" && "Audit failed. Please try again."}
          </div>
          
          {status === "failed" && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => {
                toast({
                  title: "Retrying audit",
                  description: "Initiating a new audit request",
                })
                // Here you would implement the retry logic
              }}
            >
              Retry Audit
            </Button>
          )}
          
          {error && (
            <div className="text-xs text-destructive mt-2">
              Error: {error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 