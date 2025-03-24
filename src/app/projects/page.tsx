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
      status
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
            
            return (
              <DashboardProjectCard
                key={project.id}
                project={project}
                metrics={{
                  seoScore: latestAudit?.score || 0,
                  position: latestAudit ? `#${Math.floor(Math.random() * 15) + 1}` : "N/A",
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