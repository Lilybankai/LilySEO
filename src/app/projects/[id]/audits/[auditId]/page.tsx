import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { addTodoItem } from "@/lib/todo-service";

// Import our new components
import { ExecutiveSummary } from "@/components/audits/sections/executive-summary";
import { ActionPlan } from "@/components/audits/sections/action-plan";
import { AuditNavigation } from "@/components/audits/sections/audit-navigation";
import { AuditHeader } from "@/components/audits/sections/audit-header";
import { PageSpeedSection } from "@/components/audits/sections/page-speed-section";
import { BacklinksSection } from "@/components/audits/sections/backlinks-section";
import { IssuesTable } from "@/components/audits/sections/issues-table";
import { AiRecommendations } from "@/components/audits/sections/ai-recommendations";

/**
 * Transforms the raw report data to the structure expected by components
 * If rawReport is null or undefined, returns a properly structured but empty report object
 */
function transformReportData(rawReport: any) {
  if (!rawReport) return createEmptyReport();
  
  // Normalize score to 0-100 scale if it's above 100
  const normalizeScore = (score: number) => {
    if (score > 100) {
      return Math.min(100, Math.round(score / 10));
    }
    return score;
  };
  
  // Extract SEO Issues from crawled pages
  const extractedIssues = extractIssuesFromCrawl(rawReport.crawledPages || []);
  
  // Process recommendations into proper AI recommendation format
  const aiRecommendations = processAiRecommendations(rawReport.recommendations || []);
  
  // Normalize the overall score and category scores
  const overallScore = normalizeScore(rawReport.summary?.score ?? 0);
  const categoryScores = {
    onPageSeo: normalizeScore(rawReport.summary?.categories?.content ?? 0),
    performance: normalizeScore(rawReport.summary?.categories?.performance ?? 0),
    usability: 0, // Not in raw data
    links: normalizeScore(rawReport.summary?.categories?.backlinks ?? 0),
    social: 0 // Not in raw data
  };
  
  console.log('Normalized overall score:', overallScore);
  console.log('Category scores:', categoryScores);
  console.log('Extracted issues:', Object.keys(extractedIssues).map(k => `${k}: ${extractedIssues[k].length} items`));
  console.log('AI recommendations:', aiRecommendations.length);
  
  return {
    score: {
      overall: overallScore,
      categories: categoryScores
    },
    issues: extractedIssues,
    pageSpeed: rawReport.pageSpeed || {
      mobile: { 
        performance: normalizeScore(rawReport.pageSpeed?.mobile?.performance ?? rawReport.summary?.categories?.performance ?? 0),
        cls: rawReport.pageSpeed?.mobile?.cls ?? 0,
        fcp: rawReport.pageSpeed?.mobile?.fcp ?? 0,
        lcp: rawReport.pageSpeed?.mobile?.lcp ?? 0,
        tbt: rawReport.pageSpeed?.mobile?.tbt ?? 0
      },
      desktop: { 
        performance: normalizeScore(rawReport.pageSpeed?.desktop?.performance ?? rawReport.summary?.categories?.performance ?? 0),
        cls: rawReport.pageSpeed?.desktop?.cls ?? 0,
        fcp: rawReport.pageSpeed?.desktop?.fcp ?? 0,
        lcp: rawReport.pageSpeed?.desktop?.lcp ?? 0,
        tbt: rawReport.pageSpeed?.desktop?.tbt ?? 0
      }
    },
    mozData: rawReport.mozData || {
      domainAuthority: 0,
      pageAuthority: 0,
      linkingDomains: 0,
      totalLinks: 0,
      topBacklinks: []
    },
    aiRecommendations: aiRecommendations,
    keywords: [] as any[],
    backlinks: (rawReport.mozData?.topBacklinks || []) as any[],
    competitors: [] as any[],
    crawledPages: rawReport.crawledPages || []
  };
}

/**
 * Extract actual SEO issues from crawled pages data
 */
