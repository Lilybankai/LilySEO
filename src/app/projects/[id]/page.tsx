"use client";

import Link from "next/link"
import { notFound, redirect, useSearchParams } from "next/navigation"
import { useEffect, useState, use } from "react";
import { 
  ArrowDown, 
  ArrowUp, 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Edit, 
  ExternalLink, 
  FileWarning,
  LineChart as LucideLineChart, 
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
import { ResponsiveContainer, LineChart as RechartsLineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from "recharts"
import { startAudit, pollAuditUntilComplete } from "@/lib/crawler-service-client"

interface ProjectPageProps {
  params: {
    id: string
  }
}

export default function ProjectPageWrapper(props: { params: { id: string } }) {
  const params = props.params;
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [project, setProject] = useState<any>(null);
  const [audits, setAudits] = useState<any[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    seoScore: 0,
    position: "N/A",
    crawlStatus: "pending",
    lastCrawl: "Never",
    pendingTasks: 0,
    completedTasks: 0,
    fixesNeeded: 0
  });
  const [trends, setTrends] = useState({
    seoScoreTrend: {
      value: "+0",
      isPositive: true,
      label: "from last month"
    },
    positionTrend: {
      value: "-0.8",
      isPositive: true,
      label: "from last month"
    },
    pendingTasksTrend: {
      value: "-3",
      isPositive: true,
      label: "from last month"
    },
    completedTasksTrend: {
      value: "+5",
      isPositive: true,
      label: "from last month"
    },
    fixesNeededTrend: {
      value: "+0",
      isPositive: true,
      label: "from last month"
    }
  });

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
      
      // Refresh audit data when a new audit is started
      if (projectId) {
        refreshAuditData(projectId);
      }
    }
  }, [searchParams, toast, projectId]);

  // Function to refresh just the audit data
  async function refreshAuditData(pid: string) {
    try {
      const supabase = createClient();
      
      // Get latest audits for this project
      const { data: auditData, error: auditError } = await supabase
        .from("audits")
        .select("*")
        .eq("project_id", pid)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (auditError) {
        console.error("Error fetching audits:", auditError);
      } else {
        setAudits(auditData);
        
        // Update metrics with the latest audit data
        const latestAudit = auditData && auditData.length > 0 ? auditData[0] : null;
        
        if (latestAudit) {
          setMetrics(prev => ({
            ...prev,
            crawlStatus: latestAudit.status || "pending",
            lastCrawl: new Date(latestAudit.created_at).toLocaleDateString()
          }));
        }
      }
    } catch (err) {
      console.error("Error refreshing audit data:", err);
    }
  }

  // Fetch data when projectId is available
  useEffect(() => {
    async function fetchData() {
      if (!projectId) return;
      
      try {
        setLoading(true);
        const supabase = createClient();
        
        // Check if user is authenticated with robust error handling
        try {
          // Try to get user directly first
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          
          if (authError || !user) {
            console.log("User not found, attempting to refresh session...");
            const { data: refreshData } = await supabase.auth.refreshSession();
            
            if (!refreshData.session) {
              console.log("No session after refresh, redirecting to login");
              window.location.href = "/auth/login";
              return;
            }
          }
        } catch (authError) {
          console.error("Authentication error:", authError);
          window.location.href = "/auth/login";
          return;
        }
        
        // Get project data
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();
        
        if (projectError) {
          setError(projectError.message);
          setLoading(false);
          return;
        }
        
        setProject(projectData);
        
        // Get latest audits for this project
        const { data: auditData, error: auditError } = await supabase
          .from("audits")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(10);
        
        if (auditError) {
          console.error("Error fetching audits:", auditError);
        } else {
          setAudits(auditData);
        }
        
        // Get tasks for this project
        const { data: todoData, error: todoError } = await supabase
          .from("todos")
          .select("*")
          .eq("project_id", projectId)
          .order("priority", { ascending: false })
          .order("created_at", { ascending: false });
        
        if (todoError) {
          console.error("Error fetching todos:", todoError);
        } else {
          setTodos(todoData);
        }
        
        // Get latest metrics from audit_metrics_history
        const { data: metricsData, error: metricsError } = await supabase
          .from("audit_metrics_history")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(1);
          
        if (metricsError) {
          console.error("Error fetching metrics history:", metricsError);
        }
        
        // Get metrics from one month ago for comparison
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        
        const { data: previousMonthMetrics, error: previousMetricsError } = await supabase
          .from("audit_metrics_history")
          .select("*")
          .eq("project_id", projectId)
          .gte('created_at', twoMonthsAgo.toISOString())
          .lt('created_at', oneMonthAgo.toISOString())
          .order("created_at", { ascending: false })
          .limit(1);
          
        if (previousMetricsError) {
          console.error("Error fetching previous metrics:", previousMetricsError);
        }
        
        // Use the latest audit score or metrics data
        const latestAudit = auditData && auditData.length > 0 ? auditData[0] : null;
        const latestMetrics = metricsData && metricsData.length > 0 ? metricsData[0] : null;
        const previousMetrics = previousMonthMetrics && previousMonthMetrics.length > 0 ? previousMonthMetrics[0] : null;
        
        // Get metrics from our new metrics history if available, otherwise fallback to audit data
        const seoScore = latestMetrics?.overall_score || latestAudit?.score || 0;
        const fixesNeeded = latestMetrics?.fixes_needed || 0;
        
        // Calculate metric changes for trends
        const previousScore = previousMetrics?.overall_score || 0;
        const previousFixesNeeded = previousMetrics?.fixes_needed || 0;
        
        const scoreChange = seoScore - previousScore;
        const fixesChange = previousFixesNeeded - fixesNeeded; // Negative means fewer fixes (improvement)
        
        // Count pending and completed tasks
        const pendingTasks = todoData ? todoData.filter(todo => todo.status === 'pending').length : 0;
        const completedTasks = todoData ? todoData.filter(todo => todo.status === 'completed').length : 0;
        
        // Update metrics and trends
        setMetrics({
          seoScore,
          position: "#4", // Placeholder for now
          crawlStatus: latestAudit?.status || "pending",
          lastCrawl: latestAudit ? new Date(latestAudit.created_at).toLocaleDateString() : "Never",
          pendingTasks,
          completedTasks,
          fixesNeeded
        });
        
        setTrends({
          seoScoreTrend: {
            value: scoreChange > 0 ? `+${scoreChange}` : String(scoreChange),
            isPositive: scoreChange >= 0,
            label: "from last month"
          },
          positionTrend: {
            value: "-0.8", // Placeholder for now
            isPositive: true,
            label: "from last month"
          },
          pendingTasksTrend: {
            value: "-3", // Placeholder for now
            isPositive: true,
            label: "from last month"
          },
          completedTasksTrend: {
            value: "+5", // Placeholder for now
            isPositive: true,
            label: "from last month"
          },
          fixesNeededTrend: {
            value: fixesChange > 0 ? `+${fixesChange}` : String(fixesChange),
            isPositive: fixesChange <= 0, // Fewer fixes is better
            label: "from last month"
          }
        });
        
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
          title="Fixes Needed"
          value={metrics.fixesNeeded}
          description="Issues to resolve"
          iconName="trending"
          trend={trends.fixesNeededTrend}
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
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={async () => {
                      try {
                        // Show starting toast immediately
                        toast({
                          title: "Starting Audit",
                          description: "Your audit is being set up...",
                        });
                        
                        // Make the API call to start the audit
                        const response = await fetch(`/api/projects/${project.id}/quick-audit`, {
                          method: 'GET',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                        });
                        
                        if (response.ok) {
                          // If successful, update the URL parameter for history
                          const url = new URL(window.location.href);
                          url.searchParams.set('success', 'audit_started');
                          window.history.pushState({}, '', url);
                          
                          // Show success toast
                          toast({
                            title: "Audit Started",
                            description: "Your audit has been started successfully.",
                          });
                          
                          // Get the audit ID from the response
                          const data = await response.json();
                          if (data.auditId) {
                            // Refresh audit data immediately
                            refreshAuditData(project.id);
                            
                            // Poll until audit is complete
                            pollAuditUntilComplete(
                              data.auditId,
                              30, // Check up to 30 times
                              5000, // Every 5 seconds
                              (status) => {
                                // Update UI on each status check
                                refreshAuditData(project.id);
                                
                                // If status changes to completed, show a notification
                                if (status.status === "completed") {
                                  toast({
                                    title: "Audit Completed",
                                    description: "Your SEO audit has finished processing.",
                                  });
                                } else if (status.status === "failed") {
                                  toast({
                                    title: "Audit Failed",
                                    description: "There was a problem processing your audit.",
                                    variant: "destructive",
                                  });
                                }
                              }
                            ).catch(err => {
                              console.error("Error polling audit status:", err);
                            });
                          } else {
                            // No audit ID in response, set up a simple interval
                            const intervalId = setInterval(() => {
                              refreshAuditData(project.id);
                            }, 5000); // Poll every 5 seconds
                            
                            // Clear the interval after 2.5 minutes (30 polls)
                            setTimeout(() => {
                              clearInterval(intervalId);
                            }, 150000);
                          }
                        } else {
                          // Handle error
                          const errorData = await response.json();
                          toast({
                            title: "Error Starting Audit",
                            description: errorData.message || "There was an error starting the audit.",
                            variant: "destructive",
                          });
                        }
                      } catch (error) {
                        console.error("Error starting audit:", error);
                        toast({
                          title: "Error",
                          description: "There was an unexpected error starting the audit.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                      <Search className="mr-2 h-4 w-4" />
                      Quick Audit
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
          
          {/* Performance Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>SEO metrics over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {audits && audits.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={audits.map(audit => {
                    // Convert audit to chart data
                    return {
                      date: new Date(audit.created_at).toLocaleDateString(),
                      score: audit.score || 0,
                      fixes: audit.fixes_needed || 0
                    };
                  }).reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" orientation="left" domain={[0, 100]} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, Math.max(...audits.map(a => a.fixes_needed || 0)) + 5]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="score"
                      name="SEO Score"
                      stroke="#0066cc"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="fixes"
                      name="Fixes Needed"
                      stroke="#ff6b6b"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <LucideLineChart className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Performance data will appear here after multiple audits
                </p>
              </div>
              )}
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
                <Button 
                  onClick={async () => {
                    try {
                      // Show starting toast immediately
                      toast({
                        title: "Starting Audit",
                        description: "Your audit is being set up...",
                      });
                      
                      // Make the API call to start the audit
                      const response = await fetch(`/api/projects/${project.id}/quick-audit`, {
                        method: 'GET',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                      });
                      
                      if (response.ok) {
                        // If successful, update the URL parameter for history
                        const url = new URL(window.location.href);
                        url.searchParams.set('success', 'audit_started');
                        window.history.pushState({}, '', url);
                        
                        // Show success toast
                        toast({
                          title: "Audit Started",
                          description: "Your audit has been started successfully.",
                        });
                        
                        // Get the audit ID from the response
                        const data = await response.json();
                        if (data.auditId) {
                          // Refresh audit data immediately
                          refreshAuditData(project.id);
                          
                          // Poll until audit is complete
                          pollAuditUntilComplete(
                            data.auditId,
                            30, // Check up to 30 times
                            5000, // Every 5 seconds
                            (status) => {
                              // Update UI on each status check
                              refreshAuditData(project.id);
                              
                              // If status changes to completed, show a notification
                              if (status.status === "completed") {
                                toast({
                                  title: "Audit Completed",
                                  description: "Your SEO audit has finished processing.",
                                });
                              } else if (status.status === "failed") {
                                toast({
                                  title: "Audit Failed",
                                  description: "There was a problem processing your audit.",
                                  variant: "destructive",
                                });
                              }
                            }
                          ).catch(err => {
                            console.error("Error polling audit status:", err);
                          });
                        } else {
                          // No audit ID in response, set up a simple interval
                          const intervalId = setInterval(() => {
                            refreshAuditData(project.id);
                          }, 5000); // Poll every 5 seconds
                          
                          // Clear the interval after 2.5 minutes (30 polls)
                          setTimeout(() => {
                            clearInterval(intervalId);
                          }, 150000);
                        }
                      } else {
                        // Handle error
                        const errorData = await response.json();
                        toast({
                          title: "Error Starting Audit",
                          description: errorData.message || "There was an error starting the audit.",
                          variant: "destructive",
                        });
                      }
                    } catch (error) {
                      console.error("Error starting audit:", error);
                      toast({
                        title: "Error",
                        description: "There was an unexpected error starting the audit.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                    <Search className="mr-2 h-4 w-4" />
                    Run New Audit
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