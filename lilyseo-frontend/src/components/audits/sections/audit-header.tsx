"use client"

import * as React from "react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Share2, Download, RefreshCw, Loader2, ListPlus } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { PDFPreview } from "@/components/pdf"
import { checkPdfProAccess } from "@/services/pdf-export"
import { Font } from '@react-pdf/renderer'

// Register Poppins font if used in PDF generation context - consider moving this
/*
Font.register({
  family: 'Poppins',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff', fontWeight: 'normal' }, // Regular
    { src: 'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLCz7Z1xlEw.woff', fontWeight: 'bold' }, // Bold
    { src: 'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLEj6Z1xlEw.woff', fontWeight: 'light' }, // Light
  ],
});
*/

/*
Font.register({
  family: 'Montserrat',
  fonts: [
    { src: '/fonts/Montserrat-Regular.ttf' },
    { src: '/fonts/Montserrat-Bold.ttf', fontWeight: 'bold' },
    { src: '/fonts/Montserrat-Light.ttf', fontWeight: 'light' },
  ],
});
*/

interface AuditHeaderProps {
  auditId: string;
  projectId: string;
  projectName: string;
  projectUrl: string;
  status: string;
  createdAt: string;
  onBack?: () => void;
  auditData?: any; // Full audit data if available
  onAddToTodo?: (issueId: string, recommendation: string, options?: { scheduledFor?: string; assigneeId?: string }) => Promise<void>;
}