function extractIssuesFromCrawl(crawledPages: any[]): Record<string, any[]> {
  const issues: Record<string, any[]> = {
    metaDescription: [],
    titleTags: [],
    headings: [],
    images: [],
    links: [],
    canonicalLinks: [],
    schemaMarkup: [],
    performance: [],
    mobile: [],
    security: []
  };

  // Process each crawled page to extract issues
  crawledPages.forEach((page, pageIndex) => {
    const url = page.url;
    
    // Check for missing/problematic meta descriptions
    if (!page.metaDescription || page.metaDescription.length < 50 || page.metaDescription.length > 160) {
      issues.metaDescription.push({
        url,
        title: `${page.metaDescription ? 'Problematic' : 'Missing'} meta description on ${new URL(url).pathname}`,
        description: page.metaDescription 
          ? `The meta description is ${page.metaDescription.length} characters long (recommended is 50-160 characters).` 
          : 'This page is missing a meta description, which is important for SEO and click-through rates.',
        priority: page.metaDescription ? 'medium' : 'high',
        current: page.metaDescription || 'No meta description',
        recommended: page.metaDescription 
          ? 'Create a descriptive meta description between 50-160 characters.' 
          : 'Add a descriptive meta description that summarizes the page content.',
        implementation: `Update the meta description tag in the <head> section of ${url}`
      });
    }
    
    // Check title tag issues (missing, too long, too short)
    if (!page.title || page.title.length < 30 || page.title.length > 60) {
      issues.titleTags.push({
        url,
        title: `${page.title ? 'Problematic' : 'Missing'} title tag on ${new URL(url).pathname}`,
        description: page.title 
          ? `The title is ${page.title.length} characters long (recommended is 30-60 characters).` 
          : 'This page is missing a title tag, which is crucial for SEO.',
        priority: 'high',
        current: page.title || 'No title',
        recommended: 'Create a descriptive title between 30-60 characters with primary keywords.',
        implementation: `Update the title tag in the <head> section of ${url}`
      });
    }
    
    // Check for missing H1 tags
    if (!page.h1s || page.h1s.length === 0) {
      issues.headings.push({
        url,
        title: `Missing H1 tag on ${new URL(url).pathname}`,
        description: 'This page is missing an H1 heading, which is important for page structure and SEO.',
        priority: 'medium',
        current: 'No H1 heading',
        recommended: 'Add an H1 heading that contains your primary keyword.',
        implementation: `Add an <h1> tag to the main content of ${url}`
      });
    }
    
    // Check for images without alt text
    if (page.images && page.images.length > 0) {
      const imagesWithoutAlt = page.images.filter((img: any) => !img.alt || img.alt.trim() === '');
      if (imagesWithoutAlt.length > 0) {
        issues.images.push({
          url,
          title: `${imagesWithoutAlt.length} image${imagesWithoutAlt.length > 1 ? 's' : ''} without alt text on ${new URL(url).pathname}`,
          description: 'Images without alt text are not accessible and miss SEO opportunities.',
          priority: 'medium',
          current: 'Images missing alt attributes',
          recommended: 'Add descriptive alt text to all images that conveys their content and purpose.',
          implementation: `Add alt attributes to images on ${url}`
        });
      }
    }
    
    // Check canonical link issues
    if (page.isCanonical === false || (page.canonicalUrl && page.canonicalUrl !== page.url)) {
      issues.canonicalLinks.push({
        url,
        title: `Canonical issue on ${new URL(url).pathname}`,
        description: page.canonicalUrl 
          ? `This page has a canonical URL (${page.canonicalUrl}) that differs from its actual URL.` 
          : 'This page is not set as canonical, which may lead to duplicate content issues.',
        priority: 'medium',
        current: page.canonicalUrl || 'No canonical tag',
        recommended: `Set the canonical URL to match the page URL: ${page.url}`,
        implementation: `Update the canonical link tag in the <head> section of ${url}`
      });
    }
  });
  
  // If we have performance data, extract performance issues
  if (crawledPages.length > 0) {
    // Add performance issues based on load time
    const slowPages = crawledPages
      .filter(page => page.loadTime > 1000)
      .map(page => ({
        url: page.url,
        title: `Slow page load time on ${new URL(page.url).pathname}`,
        description: `This page takes ${page.loadTime}ms to load, which exceeds the recommended 1000ms.`,
        priority: page.loadTime > 2000 ? 'high' : 'medium',
        current: `${page.loadTime}ms`,
        recommended: 'Optimize page resources to load under 1000ms.',
        implementation: 'Optimize images, minify CSS/JS, and leverage browser caching.'
      }));
    
    issues.performance.push(...slowPages);
  }
  
  return issues;
}

