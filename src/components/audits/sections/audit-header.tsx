"use client"

import * as React from "react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Share2, Download, RefreshCw, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { PDFPreview } from "@/components/pdf"
import { checkPdfProAccess } from "@/services/pdf-export"
import { Font } from '@react-pdf/renderer'

// Register fonts - this is required for PDF generation
Font.register({
  family: 'Poppins',
  fonts: [
    { src: '/fonts/Poppins-Regular.ttf' },
    { src: '/fonts/Poppins-Bold.ttf', fontWeight: 'bold' },
    { src: '/fonts/Poppins-Light.ttf', fontWeight: 'light' },
  ],
});

Font.register({
  family: 'Montserrat',
  fonts: [
    { src: '/fonts/Montserrat-Regular.ttf' },
    { src: '/fonts/Montserrat-Bold.ttf', fontWeight: 'bold' },
    { src: '/fonts/Montserrat-Light.ttf', fontWeight: 'light' },
  ],
});

interface AuditHeaderProps {
  auditId: string;
  projectId: string;
  projectName: string;
  projectUrl: string;
  status: string;
  createdAt: string;
  onBack?: () => void;
  auditData?: any; // Full audit data if available
}

export function AuditHeader({
  auditId,
  projectId,
  projectName,
  projectUrl,
  status,
  createdAt,
  onBack,
  auditData
}: AuditHeaderProps) {
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPro, setIsPro] = useState(false);
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
      
      // Check if user has pro access
      const hasProAccess = await checkPdfProAccess();
      setIsPro(hasProAccess);
      
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
    // If we have full audit data, use it
    if (auditData) {
      return auditData;
    }
    
    // Otherwise build a minimum viable data structure
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