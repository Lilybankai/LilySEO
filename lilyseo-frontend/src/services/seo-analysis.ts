/**
 * SEO Analysis Service
 * 
 * This service handles website crawling and SEO analysis.
 * It provides functions to analyze websites and generate SEO reports.
 */

import { Database } from "@/lib/supabase/database.types";

// Types for SEO analysis
export type SeoScore = {
  overall: number;
  categories: {
    onPageSeo: number;
    performance: number;
    usability: number;
    links: number;
    social: number;
  };
};

export type PageSpeedMetrics = {
  mobile: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
    fcp: number;
    lcp: number;
    cls: number;
    tbt: number;
  };
  desktop: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
    fcp: number;
    lcp: number;
    cls: number;
    tbt: number;
  };
};

// SEO Issue interface
export interface SeoIssue {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  type: string;
  url: string;
  recommendations?: string[];
  recommendation?: string;
}

// PageSpeed interface
export interface PageSpeed {
  mobile: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
    fcp: number; // First Contentful Paint (ms)
    lcp: number; // Largest Contentful Paint (ms)
    cls: number; // Cumulative Layout Shift
    tbt: number; // Total Blocking Time (ms)
  };
  desktop: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
    fcp: number;
    lcp: number;
    cls: number;
    tbt: number;
  };
}

// Keyword interface
export interface Keyword {
  term: string;
  relevance: number;
  competition: number;
  monthlySearches: number;
}

// Keyword Density interface
export interface KeywordDensity {
  term: string;
  count: number;
  density: number;
}

// Backlink interface
export interface Backlink {
  url: string;
  domain: string;
  anchorText: string;
  authority: number;
  doFollow: boolean;
}

// Backlink History interface
export interface BacklinkHistory {
  date: string;
  count: number;
}