/**
 * Process AI recommendations into a standardized format
 */
function processAiRecommendations(recommendations: any[]): any[] {
  // Format AI recommendations for display
  return recommendations.map((rec, index) => {
    return {
      id: `rec-${index}`,
      title: rec.title,
      description: rec.description || 'No detailed description available.',
      category: rec.category || 'general',
      priority: rec.priority || 'medium',
      impact: rec.impact || 'Medium impact on SEO performance',
      implementation: rec.implementation || 'No specific implementation details provided.',
      // Add CMS-specific information if available
      cms: rec.cms
    };
  });
}

/**
 * Creates an empty report object with the structure expected by components
 */
function createEmptyReport() {
  return {
    score: {
      overall: 0,
      categories: {
        onPageSeo: 0,
        performance: 0,
        usability: 0,
        links: 0,
        social: 0
      }
    },
    issues: {
      metaDescription: [] as any[],
      titleTags: [] as any[],
      headings: [] as any[],
      images: [] as any[],
      links: [] as any[],
      canonicalLinks: [] as any[],
      schemaMarkup: [] as any[],
      performance: [] as any[],
      mobile: [] as any[],
      security: [] as any[]
    },
    pageSpeed: {
      mobile: { performance: 0, cls: 0, fcp: 0, lcp: 0, tbt: 0 },
      desktop: { performance: 0, cls: 0, fcp: 0, lcp: 0, tbt: 0 }
    },
    mozData: {
      domainAuthority: 0,
      pageAuthority: 0,
      linkingDomains: 0,
      totalLinks: 0,
      topBacklinks: []
    },
    aiRecommendations: [] as any[],
    keywords: [] as any[],
    backlinks: [] as any[],
    competitors: [] as any[],
    crawledPages: []
  };
}

async function getAudit(projectId: string, auditId: string) {
  try {
    const supabase = await createClient();
    
    // Get user data
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Unauthorized");
    }
    
    // First, get the basic audit information
    const { data: auditData, error: auditError } = await supabase
      .from("audits")
      .select(`
        *,
        projects:project_id (
          id,
          name,
          url
        )
      `)
      .eq("id", auditId)
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .single();
    
    if (auditError) {
      console.error("Error fetching audit:", auditError);
      throw new Error(auditError.message);
    }
    
    if (!auditData) {
      return null;
    }

    // Get report data from audit_reports table using project_id
    const { data: reportData, error: reportError } = await supabase
      .from("audit_reports")
      .select("report_data")
      .eq("project_id", auditData.project_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (reportError) {
      console.error("Error fetching audit report:", reportError);
      // We'll continue even if there's an error with the report data
    }

    console.log('Audit data:', auditData);
    console.log('Raw report data from audit_reports:', reportData?.report_data);
    
    // Transform the raw report data to match the expected structure
    const rawReport = reportData?.report_data;
    const transformedReport = transformReportData(rawReport);
    
    console.log('Transformed report summary:', {
      hasPageSpeed: !!transformedReport?.pageSpeed,
      hasIssues: !!transformedReport?.issues,
      hasPerformanceIssues: !!transformedReport?.issues?.performance
    });
    
    // Format the data to match the component props
    return {
      audit: {
        id: auditData.id,
        projectId: auditData.project_id,
        status: auditData.status,
        score: auditData.score || (rawReport?.summary?.score ?? 0),
        report: transformedReport,
        createdAt: auditData.created_at,
        updatedAt: auditData.updated_at
      },
      project: {
        id: auditData.projects.id,
        name: auditData.projects.name,
        url: auditData.projects.url
      }
    };
  } catch (error) {
    console.error("Failed to fetch audit:", error);
    throw error;
  }
}

