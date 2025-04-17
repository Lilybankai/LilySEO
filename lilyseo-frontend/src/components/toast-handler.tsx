"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

export function ToastHandler() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  useEffect(() => {
    // Check for error or success messages in URL parameters
    const error = searchParams.get("error");
    const success = searchParams.get("success");
    
    if (error === "audit_limit_reached") {
      toast({
        title: "Audit Limit Reached",
        description: "You've reached your monthly audit limit. Upgrade your plan for more audits.",
        variant: "destructive",
      });
    } else if (error === "create_audit_failed") {
      toast({
        title: "Failed to Create Audit",
        description: "There was an error creating the audit. Please try again.",
        variant: "destructive",
      });
    } else if (error === "unexpected_error") {
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } else if (success === "audit_started") {
      toast({
        title: "Audit Started",
        description: "Your audit has been started successfully.",
      });
    }
  }, [searchParams, toast]);
  
  // This component doesn't render anything
  return null;
} 