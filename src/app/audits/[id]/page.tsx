import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Download, Share } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/server"
import { AuditReport } from "@/components/audits/audit-report"
import { Database } from "@/lib/supabase/database.types"

export const metadata: Metadata = {
  title: "Audit Details | LilySEO",
  description: "Detailed view of your SEO audit results",
}

type AuditWithProject = Database["public"]["Tables"]["audits"]["Row"] & {
  projects: { name: string } | null;
}

export default async function AuditDetailPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  
  // Get user data
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }
  
  // Get audit data with project info
  const { data: audit } = await supabase
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
    .eq("id", params.id)
    .single() as { data: AuditWithProject | null }
  
  if (!audit) {
    notFound()
  }
  
  // Redirect if the audit isn't completed yet
  if (audit.status !== "completed") {
    redirect(`/projects/${audit.project_id}?auditPending=true`)
  }
  
  // Parse the report data
  const reportData = audit.report as any
  
  return (
    <div className="space-y-8">
      {/* Header with navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="p-0" asChild>
              <Link href="/audits">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Audits
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">SEO Audit Results</h1>
          <p className="text-muted-foreground">
            {audit.projects?.name}{" "}
            <span className="mx-2">•</span>
            {new Date(audit.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={!audit.report}>
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
          <Button variant="outline">
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
      
      {/* Audit report content */}
      {reportData ? (
        <AuditReport 
          auditId={audit.id}
          projectId={audit.project_id}
          projectName={audit.projects?.name || "Unknown Project"}
          report={reportData}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Report Data Missing</CardTitle>
            <CardDescription>
              The audit report data is not available. This might be due to a processing error.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/projects/${audit.project_id}/audits/new`}>
                Run New Audit
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 