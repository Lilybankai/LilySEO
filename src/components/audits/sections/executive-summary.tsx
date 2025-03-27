"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Chart, ChartContainer } from "@/components/ui/chart"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts"
import { AlertTriangle, Info, TrendingUp, TrendingDown } from "lucide-react"

interface ExecutiveSummaryProps {
  auditData: {
    score: number;
    report: any;
    createdAt: string;
    status: string;
  };
  projectUrl: string;
}

export function ExecutiveSummary({ auditData, projectUrl }: ExecutiveSummaryProps) {
  // Transform the categories data into the format required for the radar chart
  const scoreData = auditData.report?.score?.categories ? [
    { category: "On Page SEO", score: auditData.report.score.categories.onPageSeo || 0, fullMark: 100 },
    { category: "Performance", score: auditData.report.score.categories.performance || 0, fullMark: 100 },
    { category: "Usability", score: auditData.report.score.categories.usability || 0, fullMark: 100 },
    { category: "Links", score: auditData.report.score.categories.links || 0, fullMark: 100 },
    { category: "Social", score: auditData.report.score.categories.social || 0, fullMark: 100 },
  ] : [];
  
  // Debug radar chart data
  console.log('Executive Summary Radar Chart Data:', scoreData);

  // Count total issues
  const totalIssues = auditData.report?.issues ? 
    Object.values(auditData.report.issues).reduce((total: number, issues: any) => {
      return total + (Array.isArray(issues) ? issues.length : 0);
    }, 0) : 0;

  // Get critical issues (if priority data is available)
  const criticalIssues = auditData.report?.issues ? 
    Object.values(auditData.report.issues)
      .flat()
      .filter((issue: any) => 
        issue?.priority === "critical" || issue?.priority === "high"
      ).length : 0;

  // Performance metrics for display - in a real implementation, we would use historical data
  const performanceData = [
    {
      metric: "SEO Score",
      value: `${Math.round(auditData.report?.score?.overall || 0)}`,
      change: "+0%",
      trending: "neutral",
      period: "first audit",
    },
    {
      metric: "Page Speed",
      value: `${Math.round(auditData.report?.pageSpeed?.mobile?.performance || 0)}`,
      change: "+0%",
      trending: "neutral",
      period: "mobile",
    },
    {
      metric: "Issues Found",
      value: `${totalIssues}`,
      change: `${criticalIssues} critical`,
      trending: criticalIssues > 0 ? "down" : "up",
      period: "need attention",
    },
    {
      metric: "Domain Authority",
      value: auditData.report?.mozData?.domainAuthority || "N/A",
      change: "+0",
      trending: "neutral",
      period: "first measurement",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Executive Summary</h2>
        <p className="text-muted-foreground">Overview of key findings and performance metrics for {projectUrl}</p>
      </div>

      {criticalIssues > 0 && (
        <Alert className="bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-300">Improvement Needed</AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-400">
            This audit identified {criticalIssues} critical issues affecting your site's search visibility. Addressing these issues
            could significantly increase your organic traffic.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>SEO Performance Overview</CardTitle>
            <CardDescription>Detailed breakdown of performance across key SEO factors</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[300px]">
              {scoreData.length > 0 ? (
                <Chart config={{}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={scoreData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="category" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name="Your Website" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </Chart>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No performance data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Key metrics and their recent trends</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {performanceData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.metric}</p>
                    <p className="text-xs text-muted-foreground">{item.period}</p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-lg font-bold">{item.value}</p>
                    <div
                      className={`flex items-center ml-2 ${
                        item.trending === "up" 
                          ? "text-green-500" 
                          : item.trending === "down" 
                            ? "text-red-500" 
                            : "text-gray-400"
                      }`}
                    >
                      {item.trending === "up" ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : item.trending === "down" ? (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      ) : null}
                      <span className="text-xs font-medium">{item.change}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium mb-1">Executive Insights</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Based on our comprehensive analysis of {projectUrl}, here are the key findings that require attention:
            </p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              {auditData.report?.pageSpeed?.mobile?.lcp > 2500 && (
                <li>Slow page load times on mobile devices (LCP: {(auditData.report.pageSpeed.mobile.lcp / 1000).toFixed(1)}s)</li>
              )}
              {auditData.report?.issues?.metaDescription?.length > 0 && (
                <li>Missing or poor meta descriptions on {auditData.report.issues.metaDescription.length} pages</li>
              )}
              {auditData.report?.issues?.links?.length > 0 && (
                <li>Link issues found: {auditData.report.issues.links.length} problems with internal or external links</li>
              )}
              {auditData.report?.issues?.titleTags?.length > 0 && (
                <li>Title tag issues found on {auditData.report.issues.titleTags.length} pages</li>
              )}
              {auditData.report?.issues?.security?.length > 0 && (
                <li>Security concerns: {auditData.report.issues.security.length} issues affecting secure browsing</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 