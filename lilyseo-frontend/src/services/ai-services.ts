import { AuditData } from '@/types/audit';

/**
 * Interface for AI-generated PDF content
 */
export interface AiGeneratedContent {
  executiveSummary: string;
  recommendations: string[];
  technicalExplanations: {
    [issueId: string]: string;
  };
  generatedAt: string;
}

/**
 * Cache structure for storing generated content to reduce API calls
 */
interface ContentCache {
  [auditId: string]: {
    content: AiGeneratedContent;
    expiresAt: number;
  };
}

// In-memory cache for generated content (24-hour expiry)
const contentCache: ContentCache = {};
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Generate an executive summary for a SEO audit report
 * @param auditData The audit data to generate content for
 * @returns Promise resolving to generated executive summary text
 */
export async function generateExecutiveSummary(auditData: AuditData): Promise<string> {
  try {
    // Check if we have a cached version
    const cachedContent = getCachedContent(auditData.id);
    if (cachedContent) {
      return cachedContent.executiveSummary;
    }

    // Prepare the audit data for the API request
    const promptData = {
      url: auditData.url,
      domainName: new URL(auditData.url).hostname,
      overallScore: auditData.report.overall_score,
      categoryScores: auditData.report.category_scores,
      topIssues: auditData.report.issues
        .filter(issue => issue.severity === 'high')
        .slice(0, 5)
        .map(issue => issue.title),
      topStrengths: auditData.report.strengths.slice(0, 5)
    };

    // Call Azure OpenAI API
    const response = await fetch('/api/ai/generate-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'executive-summary',
        data: promptData
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Store in cache
    cacheContent(auditData.id, {
      ...getEmptyContentTemplate(),
      executiveSummary: data.content
    });
    
    return data.content;
  } catch (error) {
    console.error('Error generating executive summary:', error);
    
    // Return a fallback summary if API fails
    return generateFallbackSummary(auditData);
  }
}

/**
 * Generate recommendations based on SEO audit issues
 * @param auditData The audit data to generate recommendations for
 * @returns Promise resolving to an array of recommendation strings
 */
export async function generateRecommendations(auditData: AuditData): Promise<string[]> {
  try {
    // Check if we have a cached version
    const cachedContent = getCachedContent(auditData.id);
    if (cachedContent) {
      return cachedContent.recommendations;
    }

    // Prepare the audit data for the API request
    const promptData = {
      url: auditData.url,
      issues: auditData.report.issues
        .filter(issue => issue.severity === 'high' || issue.severity === 'medium')
        .slice(0, 10)
        .map(issue => ({
          title: issue.title,
          description: issue.description,
          severity: issue.severity,
          category: issue.category
        }))
    };

    // Call Azure OpenAI API
    const response = await fetch('/api/ai/generate-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'recommendations',
        data: promptData
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse recommendations from the response
    const recommendations = data.content.split('\n\n')
      .filter((rec: string) => rec.trim().length > 0)
      .map((rec: string) => rec.trim());
    
    // Store in cache
    const cachedData = getCachedContent(auditData.id) || getEmptyContentTemplate();
    cacheContent(auditData.id, {
      ...cachedData,
      recommendations
    });
    
    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    
    // Return fallback recommendations if API fails
    return generateFallbackRecommendations(auditData);
  }
}

/**
 * Generate technical explanations for specific issues
 * @param auditData The audit data to generate technical explanations for
 * @param issueIds Array of issue IDs to explain
 * @returns Promise resolving to an object mapping issue IDs to explanations
 */
export async function generateTechnicalExplanations(
  auditData: AuditData, 
  issueIds: string[]
): Promise<{[issueId: string]: string}> {
  try {
    // Check if we have cached explanations for these issues
    const cachedContent = getCachedContent(auditData.id);
    
    // If all requested issues have explanations in cache, return those
    if (cachedContent && issueIds.every(id => id in cachedContent.technicalExplanations)) {
      const explanations: {[issueId: string]: string} = {};
      issueIds.forEach(id => {
        explanations[id] = cachedContent.technicalExplanations[id];
      });
      return explanations;
    }

    // Filter to issues that need explanations
    const issuesToExplain = auditData.report.issues.filter(
      issue => issueIds.includes(issue.id)
    );

    // Call Azure OpenAI API
    const response = await fetch('/api/ai/generate-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'technical-explanations',
        data: {
          issues: issuesToExplain.map(issue => ({
            id: issue.id,
            title: issue.title,
            description: issue.description,
            examples: issue.examples || [],
            category: issue.category
          }))
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const explanations = data.content;
    
    // Update cache
    const existingCache = getCachedContent(auditData.id) || getEmptyContentTemplate();
    const updatedExplanations = {
      ...existingCache.technicalExplanations,
      ...explanations
    };
    
    cacheContent(auditData.id, {
      ...existingCache,
      technicalExplanations: updatedExplanations
    });
    
    return explanations;
  } catch (error) {
    console.error('Error generating technical explanations:', error);
    
    // Return fallback explanations if API fails
    const fallbacks: {[issueId: string]: string} = {};
    issueIds.forEach(id => {
      const issue = auditData.report.issues.find(issue => issue.id === id);
      fallbacks[id] = issue 
        ? `${issue.title} - ${issue.description}. This issue can impact your SEO performance and user experience.`
        : 'Technical explanation not available.';
    });
    
    return fallbacks;
  }
}

/**
 * Retrieve cached content for an audit
 * @param auditId ID of the audit
 * @returns Cached content or null if not found or expired
 */
function getCachedContent(auditId: string): AiGeneratedContent | null {
  const cachedItem = contentCache[auditId];
  
  if (!cachedItem) {
    return null;
  }
  
  // Check if cache has expired
  if (Date.now() > cachedItem.expiresAt) {
    delete contentCache[auditId];
    return null;
  }
  
  return cachedItem.content;
}

/**
 * Cache generated content for an audit
 * @param auditId ID of the audit
 * @param content Content to cache
 */
function cacheContent(auditId: string, content: AiGeneratedContent): void {
  contentCache[auditId] = {
    content: {
      ...content,
      generatedAt: new Date().toISOString()
    },
    expiresAt: Date.now() + CACHE_EXPIRY
  };
}

/**
 * Create an empty content template
 * @returns Empty AI content structure
 */
function getEmptyContentTemplate(): AiGeneratedContent {
  return {
    executiveSummary: '',
    recommendations: [],
    technicalExplanations: {},
    generatedAt: new Date().toISOString()
  };
}

/**
 * Generate a fallback summary from audit data without using AI
 * @param auditData The audit data
 * @returns A template-based summary
 */
function generateFallbackSummary(auditData: AuditData): string {
  const score = auditData.report.overall_score;
  const domain = new URL(auditData.url).hostname;
  
  let summaryQuality = "needs improvement";
  if (score >= 80) {
    summaryQuality = "excellent";
  } else if (score >= 60) {
    summaryQuality = "good";
  } else if (score >= 40) {
    summaryQuality = "fair";
  }
  
  const topIssues = auditData.report.issues
    .filter(issue => issue.severity === 'high')
    .slice(0, 3)
    .map(issue => issue.title);
  
  const issuesText = topIssues.length > 0
    ? `The most critical issues identified include: ${topIssues.join(', ')}. `
    : 'No critical issues were identified. ';
  
  return `This SEO audit for ${domain} reveals an overall score of ${score}/100, indicating ${summaryQuality} performance. ${issuesText}Addressing the recommendations in this report will help improve search visibility and user experience.`;
}

/**
 * Generate fallback recommendations without using AI
 * @param auditData The audit data
 * @returns Array of template-based recommendations
 */
function generateFallbackRecommendations(auditData: AuditData): string[] {
  return auditData.report.issues
    .filter(issue => issue.severity === 'high' || issue.severity === 'medium')
    .slice(0, 5)
    .map(issue => {
      return `${issue.title}: ${issue.description} We recommend addressing this issue promptly to improve your SEO performance.`;
    });
}

export default {
  generateExecutiveSummary,
  generateRecommendations,
  generateTechnicalExplanations
}; 