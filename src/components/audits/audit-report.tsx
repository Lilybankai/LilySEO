import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LegacySeoReport } from "@/services/seo-analysis";
import { generateSeoReportPdf, downloadPdf } from "@/services/pdf-report";
import { Loader2, Download, Trash2 } from "lucide-react";
import { 
  generateSeoScoreRadarChart, 
  generatePageSpeedBarChart,
  generateIssueDistributionPieChart
} from "@/services/data-visualization";
import { AuditScoreCard } from "./audit-score-card";
import { AuditIssuesList } from "./audit-issues-list";
import { AuditPageSpeedMetrics } from "./audit-pagespeed-metrics";
import { AuditKeywords } from "./audit-keywords";
import { AuditCharts } from "./audit-charts";

interface AuditReportProps {
  auditId: string;
  projectId: string;
  projectName: string;
  report: LegacySeoReport;
}

export function AuditReport({ auditId, projectId, projectName, report }: AuditReportProps) {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Generate chart data
  const radarChartData = generateSeoScoreRadarChart(report);
  const barChartData = generatePageSpeedBarChart(report);
  const pieChartData = generateIssueDistributionPieChart(report);
  
  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    
    try {
      const pdfBlob = await generateSeoReportPdf(report, projectName);
      downloadPdf(pdfBlob, `${projectName}-seo-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF report downloaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to download PDF report");
    } finally {
      setIsDownloading(false);
    }
  };
  
  const handleDeleteAudit = async () => {
    if (!confirm("Are you sure you want to delete this audit report? This action cannot be undone.")) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/audits/${auditId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete audit report");
      }
      
      toast.success("Audit report deleted successfully");
      router.push(`/dashboard/projects/${projectId}/audits`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An error occurred while deleting the audit report");
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">SEO Audit Report</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
          >
            {isDownloading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDownloading ? "Downloading..." : "Download PDF"}
            {!isDownloading && <Download className="ml-2 h-4 w-4" />}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteAudit}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? "Deleting..." : "Delete Report"}
            {!isDeleting && <Trash2 className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AuditScoreCard
          title="Overall Score"
          score={report.score.overall}
          description="Your website's overall SEO score"
        />
        <AuditScoreCard
          title="Pages Crawled"
          score={report.pagesCrawled}
          description="Number of pages analyzed"
          showAsNumber
        />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Audit Date</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Date(report.crawlDate).toLocaleDateString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(report.crawlDate).toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>SEO Score Breakdown</CardTitle>
              <CardDescription>
                Detailed breakdown of your website's SEO score by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <AuditScoreCard
                  title="On-Page SEO"
                  score={report.score.categories.onPageSeo}
                  description="Meta tags, headings, content"
                  compact
                />
                <AuditScoreCard
                  title="Performance"
                  score={report.score.categories.performance}
                  description="Page speed, loading time"
                  compact
                />
                <AuditScoreCard
                  title="Usability"
                  score={report.score.categories.usability}
                  description="Mobile-friendliness, UX"
                  compact
                />
                <AuditScoreCard
                  title="Links"
                  score={report.score.categories.links}
                  description="Internal & external links"
                  compact
                />
                <AuditScoreCard
                  title="Social"
                  score={report.score.categories.social}
                  description="Social media integration"
                  compact
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Issues Summary</CardTitle>
              <CardDescription>
                Overview of issues found during the audit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                  <span className="text-2xl font-bold">{report.issues.metaDescription.length}</span>
                  <span className="text-sm text-muted-foreground">Meta Description</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                  <span className="text-2xl font-bold">{report.issues.titleTags.length}</span>
                  <span className="text-sm text-muted-foreground">Title Tags</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                  <span className="text-2xl font-bold">{report.issues.headings.length}</span>
                  <span className="text-sm text-muted-foreground">Headings</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                  <span className="text-2xl font-bold">{report.issues.images.length}</span>
                  <span className="text-sm text-muted-foreground">Images</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                  <span className="text-2xl font-bold">{report.issues.links.length}</span>
                  <span className="text-sm text-muted-foreground">Links</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="issues" className="mt-4">
          <AuditIssuesList report={report} />
        </TabsContent>
        
        <TabsContent value="performance" className="mt-4">
          <AuditPageSpeedMetrics report={report} />
        </TabsContent>
        
        <TabsContent value="keywords" className="mt-4">
          <AuditKeywords report={report} />
        </TabsContent>
        
        <TabsContent value="charts" className="mt-4">
          <AuditCharts
            radarChartData={radarChartData}
            barChartData={barChartData}
            pieChartData={pieChartData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 