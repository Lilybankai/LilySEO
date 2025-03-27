"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IssuesTable } from "@/components/audits/sections/issues-table"
import { Badge } from "@/components/ui/badge"
import { Check, XCircle, AlertTriangle, Code } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SchemaValidationSectionProps {
  schemaIssues: any[];
  onAddToTodo?: (issueId: string, recommendation: string) => void;
  projectId?: string;
  auditId?: string;
}

export function SchemaValidationSection({ 
  schemaIssues,
  onAddToTodo,
  projectId,
  auditId
}: SchemaValidationSectionProps) {
  if (!schemaIssues || schemaIssues.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Code className="h-5 w-5" />
            Structured Data Validation
          </h3>
          <p className="text-muted-foreground">
            Analysis of your schema.org markup and structured data
          </p>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Structured Data Validation Passed
            </CardTitle>
            <CardDescription>
              No schema markup issues were detected on your website.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Proper structured data helps search engines understand your content and can enable rich results in search.
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    JSON-LD
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    Schema.org
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    Rich Results
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-center bg-green-50 dark:bg-green-900/20 w-16 h-16 rounded-full">
                <Check className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Count issues by type
  const missingSchemaCount = schemaIssues.filter(issue => 
    issue.schemaDetails?.missingSchema).length;
  const invalidSyntaxCount = schemaIssues.filter(issue => 
    issue.title?.includes('Invalid schema')).length;
  const incompleteCount = schemaIssues.filter(issue => 
    !issue.schemaDetails?.missingSchema && 
    !issue.title?.includes('Invalid schema')).length;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Code className="h-5 w-5" />
          Structured Data Validation
        </h3>
        <p className="text-muted-foreground">
          Analysis of your schema.org markup and structured data
        </p>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {schemaIssues.length} Structured Data {schemaIssues.length === 1 ? 'Issue' : 'Issues'} Found
          </CardTitle>
          <CardDescription>
            Addressing these issues can improve how search engines understand your content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex items-center gap-3">
              <div className="flex items-center justify-center bg-red-100 dark:bg-red-800/50 w-10 h-10 rounded-full">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <div className="text-sm font-medium">Missing Schema</div>
                <div className="text-lg font-semibold">{missingSchemaCount}</div>
              </div>
            </div>
            <div className="flex-1 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg flex items-center gap-3">
              <div className="flex items-center justify-center bg-amber-100 dark:bg-amber-800/50 w-10 h-10 rounded-full">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <div className="text-sm font-medium">Invalid Syntax</div>
                <div className="text-lg font-semibold">{invalidSyntaxCount}</div>
              </div>
            </div>
            <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-center gap-3">
              <div className="flex items-center justify-center bg-blue-100 dark:bg-blue-800/50 w-10 h-10 rounded-full">
                <Code className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-sm font-medium">Incomplete Schema</div>
                <div className="text-lg font-semibold">{incompleteCount}</div>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground mb-6">
            <p>
              Structured data helps search engines understand your content better, potentially enabling rich results 
              in search. Implementing proper schema.org markup is an important technical SEO factor.
            </p>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("https://search.google.com/test/rich-results", "_blank")}
            >
              Test Rich Results
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("https://schema.org/docs/schemas.html", "_blank")}
            >
              Schema.org Reference
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <IssuesTable
        title="Schema Markup Issues"
        description="Problems with structured data implementation"
        issues={schemaIssues}
        category="schema"
        onAddToTodo={onAddToTodo}
        projectId={projectId}
        auditId={auditId}
      />
      
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Schema Markup Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Use JSON-LD format (preferred by Google) instead of Microdata or RDFa</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Always include @context and @type properties</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Include all required properties for your specific schema type</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Test your implementation with Google's Rich Results Test</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Use appropriate schema types for your content (WebPage, Article, Product, etc.)</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
} 