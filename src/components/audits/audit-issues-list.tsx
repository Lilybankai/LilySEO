"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LegacySeoReport, SeoIssue } from "@/services/seo-analysis";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface AuditIssuesListProps {
  report: LegacySeoReport;
}

export function AuditIssuesList({ report }: AuditIssuesListProps) {
  const [selectedIssueType, setSelectedIssueType] = useState<string>("all");
  
  // Count total issues
  const totalIssues = 
    report.issues.metaDescription.length +
    report.issues.titleTags.length +
    report.issues.headings.length +
    report.issues.images.length +
    report.issues.links.length +
    report.issues.canonicalLinks.length +
    report.issues.schemaMarkup.length +
    report.issues.performance.length +
    report.issues.mobile.length +
    report.issues.security.length;
  
  // Filter issues based on selected type
  const getFilteredIssues = () => {
    if (selectedIssueType === "all") {
      return [
        ...report.issues.metaDescription,
        ...report.issues.titleTags,
        ...report.issues.headings,
        ...report.issues.images,
        ...report.issues.links,
        ...report.issues.canonicalLinks,
        ...report.issues.schemaMarkup,
        ...report.issues.performance,
        ...report.issues.mobile,
        ...report.issues.security,
      ];
    }
    
    switch (selectedIssueType) {
      case "metaDescription":
        return report.issues.metaDescription;
      case "titleTags":
        return report.issues.titleTags;
      case "headings":
        return report.issues.headings;
      case "images":
        return report.issues.images;
      case "links":
        return report.issues.links;
      case "canonicalLinks":
        return report.issues.canonicalLinks;
      case "schemaMarkup":
        return report.issues.schemaMarkup;
      case "performance":
        return report.issues.performance;
      case "mobile":
        return report.issues.mobile;
      case "security":
        return report.issues.security;
      default:
        return [];
    }
  };
  
  const filteredIssues = getFilteredIssues();
  
  // Get severity badge color
  const getSeverityColor = (severity: SeoIssue["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      case "info":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO Issues</CardTitle>
        <CardDescription>
          {totalIssues} issues found during the audit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" onValueChange={setSelectedIssueType}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="all">All ({totalIssues})</TabsTrigger>
            <TabsTrigger value="metaDescription">
              Meta Description ({report.issues.metaDescription.length})
            </TabsTrigger>
            <TabsTrigger value="titleTags">
              Title Tags ({report.issues.titleTags.length})
            </TabsTrigger>
            <TabsTrigger value="headings">
              Headings ({report.issues.headings.length})
            </TabsTrigger>
            <TabsTrigger value="images">
              Images ({report.issues.images.length})
            </TabsTrigger>
          </TabsList>
          
          <div className="space-y-4">
            {filteredIssues.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No issues found in this category</p>
              </div>
            ) : (
              filteredIssues.map((issue) => (
                <div key={issue.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{issue.title}</h3>
                    <Badge className={getSeverityColor(issue.severity)}>
                      {issue.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
                  <div className="flex items-center text-sm text-blue-500 mb-2">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    <a href={issue.url} target="_blank" rel="noopener noreferrer">
                      {issue.url}
                    </a>
                  </div>
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <h4 className="text-sm font-medium mb-1">Recommendation:</h4>
                    <p className="text-sm">{issue.recommendation}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
} 