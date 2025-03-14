import { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Edit, 
  ExternalLink, 
  LineChart, 
  Plus,
  Search, 
  Settings, 
  Trash2, 
  TrendingUp, 
  Users 
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/server"
import { DashboardMetricCard } from "@/components/dashboard/metric-card"
import { DashboardActivityItem } from "@/components/dashboard/activity-item"

interface ProjectPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const supabase = await createClient()
  
  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", params.id)
    .single()
  
  if (!project) {
    return {
      title: "Project Not Found | LilySEO",
    }
  }
  
  return {
    title: `${project.name} | LilySEO`,
    description: `SEO performance for ${project.name}`,
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }
  
  // Get project details
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.id)
    .single()
  
  if (!project) {
    notFound()
  }
  
  // Get recent audit reports for this project
  const { data: audits } = await supabase
    .from("audits")
    .select("*")
    .eq("project_id", params.id)
    .order("created_at", { ascending: false })
    .limit(5)
  
  // Get todos for this project
  const { data: todos } = await supabase
    .from("todos")
    .select("*")
    .eq("project_id", params.id)
    .order("created_at", { ascending: false })
    .limit(5)
  
  // Get competitor data for this project
  const { data: competitors } = await supabase
    .from("competitor_data")
    .select("*")
    .eq("project_id", params.id)
    .order("created_at", { ascending: false })
    .limit(5)
  
  // Mock data for metrics
  const metrics = {
    seoScore: 76,
    position: "12.4",
    crawlStatus: "completed" as const,
    lastCrawl: new Date(project.updated_at).toLocaleDateString(),
    pendingTasks: todos?.filter(todo => todo.status === 'pending').length || 0,
    completedTasks: todos?.filter(todo => todo.status === 'completed').length || 0,
  }
  
  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <a 
              href={project.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4 ml-1" />
            </a>
          </div>
          <p className="text-muted-foreground mt-1">
            {project.url}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/projects/${project.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Project
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/projects/${project.id}/settings`}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button variant="destructive" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <DashboardMetricCard
          title="SEO Score"
          value={`${metrics.seoScore}/100`}
          description="Overall performance"
          iconName="barChart"
          trend={{
            value: "+4",
            isPositive: true,
            label: "from last month"
          }}
        />
        <DashboardMetricCard
          title="Average Position"
          value={metrics.position}
          description="Google search position"
          iconName="trending"
          trend={{
            value: "-0.8",
            isPositive: true,
            label: "from last month"
          }}
        />
        <DashboardMetricCard
          title="Pending Tasks"
          value={metrics.pendingTasks}
          description="SEO improvements"
          iconName="clock"
          trend={{
            value: "-3",
            isPositive: true,
            label: "from last month"
          }}
        />
        <DashboardMetricCard
          title="Completed Tasks"
          value={metrics.completedTasks}
          description="Improvements made"
          iconName="check"
          trend={{
            value: "+5",
            isPositive: true,
            label: "from last month"
          }}
        />
      </div>
      
      {/* Tabs for different sections */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="audits">Audits</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Audits */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Audits</CardTitle>
                <CardDescription>Latest SEO audits for this project</CardDescription>
              </CardHeader>
              <CardContent>
                {audits && audits.length > 0 ? (
                  <div className="space-y-4">
                    {audits.map((audit) => (
                      <DashboardActivityItem
                        key={audit.id}
                        icon={Search}
                        title={`Audit for ${audit.url}`}
                        description={`Score: ${(audit.report_data as any)?.score || "N/A"}`}
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
                    No audits found. Run your first audit to get insights.
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/projects/${project.id}/audits/new`}>
                    <Search className="mr-2 h-4 w-4" />
                    Run New Audit
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Recent Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>SEO Tasks</CardTitle>
                <CardDescription>Tasks and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                {todos && todos.length > 0 ? (
                  <div className="space-y-4">
                    {todos.map((todo) => (
                      <DashboardActivityItem
                        key={todo.id}
                        icon={todo.status === 'completed' ? CheckCircle2 : Clock}
                        title={todo.title}
                        description={`${todo.priority} priority`}
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
                    No tasks found. Run an audit to generate tasks.
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/projects/${project.id}/todos`}>
                    View All Tasks
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* Performance Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>SEO metrics over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="flex flex-col items-center text-center">
                <LineChart className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Performance data will appear here after multiple audits
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Audits Tab */}
        <TabsContent value="audits">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>SEO Audits</CardTitle>
                  <CardDescription>Comprehensive analysis of your website</CardDescription>
                </div>
                <Button asChild>
                  <Link href={`/projects/${project.id}/audits/new`}>
                    <Search className="mr-2 h-4 w-4" />
                    Run New Audit
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {audits && audits.length > 0 ? (
                <div className="space-y-4">
                  {audits.map((audit) => (
                    <DashboardActivityItem
                      key={audit.id}
                      icon={Search}
                      title={`Audit for ${audit.url}`}
                      description={`Score: ${(audit.report_data as any)?.score || "N/A"}`}
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
                <div className="py-10 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Search className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">No audits yet</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Run your first SEO audit to get detailed insights and recommendations for your website.
                      </p>
                    </div>
                    <Button asChild>
                      <Link href={`/projects/${project.id}/audits/new`}>
                        <Search className="mr-2 h-4 w-4" />
                        Run First Audit
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>SEO Tasks</CardTitle>
                  <CardDescription>Actionable recommendations to improve your SEO</CardDescription>
                </div>
                <Button asChild>
                  <Link href={`/projects/${project.id}/todos/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {todos && todos.length > 0 ? (
                <div className="space-y-4">
                  {todos.map((todo) => (
                    <DashboardActivityItem
                      key={todo.id}
                      icon={todo.status === 'completed' ? CheckCircle2 : Clock}
                      title={todo.title}
                      description={`${todo.priority} priority • ${todo.description || "No description"}`}
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
                <div className="py-10 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Clock className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">No tasks yet</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Run an SEO audit to automatically generate tasks, or create them manually.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild>
                        <Link href={`/projects/${project.id}/audits/new`}>
                          <Search className="mr-2 h-4 w-4" />
                          Run Audit
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href={`/projects/${project.id}/todos/new`}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Task
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Competitors Tab */}
        <TabsContent value="competitors">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Competitor Analysis</CardTitle>
                  <CardDescription>Track and compare your performance against competitors</CardDescription>
                </div>
                <Button asChild>
                  <Link href={`/projects/${project.id}/competitors/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Competitor
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {competitors && competitors.length > 0 ? (
                <div className="space-y-4">
                  {competitors.map((competitor) => (
                    <DashboardActivityItem
                      key={competitor.id}
                      icon={Users}
                      title={competitor.competitor_url}
                      description={`Last analyzed: ${new Date(competitor.created_at).toLocaleDateString()}`}
                      timestamp={new Date(competitor.created_at).toLocaleDateString()}
                      link={`/competitors/${competitor.id}`}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">No competitors yet</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Add competitors to track and compare your SEO performance against them.
                      </p>
                    </div>
                    <Button asChild>
                      <Link href={`/projects/${project.id}/competitors/new`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Competitor
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 