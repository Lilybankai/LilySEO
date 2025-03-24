"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { addTodoItem } from "@/lib/client-todo-service"
import { getAuditDetails } from "@/lib/crawler-service-client"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { notFound, useRouter } from "next/navigation"

interface TodoButtonProps {
  issueId: string
  recommendation: string
  projectId: string
  auditId: string
}

export function TodoButton({ issueId, recommendation, projectId, auditId }: TodoButtonProps) {
  const [isAdding, setIsAdding] = useState(false)

  const handleClick = async () => {
    setIsAdding(true)
    try {
      await addTodoItem({
        projectId,
        auditId,
        title: `Fix: ${issueId}`,
        description: recommendation,
        priority: "medium",
        status: "pending"
      })
    } catch (error) {
      console.error("Failed to add todo item:", error)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isAdding}
    >
      {isAdding ? "Adding..." : "Add to Todo"}
    </Button>
  )
}

export default function AuditDetailsPage({ params }: { params: { id: string, auditId: string } }) {
  const [audit, setAudit] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchAuditDetails() {
      try {
        setLoading(true)
        const auditData = await getAuditDetails(params.auditId)
        setAudit(auditData)
      } catch (err) {
        console.error("Error fetching audit details:", err)
        setError("Failed to load audit details")
      } finally {
        setLoading(false)
      }
    }

    fetchAuditDetails()
  }, [params.auditId])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>
            There was a problem loading the audit details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button className="mt-4" onClick={() => router.back()}>
            Go Back
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!audit) {
    return notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Audit Results</h1>
        <p className="text-muted-foreground">
          Audit for {audit.url || "Unknown URL"} completed on {new Date(audit.createdAt).toLocaleDateString()}
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Overview</CardTitle>
              <CardDescription>
                A summary of the audit results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Display audit overview data */}
              <pre className="p-4 rounded bg-muted overflow-auto text-xs">
                {JSON.stringify(audit, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="issues" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Issues Found</CardTitle>
              <CardDescription>
                Problems that need to be addressed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* This would be replaced with actual issues display */}
              <p>Issues content will go here</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="performance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Page speed and performance data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* This would be replaced with actual performance metrics */}
              <p>Performance content will go here</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="seo" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Analysis</CardTitle>
              <CardDescription>
                Search engine optimization details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* This would be replaced with actual SEO analysis */}
              <p>SEO content will go here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 