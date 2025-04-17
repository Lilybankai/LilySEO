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
import { AlertTriangle, CheckCircle, InfoIcon, ExternalLink, ArrowRight, ChevronDown, ChevronRight, Image } from "lucide-react"
import { cn } from "@/lib/utils"
import { TodoButton } from "@/components/ui/todo-button"

interface SeoIssue {
  id?: string;
  title: string;
  description?: string;
  priority?: string;
  url?: string;
  current?: string;
  recommended?: string;
  implementation?: string;
  images?: any[];
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
  projectId?: string;
  auditId?: string;
}

export function IssuesTable({ 
  title, 
  description, 
  issues, 
  category,
  onAddToTodo,
  projectId,
  auditId
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

  const hasProjectId = !!projectId;

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
                {(onAddToTodo || hasProjectId) && <TableHead className="w-[100px]">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue, index) => (
                <React.Fragment key={index}>
                  <TableRow 
                    key={`${issue.id || index}`}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-muted/50",
                      expandedIssues[index] && "bg-muted/50"
                    )}
                    onClick={() => toggleExpand(index)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {expandedIssues[index] ? (
                            <ChevronDown className="h-4 w-4 transition-transform" />
                          ) : (
                            <ChevronRight className="h-4 w-4 transition-transform" />
                          )}
                          <span>{issue.title}</span>
                          
                          {/* Image preview indicator */}
                          {category === "images" && issue.affectedImages && issue.affectedImages.length > 0 && (
                            <Badge variant="outline" className="ml-2 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                              <Image className="h-3 w-3 mr-1" /> 
                              {issue.affectedImages.length} {issue.affectedImages.length === 1 ? 'image' : 'images'}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Small thumbnail preview in row for image issues */}
                        {category === "images" && issue.affectedImages && issue.affectedImages.length > 0 && (
                          <div className="flex mt-2 space-x-1 overflow-x-auto pb-1" onClick={(e) => e.stopPropagation()}>
                            {issue.affectedImages.slice(0, 3).map((img, idx) => (
                              <a 
                                key={idx}
                                href={img.src} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex-shrink-0 rounded-sm border border-muted overflow-hidden"
                              >
                                <img 
                                  src={img.src} 
                                  alt="Preview" 
                                  className="h-10 w-16 object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = "https://placehold.co/100x60?text=No+Preview";
                                  }}
                                />
                              </a>
                            ))}
                            {issue.affectedImages.length > 3 && (
                              <div className="flex items-center justify-center h-10 w-8 bg-muted/50 text-xs text-muted-foreground rounded-sm">
                                +{issue.affectedImages.length - 3}
                              </div>
                            )}
                          </div>
                        )}

                        <span className="text-xs text-muted-foreground mt-1">
                          {issue.description && issue.description.length > 100 
                            ? `${issue.description.substring(0, 100)}...` 
                            : issue.description || "No description available"}
                        </span>
                      </div>
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
                      {issue.url ? (
                        <a 
                          href={issue.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {(() => {
                            try {
                              return new URL(issue.url).pathname || "/";
                            } catch (e) {
                              // If URL is invalid, just return the raw value or a placeholder
                              return issue.url || "/";
                            }
                          })()}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">No URL</span>
                      )}
                    </TableCell>
                    {(onAddToTodo || hasProjectId) && (
                      <TableCell>
                        {hasProjectId ? (
                          <div 
                            onClick={(e) => e.stopPropagation()} 
                            className="relative z-10"
                          >
                            <TodoButton 
                              issueId={`${category}-${index}`}
                              recommendation={`Fix: ${issue.title}${issue.recommended ? ` - ${issue.recommended}` : ''}`}
                              projectId={projectId}
                              auditId={auditId}
                            />
                          </div>
                        ) : onAddToTodo ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToTodo(issue, index);
                            }}
                          >
                            Add to Todo
                          </Button>
                        ) : null}
                      </TableCell>
                    )}
                  </TableRow>
                  {expandedIssues[index] && (
                    <TableRow>
                      <TableCell colSpan={(onAddToTodo || hasProjectId) ? 4 : 3} className="bg-muted/50">
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
                              <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md whitespace-pre-line">
                                {issue.implementation}
                              </div>
                            </div>
                          )}
                          
                          {/* Add image thumbnails for image issues */}
                          {category === "images" && issue.affectedImages && issue.affectedImages.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium mb-2">Affected Images: <span className="text-muted-foreground font-normal text-xs">Click to enlarge</span></h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {issue.affectedImages.slice(0, 5).map((img, imgIndex) => (
                                  <div key={imgIndex} className="border rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <a 
                                      href={img.src} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <img 
                                        src={img.src} 
                                        alt="Affected image without alt text" 
                                        className="w-full h-24 object-cover"
                                        onError={(e) => {
                                          // If image fails to load, replace with placeholder
                                          e.currentTarget.src = "https://placehold.co/200x150?text=No+Preview";
                                        }}
                                      />
                                    </a>
                                    <div className="text-xs p-2 truncate bg-muted flex items-center justify-between">
                                      <span>Missing alt text</span>
                                      <span className="text-xs text-muted-foreground">{img.width && img.height ? `${img.width}×${img.height}` : 'unknown size'}</span>
                                    </div>
                                  </div>
                                ))}
                                {issue.affectedImages.length > 5 && (
                                  <div className="flex items-center justify-center border rounded-md p-4 bg-muted/50">
                                    <span className="text-sm text-muted-foreground">
                                      +{issue.affectedImages.length - 5} more images
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Add to todo button in detailed view */}
                          {(onAddToTodo || hasProjectId) && (
                            <div className="pt-2">
                              {hasProjectId ? (
                                <div className="relative z-10">
                                  <TodoButton 
                                    issueId={`${category}-${index}`}
                                    recommendation={`Fix: ${issue.title}${issue.recommended ? ` - ${issue.recommended}` : ''}`}
                                    projectId={projectId}
                                    auditId={auditId}
                                  />
                                </div>
                              ) : onAddToTodo ? (
                                <Button
                                  size="sm"
                                  className="mt-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToTodo(issue, index);
                                  }}
                                >
                                  Add to Todo
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                              ) : null}
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