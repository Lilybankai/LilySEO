"use client"

import Link from "next/link"
import { CheckCircle2, Clock, ExternalLink, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Database } from "@/lib/supabase/database.types"

type Project = Database["public"]["Tables"]["projects"]["Row"]

interface ProjectMetrics {
  seoScore: number
  fixesNeeded: number
  crawlStatus: "pending" | "processing" | "completed" | "failed"
  lastCrawl: string
}

interface DashboardProjectCardProps {
  project: Project
  metrics: ProjectMetrics
}

export function DashboardProjectCard({ project, metrics }: DashboardProjectCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold truncate" title={project.name}>
            {project.name}
          </CardTitle>
          <Badge variant={project.status === "active" ? "default" : "secondary"}>
            {project.status}
          </Badge>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <span className="truncate" title={project.url}>
            {project.url.replace(/^https?:\/\//, "")}
          </span>
          <ExternalLink className="ml-1 h-3 w-3" />
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>SEO Score</span>
              <span className="font-medium">{metrics.seoScore || 0}/100</span>
            </div>
            <Progress value={metrics.seoScore || 0} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Fixes Needed</p>
              <p className="font-medium">{metrics.fixesNeeded || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Crawl</p>
              <p className="font-medium">{metrics.lastCrawl}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            {metrics.crawlStatus === "completed" ? (
              <div className="flex items-center text-green-500 text-sm">
                <CheckCircle2 className="mr-1 h-4 w-4" />
                <span>Crawl completed</span>
              </div>
            ) : metrics.crawlStatus === "processing" ? (
              <div className="flex items-center text-blue-500 text-sm">
                <Clock className="mr-1 h-4 w-4" />
                <span>Crawl in progress</span>
              </div>
            ) : metrics.crawlStatus === "pending" ? (
              <div className="flex items-center text-amber-500 text-sm">
                <Clock className="mr-1 h-4 w-4" />
                <span>Crawl pending</span>
              </div>
            ) : (
              <div className="flex items-center text-red-500 text-sm">
                <AlertTriangle className="mr-1 h-4 w-4" />
                <span>Crawl failed</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/projects/${project.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 