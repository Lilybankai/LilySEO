"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, ExternalLink, AlertTriangle, Info } from "lucide-react";

interface AuditIssuesProps {
  issues: {
    metaDescription: Array<any>;
    titleTags: Array<any>;
    headings: Array<any>;
    images: Array<any>;
    links: Array<any>;
    canonicalLinks: Array<any>;
    schemaMarkup: Array<any>;
    performance: Array<any>;
    mobile: Array<any>;
    security: Array<any>;
  };
  onAddToTodo: (issueId: string, recommendation: string) => Promise<void>;
  projectUrl: string;
}

type IssueSeverity = "critical" | "high" | "medium" | "low" | "info";

interface Issue {
  id: string;
  title: string;
  description: string;
  recommendation: string;
  severity: IssueSeverity;
  url: string;
  location?: string;
  code?: string;
}

export function AuditIssues({ issues, onAddToTodo, projectUrl }: AuditIssuesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get severity badge variant
  const getSeverityBadgeVariant = (severity: IssueSeverity) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "default";
      case "info":
        return "outline";
      default:
        return "outline";
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity: IssueSeverity) => {
    switch (severity) {
      case "critical":
      case "high":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  // Filter and sort issues
  const getFilteredIssues = () => {
    let filteredIssues: Issue[] = [];

    // Combine all issues if "all" category is selected
    if (selectedCategory === "all") {
      Object.entries(issues).forEach(([category, categoryIssues]) => {
        filteredIssues = [...filteredIssues, ...categoryIssues];
      });
    } else {
      filteredIssues = issues[selectedCategory as keyof typeof issues] || [];
    }

    // Filter by severity
    if (selectedSeverity !== "all") {
      filteredIssues = filteredIssues.filter(
        issue => issue.severity === selectedSeverity
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredIssues = filteredIssues.filter(
        issue =>
          issue.title.toLowerCase().includes(query) ||
          issue.description.toLowerCase().includes(query) ||
          issue.url.toLowerCase().includes(query)
      );
    }

    // Sort by severity
    return filteredIssues.sort((a, b) => {
      const severityOrder = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
        info: 4,
      };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  };

  const filteredIssues = getFilteredIssues();
  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
  const currentIssues = filteredIssues.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO Issues</CardTitle>
        <CardDescription>
          Found {filteredIssues.length} issues that need attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(issues).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {key.replace(/([A-Z])/g, ' $1').trim()} ({value.length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedSeverity}
              onValueChange={setSelectedSeverity}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-[300px]"
            />
          </div>

          {/* Issues List */}
          <ScrollArea className="h-[600px] rounded-md border p-4">
            <div className="space-y-4">
              {currentIssues.map((issue) => (
                <Card key={issue.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{issue.title}</CardTitle>
                        <CardDescription>{issue.description}</CardDescription>
                      </div>
                      <Badge
                        variant={getSeverityBadgeVariant(issue.severity)}
                        className="ml-2"
                      >
                        {getSeverityIcon(issue.severity)}
                        <span className="ml-1">{issue.severity}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* URL */}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        <a
                          href={issue.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {issue.url.replace(projectUrl, '')}
                        </a>
                      </div>

                      {/* Location (if available) */}
                      {issue.location && (
                        <div className="text-sm bg-muted p-2 rounded">
                          <strong>Location:</strong> {issue.location}
                        </div>
                      )}

                      {/* Code (if available) */}
                      {issue.code && (
                        <pre className="text-sm bg-muted p-2 rounded overflow-x-auto">
                          <code>{issue.code}</code>
                        </pre>
                      )}

                      {/* Recommendation */}
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h4 className="text-sm font-medium">Recommendation</h4>
                            <p className="text-sm text-muted-foreground">
                              {issue.recommendation}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAddToTodo(issue.id, issue.recommendation)}
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add to Todo
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {currentIssues.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No issues found matching your filters
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 