"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Zap, Clock, ArrowUpCircle, AlertTriangle } from "lucide-react"

interface PageSpeedProps {
  pageSpeedData: {
    mobile: any;
    desktop: any;
  };
  performanceIssues: any[];
  projectId?: string;
  auditId?: string;
}

export function PageSpeedSection({ pageSpeedData, performanceIssues }: PageSpeedProps) {
  const scoreToColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const formatMetric = (value: number | undefined, unit: string) => {
    if (value === undefined) return "N/A";
    if (unit === "s") return `${(value / 1000).toFixed(1)}s`;
    if (unit === "ms") return `${value.toFixed(0)}ms`;
    return value.toString();
  };

  const getMetricStatus = (metric: string, value: number | undefined) => {
    if (value === undefined) return "unknown";
    
    // Based on Google's Core Web Vitals thresholds
    if (metric === "lcp") {
      if (value <= 2500) return "good";
      if (value <= 4000) return "needs-improvement";
      return "poor";
    }
    
    if (metric === "fcp") {
      if (value <= 1800) return "good";
      if (value <= 3000) return "needs-improvement";
      return "poor";
    }
    
    if (metric === "cls") {
      if (value <= 0.1) return "good";
      if (value <= 0.25) return "needs-improvement";
      return "poor"; 
    }
    
    if (metric === "tbt") {
      if (value <= 200) return "good";
      if (value <= 600) return "needs-improvement";
      return "poor";
    }
    
    return "unknown";
  };

  const getStatusIcon = (status: string) => {
    if (status === "good") return <Zap className="h-4 w-4 text-green-500" />;
    if (status === "needs-improvement") return <Clock className="h-4 w-4 text-amber-500" />;
    if (status === "poor") return <AlertTriangle className="h-4 w-4 text-red-500" />;
    return null;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Page Speed & Performance</h2>
      <p className="text-muted-foreground">
        Analysis of your website's loading performance and core web vitals
      </p>

      <Tabs defaultValue="mobile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mobile">Mobile</TabsTrigger>
          <TabsTrigger value="desktop">Desktop</TabsTrigger>
        </TabsList>
        
        <TabsContent value="mobile" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center justify-between">
                <span>Mobile Performance Score</span>
                <span className={scoreToColor(pageSpeedData?.mobile?.performance || 0)}>
                  {Math.round(pageSpeedData?.mobile?.performance || 0)}/100
                </span>
              </CardTitle>
              <CardDescription>
                Overall performance score based on Core Web Vitals and other metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress 
                value={pageSpeedData?.mobile?.performance || 0} 
                className="h-3" 
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {getStatusIcon(getMetricStatus("lcp", pageSpeedData?.mobile?.lcp))}
                  Largest Contentful Paint (LCP)
                </CardTitle>
                <CardDescription>
                  Measures loading performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">
                    {formatMetric(pageSpeedData?.mobile?.lcp, "s")}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {pageSpeedData?.mobile?.lcp ? (pageSpeedData.mobile.lcp <= 2500 ? "Good" : pageSpeedData.mobile.lcp <= 4000 ? "Needs Improvement" : "Poor") : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {getStatusIcon(getMetricStatus("fcp", pageSpeedData?.mobile?.fcp))}
                  First Contentful Paint (FCP)
                </CardTitle>
                <CardDescription>
                  Measures when the browser renders the first content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">
                    {formatMetric(pageSpeedData?.mobile?.fcp, "s")}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {pageSpeedData?.mobile?.fcp ? (pageSpeedData.mobile.fcp <= 1800 ? "Good" : pageSpeedData.mobile.fcp <= 3000 ? "Needs Improvement" : "Poor") : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {getStatusIcon(getMetricStatus("cls", pageSpeedData?.mobile?.cls))}
                  Cumulative Layout Shift (CLS)
                </CardTitle>
                <CardDescription>
                  Measures visual stability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">
                    {pageSpeedData?.mobile?.cls !== undefined ? pageSpeedData.mobile.cls.toFixed(2) : "N/A"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {pageSpeedData?.mobile?.cls !== undefined ? (pageSpeedData.mobile.cls <= 0.1 ? "Good" : pageSpeedData.mobile.cls <= 0.25 ? "Needs Improvement" : "Poor") : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {getStatusIcon(getMetricStatus("tbt", pageSpeedData?.mobile?.tbt))}
                  Total Blocking Time (TBT)
                </CardTitle>
                <CardDescription>
                  Measures interactivity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">
                    {formatMetric(pageSpeedData?.mobile?.tbt, "ms")}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {pageSpeedData?.mobile?.tbt ? (pageSpeedData.mobile.tbt <= 200 ? "Good" : pageSpeedData.mobile.tbt <= 600 ? "Needs Improvement" : "Poor") : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="desktop" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center justify-between">
                <span>Desktop Performance Score</span>
                <span className={scoreToColor(pageSpeedData?.desktop?.performance || 0)}>
                  {Math.round(pageSpeedData?.desktop?.performance || 0)}/100
                </span>
              </CardTitle>
              <CardDescription>
                Overall performance score based on Core Web Vitals and other metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress 
                value={pageSpeedData?.desktop?.performance || 0} 
                className="h-3"
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {getStatusIcon(getMetricStatus("lcp", pageSpeedData?.desktop?.lcp))}
                  Largest Contentful Paint (LCP)
                </CardTitle>
                <CardDescription>
                  Measures loading performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">
                    {formatMetric(pageSpeedData?.desktop?.lcp, "s")}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {pageSpeedData?.desktop?.lcp ? (pageSpeedData.desktop.lcp <= 2500 ? "Good" : pageSpeedData.desktop.lcp <= 4000 ? "Needs Improvement" : "Poor") : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {getStatusIcon(getMetricStatus("fcp", pageSpeedData?.desktop?.fcp))}
                  First Contentful Paint (FCP)
                </CardTitle>
                <CardDescription>
                  Measures when the browser renders the first content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">
                    {formatMetric(pageSpeedData?.desktop?.fcp, "s")}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {pageSpeedData?.desktop?.fcp ? (pageSpeedData.desktop.fcp <= 1800 ? "Good" : pageSpeedData.desktop.fcp <= 3000 ? "Needs Improvement" : "Poor") : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {getStatusIcon(getMetricStatus("cls", pageSpeedData?.desktop?.cls))}
                  Cumulative Layout Shift (CLS)
                </CardTitle>
                <CardDescription>
                  Measures visual stability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">
                    {pageSpeedData?.desktop?.cls !== undefined ? pageSpeedData.desktop.cls.toFixed(2) : "N/A"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {pageSpeedData?.desktop?.cls !== undefined ? (pageSpeedData.desktop.cls <= 0.1 ? "Good" : pageSpeedData.desktop.cls <= 0.25 ? "Needs Improvement" : "Poor") : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {getStatusIcon(getMetricStatus("tbt", pageSpeedData?.desktop?.tbt))}
                  Total Blocking Time (TBT)
                </CardTitle>
                <CardDescription>
                  Measures interactivity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">
                    {formatMetric(pageSpeedData?.desktop?.tbt, "ms")}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {pageSpeedData?.desktop?.tbt ? (pageSpeedData.desktop.tbt <= 200 ? "Good" : pageSpeedData.desktop.tbt <= 600 ? "Needs Improvement" : "Poor") : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {performanceIssues && performanceIssues.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Performance Recommendations</h3>
          <div className="space-y-4">
            {performanceIssues.map((issue, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{issue.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{issue.description}</p>
                  {issue.implementation && (
                    <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                      <p className="font-medium mb-1">Implementation:</p>
                      <p>{issue.implementation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 