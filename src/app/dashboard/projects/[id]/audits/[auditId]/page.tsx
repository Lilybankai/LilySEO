"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

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
        
        const { data, error } = await supabase
          .from("audits")
          .select("*")
          .eq("id", params.auditId)
          .single();
        
        if (error) {
          throw error;
        }
        
        setAuditData(data);
      } catch (error) {
        console.error("Error fetching audit data:", error);
        toast.error("Failed to load audit data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAuditData();
  }, [params.auditId]);
  
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

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Audit Results</h1>
        
        <Button
          onClick={generateTodosFromAudit}
          disabled={isGeneratingTodos || !auditData?.summary || isLoading}
          className="ml-auto"
        >
          {isGeneratingTodos ? "Generating..." : "Generate Tasks"}
        </Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">Loading audit data...</div>
      ) : auditData ? (
        <div>
          {/* Display audit data here */}
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-screen">
            {JSON.stringify(auditData, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="text-center py-8">No audit data found</div>
      )}
    </div>
  );
} 