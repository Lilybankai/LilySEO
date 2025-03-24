"use client"

import * as React from "react"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, ChevronRight, Zap, FileText, Globe, UserCheck, ExternalLink } from "lucide-react"
import { Progress } from "@/components/ui/progress"

type Priority = "critical" | "high" | "medium" | "low"
type Category = "technical" | "on-page" | "off-page" | "user-experience" | "performance" | "metaDescription" | "titleTags" | "links" | "images" | "security" | "mobile"

interface ActionItem {
  id: string
  title: string
  description: string
  category: Category
  priority: Priority
  estimatedTime?: string
  checked: boolean
  impact?: number
  difficulty?: number
  expanded?: boolean
  isAiRecommendation?: boolean
  current?: string
  recommended?: string
  url?: string
  implementation?: string
}

interface ActionPlanProps {
  auditData: {
    id: string;
    report: any;
  };
  projectId: string;
  onAddToTodo: (issueId: string, recommendation: string) => void;
}

export function ActionPlan({ auditData, projectId, onAddToTodo }: ActionPlanProps) {
  // Derive action items from the audit data
  const [actions, setActions] = useState<ActionItem[]>(() => {
    const items: ActionItem[] = [];
    
    // Process SEO issues first - these are actual problems found during crawl
    if (auditData.report?.issues) {
      Object.entries(auditData.report.issues).forEach(([category, issuesRaw]) => {
        const issues = Array.isArray(issuesRaw) ? issuesRaw : [];
        issues.forEach((issue, index) => {
          // Skip if no title
          if (!issue.title) return;
          
          items.push({
            id: `issue-${category}-${index}`,
            title: issue.title,
            description: issue.description || "No detailed description available.",
            category: category as Category,
            priority: issue.priority || "medium",
            estimatedTime: "varies",
            checked: false,
            impact: 80, // High impact for actual issues
            difficulty: 40,
            isAiRecommendation: false,
            current: issue.current,
            recommended: issue.recommended,
            url: issue.url
          });
        });
      });
    }
    
    // Sort by priority
    return items.sort((a, b) => {
      const priorityOrder: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  });

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleChecked = (id: string) => {
    setActions(prev =>
      prev.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleAddToTodo = (item: ActionItem) => {
    onAddToTodo(item.id, `${item.title} - ${item.description}`);
  };

  // Filter actions based on selected filters
  const filteredActions = actions.filter(item => {
    // Filter by type - since we no longer have AI recommendations here, we can simplify this
    if (filterType === "recommendations") return false; // No AI recommendations in action plan anymore
    
    // Filter by category
    if (filterCategory === "all") return true;
    if (filterCategory === "critical" || filterCategory === "high" || filterCategory === "medium" || filterCategory === "low") {
      return item.priority === filterCategory;
    }
    return item.category === filterCategory;
  });

  const completedCount = actions.filter(item => item.checked).length;
  const progressPercentage = actions.length > 0 ? (completedCount / actions.length) * 100 : 0;

  // Get unique categories for filter
  const categories = [...new Set(actions.map(item => item.category))];

  const getCategoryColor = (category: Category) => {
    const colorMap: Record<Category, string> = {
      technical: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
      "on-page": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      "off-page": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      "user-experience": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      performance: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      metaDescription: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      titleTags: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      links: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      images: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300",
      security: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      mobile: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    };
    return colorMap[category] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  };

  const getPriorityColor = (priority: Priority) => {
    const colorMap: Record<Priority, string> = {
      critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    };
    return colorMap[priority];
  };

  const getCategoryIcon = (category: Category) => {
    const iconMap: Record<string, React.ReactNode> = {
      technical: <Globe className="h-4 w-4" />,
      "on-page": <FileText className="h-4 w-4" />,
      "off-page": <Globe className="h-4 w-4" />,
      "user-experience": <UserCheck className="h-4 w-4" />,
      performance: <Zap className="h-4 w-4" />,
    };
    return iconMap[category] || <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold">Action Plan</h2>
          <p className="text-muted-foreground">
            {actions.length} recommended actions to improve your SEO performance
          </p>
        </div>
        <div className="flex flex-col space-y-2 w-full md:w-auto">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("all")}
            >
              All Types
            </Button>
            <Button
              variant={filterType === "issues" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("issues")}
            >
              SEO Issues
            </Button>
            <Button
              variant={filterType === "recommendations" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("recommendations")}
              className={filterType === "recommendations" ? "bg-primary" : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"}
            >
              AI Recommendations
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterCategory("all")}
            >
              All Categories
            </Button>
            <Button
              variant={filterCategory === "critical" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterCategory("critical")}
              className="bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
            >
              Critical
            </Button>
            {categories.slice(0, 3).map(category => (
              <Button
                key={category}
                variant={filterCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterCategory(category)}
                className={filterCategory === category ? "bg-primary" : getCategoryColor(category as Category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1')}
              </Button>
            ))}
            {categories.length > 3 && (
              <Button variant="outline" size="sm">
                More...
              </Button>
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedCount} of {actions.length} completed
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Recommendation</TableHead>
                <TableHead className="w-[100px]">Priority</TableHead>
                <TableHead className="w-[120px]">Category</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No recommendations found in this category
                  </TableCell>
                </TableRow>
              ) : (
                filteredActions.map(item => (
                  <React.Fragment key={item.id}>
                    <TableRow className={`${item.checked ? "opacity-60" : ""} ${item.isAiRecommendation ? "bg-purple-50/30 dark:bg-purple-900/5" : ""}`}>
                      <TableCell className="px-2">
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={() => toggleChecked(item.id)}
                        />
                      </TableCell>
                      <TableCell
                        className="cursor-pointer"
                        onClick={() => toggleExpand(item.id)}
                      >
                        <div className="flex items-start gap-2">
                          {expanded[item.id] ? (
                            <ChevronDown className="h-4 w-4 mt-1 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 mt-1 flex-shrink-0" />
                          )}
                          <div>
                            <div className="font-medium flex items-center gap-1">
                              {item.isAiRecommendation && (
                                <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 text-xs px-1.5 py-0">
                                  AI
                                </Badge>
                              )}
                              {item.title}
                            </div>
                            {expanded[item.id] && (
                              <div className="text-sm text-muted-foreground mt-1 mb-2">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getPriorityColor(item.priority)}
                        >
                          {item.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`flex items-center gap-1 ${getCategoryColor(item.category)}`}
                        >
                          {getCategoryIcon(item.category)}
                          <span>
                            {item.category.charAt(0).toUpperCase() + 
                             item.category.slice(1).replace(/([A-Z])/g, ' $1')}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddToTodo(item)}
                        >
                          Add to Todo
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expanded[item.id] && item.impact !== undefined && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-muted/50 px-10 py-3">
                          <div className="space-y-4">
                            <div className="flex flex-col md:flex-row gap-6">
                              <div className="flex-1">
                                <div className="text-sm font-medium mb-1">Impact</div>
                                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${item.impact}%` }}
                                  ></div>
                                </div>
                              </div>
                              {item.difficulty !== undefined && (
                                <div className="flex-1">
                                  <div className="text-sm font-medium mb-1">Difficulty</div>
                                  <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-orange-500 rounded-full"
                                      style={{ width: `${item.difficulty}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="text-sm font-medium mb-1">Estimated Time</div>
                                <div className="text-sm">{item.estimatedTime || "Varies"}</div>
                              </div>
                            </div>
                            
                            {/* Show different content based on item type */}
                            {item.isAiRecommendation ? (
                              // AI Recommendation specific details
                              <div className="mt-2">
                                {item.implementation && (
                                  <div className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-md border border-purple-100 dark:border-purple-800">
                                    <p className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-1">Implementation Guide:</p>
                                    <p className="text-sm text-muted-foreground">{item.implementation}</p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              // SEO Issue specific details
                              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {item.current && (
                                  <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-md border border-red-100 dark:border-red-800">
                                    <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">Current State:</p>
                                    <p className="text-sm text-red-700 dark:text-red-400">{item.current}</p>
                                  </div>
                                )}
                                {item.recommended && (
                                  <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-md border border-green-100 dark:border-green-800">
                                    <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">Recommended Fix:</p>
                                    <p className="text-sm text-green-700 dark:text-green-400">{item.recommended}</p>
                                  </div>
                                )}
                                {item.url && (
                                  <div className="col-span-1 md:col-span-2">
                                    <p className="text-sm font-medium mb-1">Affected URL:</p>
                                    <a 
                                      href={item.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                                    >
                                      {item.url}
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 