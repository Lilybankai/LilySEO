"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Smartphone, Monitor, Clock, Zap } from "lucide-react";

// Import visualization components
import { PerformanceBarChart } from "../charts/performance-bar-chart";
import { CoreWebVitalsChart } from "../charts/core-web-vitals-chart";

interface AuditPerformanceProps {
  pageSpeed: {
    mobile: {
      score: number;
      metrics: {
        firstContentfulPaint: number;
        speedIndex: number;
        largestContentfulPaint: number;
        timeToInteractive: number;
        totalBlockingTime: number;
        cumulativeLayoutShift: number;
      };
      opportunities: Array<{
        id: string;
        title: string;
        description: string;
        score: number;
        savings: string;
      }>;
      diagnostics: Array<{
        id: string;
        title: string;
        description: string;
        score: number;
      }>;
    };
    desktop: {
      score: number;
      metrics: {
        firstContentfulPaint: number;
        speedIndex: number;
        largestContentfulPaint: number;
        timeToInteractive: number;
        totalBlockingTime: number;
        cumulativeLayoutShift: number;
      };
      opportunities: Array<{
        id: string;
        title: string;
        description: string;
        score: number;
        savings: string;
      }>;
      diagnostics: Array<{
        id: string;
        title: string;
        description: string;
        score: number;
      }>;
    };
  };
  performanceIssues: Array<{
    id: string;
    title: string;
    description: string;
    severity: string;
    recommendation: string;
  }>;
  projectUrl: string;
}

export function AuditPerformance({ pageSpeed, performanceIssues, projectUrl }: AuditPerformanceProps) {
  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  // Format milliseconds
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Get metric status
  const getMetricStatus = (value: number, metric: string) => {
    const thresholds = {
      firstContentfulPaint: { good: 1800, poor: 3000 },
      speedIndex: { good: 3400, poor: 5800 },
      largestContentfulPaint: { good: 2500, poor: 4000 },
      timeToInteractive: { good: 3800, poor: 7300 },
      totalBlockingTime: { good: 200, poor: 600 },
      cumulativeLayoutShift: { good: 0.1, poor: 0.25 },
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return "default";

    if (value <= threshold.good) return "default";
    if (value <= threshold.poor) return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="mobile">Mobile</TabsTrigger>
          <TabsTrigger value="desktop">Desktop</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Performance Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-4 w-4" />
                  <CardTitle>Mobile Performance</CardTitle>
                </div>
                <CardDescription>
                  Performance score for mobile devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <div className={`text-4xl font-bold ${getScoreColor(pageSpeed.mobile.score)}`}>
                    {pageSpeed.mobile.score}
                  </div>
                  <Progress value={pageSpeed.mobile.score} className="mt-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Monitor className="h-4 w-4" />
                  <CardTitle>Desktop Performance</CardTitle>
                </div>
                <CardDescription>
                  Performance score for desktop devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <div className={`text-4xl font-bold ${getScoreColor(pageSpeed.desktop.score)}`}>
                    {pageSpeed.desktop.score}
                  </div>
                  <Progress value={pageSpeed.desktop.score} className="mt-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics Comparison</CardTitle>
              <CardDescription>
                Compare mobile and desktop performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <PerformanceBarChart
                  mobile={pageSpeed.mobile.metrics}
                  desktop={pageSpeed.desktop.metrics}
                />
              </div>
            </CardContent>
          </Card>

          {/* Core Web Vitals */}
          <Card>
            <CardHeader>
              <CardTitle>Core Web Vitals</CardTitle>
              <CardDescription>
                Essential metrics for a healthy website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <CoreWebVitalsChart
                  mobile={pageSpeed.mobile.metrics}
                  desktop={pageSpeed.desktop.metrics}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mobile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mobile Metrics</CardTitle>
              <CardDescription>
                Detailed performance metrics for mobile devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(pageSpeed.mobile.metrics).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <Badge variant={getMetricStatus(value, key)}>
                        {formatTime(value)}
                      </Badge>
                    </div>
                    <Progress 
                      value={100 - (value / 10)} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mobile Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle>Opportunities</CardTitle>
              <CardDescription>
                Suggestions to improve mobile performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {pageSpeed.mobile.opportunities.map((opportunity) => (
                    <div key={opportunity.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{opportunity.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {opportunity.description}
                          </p>
                        </div>
                        {opportunity.savings && (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            {opportunity.savings}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="desktop" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Desktop Metrics</CardTitle>
              <CardDescription>
                Detailed performance metrics for desktop devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(pageSpeed.desktop.metrics).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <Badge variant={getMetricStatus(value, key)}>
                        {formatTime(value)}
                      </Badge>
                    </div>
                    <Progress 
                      value={100 - (value / 10)} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Desktop Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle>Opportunities</CardTitle>
              <CardDescription>
                Suggestions to improve desktop performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {pageSpeed.desktop.opportunities.map((opportunity) => (
                    <div key={opportunity.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{opportunity.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {opportunity.description}
                          </p>
                        </div>
                        {opportunity.savings && (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            {opportunity.savings}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Issues</CardTitle>
              <CardDescription>
                Issues affecting your website's performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {performanceIssues.map((issue) => (
                    <div key={issue.id} className="p-4 border rounded-lg">
                      <div className="flex items-start space-x-4">
                        <div className="mt-1">
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{issue.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {issue.description}
                          </p>
                          <div className="mt-4 p-3 bg-muted rounded-lg">
                            <h5 className="text-sm font-medium mb-1">
                              Recommendation
                            </h5>
                            <p className="text-sm text-muted-foreground">
                              {issue.recommendation}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {issue.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {performanceIssues.length === 0 && (
                    <div className="text-center py-8">
                      <Zap className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        No performance issues found
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 