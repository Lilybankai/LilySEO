"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { exportAuditToPdf, checkPdfExportStatus, checkPdfProAccess } from "@/services/pdf-export";
import { PDFPreview } from "@/components/pdf";

// Import sub-components
import { AuditOverview } from "./sections/audit-overview";
import { AuditIssues } from "./sections/audit-issues";
import { AuditPerformance } from "./sections/audit-performance";
import { AuditKeywords } from "./sections/audit-keywords";
import { AuditBacklinks } from "./sections/audit-backlinks";
import { AuditCompetitors } from "./sections/audit-competitors";
import { AuditGoogleData } from "./sections/audit-google-data";
import { SchemaValidationSection } from "./sections/schema-validation-section";
import { InternalLinksSection } from "./sections/internal-links-section";

interface EnhancedAuditReportProps {
  audit: {
    id: string;
    projectId: string;
    status: string;
    score: number;
    report: {
      score: {
        overall: number;
        categories: {
          onPageSeo: number;
          performance: number;
          usability: number;
          links: number;
          social: number;
        };
      };
      issues: {
        metaDescription: Array<any>;
        titleTags: Array<any>;
        headings: Array<any>;
        images: Array<any>;
        links: Array<any>;
        canonicalLinks: Array<any>;
        schemaMarkup: Array<any>;
        performance: Array<any>;
        mobile: Array<any>;
        security: Array<any>;
      };
      pageSpeed: {
        mobile: any;
        desktop: any;
      };
      keywords: Array<any>;
      backlinks: Array<any>;
      competitors: Array<any>;
      internalLinkData?: {
        orphanedPages: string[];
        lowInboundPages: {url: string, count: number}[];
        topPages: {url: string, inboundCount: number}[];
        suggestions: {target: string, sources: string[], reason: string}[];
        graph: {
          nodes: Array<{id: string, inboundCount: number, outboundCount: number}>;
          links: Array<{source: string, target: string, text: string}>;
        };
      };
      googleData?: {
        searchConsole?: any;
        analytics?: any;
      };
      keywordsHistory?: {
        [keywordId: string]: Array<{
          date: string;
          rank: number;
        }>;
      };
    };
    createdAt: string;
    updatedAt: string;
  };
  project: {
    id: string;
    name: string;
    url: string;
    whiteLabelSettings?: {
      enabled: boolean;
      logo?: string;
      primaryColor?: string;
      companyName?: string;
    };
  };
  onAddToTodo: (issueId: string, recommendation: string, options?: { scheduledFor?: string; assigneeId?: string }) => Promise<void>;
}

