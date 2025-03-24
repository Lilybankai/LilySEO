"use client"

import * as React from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, InfoIcon, ExternalLink, ArrowRight } from "lucide-react"

interface SeoIssue {
  url: string;
  title: string;
  description?: string;
  priority?: string;
  current?: string;
  recommended?: string;
  implementation?: string;
  affectedImages?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  }[];
}

interface IssuesTableProps {
  title: string;
  description: string;
  issues: SeoIssue[];
  category: string;
  onAddToTodo?: (issueId: string, recommendation: string) => void;
}

export function IssuesTable({ 
  title, 
  description, 
  issues, 
  category,
  onAddToTodo 
}: IssuesTableProps) {
  const [expandedIssues, setExpandedIssues] = React.useState<Record<number, boolean>>({});

  const toggleExpand = (index: number) => {
    setExpandedIssues(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleAddToTodo = (issue: SeoIssue, index: number) => {
    if (onAddToTodo) {
      onAddToTodo(`${category}-${index}`, 
        `Fix: ${issue.title}${issue.recommended ? ` - ${issue.recommended}` : ''}`);
    }
  };

  const getPriorityColor = (priority?: string) => {
    if (!priority) return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    
    const map: Record<string, string> = {
      "critical": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      "high": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      "medium": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      "low": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    };
    
    return map[priority.toLowerCase()] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  };

  const getPriorityIcon = (priority?: string) => {
    if (!priority) return <InfoIcon className="h-4 w-4" />;
    
    if (priority.toLowerCase() === "critical" || priority.toLowerCase() === "high") {
      return <AlertTriangle className="h-4 w-4" />;
    }
    
    if (priority.toLowerCase() === "low") {
      return <CheckCircle className="h-4 w-4" />;
    }
    
    return <InfoIcon className="h-4 w-4" />;
  };

  if (!issues || issues.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No issues found in this category.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead className="w-[120px]">Priority</TableHead>
                <TableHead className="w-[140px]">URL</TableHead>
                {onAddToTodo && <TableHead className="w-[100px]">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue, index) => (
                <React.Fragment key={index}>
                  <TableRow className="cursor-pointer" onClick={() => toggleExpand(index)}>
                    <TableCell>
                      <div className="font-medium">{issue.title}</div>
                      {!expandedIssues[index] && issue.description && (
                        <div className="text-xs text-muted-foreground mt-1 truncate max-w-lg">
                          {issue.description.substring(0, 100)}
                          {issue.description.length > 100 ? "..." : ""}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`flex items-center gap-1 ${getPriorityColor(issue.priority)}`}
                      >
                        {getPriorityIcon(issue.priority)}
                        <span>{issue.priority || "Medium"}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <a 
                        href={issue.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {new URL(issue.url).pathname || "/"}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    {onAddToTodo && (
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToTodo(issue, index);
                          }}
                        >
                          Add to Todo
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                  {expandedIssues[index] && (
                    <TableRow>
                      <TableCell colSpan={onAddToTodo ? 4 : 3} className="bg-muted/50">
                        <div className="p-4 space-y-4">
                          {/* Description section */}
                          {issue.description && (
                            <div>
                              <h4 className="text-sm font-medium mb-1">Description:</h4>
                              <p className="text-sm text-muted-foreground">{issue.description}</p>
                            </div>
                          )}
                          
                          {/* Current vs Recommended section */}
                          {(issue.current || issue.recommended) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                              {issue.current && (
                                <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-md border border-red-100 dark:border-red-800">
                                  <h4 className="text-sm font-medium mb-1 text-red-800 dark:text-red-300">Current:</h4>
                                  <p className="text-sm text-red-700 dark:text-red-400">{issue.current}</p>
                                </div>
                              )}
                              {issue.recommended && (
                                <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-md border border-green-100 dark:border-green-800">
                                  <h4 className="text-sm font-medium mb-1 text-green-800 dark:text-green-300">Recommended:</h4>
                                  <p className="text-sm text-green-700 dark:text-green-400">{issue.recommended}</p>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Implementation guide */}
                          {issue.implementation && (
                            <div>
                              <h4 className="text-sm font-medium mb-1">Implementation:</h4>
                              <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                                {issue.implementation}
                              </div>
                            </div>
                          )}
                          
                          {/* Image thumbnails for image issues */}
                          {category === "images" && issue.affectedImages && issue.affectedImages.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium mb-1">Affected Images:</h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                {issue.affectedImages.slice(0, 5).map((img, imgIndex) => (
                                  <div key={imgIndex} className="border rounded-md overflow-hidden">
                                    <img 
                                      src={img.src} 
                                      alt="Affected image without alt text" 
                                      className="w-full h-16 object-cover"
                                    />
                                    <div className="text-xs p-1 truncate bg-muted">
                                      Missing alt text
                                    </div>
                                  </div>
                                ))}
                                {issue.affectedImages.length > 5 && (
                                  <div className="flex items-center justify-center border rounded-md p-2">
                                    <span className="text-xs text-muted-foreground">
                                      +{issue.affectedImages.length - 5} more
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Add to todo button in detailed view */}
                          {onAddToTodo && (
                            <div className="pt-2">
                              <Button
                                size="sm"
                                className="mt-2"
                                onClick={() => handleAddToTodo(issue, index)}
                              >
                                Add to Todo
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 