export function AuditHeader({
  auditId,
  projectId,
  projectName,
  projectUrl,
  status,
  createdAt,
  onBack,
  auditData,
  onAddToTodo
}: AuditHeaderProps) {
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [isAddingBulkTodos, setIsAddingBulkTodos] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkAddSuccess, setBulkAddSuccess] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`audit-todos-added-${auditId}`) === 'true';
    }
    return false;
  });
  const { toast } = useToast();

  const getStatusBadge = () => {
    const statusMap: Record<string, string> = {
      'running': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'failed': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    };
    
    return (
      <Badge 
        variant="outline" 
        className={statusMap[status.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleExportPDF = async () => {
    try {
      setIsLoading(true);
      console.log("Export to PDF");
      
      // Check if user has premium access
      const hasPremiumAccess = await checkPdfProAccess();
      setIsPro(hasPremiumAccess);
      
      // Open the PDF preview dialog
      setIsPdfPreviewOpen(true);
    } catch (error) {
      toast({
        title: "Error Preparing PDF",
        description: "There was an error preparing your PDF. Please try again.",
        variant: "destructive",
      });
      
      console.error("PDF export error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    // Share functionality would go here
    console.log("Share audit");
  };

  const handleRerunAudit = () => {
    // Rerun audit functionality would go here
    console.log("Rerun audit");
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${formatDistanceToNow(date, { addSuffix: true })}`;
    } catch (e) {
      return dateString;
    }
  };

  // Prepare the data for PDF export
  const preparePdfData = () => {
    // Log the audit data for debugging
    console.log('PDF Export - auditData available:', !!auditData);
    if (auditData) {
      console.log('PDF Export - auditData structure:', {
        hasReport: !!auditData.report,
        reportKeys: auditData.report ? Object.keys(auditData.report) : [],
        status: auditData.status,
        createdAt: auditData.createdAt
      });
      
      // Transform the data structure to match what the PDF component expects
      return {
        id: auditData.id,
        project_id: projectId,
        created_at: auditData.createdAt,
        status: auditData.status,
        score: auditData.score || 0,
        url: projectUrl,
        projects: {
          name: projectName,
          url: projectUrl
        },
        report: auditData.report || {
          score: {
            overall: 0,
            categories: {
              onPageSeo: 0,
              performance: 0,
              usability: 0,
              links: 0,
              social: 0
            }
          },
          issues: {},
          pageSpeed: {
            mobile: { performance: 0 },
            desktop: { performance: 0 }
          },
          mozData: {
            domainAuthority: 0,
            pageAuthority: 0,
            linkingDomains: 0,
            totalLinks: 0
          }
        }
      };
    }
    
    // Otherwise build a minimum viable data structure
    console.log('PDF Export - Using fallback data structure');
    return {
      id: auditId,
      project_id: projectId,
      created_at: createdAt,
      status: status,
      projects: {
        name: projectName,
        url: projectUrl
      },
      report: {
        score: {
          overall: 0,
          categories: {
            onPageSeo: 0,
            performance: 0,
            usability: 0,
            links: 0,
            social: 0
          }
        },
        issues: {},
        pageSpeed: {
          mobile: { performance: 0 },
          desktop: { performance: 0 }
        },
        mozData: {
          domainAuthority: 0,
          pageAuthority: 0,
          linkingDomains: 0,
          totalLinks: 0
        }
      }
    };
  };

  // Add function to handle adding all issues to todos
  const handleAddAllToTodos = async () => {
    // Reset success state when starting a new operation
    setBulkAddSuccess(false);
    console.log("[DEBUG-BULK-TODO] Starting bulk todo addition", { 
      hasIssues: !!auditData?.report?.issues,
      hasAddToTodoFn: !!onAddToTodo
    });
    
    if (!auditData?.report?.issues || !onAddToTodo) {
      toast({
        title: "No Issues Available",
        description: "There are no issues available to add to your todo list or the functionality is not enabled.",
        variant: "destructive",
      });
      return;
    }
    
    setIsAddingBulkTodos(true);
    setBulkProgress(0);
    
    try {
      // Collect all issues from different categories
      interface IssueItem {
        id: string;
        recommendation: string;
        issue: any;
      }
      
      const allIssues: IssueItem[] = [];
      Object.entries(auditData.report.issues).forEach(([category, issues]: [string, any]) => {
        if (Array.isArray(issues)) {
          issues.forEach((issue: any, index: number) => {
            // Check for recommendation in various formats
            let recommendation = '';
            
            // Log one sample issue to understand structure
            if (index === 0) {
              console.log(`[DEBUG-BULK-TODO] Sample issue from ${category}:`, issue);
            }
            
            // Check for common recommendation fields
            if (issue.recommendation) {
              recommendation = issue.recommendation;
            } else if (issue.recommendedAction) {
              recommendation = issue.recommendedAction;
            } else if (issue.recommendedActions) {
              recommendation = Array.isArray(issue.recommendedActions) 
                ? issue.recommendedActions.join('. ')
                : issue.recommendedActions;
            } else if (issue.recommended) {
              recommendation = `Change to: ${issue.recommended}`;
            }
            
            // If no recommendation found, build one from other fields
            if (!recommendation) {
              if (issue.title) {
                recommendation = `Fix: ${issue.title}`;
              } else if (issue.description) {
                recommendation = `Fix issue: ${issue.description.substring(0, 100)}${issue.description.length > 100 ? '...' : ''}`;
              } else if (issue.current && issue.recommended) {
                recommendation = `Change from "${issue.current}" to "${issue.recommended}"`;
              } else {
                recommendation = `Fix ${category} issue #${index + 1}`;
              }
            }
            
            allIssues.push({
              id: `${category}-${index}`,
              recommendation,
              issue
            });
          });
        }
      });
      
      console.log("[DEBUG-BULK-TODO] Collected issues", { 
        totalIssues: allIssues.length,
        categories: Object.keys(auditData.report.issues),
        sampleRecommendations: allIssues.slice(0, 3).map(i => i.recommendation)
      });
      
      if (allIssues.length === 0) {
        toast({
          title: "No Issues Found",
          description: "There are no issues to add to your todo list.",
          variant: "destructive",
        });
        return;
      }
      
      if (allIssues.length > 50) {
        const shouldContinue = window.confirm(
          `You are about to add ${allIssues.length} issues to your todo list. This might take some time. Continue?`
        );
        if (!shouldContinue) {
          setIsAddingBulkTodos(false);
          return;
        }
      }
      
      let successCount = 0;
      
      for (let i = 0; i < allIssues.length; i++) {
        const issue = allIssues[i];
        try {
          console.log(`[DEBUG-BULK-TODO] Adding issue ${i+1}/${allIssues.length}:`, { 
            id: issue.id,
            recommendation: issue.recommendation.substring(0, 30) + "..."
          });
          
          await onAddToTodo(issue.id, issue.recommendation);
          successCount++;
          console.log(`[DEBUG-BULK-TODO] Successfully added issue ${i+1}`);
        } catch (error) {
          console.error(`[DEBUG-BULK-TODO] Failed to add issue ${issue.id} to todo:`, error);
        }
        
        // Update progress
        setBulkProgress(Math.round(((i + 1) / allIssues.length) * 100));
      }
      
      console.log("[DEBUG-BULK-TODO] Bulk addition complete", { 
        successCount,
        totalIssues: allIssues.length
      });
      
      // Set success state if we added at least one item
      if (successCount > 0) {
        setBulkAddSuccess(true);
        // Store in localStorage to persist across refreshes
        if (typeof window !== 'undefined') {
          localStorage.setItem(`audit-todos-added-${auditId}`, 'true');
        }
      }
      
      toast({
        title: "Bulk Addition Complete",
        description: `Added ${successCount} of ${allIssues.length} issues to your todo list.`,
        variant: successCount > 0 ? "default" : "destructive",
      });
    } catch (error) {
      console.error("[DEBUG-BULK-TODO] Error in bulk add to todos:", error);
      toast({
        title: "Error",
        description: "Failed to complete bulk addition to todo list.",
        variant: "destructive",
      });
    } finally {
      setIsAddingBulkTodos(false);
      setBulkProgress(0);
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} className="mr-1">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <h1 className="text-3xl font-bold">SEO Audit Report</h1>
            {getStatusBadge()}
          </div>
          <div className="text-muted-foreground">
            <p>
              <span className="font-medium">{projectName}</span> - {projectUrl}
            </p>
            <p className="text-sm">
              {status.toLowerCase() === "completed" ? "Completed" : "Created"} {formatDate(createdAt)}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Add All to Todos button */}
          {onAddToTodo && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddAllToTodos}
              disabled={isAddingBulkTodos || !auditData?.report?.issues}
              className={bulkAddSuccess ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : ""}
            >
              {isAddingBulkTodos ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  {bulkProgress > 0 ? `${bulkProgress}%` : 'Processing...'}
                </>
              ) : bulkAddSuccess ? (
                <>
                  <ListPlus className="h-4 w-4 mr-1" />
                  Added All to Todos
                </>
              ) : (
                <>
                  <ListPlus className="h-4 w-4 mr-1" />
                  Add All to Todos
                </>
              )}
            </Button>
          )}
          
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-1" />
                Export PDF
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
          <Button variant="default" size="sm" onClick={handleRerunAudit}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Rerun Audit
          </Button>
        </div>
      </div>

      {/* PDF Preview Dialog */}
      {isPdfPreviewOpen && (
        <PDFPreview 
          auditData={preparePdfData()}
          isOpen={isPdfPreviewOpen}
          onClose={() => setIsPdfPreviewOpen(false)}
          whiteLabel={null}
          isProUser={isPro}
        />
      )}
    </>
  );
} 