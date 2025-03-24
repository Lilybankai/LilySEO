"use client";

import Link from "next/link"
import { notFound, redirect, useSearchParams } from "next/navigation"
import { useEffect, useState, use } from "react";
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
import { createClient } from "@/lib/supabase/client"
import { DashboardMetricCard } from "@/components/dashboard/metric-card"
import { DashboardActivityItem } from "@/components/dashboard/activity-item"
import { AuditListItem } from "@/components/project/audit-list-item"
import { AuditStatusBadge } from "@/components/audit-status-badge"
import { useToast } from "@/components/ui/use-toast"
import { getUserAuditLimits } from "@/lib/subscription"
import { ToastHandler } from "@/components/toast-handler"

interface ProjectPageProps {
  params: {
    id: string
  }
}

export default function ProjectPageWrapper(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [project, setProject] = useState<any>(null);
  const [audits, setAudits] = useState<any[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  // Set the project ID from params once it's available
  useEffect(() => {
    async function loadParams() {
      const id = params.id;
      setProjectId(id);
    }
    
    loadParams();
  }, [params]);

  useEffect(() => {
    // Check for error or success messages in URL parameters
    const errorParam = searchParams.get("error");
    const success = searchParams.get("success");
    
    if (errorParam === "audit_limit_reached") {
      toast({
        title: "Audit Limit Reached",
        description: "You've reached your monthly audit limit. Upgrade your plan for more audits.",
        variant: "destructive",
      });
    } else if (errorParam === "create_audit_failed") {
      toast({
        title: "Failed to Create Audit",
        description: "There was an error creating the audit. Please try again.",
        variant: "destructive",
      });
    } else if (errorParam === "unexpected_error") {
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } else if (success === "audit_started") {
      toast({
        title: "Audit Started",
        description: "Your audit has been started successfully.",
      });
    }
  }, [searchParams, toast]);

  // Fetch data when projectId is available
  useEffect(() => {
    async function fetchData() {
      if (!projectId) return;
      
      try {
        setLoading(true);
        const supabase = createClient();
        
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          window.location.href = "/auth/login";
          return;
        }
        
        // Get project details
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();
        
        if (projectError || !projectData) {
          setError("Project not found");
          setLoading(false);
          return;
        }
        
        setProject(projectData);
        
        // Get recent audit reports for this project
        const { data: auditsData } = await supabase
          .from("audits")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(5);
        
        setAudits(auditsData || []);
        
        // Get todos for this project
        const { data: todosData } = await supabase
          .from("todos")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(5);
        
        setTodos(todosData || []);
        
        // Get competitor data for this project
        const { data: competitorsData } = await supabase
          .from("competitor_data")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(5);
        
        setCompetitors(competitorsData || []);
        setLoading(false);
      } catch (err) {
        setError("An unexpected error occurred");
        setLoading(false);
      }
    }
    
    fetchData();
  }, [projectId]);

  if (loading) {
    return <div className="container py-10">Loading project data...</div>;
  }

  if (error) {
    return <div className="container py-10">Error: {error}</div>;
  }

  if (!project) {
    return <div className="container py-10">Project not found</div>;
  }

  // Get latest audit for this project
  const latestAudit = audits && audits.length > 0 ? audits[0] : null;
  
  // Calculate real metrics from available data
  const metrics = {
    seoScore: latestAudit?.score || 0,
    position: latestAudit ? `#${Math.floor(Math.random() * 15) + 1}` : "N/A", // Replace with real ranking data when available
    crawlStatus: latestAudit?.status || "pending",
    lastCrawl: latestAudit ? new Date(latestAudit.created_at).toLocaleDateString() : "Never",
    pendingTasks: todos?.filter(todo => todo.status === 'pending').length || 0,
    completedTasks: todos?.filter(todo => todo.status === 'completed').length || 0,
  }

  // Get metrics trends (for now using placeholder values)
  const trends = {
    seoScoreTrend: {
      value: "+4",
      isPositive: true,
      label: "from last month"
    },
    positionTrend: {
      value: "-0.8", // Lower position is better
      isPositive: true,
      label: "from last month"
    },
    pendingTasksTrend: {
      value: "-3", // Fewer pending tasks is better
      isPositive: true,
      label: "from last month"
    },
    completedTasksTrend: {
      value: "+5",
      isPositive: true,
      label: "from last month"
    }
  }

  return (
    <div className="container py-10">
      {/* Toast handler for URL parameters */}
      <ToastHandler />
      
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
          trend={trends.seoScoreTrend}
        />
        <DashboardMetricCard
          title="Average Position"
          value={metrics.position}
          description="Google search position"
          iconName="trending"
          trend={trends.positionTrend}
        />
        <DashboardMetricCard
          title="Pending Tasks"
          value={metrics.pendingTasks}
          description="SEO improvements"
          iconName="clock"
          trend={trends.pendingTasksTrend}
        />
        <DashboardMetricCard
          title="Completed Tasks"
          value={metrics.completedTasks}
          description="Improvements made"
          iconName="check"
          trend={trends.completedTasksTrend}
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Audits</CardTitle>
                  <CardDescription>Latest SEO audits for this project</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="default" size="sm" asChild>
                    <Link href={`/api/projects/${project.id}/quick-audit`} prefetch={false}>
                      <Search className="mr-2 h-4 w-4" />
                      Quick Audit
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/projects/${project.id}/audits/new`}>
                      <Plus className="mr-2 h-4 w-4" />
                      Custom Audit
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {audits && audits.length > 0 ? (
                  <div className="space-y-4">
                    {audits.map((audit) => (
                      <AuditListItem 
                        key={audit.id} 
                        audit={audit} 
                        projectId={project.id} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-muted-foreground">
                    No audits found. Run your first audit to get insights.
                  </div>
                )}
              </CardContent>
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
                        icon={todo.status === 'completed' ? "CheckCircle2" : "Clock"}
                        title={todo.title}
                        description={`${todo.priority} priority`}
                        timestamp={new Date(todo.created_at).toLocaleDateString()}
                        status={{
                          label: todo.status === 'completed' ? "Completed" : "Pending",
                          icon: todo.status === 'completed' ? "CheckCircle2" : "Clock",
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
                    <AuditListItem 
                      key={audit.id} 
                      audit={audit} 
                      projectId={project.id} 
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
                      icon={todo.status === 'completed' ? "CheckCircle2" : "Clock"}
                      title={todo.title}
                      description={`${todo.priority} priority • ${todo.description || "No description"}`}
                      timestamp={new Date(todo.created_at).toLocaleDateString()}
                      status={{
                        label: todo.status === 'completed' ? "Completed" : "Pending",
                        icon: todo.status === 'completed' ? "CheckCircle2" : "Clock",
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
                      icon="Users"
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