export function EnhancedAuditReport({ audit, project, onAddToTodo }: EnhancedAuditReportProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [whiteLabel, setWhiteLabel] = useState(null);
  const { toast } = useToast();

  // Handle PDF export
  const handleExportPdf = async () => {
    try {
      setIsLoading(true);
      
      // Check if user has pro access
      const hasProAccess = await checkPdfProAccess();
      setIsPro(hasProAccess);
      
      // We're now using the client-side approach, so we don't need to fetch extra data
      // Just open the PDF preview dialog
      setIsPdfPreviewOpen(true);
    } catch (error) {
      toast({
        title: "Error Preparing PDF",
        description: "There was an error preparing your PDF. Please try again.",
        variant: "destructive",
      });
      
      console.error("PDF export error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-2xl font-bold">SEO Audit Report</h2>
        <Button
          variant="outline"
          onClick={handleExportPdf}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          {isLoading ? "Preparing..." : "Export PDF"}
        </Button>
      </div>
      
      {/* PDF Preview Dialog */}
      <PDFPreview 
        auditData={audit}
        isOpen={isPdfPreviewOpen}
        onClose={() => setIsPdfPreviewOpen(false)}
        whiteLabel={project.whiteLabelSettings || null}
        isProUser={isPro}
      />
      
      <Tabs 
        defaultValue="overview" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <ScrollArea className="w-full">
          <TabsList className="grid grid-cols-8 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="structured-data">Structured Data</TabsTrigger>
            <TabsTrigger value="internal-links">Internal Links</TabsTrigger>
            <TabsTrigger value="backlinks">Backlinks</TabsTrigger>
            <TabsTrigger value="competitors">Competitors</TabsTrigger>
            {audit.report && audit.report.googleData && (
              <TabsTrigger value="google-data">Google Data</TabsTrigger>
            )}
          </TabsList>
        </ScrollArea>

        <div className="p-6">
          <TabsContent value="overview" className="mt-0">
            {audit.report && audit.report.score ? (
              <AuditOverview 
                score={audit.report.score} 
                issues={audit.report.issues}
                createdAt={audit.createdAt}
                projectUrl={project.url}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Audit Overview</CardTitle>
                  <CardDescription>No audit data available</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">This audit's report data is not available or is still being processed.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="issues" className="mt-0">
            {audit.report && audit.report.issues ? (
              <AuditIssues 
                issues={audit.report.issues} 
                onAddToTodo={onAddToTodo}
                projectUrl={project.url}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Audit Issues</CardTitle>
                  <CardDescription>No issues data available</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">This audit's issues data is not available or is still being processed.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="performance" className="mt-0">
            {audit.report && audit.report.pageSpeed ? (
              <AuditPerformance 
                pageSpeed={audit.report.pageSpeed}
                performanceIssues={audit.report.issues.performance}
                projectUrl={project.url}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Performance Analysis</CardTitle>
                  <CardDescription>No performance data available</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">This audit's performance data is not available or is still being processed.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="structured-data" className="mt-0">
            {audit.report && audit.report.issues && audit.report.issues.schemaMarkup ? (
              <SchemaValidationSection 
                schemaIssues={audit.report.issues.schemaMarkup}
                onAddToTodo={onAddToTodo}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Structured Data Validation</CardTitle>
                  <CardDescription>No structured data validation information available</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">This audit's structured data validation information is not available or is still being processed.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="internal-links" className="mt-0">
            {audit.report && audit.report.internalLinkData ? (
              <InternalLinksSection 
                internalLinkData={audit.report.internalLinkData}
                baseUrl={project.url}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Internal Link Optimization</CardTitle>
                  <CardDescription>No internal link data available</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">This audit's internal link data is not available or is still being processed.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="keywords" className="mt-0">
            {audit.report && audit.report.keywords ? (
              <AuditKeywords 
                keywords={audit.report.keywords}
                projectUrl={project.url}
                historyData={audit.report.keywordsHistory}
                onExportPdf={() => {
                  setActiveTab("keywords");
                  handleExportPdf();
                }}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Keyword Analysis</CardTitle>
                  <CardDescription>No keyword data available</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">This audit's keyword data is not available or is still being processed.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="backlinks" className="mt-0">
            {audit.report && audit.report.backlinks ? (
              <AuditBacklinks 
                backlinks={audit.report.backlinks}
                projectUrl={project.url}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Backlink Analysis</CardTitle>
                  <CardDescription>No backlink data available</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">This audit's backlink data is not available or is still being processed.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="competitors" className="space-y-4">
            {audit.report && audit.report.competitors ? (
              <AuditCompetitors 
                competitors={audit.report.competitors}
                domainAuthority={30}
                rankPosition={100000}
                domainName={project.url.replace(/^https?:\/\//, '')}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Competitor Analysis</CardTitle>
                  <CardDescription>No competitor data available</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">This audit's competitor analysis data is not available or is still being processed.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {audit.report && audit.report.googleData && (
            <TabsContent value="google-data" className="space-y-4">
              <AuditGoogleData 
                googleData={{
                  clicks: audit.report.googleData.searchConsole?.clicks || 0,
                  impressions: audit.report.googleData.searchConsole?.impressions || 0,
                  ctr: audit.report.googleData.searchConsole?.ctr || 0,
                  position: audit.report.googleData.searchConsole?.position || 0,
                  clicksChange: audit.report.googleData.searchConsole?.clicksChange || 0,
                  impressionsChange: audit.report.googleData.searchConsole?.impressionsChange || 0,
                  ctrChange: audit.report.googleData.searchConsole?.ctrChange || 0,
                  positionChange: audit.report.googleData.searchConsole?.positionChange || 0,
                  topQueries: audit.report.googleData.searchConsole?.topQueries || [],
                  topPages: audit.report.googleData.searchConsole?.topPages || [],
                  performance: audit.report.googleData.searchConsole?.performance || []
                }}
              />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </Card>
  );
} 