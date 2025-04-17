import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { 
  ArrowDown, 
  ArrowUp, 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Plus, 
  Search, 
  TrendingUp,
  Globe,
  LineChart,
  ListChecks,
  ArrowRight
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { DashboardMetricCard } from "@/components/dashboard/metric-card"
import { DashboardProjectCard } from "@/components/dashboard/project-card"
import { DashboardActivityItem } from "@/components/dashboard/activity-item"
import { Database, Json } from "@/lib/supabase/database.types"
import { CrawlerServiceStatus } from "@/components/crawler-service-status"

export const metadata: Metadata = {
  title: "Dashboard | LilySEO",
  description: "LilySEO dashboard overview",
}

// Define types for the join results
type AuditWithProject = Database["public"]["Tables"]["audits"]["Row"] & {
  projects: { name: string } | null;
}

type TodoWithProject = Database["public"]["Tables"]["todos"]["Row"] & {
  projects: { name: string } | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect("/auth/login")
  }
  
  // Check if user is an admin
  const isAdmin = session.user.email?.endsWith('@thelilybankagency.co.uk') || 
                 session.user.email === 'carl@thelilybankagency.co.uk'
  
  // Get user data
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }
  
  // Get user's projects with more data
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(4)
  
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
  
  // Get recent audit reports
  const { data: recentAudits } = await supabase
    .from("audits")
    .select(`
      id,
      url,
      created_at,
      report,
      project_id,
      status,
      score,
      projects:project_id (name)
    `)
    .order("created_at", { ascending: false })
    .limit(10) as { data: AuditWithProject[] | null }
  
  // Get recent todos
  const { data: recentTodos } = await supabase
    .from("todos")
    .select(`
      id,
      title,
      status,
      priority,
      description,
      created_at,
      project_id,
      projects:project_id (name)
    `)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10) as { data: TodoWithProject[] | null }
  
  // Check if this is a new user with no projects
  const isNewUser = !projects || projects.length === 0
  
  // Get latest audit metrics for each project
  const { data: projectMetrics } = await supabase
    .from("audit_metrics_history")
    .select(`
      project_id,
      created_at,
      overall_score,
      fixes_needed,
      on_page_seo_score,
      performance_score,
      usability_score,
      links_score,
      total_issues
    `)
    .in('project_id', projects?.map(p => p.id) || [])
    .order('created_at', { ascending: false })

  // Group metrics by project_id and get the latest one for each project
  const latestMetricsByProject = projectMetrics?.reduce((acc, metric) => {
    if (!acc[metric.project_id] || new Date(metric.created_at) > new Date(acc[metric.project_id].created_at)) {
      acc[metric.project_id] = metric;
    }
    return acc;
  }, {} as Record<string, typeof projectMetrics[0]>);
  
  // Get historical data (one month ago) for comparison
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  // Get historical project count for comparison
  const { data: lastMonthProjects } = await supabase
    .from("projects")
    .select("id")
    .lt("created_at", oneMonthAgo.toISOString())
    .eq("user_id", user.id)
    .eq("status", "active");
  
  const projectGrowth = (projects?.length || 0) - (lastMonthProjects?.length || 0);
  
  // Get historical metrics for comparison (one month ago)
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const { data: previousMonthMetrics } = await supabase
    .from("audit_metrics_history")
    .select(`
      project_id,
      created_at,
      overall_score,
      fixes_needed,
      on_page_seo_score,
      performance_score
    `)
    .in('project_id', projects?.map(p => p.id) || [])
    .gte('created_at', twoMonthsAgo.toISOString())
    .lt('created_at', oneMonthAgo.toISOString())
    .order('created_at', { ascending: false })

  // Calculate average score from metrics history
  const averageSeoScore = projectMetrics && projectMetrics.length > 0
    ? Math.round(projectMetrics.reduce((sum, metric) => sum + (metric.overall_score || 0), 0) / projectMetrics.length)
    : 0;

  // Calculate historical score average
  const previousMonthScores = previousMonthMetrics?.map(metric => metric.overall_score) || [];
  const lastMonthAverageScore = previousMonthScores.length > 0
    ? Math.round(previousMonthScores.reduce((sum, score) => sum + (score || 0), 0) / previousMonthScores.length)
    : 0;

  const scoreGrowth = averageSeoScore - lastMonthAverageScore;
  
  // Get historical pending tasks for comparison
  const { data: lastMonthPendingTasks } = await supabase
    .from("todos")
    .select("id")
    .lt("created_at", oneMonthAgo.toISOString())
    .eq("user_id", user.id)
    .eq("status", "pending");
  
  const currentPendingTasks = recentTodos?.filter(todo => todo.status === 'pending').length || 0;
  const lastMonthPendingTasksCount = lastMonthPendingTasks?.length || 0;
  const taskChange = lastMonthPendingTasksCount - currentPendingTasks;
  // For pending tasks, a reduction (negative change) is actually positive
  const isTaskChangePositive = taskChange <= 0 ? false : true;
  
  // Calculate average position (dummy data for now, could be replaced with real ranking data)
  const averagePosition = "12.4";
  const positionChange = -0.8;
  const isPositionChangePositive = positionChange < 0; // For ranking, lower is better
  
  if (isNewUser) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome to LilySEO</h1>
          <p className="text-muted-foreground mt-2">
            Let's get started with improving your website's SEO performance
          </p>
        </div>
        
        {/* Getting Started Card */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl">Getting Started</CardTitle>
            <CardDescription>
              Follow these steps to start tracking and improving your website's SEO
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Globe className="h-5 w-5" />
                  <span className="absolute -ml-1 -mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">1</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-medium">Create your first project</h3>
                  <p className="text-sm text-muted-foreground">
                    Add your website as a project to start tracking its SEO performance.
                  </p>
                  <Button asChild className="mt-2">
                    <Link href="/projects/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Project
                    </Link>
                  </Button>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Search className="h-5 w-5" />
                  <span className="absolute -ml-1 -mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">2</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-medium">Run your first SEO audit</h3>
                  <p className="text-sm text-muted-foreground">
                    Analyze your website to identify SEO issues and opportunities.
                  </p>
                  <Button variant="outline" className="mt-2" disabled>
                    <Search className="mr-2 h-4 w-4" />
                    Run Audit
                    <span className="ml-2 text-xs text-muted-foreground">(Create a project first)</span>
                  </Button>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ListChecks className="h-5 w-5" />
                  <span className="absolute -ml-1 -mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">3</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-medium">Complete SEO tasks</h3>
                  <p className="text-sm text-muted-foreground">
                    Follow the AI-generated recommendations to improve your rankings.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <LineChart className="h-5 w-5" />
                  <span className="absolute -ml-1 -mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">4</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-medium">Track your progress</h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor your SEO improvements with monthly recrawls and performance tracking.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* SEO Tips */}
        <div>
          <h2 className="text-xl font-semibold mb-4">SEO Tips & Best Practices</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Optimize Page Titles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create unique, descriptive titles under 60 characters that include your main keywords.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Improve Page Speed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Compress images, minimize code, and leverage browser caching to speed up your website.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Create Quality Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Publish original, valuable content that answers your audience's questions and needs.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-4 text-center">
            <Button variant="link" asChild>
              <Link href="/resources/seo-guide">
                View Complete SEO Guide
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.user_metadata.full_name || user.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/projects">
              <Search className="mr-2 h-4 w-4" />
              New Audit
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Crawler Service Status */}
      <CrawlerServiceStatus />
      
      {/* Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          title="Total Projects"
          value={projects?.length || 0}
          description="Active SEO projects"
          iconName="file"
          trend={projectGrowth !== 0 ? {
            value: projectGrowth > 0 ? `+${projectGrowth}` : `${projectGrowth}`,
            isPositive: projectGrowth >= 0,
            label: "from last month"
          } : undefined}
        />
        <DashboardMetricCard
          title="Average Position"
          value={averagePosition}
          description="Google search position"
          iconName="trending"
          trend={{
            value: positionChange.toString(),
            isPositive: isPositionChangePositive,
            label: "from last month"
          }}
        />
        <DashboardMetricCard
          title="SEO Score"
          value={`${averageSeoScore || 0}/100`}
          description="Average across projects"
          iconName="barChart"
          trend={scoreGrowth !== 0 ? {
            value: scoreGrowth > 0 ? `+${scoreGrowth}` : `${scoreGrowth}`,
            isPositive: scoreGrowth > 0,
            label: "from last month"
          } : undefined}
        />
        <DashboardMetricCard
          title="Pending Tasks"
          value={currentPendingTasks}
          description="SEO improvements"
          iconName="check"
          trend={taskChange !== 0 ? {
            value: taskChange < 0 ? `${taskChange}` : `+${taskChange}`,
            isPositive: taskChange < 0,
            label: "from last month"
          } : undefined}
        />
      </div>
      
      {/* Projects Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Projects</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/projects">View all projects</Link>
          </Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => {
            const latestAudit = latestAuditsByProject?.[project.id];
            const latestMetrics = latestMetricsByProject?.[project.id];
            
            // Get metrics from our new metrics history if available, otherwise fallback to audit data
            const seoScore = latestMetrics?.overall_score || latestAudit?.score || 0;
            const fixesNeeded = latestMetrics?.fixes_needed || 0;
            
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
      </div>
      
      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Audits */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Audits</CardTitle>
            <CardDescription>Latest SEO audits across your projects</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAudits && recentAudits.length > 0 ? (
              <div className="space-y-4">
                {recentAudits.map((audit) => (
                  <DashboardActivityItem
                    key={audit.id}
                    icon="Search"
                    title={audit.projects?.name || "Unknown Project"}
                    description={`Audit for ${audit.url} ${audit.score ? `• Score: ${audit.score}/100` : ''}`}
                    timestamp={new Date(audit.created_at).toLocaleDateString()}
                    status={{
                      label: audit.status === 'completed' ? "Completed" : 
                             audit.status === 'processing' ? "Processing" : 
                             audit.status === 'failed' ? "Failed" : "Pending",
                      icon: audit.status === 'completed' ? "CheckCircle2" : 
                            audit.status === 'failed' ? "FileText" : "Clock",
                      color: audit.status === 'completed' ? "text-green-500" : 
                             audit.status === 'failed' ? "text-red-500" :
                             audit.status === 'processing' ? "text-blue-500" : "text-amber-500"
                    }}
                    link={`/projects/${audit.project_id}/audits/${audit.id}`}
                  />
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground">
                No recent audits found
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/projects">View all audits</Link>
            </Button>
          </CardFooter>
        </Card>
        
        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Tasks</CardTitle>
            <CardDescription>Recent tasks and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTodos && recentTodos.length > 0 ? (
              <div className="space-y-4">
                {recentTodos.map((todo) => {
                  const priorityColor = 
                    todo.priority === 'critical' ? "text-red-500" :
                    todo.priority === 'high' ? "text-orange-500" :
                    todo.priority === 'medium' ? "text-amber-500" : "text-blue-500";
                  
                  const statusIcon = todo.status === 'completed' ? "CheckCircle2" : 
                                     todo.status === 'canceled' ? "FileText" : "Clock";
                  
                  return (
                    <DashboardActivityItem
                      key={todo.id}
                      icon={todo.status === 'completed' ? "CheckCircle2" : "Clock"}
                      title={todo.title}
                      description={`${todo.projects?.name || "Unknown Project"} • ${todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)} priority`}
                      timestamp={new Date(todo.created_at).toLocaleDateString()}
                      status={{
                        label: todo.status === 'completed' ? "Completed" : 
                               todo.status === 'in_progress' ? "In Progress" : 
                               todo.status === 'canceled' ? "Canceled" : "Pending",
                        icon: statusIcon,
                        color: todo.status === 'completed' ? "text-green-500" : 
                               todo.status === 'canceled' ? "text-slate-500" : priorityColor
                      }}
                      link={`/todos/${todo.id}`}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground">
                No tasks found
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/todos">View all tasks</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="grid gap-6 mt-6">
        {isAdmin && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">Admin Diagnostics</h3>
            <div className="space-y-2">
              <p className="text-sm text-yellow-700">
                Use these links for troubleshooting:
              </p>
              <div className="flex space-x-3">
                <a 
                  href="/dashboard/white-label?debug=true" 
                  className="text-sm px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded"
                >
                  White Label Debug Mode
                </a>
                <a 
                  href="/dashboard/debug-tools" 
                  className="text-sm px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded"
                >
                  Debug Tools
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 