async function AuditDetailPage({ params }: { params: { id: string; auditId: string } }) {
  const auditData = await getAudit(params.id, params.auditId);
  
  if (!auditData) {
    notFound();
  }
  
  const handleAddToTodo = async (issueId: string, recommendation: string) => {
    "use server";
    
    try {
      await addTodoItem({
        projectId: auditData.project.id,
        auditId: auditData.audit.id,
        title: `Fix: ${issueId}`,
        description: recommendation,
        priority: "medium",
        status: "pending"
      });
    } catch (error) {
      console.error("Failed to add todo item:", error);
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <AuditHeader
        auditId={auditData.audit.id}
        projectId={auditData.project.id}
        projectName={auditData.project.name}
        projectUrl={auditData.project.url}
        status={auditData.audit.status}
        createdAt={auditData.audit.createdAt}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <div className="sticky top-20">
            <AuditNavigation />
          </div>
        </div>
        
        <div className="md:col-span-3 space-y-10">
          <section id="executive-summary">
            <ExecutiveSummary 
              auditData={auditData.audit}
              projectUrl={auditData.project.url}
            />
          </section>

          <Separator />

          <section id="action-plan" className="pt-2">
            <ActionPlan 
              auditData={auditData.audit}
              projectId={auditData.project.id}
              onAddToTodo={handleAddToTodo}
            />
          </section>

          <Separator />

          <section id="technical-seo" className="pt-2">
            <h2 className="text-2xl font-bold mb-4">Technical SEO</h2>
            <p className="text-muted-foreground mb-6">
              Analysis of technical aspects affecting your website's visibility to search engines.
            </p>
            
            <div className="space-y-6">
              {auditData.audit.report.issues.canonicalLinks.length > 0 && (
                <IssuesTable
                  title="Canonical Tag Issues"
                  description="Problems with canonical URL implementation"
                  issues={auditData.audit.report.issues.canonicalLinks}
                  category="canonicalLinks"
                  onAddToTodo={handleAddToTodo}
                />
              )}
              
              {auditData.audit.report.issues.security.length > 0 && (
                <IssuesTable
                  title="Security Issues"
                  description="Security concerns that may affect SEO performance"
                  issues={auditData.audit.report.issues.security}
                  category="security"
                  onAddToTodo={handleAddToTodo}
                />
              )}
            </div>
          </section>

          <Separator />

          <section id="on-page-seo" className="pt-2">
            <h2 className="text-2xl font-bold mb-4">On-Page SEO</h2>
            <p className="text-muted-foreground mb-6">
              Analysis of content and HTML source code elements that can be optimized.
            </p>
            
            <div className="space-y-6">
              {auditData.audit.report.issues.metaDescription.length > 0 && (
                <IssuesTable
                  title="Meta Description Issues"
                  description="Problems with meta description implementation"
                  issues={auditData.audit.report.issues.metaDescription}
                  category="metaDescription"
                  onAddToTodo={handleAddToTodo}
                />
              )}
              
              {auditData.audit.report.issues.titleTags.length > 0 && (
                <IssuesTable
                  title="Title Tag Issues"
                  description="Problems with page title implementation"
                  issues={auditData.audit.report.issues.titleTags}
                  category="titleTags"
                  onAddToTodo={handleAddToTodo}
                />
              )}
              
              {auditData.audit.report.issues.headings.length > 0 && (
                <IssuesTable
                  title="Heading Structure Issues"
                  description="Problems with heading hierarchy"
                  issues={auditData.audit.report.issues.headings}
                  category="headings"
                  onAddToTodo={handleAddToTodo}
                />
              )}
              
              {auditData.audit.report.issues.images.length > 0 && (
                <IssuesTable
                  title="Image Optimization Issues"
                  description="Problems with image implementation and alt tags"
                  issues={auditData.audit.report.issues.images}
                  category="images"
                  onAddToTodo={handleAddToTodo}
                />
              )}
            </div>
          </section>

          <Separator />

          <section id="off-page-seo" className="pt-2">
            <BacklinksSection backlinksData={auditData.audit.report.mozData} />
          </section>

          <Separator />

          <section id="page-speed" className="pt-2">
            <PageSpeedSection 
              pageSpeedData={auditData.audit.report.pageSpeed} 
              performanceIssues={auditData.audit.report.issues.performance}
            />
          </section>

          <Separator />

          <section id="ai-recommendations" className="pt-2">
            <AiRecommendations 
              recommendations={auditData.audit.report.aiRecommendations} 
              onAddToTodo={handleAddToTodo}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

export default async function AuditPage(props: { params: Promise<{ id: string; auditId: string }> }) {
  const params = await props.params;
  return (
    <Suspense fallback={<AuditSkeleton />}>
      <AuditDetailPage params={params} />
    </Suspense>
  );
}

function AuditSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Skeleton className="h-12 w-full max-w-md" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
} 