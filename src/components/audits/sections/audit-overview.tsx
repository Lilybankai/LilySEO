"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Globe } from "lucide-react";

// Import visualization components
import { ScoreRadarChart } from "../charts/score-radar-chart";
import { IssuesPieChart } from "../charts/issues-pie-chart";

interface AuditOverviewProps {
  score: {
    overall: number;
    categories: {
      onPageSeo: number;
      performance: number;
      usability: number;
      links: number;
      social: number;
    };
  };
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
  createdAt: string;
  projectUrl: string;
}

export function AuditOverview({ score, issues, createdAt, projectUrl }: AuditOverviewProps) {
  // Calculate total issues
  const totalIssues = Object.values(issues).reduce((acc, curr) => acc + curr.length, 0);
  
  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    if (score >= 50) return "text-orange-500";
    return "text-red-500";
  };
  
  // Get score badge variant
  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 90) return "default";
    if (score >= 70) return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      {/* Overall Score and Meta Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Overall Score</CardTitle>
            <CardDescription>Your website's SEO health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className={`text-4xl font-bold ${getScoreColor(score.overall)}`}>
                {score.overall}
              </div>
              <Progress 
                value={score.overall} 
                className="w-full mt-2" 
              />
              <Badge 
                variant={getScoreBadgeVariant(score.overall)}
                className="mt-2"
              >
                {score.overall >= 90 ? "Excellent" : 
                 score.overall >= 70 ? "Good" :
                 score.overall >= 50 ? "Needs Improvement" : 
                 "Poor"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Issues</CardTitle>
            <CardDescription>Issues found during audit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold text-orange-500">
                {totalIssues}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Issues requiring attention
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Info</CardTitle>
            <CardDescription>Audit details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                <span className="text-sm truncate">{projectUrl}</span>
              </div>
              <div className="flex items-center">
                <CalendarDays className="h-4 w-4 mr-2" />
                <span className="text-sm">
                  {new Date(createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Category Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Category Scores</CardTitle>
          <CardDescription>Breakdown of SEO performance by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {Object.entries(score.categories).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className={`text-sm font-bold ${getScoreColor(value)}`}>
                      {value}
                    </span>
                  </div>
                  <Progress value={value} />
                </div>
              ))}
            </div>
            <div className="min-h-[300px]">
              <ScoreRadarChart data={score.categories} />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Issues Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Issues Distribution</CardTitle>
          <CardDescription>Breakdown of issues by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {Object.entries(issues).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <Badge variant="secondary">{value.length}</Badge>
                </div>
              ))}
            </div>
            <div className="min-h-[300px]">
              <IssuesPieChart issues={issues} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 