// SEO Report interface for detailed reports
export interface SeoReport {
  id: string;
  projectId: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  score: number;
  issues: SeoIssue[];
  pageSpeed: PageSpeed;
  keywords: {
    primary: string[];
    secondary: string[];
    opportunities: Keyword[];
    density: KeywordDensity[];
  };
  backlinks: {
    total: number;
    doFollow: number;
    noFollow: number;
    domains: number;
    list: Backlink[];
    history: BacklinkHistory[];
  };
  issuesByType: {
    metaDescription: number;
    titleTag: number;
    headings: number;
    images: number;
    links: number;
    canonicalLinks: number;
    schemaMarkup: number;
    performance: number;
    mobile: number;
    security: number;
  };
  issuesBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

// Legacy SEO Report type for backward compatibility
export type LegacySeoReport = {
  url: string;
  crawlDate: string;
  score: SeoScore;
  pagesCrawled: number;
  pageSpeed: PageSpeedMetrics;
  issues: {
    metaDescription: SeoIssue[];
    titleTags: SeoIssue[];
    headings: SeoIssue[];
    images: SeoIssue[];
    links: SeoIssue[];
    canonicalLinks: SeoIssue[];
    schemaMarkup: SeoIssue[];
    performance: SeoIssue[];
    mobile: SeoIssue[];
    security: SeoIssue[];
  };
  keywords: {
    found: string[];
    suggested: string[];
  };
};

/**
 * Analyzes a website and generates an SEO report
 * @param url The URL of the website to analyze
 * @returns A promise that resolves to an SEO report
 */
export async function analyzeSite(url: string): Promise<LegacySeoReport> {
  // In a real implementation, this would call an external API or use a crawler
  // For now, we'll generate mock data
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate random scores
  const overallScore = Math.floor(Math.random() * 30) + 70;
  const onPageScore = Math.floor(Math.random() * 30) + 70;
  const performanceScore = Math.floor(Math.random() * 30) + 70;
  const usabilityScore = Math.floor(Math.random() * 30) + 70;
  const linksScore = Math.floor(Math.random() * 30) + 70;
  const socialScore = Math.floor(Math.random() * 30) + 70;
  
  // Generate random PageSpeed metrics
  const mobilePerformance = Math.floor(Math.random() * 60) + 40;
  const desktopPerformance = Math.floor(Math.random() * 30) + 70;
  
  // Generate mock issues
  const metaDescriptionIssues: SeoIssue[] = [
    {
      id: '1',
      type: 'meta_description_missing',
      severity: 'high',
      title: 'Missing Meta Description',
      description: 'Some pages are missing meta descriptions.',
      url: `${url}/blog/keyword-clusters/`,
      recommendation: 'Add a descriptive meta description that includes your target keywords.',
    },
    {
      id: '2',
      type: 'meta_description_duplicate',
      severity: 'medium',
      title: 'Duplicate Meta Description',
      description: 'Some pages have duplicate meta descriptions.',
      url: `${url}/blog/link-building-strategies/`,
      recommendation: 'Create unique meta descriptions for each page.',
    },
  ];
  
  const titleTagIssues: SeoIssue[] = [
    {
      id: '3',
      type: 'title_tag_too_long',
      severity: 'medium',
      title: 'Title Tag Too Long',
      description: 'Some title tags exceed the recommended length of 60 characters.',
      url: `${url}/blog/how-long-does-seo-take/`,
      recommendation: 'Keep title tags under 60 characters to ensure they display properly in search results.',
    },
  ];
  
  // Create the full report
  const report: LegacySeoReport = {
    url,
    crawlDate: new Date().toISOString(),
    pagesCrawled: Math.floor(Math.random() * 50) + 10,
    score: {
      overall: overallScore,
      categories: {
        onPageSeo: onPageScore,
        performance: performanceScore,
        usability: usabilityScore,
        links: linksScore,
        social: socialScore,
      },
    },
    pageSpeed: {
      mobile: {
        performance: mobilePerformance,
        seo: Math.floor(Math.random() * 20) + 80,
        accessibility: Math.floor(Math.random() * 20) + 80,
        bestPractices: Math.floor(Math.random() * 20) + 80,
        fcp: Math.floor(Math.random() * 1000) + 500,
        lcp: Math.floor(Math.random() * 2000) + 1000,
        cls: Math.random() * 0.2,
        tbt: Math.floor(Math.random() * 300) + 100,
      },
      desktop: {
        performance: desktopPerformance,
        seo: Math.floor(Math.random() * 10) + 90,
        accessibility: Math.floor(Math.random() * 10) + 90,
        bestPractices: Math.floor(Math.random() * 10) + 90,
        fcp: Math.floor(Math.random() * 500) + 200,
        lcp: Math.floor(Math.random() * 1000) + 500,
        cls: Math.random() * 0.1,
        tbt: Math.floor(Math.random() * 200) + 50,
      },
    },
    issues: {
      metaDescription: metaDescriptionIssues,
      titleTags: titleTagIssues,
      headings: [],
      images: [],
      links: [],
      canonicalLinks: [],
      schemaMarkup: [],
      performance: [],
      mobile: [],
      security: [],
    },
    keywords: {
      found: ['seo', 'search engine optimization', 'keyword research', 'link building'],
      suggested: ['seo tools', 'seo audit', 'seo strategy', 'technical seo'],
    },
  };
  
  return report;
}

/**
 * Generates SEO tasks based on an SEO report
 * @param report The SEO report to generate tasks from
 * @returns An array of SEO tasks
 */
export function generateSeoTasks(report: LegacySeoReport): Database['public']['Tables']['todos']['Insert'][] {
  const tasks: Database['public']['Tables']['todos']['Insert'][] = [];
  
  // Process meta description issues
  report.issues.metaDescription.forEach(issue => {
    tasks.push({
      user_id: '', // This will be filled in by the API route
      project_id: '', // This will be filled in by the API route
      title: issue.title,
      description: `${issue.description} URL: ${issue.url}. ${issue.recommendation}`,
      status: 'pending',
      priority: issueSeverityToPriority(issue.severity),
    });
  });
  
  // Process title tag issues
  report.issues.titleTags.forEach(issue => {
    tasks.push({
      user_id: '', // This will be filled in by the API route
      project_id: '', // This will be filled in by the API route
      title: issue.title,
      description: `${issue.description} URL: ${issue.url}. ${issue.recommendation}`,
      status: 'pending',
      priority: issueSeverityToPriority(issue.severity),
    });
  });
  
  // Add general improvement tasks based on scores
  if (report.score.categories.performance < 80) {
    tasks.push({
      user_id: '', // This will be filled in by the API route
      project_id: '', // This will be filled in by the API route
      title: 'Improve Website Performance',
      description: 'Your website performance score is below 80. Consider optimizing images, minifying CSS/JS, and implementing browser caching.',
      status: 'pending',
      priority: 'high',
    });
  }
  
  if (report.score.categories.usability < 80) {
    tasks.push({
      user_id: '', // This will be filled in by the API route
      project_id: '', // This will be filled in by the API route
      title: 'Improve Mobile Usability',
      description: 'Your mobile usability score is below 80. Ensure your website is fully responsive and provides a good user experience on mobile devices.',
      status: 'pending',
      priority: 'high',
    });
  }
  
  return tasks;
}

/**
 * Converts an issue severity to a task priority
 * @param severity The issue severity
 * @returns The corresponding task priority
 */
function issueSeverityToPriority(severity: SeoIssue['severity']): 'critical' | 'high' | 'medium' | 'low' {
  switch (severity) {
    case 'critical':
      return 'critical';
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    case 'low':
    case 'info':
    default:
      return 'low';
  }
}

// Function to fetch SEO report by ID
export async function fetchSeoReport(auditId: string): Promise<SeoReport> {
  try {
    const response = await fetch(`/api/audits/${auditId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch SEO report');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching SEO report:', error);
    throw error;
  }
}

// Function to download SEO report as PDF
export async function downloadSeoReportPdf(auditId: string, projectName: string): Promise<Blob> {
  try {
    const response = await fetch(`/api/audits/${auditId}/pdf`);
    if (!response.ok) {
      throw new Error('Failed to download PDF report');
    }
    return await response.blob();
  } catch (error) {
    console.error('Error downloading PDF report:', error);
    throw error;
  }
}

// Function to delete SEO audit
export async function deleteSeoAudit(auditId: string, projectId: string): Promise<void> {
  try {
    const response = await fetch(`/api/audits/${auditId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete SEO audit');
    }
  } catch (error) {
    console.error('Error deleting SEO audit:', error);
    throw error;
  }
} 