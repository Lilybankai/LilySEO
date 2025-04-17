export const dynamic = 'force-dynamic';

import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { 
  ArrowDown, 
  ArrowUp, 
  BarChart3, 
  Clock, 
  Download, 
  FileText, 
  Filter, 
  Search, 
  SortAsc, 
  Eye,
  Calendar,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Trash2,
  FileOutput,
  CheckSquare
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { Database } from "@/lib/supabase/database.types"
import { AuditStatusBadge } from "@/components/audit-status-badge"
import { AuditFilters } from "@/components/audits/audit-filters"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AuditMetricCard } from "@/components/audits/audit-metric-card"
import { AuditComparisonChart } from "@/components/audits/audit-comparison-chart"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export const metadata: Metadata = {
  title: "SEO Audits | LilySEO",
  description: "View and analyze your SEO audit history",
}

// Define the type for audit with project data
type AuditWithProject = Database["public"]["Tables"]["audits"]["Row"] & {
  projects: { name: string } | null;
}

// Items per page for pagination
const ITEMS_PER_PAGE = 10

export default async function AuditsPage({
  searchParams,
}: {
  searchParams: {
    project?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    scoreMin?: string;
    scoreMax?: string;
    page?: string;
    deleted?: string;
  }
}) {
  const supabase = await createClient()
  
  // Get user data
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }
  
  // Parse the current page from URL params or default to 1
  const currentPage = searchParams.page ? parseInt(searchParams.page) : 1
  const from = (currentPage - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1
  
  // Check if we just deleted audits
  const hasDeletedAudits = searchParams.deleted === 'true'
  
  // Build query with filters for counting total items
  let countQuery = supabase
    .from("audits")
    .select("id", { count: "exact" })
  
  // Apply filters from searchParams to count query
  if (searchParams.project && searchParams.project !== 'all') {
    countQuery = countQuery.eq('project_id', searchParams.project)
  }
  
  if (searchParams.dateFrom) {
    countQuery = countQuery.gte('created_at', searchParams.dateFrom)
  }
  
  if (searchParams.dateTo) {
    countQuery = countQuery.lte('created_at', searchParams.dateTo)
  }
  
  if (searchParams.status && searchParams.status !== 'all') {
    countQuery = countQuery.eq('status', searchParams.status)
  }
  
  if (searchParams.scoreMin) {
    countQuery = countQuery.gte('score', searchParams.scoreMin)
  }
  
  if (searchParams.scoreMax) {
    countQuery = countQuery.lte('score', searchParams.scoreMax)
  }
  
  // Get total count of filtered audits
  const { count: totalCount } = await countQuery
  
  // Build query with filters for data
  let query = supabase
    .from("audits")
    .select(`
      id,
      url,
      created_at,
      updated_at,
      report,
      project_id,
      status,
      score,
      projects:project_id (name)
    `)
    .order("created_at", { ascending: false })
  
  // Apply filters from searchParams
  if (searchParams.project && searchParams.project !== 'all') {
    query = query.eq('project_id', searchParams.project)
  }
  
  if (searchParams.dateFrom) {
    query = query.gte('created_at', searchParams.dateFrom)
  }
  
  if (searchParams.dateTo) {
    query = query.lte('created_at', searchParams.dateTo)
  }
  
  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('status', searchParams.status)
  }
  
  if (searchParams.scoreMin) {
    query = query.gte('score', searchParams.scoreMin)
  }
  
  if (searchParams.scoreMax) {
    query = query.lte('score', searchParams.scoreMax)
  }
  
  // Apply pagination
  query = query.range(from, to)
  
  // Get audit data
  const { data: audits } = await query as { data: AuditWithProject[] | null }
  
  // Get all projects for filter dropdown
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .order("name")
  
  // Get all audits for metrics and charts (without pagination)
  const { data: allAudits } = await supabase
    .from("audits")
    .select(`
      id,
      created_at,
      status,
      score,
      project_id
    `)
  
  // Get metrics for summary from all audits
  const totalAudits = allAudits?.length || 0
  const completedAudits = allAudits?.filter(audit => audit.status === 'completed').length || 0
  const pendingAudits = allAudits?.filter(audit => ['pending', 'processing'].includes(audit.status)).length || 0
  const failedAudits = allAudits?.filter(audit => audit.status === 'failed').length || 0
  
  // Calculate average score
  const validScores = allAudits?.filter(audit => audit.score !== null).map(audit => audit.score) || []
  const averageScore = validScores.length > 0 
    ? Math.round(validScores.reduce((sum, score) => sum + (score || 0), 0) / validScores.length)
    : 0
  
  // Prepare data for comparison
  // Calculate month-over-month metrics
  const currentDate = new Date()
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(currentDate.getMonth() - 1)
  const twoMonthsAgo = new Date()
  twoMonthsAgo.setMonth(currentDate.getMonth() - 2)
  
  // Get audits from previous month for comparison
  const currentMonthAudits = allAudits?.filter(audit => 
    new Date(audit.created_at) >= oneMonthAgo && 
    new Date(audit.created_at) <= currentDate
  ) || []
  
  const previousMonthAudits = allAudits?.filter(audit => 
    new Date(audit.created_at) >= twoMonthsAgo && 
    new Date(audit.created_at) < oneMonthAgo
  ) || []
  
  // Calculate averages for both periods
  const currentMonthScores = currentMonthAudits
    .filter(audit => audit.score !== null)
    .map(audit => audit.score) || []
  
  const previousMonthScores = previousMonthAudits
    .filter(audit => audit.score !== null)
    .map(audit => audit.score) || []
  
  const currentMonthAverage = currentMonthScores.length > 0 
    ? Math.round(currentMonthScores.reduce((sum, score) => sum + (score || 0), 0) / currentMonthScores.length)
    : 0
  
  const previousMonthAverage = previousMonthScores.length > 0 
    ? Math.round(previousMonthScores.reduce((sum, score) => sum + (score || 0), 0) / previousMonthScores.length)
    : 0
  
  const scoreChange = currentMonthAverage - previousMonthAverage
  
  // Calculate pagination info
  const totalPages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE)
  const hasPreviousPage = currentPage > 1
  const hasNextPage = currentPage < totalPages
  
  // Function to generate page URL with current filters
  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(
      Object.entries(searchParams)
        .filter(([key]) => key !== 'page' && key !== 'deleted')
        .map(([key, value]) => [key, value || ''])
    )
    params.set('page', page.toString())
    return `/audits?${params.toString()}`
  }
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SEO Audits</h1>
          <p className="text-muted-foreground">
            View and analyze your SEO audit history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/projects">
              <Search className="mr-2 h-4 w-4" />
              New Audit
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Success notification */}
      {hasDeletedAudits && (
        <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">Selected audits have been deleted successfully.</span>
        </div>
      )}
      
      {/* Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AuditMetricCard
          title="Total Audits"
          value={totalAudits}
          description="All-time audit count"
          iconName="barChart"
        />
        <AuditMetricCard
          title="Average Score"
          value={`${averageScore}/100`}
          description="Across all completed audits"
          iconName="trending"
          trend={scoreChange !== 0 ? {
            value: scoreChange > 0 ? `+${scoreChange}` : `${scoreChange}`,
            isPositive: scoreChange > 0,
            label: "from last month"
          } : undefined}
        />
        <AuditMetricCard
          title="Completed Audits"
          value={completedAudits}
          description="Successful audits"
          iconName="check"
        />
        <AuditMetricCard
          title="Pending Audits"
          value={pendingAudits}
          description="In progress"
          iconName="clock"
        />
      </div>
      
      {/* Filters Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">
            <Filter className="inline mr-2 h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AuditFilters projects={projects || []} />
        </CardContent>
      </Card>
      
      {/* Audit Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            <ArrowRightLeft className="inline mr-2 h-4 w-4" />
            Month-Over-Month Comparison
          </CardTitle>
          <CardDescription>
            Compare your SEO scores and metrics over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="scores">
            <TabsList className="mb-4">
              <TabsTrigger value="scores">SEO Scores</TabsTrigger>
              <TabsTrigger value="counts">Audit Counts</TabsTrigger>
            </TabsList>
            <TabsContent value="scores">
              <div className="h-80">
                <AuditComparisonChart 
                  currentMonth={currentMonthAudits}
                  previousMonth={previousMonthAudits}
                  type="scores"
                />
              </div>
            </TabsContent>
            <TabsContent value="counts">
              <div className="h-80">
                <AuditComparisonChart 
                  currentMonth={currentMonthAudits}
                  previousMonth={previousMonthAudits}
                  type="counts"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Audits Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            Audit History
          </CardTitle>
          <CardDescription>
            View your recent SEO audits and their results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {audits && audits.length > 0 ? (
            <>
              {/* Bulk actions form */}
              <form action="/api/audits/bulk-action" method="POST">
                <div className="rounded-md border">
                  <div className="w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                          <th className="h-12 w-12 px-4 text-left align-middle font-medium">
                            <span className="sr-only">Select</span>
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Project</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">URL</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Date</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Score</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="[&_tr:last-child]:border-0">
                        {audits.map((audit) => (
                          <tr 
                            key={audit.id}
                            className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                          >
                            <td className="p-4 align-middle">
                              <Checkbox name="selectedAudits" value={audit.id} id={`audit-${audit.id}`} />
                            </td>
                            <td className="p-4 align-middle">{audit.projects?.name || 'Unknown Project'}</td>
                            <td className="p-4 align-middle max-w-[200px] truncate">{audit.url}</td>
                            <td className="p-4 align-middle">
                              {new Date(audit.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-4 align-middle font-medium">
                              {audit.score !== null ? `${audit.score}/100` : '-'}
                            </td>
                            <td className="p-4 align-middle">
                              <AuditStatusBadge status={audit.status} />
                            </td>
                            <td className="p-4 align-middle">
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" asChild disabled={audit.status !== 'completed'}>
                                  <Link href={`/audits/${audit.id}`}>
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">View</span>
                                  </Link>
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" disabled={audit.status !== 'completed'}>
                                      <FileOutput className="h-4 w-4" />
                                      <span className="sr-only">Export</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link href={`/api/audits/${audit.id}/export/pdf`}>
                                        Export as PDF
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <Link href={`/api/audits/${audit.id}/export/csv`}>
                                        Export as CSV
                                      </Link>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                      <span className="sr-only">Delete</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Audit?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this audit? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction asChild>
                                        <Link href={`/api/audits/${audit.id}/delete`}>
                                          Delete
                                        </Link>
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Bulk actions */}
                <div className="flex justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" type="button" className="gap-1">
                          <Trash2 className="h-4 w-4" />
                          Delete Selected
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Selected Audits?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the selected audits? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction asChild>
                            <Button type="submit" name="action" value="delete" form="bulk-action-form" variant="destructive">
                              Delete
                            </Button>
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-1">
                          <FileOutput className="h-4 w-4" />
                          Export Selected
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem asChild>
                          <Button type="submit" name="action" value="export-pdf" className="w-full justify-start" variant="ghost">
                            Export as PDF
                          </Button>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Button type="submit" name="action" value="export-csv" className="w-full justify-start" variant="ghost">
                            Export as CSV
                          </Button>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* Select all checkbox */}
                  <div className="flex items-center gap-2">
                    <Checkbox id="select-all" className="mr-2" />
                    <label htmlFor="select-all" className="text-sm">Select All</label>
                  </div>
                </div>
              </form>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between my-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {from + 1} to {Math.min(to + 1, totalCount || 0)} of {totalCount} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasPreviousPage}
                      asChild={hasPreviousPage}
                    >
                      {hasPreviousPage ? (
                        <Link href={getPageUrl(currentPage - 1)}>
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Link>
                      ) : (
                        <>
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </>
                      )}
                    </Button>
                    <div className="text-sm">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasNextPage}
                      asChild={hasNextPage}
                    >
                      {hasNextPage ? (
                        <Link href={getPageUrl(currentPage + 1)}>
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      ) : (
                        <>
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Search className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No audits found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {Object.keys(searchParams).length > 0 
                  ? "Try adjusting your filters to see more results." 
                  : "Run your first SEO audit to get started."}
              </p>
              {Object.keys(searchParams).length === 0 && (
                <Button className="mt-4" asChild>
                  <Link href="/projects">
                    <Search className="mr-2 h-4 w-4" />
                    Run New Audit
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 