"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { addTodoItem } from "@/lib/client-todo-service"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { AuditReport } from "@/components/audits/audit-report"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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
    </Button>
  )
}

export default function AuditDetailPage({ params }: { params: { id: string, auditId: string } }) {
  const [isGeneratingTodos, setIsGeneratingTodos] = useState(false);
  const [auditData, setAuditData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch audit data
  useEffect(() => {
    const fetchAuditData = async () => {
      try {
        setIsLoading(true);
        const supabase = createClient();
        
        // First, try to get the audit data from the audits table
        const { data: auditRecord, error: auditError } = await supabase
          .from("audits")
          .select("*, projects:project_id(name)")
          .eq("id", params.auditId)
          .single();
        
        if (auditError) {
          throw auditError;
        }
        
        // If the audit result is missing but status is completed, try to get it from audit_reports
        if (auditRecord.status === "completed" && !auditRecord.result) {
          console.log("Audit result is missing, trying to fetch from audit_reports");
          
          const { data: reportData, error: reportError } = await supabase
            .from("audit_reports")
            .select("report_data")
            .eq("project_id", params.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
            
          if (!reportError && reportData) {
            // Update the audit record with the report data
            setAuditData({
              ...auditRecord,
              result: reportData.report_data
            });
          } else {
            setAuditData(auditRecord);
          }
        } else {
          setAuditData(auditRecord);
        }
      } catch (error) {
        console.error("Error fetching audit data:", error);
        toast.error("Failed to load audit data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAuditData();
  }, [params.auditId, params.id]);
  
  // Function to generate todos from the audit
  const generateTodosFromAudit = async () => {
    try {
      setIsGeneratingTodos(true);
      
      const response = await fetch("/api/todos/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auditId: params.auditId,
          projectId: params.id,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate todos");
      }
      
      toast.success(`Generated ${data.count} SEO tasks from this audit.`);
    } catch (error) {
      console.error("Error generating todos:", error);
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsGeneratingTodos(false);
    }
  };

  // Render content based on loading state and data availability
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-8">Loading audit data...</div>
      </div>
    );
  }

  if (!auditData) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-8">No audit data found</div>
      </div>
    );
  }

  // If we have detailed report data
  if (auditData.result) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Audit Results</h1>
          
          <Button
            onClick={generateTodosFromAudit}
            disabled={isGeneratingTodos}
            className="ml-auto"
          >
            {isGeneratingTodos ? "Generating..." : "Generate Tasks"}
          </Button>
        </div>
        
        <AuditReport 
          auditId={auditData.id}
          projectId={params.id}
          projectName={auditData.projects?.name || "Unknown Project"}
          report={auditData.result}
        />
      </div>
    );
  }

  // If still processing
  if (auditData.status === "processing") {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold mb-6">Audit Results</h1>
          <Card>
            <CardHeader>
              <CardTitle>Your audit is still processing</CardTitle>
              <CardDescription>
                This can take a few minutes depending on the size of your website. Please check back soon.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-2 w-full bg-muted rounded overflow-hidden">
                <div className="h-full bg-primary animate-pulse" style={{ width: "50%" }}></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If completed but no result data
  if (auditData.status === "completed" && !auditData.result) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold mb-6">Audit Results</h1>
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Report Data Missing</CardTitle>
              <CardDescription>
                Your audit is marked as completed but the detailed report is missing. 
                This might be due to a processing error.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-left">
                {JSON.stringify(auditData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Fallback for any other state
  return (
    <div className="container mx-auto py-8">
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold mb-6">Audit Results</h1>
        <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-screen">
          {JSON.stringify(auditData, null, 2)}
        </pre>
      </div>
    </div>
  );
} 