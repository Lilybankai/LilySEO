"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Share2, Download, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface AuditHeaderProps {
  auditId: string;
  projectId: string;
  projectName: string;
  projectUrl: string;
  status: string;
  createdAt: string;
  onBack?: () => void;
}

export function AuditHeader({
  auditId,
  projectId,
  projectName,
  projectUrl,
  status,
  createdAt,
  onBack
}: AuditHeaderProps) {
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

  const handleExportPDF = () => {
    // PDF export functionality would go here
    console.log("Export to PDF");
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

  return (
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
        <Button variant="outline" size="sm" onClick={handleExportPDF}>
          <Download className="h-4 w-4 mr-1" />
          Export PDF
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
  );
} 