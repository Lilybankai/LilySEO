"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Globe, Settings, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const auditFormSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL" }),
  projectId: z.string().min(1, { message: "Please select a project" }),
  description: z.string().optional(),
  auditOptions: z.object({
    checkMobile: z.boolean().default(true),
    checkPerformance: z.boolean().default(true),
    checkSecurity: z.boolean().default(true),
    checkSeo: z.boolean().default(true),
    checkAccessibility: z.boolean().default(true),
  }),
  auditDepth: z.enum(["basic", "standard", "deep"]).default("standard"),
})

type AuditFormValues = z.infer<typeof auditFormSchema>

interface Project {
  id: string
  name: string
  url: string
}

interface AuditCreationFormProps {
  projects: Project[]
  initialUrl?: string
  initialProjectId?: string
}

export function AuditCreationForm({ projects, initialUrl = "", initialProjectId = "" }: AuditCreationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<AuditFormValues>({
    resolver: zodResolver(auditFormSchema),
    defaultValues: {
      url: initialUrl,
      projectId: initialProjectId,
      description: "",
      auditOptions: {
        checkMobile: true,
        checkPerformance: true,
        checkSecurity: true,
        checkSeo: true,
        checkAccessibility: true,
      },
      auditDepth: "standard",
    },
  })

  const onSubmit = async (data: AuditFormValues) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/audits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create audit")
      }

      const result = await response.json()

      toast({
        title: "Audit created successfully",
        description: "Your SEO audit has been initiated and will be ready soon.",
      })

      // Redirect to the audit details page
      router.push(`/projects/${data.projectId}/audits/${result.id}`)
    } catch (err) {
      console.error("Error creating audit:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
      
      toast({
        variant: "destructive",
        title: "Failed to create audit",
        description: err instanceof Error ? err.message : "An unexpected error occurred",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auto-fill URL when project changes
  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (project && !form.getValues("url")) {
      form.setValue("url", project.url)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create New SEO Audit</CardTitle>
        <CardDescription>
          Analyze a website for SEO issues, performance problems, and more
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value)
                      handleProjectChange(value)
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the project this audit belongs to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL to Audit</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="https://example.com" {...field} />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Enter the full URL of the website you want to audit
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add notes about this audit..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Add any additional notes or context for this audit
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel>Audit Options</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="auditOptions.checkSeo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>SEO Analysis</FormLabel>
                        <FormDescription>
                          Check meta tags, headings, content, and more
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="auditOptions.checkPerformance"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Performance</FormLabel>
                        <FormDescription>
                          Analyze page speed and loading performance
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="auditOptions.checkMobile"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Mobile Friendliness</FormLabel>
                        <FormDescription>
                          Test how well the site works on mobile devices
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="auditOptions.checkAccessibility"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Accessibility</FormLabel>
                        <FormDescription>
                          Check for accessibility issues and WCAG compliance
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="auditOptions.checkSecurity"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Security</FormLabel>
                        <FormDescription>
                          Scan for common security vulnerabilities
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="auditDepth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Audit Depth</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select audit depth" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="basic">Basic (Homepage only)</SelectItem>
                      <SelectItem value="standard">Standard (Up to 10 pages)</SelectItem>
                      <SelectItem value="deep">Deep (Up to 50 pages)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose how thoroughly to scan the website
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button 
          onClick={form.handleSubmit(onSubmit)} 
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Creating Audit..." : "Start Audit"}
        </Button>
      </CardFooter>
    </Card>
  )
} 