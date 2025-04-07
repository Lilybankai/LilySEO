import { PdfGenerationContent } from './pdf-job';

// Define a minimal AuditData interface for TypeScript
interface AuditData {
  id?: string;
  url: string;
  score?: number;
  report?: {
    overall_score?: number;
    category_scores?: Record<string, number>;
    score?: {
      overall?: number;
      categories?: Record<string, number>;
    };
    issues?: Array<{
      id?: string;
      title?: string;
      description?: string;
      severity?: string;
      priority?: string;
      category?: string;
      examples?: string[];
    }> | Record<string, Array<any>>;
    strengths?: string[];
  };
}

/**
 * Unified AI content generation service for PDF reports
 * This service generates all sections at once, allowing for more cohesive content
 */

/**
 * Generate all AI content for a PDF report at once
 * @param auditData The audit data to generate content for
 * @returns Promise resolving to generated content
 */
export async function generateUnifiedPdfContent(auditData: AuditData): Promise<PdfGenerationContent> {
  try {
    // Validate the input data structure
    if (!auditData?.url) {
      console.warn('generateUnifiedPdfContent: Missing URL in audit data');
      return createGenericFallbackContent();
    }

    // Add additional logging to track data structure
    console.log('AI Content Generation - Input data structure:', {
      hasUrl: !!auditData.url,
      url: auditData.url,
      hasReport: !!auditData.report,
      hasIssues: !!auditData.report?.issues,
      issuesType: auditData.report?.issues ? typeof auditData.report.issues : 'undefined',
      scoreType: auditData.report?.score ? typeof auditData.report.score : 'undefined',
      hasId: !!auditData.id
    });

    // Handle different report structures - our data might be in different formats
    const domain = auditData.url ? (new URL(auditData.url).hostname || auditData.url) : 'example.com';
    const overallScore = auditData?.report?.overall_score || auditData?.score || auditData?.report?.score?.overall || 65;
    
    // Check report structure and extract category scores
    let categoryScores = auditData?.report?.category_scores;
    if (!categoryScores && auditData?.report?.score?.categories) {
      categoryScores = auditData.report.score.categories;
    }
    
    // Extract issues from various possible structures with additional validation
    let allIssues = [];
    if (Array.isArray(auditData?.report?.issues)) {
      // If issues is already an array, use it directly
      allIssues = auditData.report.issues;
      console.log('AI Content Generation - Issues found in array format:', allIssues.length);
    } else if (typeof auditData?.report?.issues === 'object' && auditData?.report?.issues !== null) {
      // If issues is an object of arrays, flatten them
      const issuesObj = auditData.report.issues;
      // Collect issues from all categories
      for (const key in issuesObj) {
        if (Array.isArray(issuesObj[key])) {
          allIssues.push(...issuesObj[key]);
        }
      }
      console.log('AI Content Generation - Issues found in object format:', allIssues.length);
    }
    
    // Log sample issues for debugging
    if (allIssues.length > 0) {
      console.log('AI Content Generation - Sample issues:', 
        allIssues.slice(0, 2).map(issue => ({
          title: issue.title,
          severity: issue.severity || issue.priority,
          category: issue.category
        }))
      );
    }
    
    // Ensure issues have required properties
    allIssues = allIssues.filter(issue => issue && (
      issue.title || issue.description || 
      (typeof issue === 'object' && Object.keys(issue).length > 0)
    ));
    
    // Extract strengths if available
    const strengths = Array.isArray(auditData?.report?.strengths) 
      ? auditData.report.strengths.slice(0, 5) 
      : [];

    console.log(`Successfully prepared data for AI content generation: ${allIssues.length} issues, ${strengths.length} strengths`);
    
    // Ensure we have at least some data to work with
    if (allIssues.length === 0 && !categoryScores) {
      console.warn('AI Content Generation - Insufficient data for meaningful content generation');
      return generateFallbackContent(auditData);
    }
    
    // Prepare the audit data for the API request
    const promptData = {
      url: auditData.url,
      domainName: domain,
      overallScore: overallScore,
      categoryScores: categoryScores || {},
      issues: allIssues
        .filter(issue => issue && (
          issue.severity === 'high' || issue.severity === 'medium' || 
          issue.priority === 'high' || issue.priority === 'medium'
        ))
        .slice(0, 10)
        .map(issue => ({
          id: issue.id || `issue-${Math.random().toString(36).substr(2, 9)}`,
          title: issue.title || 'Unnamed Issue',
          description: issue.description || '',
          severity: issue.severity || issue.priority || 'medium',
          category: issue.category || 'general',
          examples: issue.examples || []
        })),
      strengths: strengths
    };

    // Validate that we have at least some issues to work with
    if (promptData.issues.length === 0) {
      console.warn('AI Content Generation - No high/medium severity issues found, adding generic issues');
      // Add generic issues if none were found
      promptData.issues = [
        {
          id: 'generic-issue-1',
          title: 'Website Performance Issues',
          description: 'The site may have performance issues affecting user experience and search rankings.',
          severity: 'medium',
          category: 'performance',
          examples: []
        },
        {
          id: 'generic-issue-2',
          title: 'SEO Metadata Optimization',
          description: 'Metadata optimization opportunities exist to improve search visibility.',
          severity: 'medium',
          category: 'on-page',
          examples: []
        }
      ];
    }

    console.log('AI Content Generation - Sending data to API:', {
      issuesCount: promptData.issues.length,
      hasStrengths: promptData.strengths.length > 0,
      hasCategoryScores: Object.keys(promptData.categoryScores).length > 0,
      url: promptData.url,
      domainName: promptData.domainName,
      overallScore: promptData.overallScore
    });

    // Environment variables check before API call
    const envCheck = {
      hasAzureEndpoint: !!process.env.AZURE_OPENAI_ENDPOINT,
      hasAzureApiKey: !!process.env.AZURE_OPENAI_API_KEY,
      hasAzureDeployment: !!process.env.AZURE_OPENAI_DEPLOYMENT_NAME
    };
    console.log('AI Content Generation - Environment check:', envCheck);

    // Call unified AI content generation API
    console.log('AI Content Generation - Making request to unified-content API endpoint');
    const response = await fetch('/api/ai/unified-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: promptData }),
    });

    console.log('AI Content Generation - Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Content Generation - API error response:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    console.log('AI Content Generation - Parsing response JSON');
    const data = await response.json();
    
    console.log('AI Content Generation - Response received:', {
      hasExecutiveSummary: !!data.executiveSummary,
      executiveSummaryLength: data.executiveSummary?.length,
      recommendationsCount: data.recommendations?.length || 0,
      hasExplanations: !!data.technicalExplanations && Object.keys(data.technicalExplanations).length > 0,
      hasError: !!data.error,
      errorMessage: data.error || null,
    });
    
    // Check for error in the response
    if (data.error) {
      console.error('AI Content Generation - Error returned in JSON response:', data.error);
      throw new Error(`API returned error: ${data.error}`);
    }
    
    // Verify we have the expected data
    if (!data.executiveSummary) {
      console.warn('AI Content Generation - No executive summary in response');
    }
    
    if (!Array.isArray(data.recommendations) || data.recommendations.length === 0) {
      console.warn('AI Content Generation - No recommendations in response');
    }

    // Return structured content
    return {
      executiveSummary: data.executiveSummary,
      recommendations: data.recommendations || [],
      technicalExplanations: data.technicalExplanations || {},
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating unified PDF content:', error);
    
    // Return fallback content if API fails
    try {
      return generateFallbackContent(auditData);
    } catch (fallbackError) {
      console.error('Error generating fallback content:', fallbackError);
      return createGenericFallbackContent();
    }
  }
}

/**
 * Generate fallback content if the API call fails
 * @param auditData The audit data
 * @returns Fallback content
 */
function generateFallbackContent(auditData: AuditData): PdfGenerationContent {
  try {
    // Validate input
    if (!auditData?.url) {
      return createGenericFallbackContent();
    }

    const domain = new URL(auditData.url).hostname;
    const score = auditData?.report?.overall_score || auditData?.score || auditData?.report?.score?.overall || 65;
    
    let summaryQuality = "needs improvement";
    if (score >= 80) {
      summaryQuality = "excellent";
    } else if (score >= 60) {
      summaryQuality = "good";
    } else if (score >= 40) {
      summaryQuality = "fair";
    }
    
    // Extract issues from various possible structures
    let allIssues = [];
    if (Array.isArray(auditData?.report?.issues)) {
      allIssues = auditData.report.issues;
    } else if (typeof auditData?.report?.issues === 'object') {
      const issuesObj = auditData.report.issues;
      for (const key in issuesObj) {
        if (Array.isArray(issuesObj[key])) {
          allIssues.push(...issuesObj[key]);
        }
      }
    }
    
    // Filter high severity issues
    const topIssues = allIssues
      .filter(issue => issue && (issue.severity === 'high' || issue.priority === 'high'))
      .slice(0, 3);
    
    const issuesText = topIssues.length > 0
      ? `The most critical issues identified include: ${topIssues.map(i => i.title || 'Issue').join(', ')}. `
      : 'No critical issues were identified. ';
    
    const executiveSummary = `This SEO audit for ${domain} reveals an overall score of ${score}/100, indicating ${summaryQuality} performance. ${issuesText}Addressing the recommendations in this report will help improve search visibility and user experience.`;

    // Filter high and medium severity issues for recommendations
    const recommendations = allIssues
      .filter(issue => issue && (
        issue.severity === 'high' || issue.severity === 'medium' ||
        issue.priority === 'high' || issue.priority === 'medium'
      ))
      .slice(0, 5)
      .map(issue => {
        const title = issue.title || 'SEO Issue';
        const description = issue.description || 'This issue affects your SEO performance.';
        return `${title}: ${description} We recommend addressing this issue promptly to improve your SEO performance.`;
      });

    // Create technical explanations
    const technicalExplanations: Record<string, string> = {};
    topIssues.forEach(issue => {
      const id = issue.id || `issue-${Math.random().toString(36).substr(2, 9)}`;
      const title = issue.title || 'SEO Issue';
      const description = issue.description || 'This issue affects your SEO performance.';
      technicalExplanations[id] = `${title} - ${description}. This issue can impact your SEO performance and user experience.`;
    });
    
    return {
      executiveSummary,
      recommendations,
      technicalExplanations,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in generateFallbackContent:', error);
    return createGenericFallbackContent();
  }
}

/**
 * Create a generic fallback content when all else fails
 */
function createGenericFallbackContent(): PdfGenerationContent {
  return {
    executiveSummary: "This SEO audit report summarizes the website's performance across various dimensions including on-page SEO, technical aspects, and user experience. The report identifies issues that may be affecting the site's search ranking and provides recommendations for improvement.",
    recommendations: [
      "Ensure all pages have unique, descriptive meta titles and descriptions.",
      "Optimize page load speed for better user experience and search ranking.",
      "Fix broken links and improve internal linking structure.",
      "Make sure your website is mobile-friendly and responsive.",
      "Add structured data markup to help search engines understand your content."
    ],
    technicalExplanations: {},
    generatedAt: new Date().toISOString()
  };
}

export default {
  generateUnifiedPdfContent
}; 