"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";

type AuditStatusBadgeProps = 
  | {
      projectId: string;
      auditId: string;
      initialStatus?: string;
      showTooltip?: boolean;
      status?: never;
    }
  | {
      status: string;
      showTooltip?: boolean;
      projectId?: never;
      auditId?: never;
      initialStatus?: never;
    };

export function AuditStatusBadge(props: AuditStatusBadgeProps) {
  if ('status' in props && props.status) {
    // Simple static variant that just displays the status
    const { status, showTooltip = true } = props;
    const statusConfig = getStatusConfig(status);
    const { variant, icon: Icon, label, tooltip, className } = statusConfig;
    
    const badgeContent = (
      <Badge variant={variant} className={`gap-1 ${className || ""}`}>
        <Icon className="h-3 w-3" />
        <span>{label}</span>
      </Badge>
    );
    
    if (showTooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
            <TooltipContent>
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return badgeContent;
  }
  
  // Dynamic variant that polls for status updates
  const { projectId, auditId, initialStatus = "pending", showTooltip = true } = props;
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const checkStatus = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/audits/${auditId}/status`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch audit status");
        }
        
        const data = await response.json();
        
        if (isMounted) {
          setStatus(data.status);
          
          // If the audit is still processing, continue polling
          if (data.status === "processing" || data.status === "pending") {
            // Continue polling
          } else {
            // Stop polling if the audit is complete or failed
            clearInterval(intervalId);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "An error occurred");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Check immediately
    checkStatus();
    
    // Then poll every 10 seconds if the status is pending or processing
    if (initialStatus === "pending" || initialStatus === "processing") {
      intervalId = setInterval(checkStatus, 10000);
    }

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [auditId, initialStatus, projectId]);

  const statusConfig = getStatusConfig(status);
  const { variant, icon: Icon, label, tooltip, className } = statusConfig;

  const badgeContent = (
    <Badge variant={variant} className={`gap-1 ${className || ""}`}>
      <Icon className="h-3 w-3" />
      <span>{label}</span>
    </Badge>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
            {error && <p className="text-destructive text-xs mt-1">{error}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badgeContent;
}

// Helper function to get status configuration
function getStatusConfig(status: string) {
  switch (status) {
    case "completed":
      return {
        variant: "default" as const,
        icon: CheckCircle2,
        label: "Completed",
        tooltip: "Audit completed successfully",
        className: "bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900",
      };
    case "processing":
      return {
        variant: "default" as const,
        icon: Loader2,
        label: "Processing",
        tooltip: "Audit is currently running",
        className: "animate-spin",
      };
    case "pending":
      return {
        variant: "secondary" as const,
        icon: Clock,
        label: "Pending",
        tooltip: "Audit is queued and waiting to start",
      };
    case "failed":
      return {
        variant: "destructive" as const,
        icon: AlertCircle,
        label: "Failed",
        tooltip: "Audit failed to complete",
      };
    default:
      return {
        variant: "outline" as const,
        icon: Clock,
        label: status || "Unknown",
        tooltip: "Unknown audit status",
      };
  }
} 