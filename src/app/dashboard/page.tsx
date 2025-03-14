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
import { Database } from "@/lib/supabase/database.types"

export const metadata: Metadata = {
  title: "Dashboard | LilySEO",
  description: "LilySEO dashboard overview",
}

// Define types for the join results
type AuditWithProject = Database["public"]["Tables"]["audits"]["Row"] & {
  projects: { name: string } | null
}

type TodoWithProject = Database["public"]["Tables"]["todos"]["Row"] & {
  projects: { name: string } | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Get user data
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }
  
  // Get user's projects
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(4)
  
  // Get recent audit reports
  const { data: recentAudits } = await supabase
    .from("audits")
    .select(`
      id,
      url,
      created_at,
      report_data,
      project_id,
      projects:project_id (name)
    `)
    .order("created_at", { ascending: false })
    .limit(5) as { data: AuditWithProject[] | null }
  
  // Get recent todos
  const { data: recentTodos } = await supabase
    .from("todos")
    .select(`
      id,
      title,
      status,
      priority,
      created_at,
      project_id,
      projects:project_id (name)
    `)
    .order("created_at", { ascending: false })
    .limit(5) as { data: TodoWithProject[] | null }
  
  // Check if this is a new user with no projects
  const isNewUser = !projects || projects.length === 0
  
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
            <Link href="/audits/new">
              <Search className="mr-2 h-4 w-4" />
              New Audit
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          title="Total Projects"
          value={projects?.length || 0}
          description="Active SEO projects"
          iconName="file"
          trend={{
            value: "+2",
            isPositive: true,
            label: "from last month"
          }}
        />
        <DashboardMetricCard
          title="Average Position"
          value="12.4"
          description="Google search position"
          iconName="trending"
          trend={{
            value: "-0.8",
            isPositive: true,
            label: "from last month"
          }}
        />
        <DashboardMetricCard
          title="SEO Score"
          value="76/100"
          description="Average across projects"
          iconName="barChart"
          trend={{
            value: "+4",
            isPositive: true,
            label: "from last month"
          }}
        />
        <DashboardMetricCard
          title="Pending Tasks"
          value={recentTodos?.filter(todo => todo.status === 'pending').length || 0}
          description="SEO improvements"
          iconName="check"
          trend={{
            value: "-3",
            isPositive: true,
            label: "from last month"
          }}
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
          {projects.map((project) => (
            <DashboardProjectCard
              key={project.id}
              project={project}
              metrics={{
                seoScore: Math.floor(Math.random() * 30) + 70,
                position: (Math.random() * 20 + 1).toFixed(1),
                crawlStatus: Math.random() > 0.3 ? "completed" : "pending",
                lastCrawl: new Date(project.updated_at).toLocaleDateString()
              }}
            />
          ))}
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
                    icon={Search}
                    title={audit.projects?.name || "Unknown Project"}
                    description={`Audit for ${audit.url}`}
                    timestamp={new Date(audit.created_at).toLocaleDateString()}
                    status={{
                      label: "Completed",
                      icon: CheckCircle2,
                      color: "text-green-500"
                    }}
                    link={`/audits/${audit.id}`}
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
              <Link href="/audits">View all audits</Link>
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
                {recentTodos.map((todo) => (
                  <DashboardActivityItem
                    key={todo.id}
                    icon={todo.status === 'completed' ? CheckCircle2 : Clock}
                    title={todo.title}
                    description={`${todo.projects?.name || "Unknown Project"} • ${todo.priority} priority`}
                    timestamp={new Date(todo.created_at).toLocaleDateString()}
                    status={{
                      label: todo.status === 'completed' ? "Completed" : "Pending",
                      icon: todo.status === 'completed' ? CheckCircle2 : Clock,
                      color: todo.status === 'completed' ? "text-green-500" : "text-amber-500"
                    }}
                    link={`/todos/${todo.id}`}
                  />
                ))}
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
    </div>
  )
} 