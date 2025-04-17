import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { DashboardProjectCard } from "@/components/dashboard/project-card"

export const metadata: Metadata = {
  title: "Projects | LilySEO",
  description: "Manage your SEO projects",
}

export default async function ProjectsPage() {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }
  
  // Get all user's projects
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false })
  
  // Get latest audit for each project with scores
  const { data: projectAudits } = await supabase
    .from("audits")
    .select(`
      id,
      project_id,
      created_at,
      score,
      status,
      report,
      metadata
    `)
    .in('project_id', projects?.map(p => p.id) || [])
    .order('created_at', { ascending: false })
  
  // Group audits by project_id and get the latest one for each project
  const latestAuditsByProject = projectAudits?.reduce((acc, audit) => {
    if (!acc[audit.project_id] || new Date(audit.created_at) > new Date(acc[audit.project_id].created_at)) {
      acc[audit.project_id] = audit;
    }
    return acc;
  }, {} as Record<string, typeof projectAudits[0]>);
  
  // Debug audit scores
  console.log('Latest audits with scores and metadata:', latestAuditsByProject);
  
  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Projects</h1>
          <p className="text-muted-foreground">
            Manage and track your websites' SEO performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>
      </div>
      
      {projects && projects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const latestAudit = latestAuditsByProject?.[project.id];
            
            // Extract report data if available to get issue count
            let fixesNeeded = 0;
            let seoScore = latestAudit?.score || 0;
            
            // First check if we have the fixes count in metadata
            if (latestAudit?.metadata && typeof latestAudit.metadata === 'object') {
              if ('fixes_needed' in latestAudit.metadata) {
                fixesNeeded = (latestAudit.metadata as any).fixes_needed || 0;
              }
            }
            
            // If no fixes in metadata, try to calculate from report
            if (fixesNeeded === 0 && latestAudit?.report) {
              try {
                // Parse the report JSON if it's a string
                const reportData = typeof latestAudit.report === 'string' 
                  ? JSON.parse(latestAudit.report) 
                  : latestAudit.report;
                
                // Try to get issue count from the report
                if (reportData.issues) {
                  // Sum all issues across categories
                  Object.values(reportData.issues).forEach((issues: any) => {
                    if (Array.isArray(issues)) {
                      fixesNeeded += issues.length;
                    }
                  });
                } else if (reportData.totalIssues) {
                  // If we have a direct totalIssues count
                  fixesNeeded = reportData.totalIssues;
                }
                
                // Ensure we have a valid score - if not in the audit record, try to get from report
                if (!seoScore && reportData.score) {
                  seoScore = typeof reportData.score === 'number' 
                    ? reportData.score 
                    : reportData.score.overall || 0;
                }
              } catch (e) {
                console.error('Error parsing audit report:', e);
              }
            }
            
            // Ensure the score is a number between 0-100
            seoScore = Math.max(0, Math.min(100, Math.round(Number(seoScore) || 0)));
            
            return (
              <DashboardProjectCard
                key={project.id}
                project={project}
                metrics={{
                  seoScore: seoScore,
                  fixesNeeded: fixesNeeded,
                  crawlStatus: latestAudit?.status || "pending",
                  lastCrawl: latestAudit ? 
                    new Date(latestAudit.created_at).toLocaleDateString() : 
                    new Date(project.updated_at).toLocaleDateString()
                }}
              />
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed border-2">
          <CardContent className="py-10 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">No projects yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Create your first SEO project to start tracking your website's performance and get actionable recommendations.
                </p>
              </div>
              <Button asChild>
                <Link href="/projects/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 