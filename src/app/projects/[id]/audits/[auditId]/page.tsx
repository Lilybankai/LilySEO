import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// Import our new components
import { ExecutiveSummary } from "@/components/audits/sections/executive-summary";
import { ActionPlan } from "@/components/audits/sections/action-plan";
import { AuditNavigation } from "@/components/audits/sections/audit-navigation";
import { AuditHeader } from "@/components/audits/sections/audit-header";
import { PageSpeedSection } from "@/components/audits/sections/page-speed-section";
import { BacklinksSection } from "@/components/audits/sections/backlinks-section";
import { IssuesTable } from "@/components/audits/sections/issues-table";
import { AiRecommendations } from "@/components/audits/sections/ai-recommendations";
import { SchemaValidationSection } from "@/components/audits/sections/schema-validation-section";

interface TransformedAuditReport {
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
    seo: any[];
    performance: any[];
    bestPractices: any[];
    accessibility: any[];
    metaDescription: any[];
    titleTags: any[];
    headings: any[];
    images: any[];
    links: any[];
    canonicalLinks: any[];
    schemaMarkup: any[];
    mobile: any[];
    security: any[];
    [key: string]: any[]; // Allow string indexing for issues
  };
  metrics: {
    performance: {
      desktop: any;
      mobile: any;
    };
  };
  mozData: {
    domainAuthority: number;
    pageAuthority: number;
    linkingDomains: number;
    totalLinks: number;
    topBacklinks: any[];
  };
  pageSpeed: {
    mobile: any;
    desktop: any;
  };
  fixesNeeded?: number;
  scoreTransformSummary?: any;
}

/**
 * Transforms the raw report data to the structure expected by components
 * If rawReport is null or undefined, returns a properly structured but empty report object
 */
function transformReportData(rawReport: any): TransformedAuditReport {
  // Initialize the default structure for the transformed data
  const transformedData: TransformedAuditReport = {
    score: {
      overall: 0,
      categories: {
        onPageSeo: 0,
        performance: 0,
        usability: 0,
        links: 0,
        social: 70 // Default since we don't track social issues specifically
      }
    },
    issues: {
      seo: [],
      performance: [],
      bestPractices: [],
      accessibility: [],
      metaDescription: [],
      titleTags: [],
      headings: [],
      images: [],
      links: [],
      canonicalLinks: [],
      schemaMarkup: [],
      mobile: [],
      security: []
    },
    metrics: {
      performance: {
        desktop: {},
        mobile: {}
      }
    },
    mozData: {
      domainAuthority: 0,
      pageAuthority: 0,
      linkingDomains: 0,
      totalLinks: 0,
      topBacklinks: []
    },
    pageSpeed: {
      mobile: { performance: 0, cls: 0, fcp: 0, lcp: 0, tbt: 0 },
      desktop: { performance: 0, cls: 0, fcp: 0, lcp: 0, tbt: 0 }
    }
  };
  
  // If no report data, return empty structure
  if (!rawReport) {
    return transformedData;
  }
  
  try {
    console.log("Raw report data has page speed:", !!rawReport.pageSpeed);
    
    // Add page speed metrics if available - map both metrics.performance and pageSpeed
    if (rawReport.pageSpeed) {
      console.log("Processing page speed data");
      // Set pageSpeed directly for PageSpeedSection component
      transformedData.pageSpeed = {
        mobile: {
          performance: rawReport.pageSpeed.mobile?.performance || 0,
          cls: rawReport.pageSpeed.mobile?.cls || 0,
          fcp: rawReport.pageSpeed.mobile?.fcp || 0,
          lcp: rawReport.pageSpeed.mobile?.lcp || 0,
          tbt: rawReport.pageSpeed.mobile?.tbt || 0
        },
        desktop: {
          performance: rawReport.pageSpeed.desktop?.performance || 0,
          cls: rawReport.pageSpeed.desktop?.cls || 0,
          fcp: rawReport.pageSpeed.desktop?.fcp || 0,
          lcp: rawReport.pageSpeed.desktop?.lcp || 0,
          tbt: rawReport.pageSpeed.desktop?.tbt || 0
        }
      };
      
      // Also map to metrics.performance for backward compatibility
      transformedData.metrics.performance = {
        desktop: mapPageSpeedMetrics(rawReport.pageSpeed.desktop),
        mobile: mapPageSpeedMetrics(rawReport.pageSpeed.mobile)
      };
      
      console.log("Page speed data mapped:", JSON.stringify(transformedData.pageSpeed));
    }
    
    // Add mozData if available
    if (rawReport.mozData) {
      transformedData.mozData = {
        domainAuthority: rawReport.mozData.domainAuthority || 0,
        pageAuthority: rawReport.mozData.pageAuthority || 0,
        linkingDomains: rawReport.mozData.linkingDomains || 0,
        totalLinks: rawReport.mozData.totalLinks || 0,
        topBacklinks: rawReport.mozData.topBacklinks || []
      };
    }
    
    // Add schema validation issues if available
    if (rawReport.schemaValidationIssues && Array.isArray(rawReport.schemaValidationIssues) && rawReport.schemaValidationIssues.length > 0) {
      console.log("Processing schema validation issues:", rawReport.schemaValidationIssues.length);
      
      rawReport.schemaValidationIssues.forEach((issue: {
        url: string;
        title?: string;
        description?: string;
        priority?: string;
        schemaDetails?: any;
      }) => {
        transformedData.issues.schemaMarkup.push(normalizeIssue({
          url: issue.url,
          title: issue.title || 'Schema markup issue',
          description: issue.description || 'Issue with structured data markup',
          priority: issue.priority || 'medium',
          current: 'Invalid or incomplete schema markup',
          recommended: getSchemaRecommendation(issue),
          implementation: getSchemaImplementationGuide(issue),
          schemaDetails: issue.schemaDetails || {}
        }));
      });
      
      console.log(`Added ${rawReport.schemaValidationIssues.length} schema validation issues`);
    }
    
    // Process crawled pages to extract more detailed issues
    if (rawReport.crawledPages && Array.isArray(rawReport.crawledPages) && rawReport.crawledPages.length > 0) {
      console.log("Processing crawled pages for issues:", rawReport.crawledPages.length);
      
      // Extract issues from crawled pages
      const crawlIssues = extractIssuesFromCrawl(rawReport.crawledPages);
      
      // Merge the extracted issues into our transformed data
      Object.keys(crawlIssues).forEach(issueType => {
        if (transformedData.issues[issueType] && Array.isArray(transformedData.issues[issueType])) {
          transformedData.issues[issueType] = [
            ...transformedData.issues[issueType],
            ...crawlIssues[issueType]
          ];
        }
      });
      
      console.log("Crawl issues extracted:", 
        Object.keys(crawlIssues).map(key => `${key}: ${crawlIssues[key].length}`).join(', ')
      );
    }
    
    // Process issues directly if they're in the report
    if (rawReport.issues) {
      console.log("Raw report has direct issues object:", Object.keys(rawReport.issues));
      
      // Map each issue category to our transformed data structure
      Object.keys(rawReport.issues).forEach(issueType => {
        const issues = rawReport.issues[issueType];
        if (Array.isArray(issues) && issues.length > 0) {
          if (!transformedData.issues[issueType]) {
            transformedData.issues[issueType] = [];
          }
          
          // Add each issue to our structure
          issues.forEach(issue => {
            // Special handling for image issues to ensure affectedImages are included
            if (issueType === 'images' && issue.images && !issue.affectedImages) {
              issue.affectedImages = issue.images;
            }
            
            transformedData.issues[issueType].push(normalizeIssue(issue));
          });
          
          console.log(`Added ${issues.length} issues from direct issues.${issueType}`);
        }
      });
    }
    
    // Check for images with missing alt text in a different format
    if (rawReport.imagesWithoutAlt && Array.isArray(rawReport.imagesWithoutAlt) && rawReport.imagesWithoutAlt.length > 0) {
      console.log("Found images without alt text:", rawReport.imagesWithoutAlt.length);
      
      // Group images by page URL
      const imagesByPage = rawReport.imagesWithoutAlt.reduce((acc: Record<string, any[]>, img: any) => {
        const pageUrl = img.pageUrl || img.page || img.url || '';
        if (!acc[pageUrl]) {
          acc[pageUrl] = [];
        }
        acc[pageUrl].push(img);
        return acc;
      }, {});
      
      // Create an issue for each page with missing alt text
      Object.entries(imagesByPage).forEach(([pageUrl, rawImages]) => {
        // Type assertion
        const imagesArray = rawImages as any[];
        
        if (imagesArray.length > 0 && pageUrl) {
          transformedData.issues.images.push(normalizeIssue({
            url: pageUrl,
            title: `${imagesArray.length} image${imagesArray.length > 1 ? 's' : ''} without alt text`,
            description: 'Images without alt text are not accessible and miss SEO opportunities.',
            priority: 'medium',
            current: 'Images missing alt attributes',
            recommended: 'Add descriptive alt text to all images that conveys their content and purpose.',
            implementation: `Add alt attributes to images on ${pageUrl}`,
            affectedImages: imagesArray.map((img: any) => {
              // Debug the affectedImages content
              const imageObj = {
                src: img.src || img.url || '',
                alt: '',
                width: img.width || 0,
                height: img.height || 0
              };
              console.log('Created affectedImage object:', imageObj);
              return imageObj;
            })
          }));
          
          // Log the created issue
          const lastIssue = transformedData.issues.images[transformedData.issues.images.length - 1];
          console.log(`Added image issue with ${lastIssue.affectedImages?.length || 0} affectedImages`);
          if (lastIssue.affectedImages?.length > 0) {
            console.log('Sample image URL:', lastIssue.affectedImages[0].src);
          }
        }
      });
    }
    
    // Direct extraction of common issue types if they exist as arrays at the report root
    const possibleIssueArrays = [
      'metaDescriptionIssues', 'titleIssues', 'headingIssues', 'imageIssues', 
      'linkIssues', 'canonicalIssues', 'performanceIssues', 'securityIssues'
    ];
    
    possibleIssueArrays.forEach(arrayName => {
      const targetField = arrayName.replace('Issues', '');
      
      if (rawReport[arrayName] && Array.isArray(rawReport[arrayName]) && rawReport[arrayName].length > 0) {
        console.log(`Found ${arrayName}:`, rawReport[arrayName].length);
        
        // Map to the appropriate issue type
        let targetIssueType = '';
        if (arrayName === 'metaDescriptionIssues') targetIssueType = 'metaDescription';
        else if (arrayName === 'titleIssues') targetIssueType = 'titleTags';
        else if (arrayName === 'headingIssues') targetIssueType = 'headings';
        else if (arrayName === 'imageIssues') targetIssueType = 'images';
        else if (arrayName === 'linkIssues') targetIssueType = 'links';
        else if (arrayName === 'canonicalIssues') targetIssueType = 'canonicalLinks';
        else if (arrayName === 'performanceIssues') targetIssueType = 'performance';
        else if (arrayName === 'securityIssues') targetIssueType = 'security';
        else targetIssueType = targetField;
        
        if (targetIssueType) {
          rawReport[arrayName].forEach(issue => {
            transformedData.issues[targetIssueType].push(normalizeIssue(issue));
          });
          
          console.log(`Added ${rawReport[arrayName].length} issues from ${arrayName} to ${targetIssueType}`);
        }
      }
    });
    
    // Populate score information
    if (rawReport.summary) {
      // Use the backend score as a starting point
      const baseScore = rawReport.summary.score || 0;
      transformedData.score.overall = baseScore;
      
      // Count issues and adjust category scores
      let totalIssues = 0;
      let seoIssues = 0;
      let performanceIssues = 0;
      let usabilityIssues = 0;
      let linkIssues = 0;
      
      // Extract issues by category
      if (rawReport.recommendations) {
        console.log("Processing recommendations:", rawReport.recommendations.length);
        
        // Use our improved processing function for all recommendations
        const processedRecommendations = processAiRecommendations(rawReport.recommendations);
        
        // Sort recommendations by category
        processedRecommendations.forEach(rec => {
          totalIssues++;
          
          // Map backend categories to our frontend categories
          switch (rec.category.toLowerCase()) {
            case 'technical':
              seoIssues++;
              transformedData.issues.seo.push(rec);
              break;
            case 'content':
              seoIssues++;
              transformedData.issues.seo.push(rec);
              break;
            case 'performance':
              performanceIssues++;
              transformedData.issues.performance.push(rec);
              break;
            case 'backlinks':
              linkIssues++;
              transformedData.issues.seo.push(rec);
              break;
            case 'security':
            case 'accessibility':
              usabilityIssues++;
              transformedData.issues.accessibility.push(rec);
              break;
            default:
              // Default to best practices
              transformedData.issues.bestPractices.push(rec);
          }
        });
      }
      
      // Calculate adjusted scores for each category
      transformedData.score.categories = {
        onPageSeo: adjustCategoryScore(85, seoIssues, 3, 40),
        performance: adjustCategoryScore(90, performanceIssues, 4, 40),
        usability: adjustCategoryScore(85, usabilityIssues, 3, 40),
        links: adjustCategoryScore(80, linkIssues, 3, 40),
        social: 70 // Default since we don't track social issues
      };
      
      // Calculate the overall adjusted score based on the category scores
      const weightsForCategories = {
        onPageSeo: 0.4,
        performance: 0.3,
        usability: 0.15,
        links: 0.1,
        social: 0.05
      };
      
      // Calculate weighted average of category scores
      const weights = Object.entries(weightsForCategories);
      const weightedSum = weights.reduce((sum, [category, weight]) => {
        return sum + (transformedData.score.categories[category as keyof typeof transformedData.score.categories] * weight);
      }, 0);
      
      // For SEO reports with issues, use our adjusted calculation
      // otherwise use the original backend score
      if (totalIssues > 0) {
        transformedData.score.overall = Math.round(weightedSum);
      }
      
      // Generate and store the explanation of how the score was calculated
      transformedData.scoreTransformSummary = generateScoreTransformSummary(
        baseScore, 
        transformedData.score.overall,
        totalIssues,
        seoIssues,
        performanceIssues, 
        usabilityIssues,
        linkIssues
      );
      
      // Update the fixes needed count for use throughout the app
      transformedData.fixesNeeded = totalIssues;
    }
    
    // Return the transformed data
    return transformedData;
    
  } catch (error) {
    console.error('Error transforming report data:', error);
    // Return the default structure on error
    return transformedData;
  }
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
      issues.metaDescription.push(normalizeIssue({
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
      }));
    }
    
    // Check title tag issues (missing, too long, too short)
    if (!page.title || page.title.length < 30 || page.title.length > 60) {
      issues.titleTags.push(normalizeIssue({
        url,
        title: `${page.title ? 'Problematic' : 'Missing'} title tag on ${new URL(url).pathname}`,
        description: page.title 
          ? `The title is ${page.title.length} characters long (recommended is 30-60 characters).` 
          : 'This page is missing a title tag, which is crucial for SEO.',
        priority: 'high',
        current: page.title || 'No title',
        recommended: 'Create a descriptive title between 30-60 characters with primary keywords.',
        implementation: `Update the title tag in the <head> section of ${url}`
      }));
    }
    
    // Check for missing H1 tags
    if (!page.h1s || page.h1s.length === 0) {
      issues.headings.push(normalizeIssue({
        url,
        title: `Missing H1 tag on ${new URL(url).pathname}`,
        description: 'This page is missing an H1 heading, which is important for page structure and SEO.',
        priority: 'medium',
        current: 'No H1 heading',
        recommended: 'Add an H1 heading that contains your primary keyword.',
        implementation: `Add an <h1> tag to the main content of ${url}`
      }));
    }
    
    // Check for images without alt text
    if (page.images && page.images.length > 0) {
      const imagesWithoutAlt = page.images.filter((img: any) => !img.alt || img.alt.trim() === '');
      if (imagesWithoutAlt.length > 0) {
        issues.images.push(normalizeIssue({
          url,
          title: `${imagesWithoutAlt.length} image${imagesWithoutAlt.length > 1 ? 's' : ''} without alt text on ${new URL(url).pathname}`,
          description: 'Images without alt text are not accessible and miss SEO opportunities.',
          priority: 'medium',
          current: 'Images missing alt attributes',
          recommended: 'Add descriptive alt text to all images that conveys their content and purpose.',
          implementation: `Add alt attributes to images on ${url}`,
          // Include the actual image data for display in the UI
          affectedImages: imagesWithoutAlt.map((img: any) => ({
            src: img.src,
            alt: img.alt || '',
            width: img.width || 0,
            height: img.height || 0
          }))
        }));
      }
    }
    
    // Check canonical link issues
    if (page.isCanonical === false || (page.canonicalUrl && page.canonicalUrl !== page.url)) {
      issues.canonicalLinks.push(normalizeIssue({
        url,
        title: `Canonical issue on ${new URL(url).pathname}`,
        description: page.canonicalUrl 
          ? `This page has a canonical URL (${page.canonicalUrl}) that differs from its actual URL.` 
          : 'This page is not set as canonical, which may lead to duplicate content issues.',
        priority: 'medium',
        current: page.canonicalUrl || 'No canonical tag',
        recommended: `Set the canonical URL to match the page URL: ${page.url}`,
        implementation: `Update the canonical link tag in the <head> section of ${url}`
      }));
    }
  });
  
  // If we have performance data, extract performance issues
  if (crawledPages.length > 0) {
    // Add performance issues based on load time
    const slowPages = crawledPages
      .filter(page => page.loadTime > 1000)
      .map(page => normalizeIssue({
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
 * Process AI recommendations into a standardized format with better structure
 */
function processAiRecommendations(recommendations: any[]): any[] {
  if (!recommendations || !Array.isArray(recommendations)) return [];
  
  return recommendations.map((rec, index) => {
    // Extract actionable parts from the description if they exist
    const description = rec.description || '';
    let current = rec.current || 'Not specified';
    let recommended = rec.recommended || '';
    let implementation = rec.implementation || '';
    
    // For recommendations that have a pattern like "- X: something - Y: something else"
    if (description.includes('- Rationale:') || description.includes('- Recommendation:')) {
      // For recommendations that mention rationale, capture that as the current state
      const rationaleIndex = description.indexOf('- Rationale:');
      if (rationaleIndex !== -1 && current === 'Not specified') {
        // Extract the content after "- Rationale:" and before the next dash if present
        let rationaleEnd = description.indexOf('-', rationaleIndex + 12);
        if (rationaleEnd === -1) rationaleEnd = description.length;
        const rationale = description.substring(rationaleIndex + 12, rationaleEnd).trim();
        current = rationale;
      }
      
      // For recommendations that contain explicit recommendations, extract those
      const recommendationIndex = description.indexOf('- Recommendation:');
      if (recommendationIndex !== -1 && !recommended) {
        // Extract the content after "- Recommendation:" and before the next dash if present
        let recommendationEnd = description.indexOf('-', recommendationIndex + 17);
        if (recommendationEnd === -1) recommendationEnd = description.length;
        recommended = description.substring(recommendationIndex + 17, recommendationEnd).trim();
      }
      
      // Generate a detailed implementation guide
      if (!implementation) {
        // Extract actionable steps from the recommendation
        let implementationSteps = "Implementation steps:\n\n";
        
        // Look for different parts of the recommendation that can be turned into implementation steps
        if (description.includes('H1 heading')) {
          implementationSteps += "1. Audit all pages for missing H1 headings\n";
          implementationSteps += "2. For each page without an H1, add an appropriate heading that includes your target keywords\n";
          implementationSteps += "3. Ensure each page has exactly one H1 tag at the beginning of the main content\n\n";
        }
        
        if (description.includes('performance audit')) {
          implementationSteps += "1. Run a performance audit using Google PageSpeed Insights\n";
          implementationSteps += "2. Identify slow-loading resources and optimize them\n";
          implementationSteps += "3. Compress and resize images to reduce load time\n";
          implementationSteps += "4. Minify CSS, JavaScript, and HTML\n\n";
        }
        
        if (description.toLowerCase().includes('schema') || description.toLowerCase().includes('structured data')) {
          implementationSteps += "1. Identify the appropriate schema.org markup types for your content\n";
          implementationSteps += "2. Implement JSON-LD structured data in your website's <head> section\n";
          implementationSteps += "3. Test the markup using Google's Rich Results Test\n";
          implementationSteps += "4. Monitor performance in Google Search Console\n\n";
        }
        
        if (description.toLowerCase().includes('mobile')) {
          implementationSteps += "1. Test your website's mobile responsiveness\n";
          implementationSteps += "2. Implement lazy loading for images and videos\n";
          implementationSteps += "3. Optimize tap targets and ensure readable font sizes\n";
          implementationSteps += "4. Consider implementing AMP for key content pages\n\n";
        }
        
        if (description.toLowerCase().includes('meta description')) {
          implementationSteps += "1. Audit your pages for missing or problematic meta descriptions\n";
          implementationSteps += "2. Write unique meta descriptions between 120-158 characters\n";
          implementationSteps += "3. Include relevant keywords naturally in the description\n";
          implementationSteps += "4. Make the description compelling to improve click-through rates\n\n";
        }
        
        if (description.toLowerCase().includes('title tag')) {
          implementationSteps += "1. Audit pages for missing or poorly optimized title tags\n";
          implementationSteps += "2. Create unique titles between 50-60 characters\n";
          implementationSteps += "3. Include primary keywords near the beginning\n";
          implementationSteps += "4. Follow a consistent format across your site\n\n";
        }
        
        if (description.toLowerCase().includes('content')) {
          implementationSteps += "1. Perform a content audit to identify thin or outdated content\n";
          implementationSteps += "2. Update and expand pages with quality, relevant information\n";
          implementationSteps += "3. Incorporate target keywords naturally throughout the content\n";
          implementationSteps += "4. Add relevant headings, lists, and media to improve readability\n\n";
        }
        
        // If none of the specific cases match, create a generic implementation guide based on the title
        if (implementationSteps === "Implementation steps:\n\n" && rec.title) {
          const title = rec.title.toLowerCase();
          if (title.includes('technical')) {
            implementationSteps += "1. Perform a technical SEO audit using a tool like Screaming Frog\n";
            implementationSteps += "2. Fix identified issues in order of priority\n";
            implementationSteps += "3. Implement improvements to site structure and crawlability\n";
            implementationSteps += "4. Monitor technical health in Google Search Console\n\n";
          } else if (title.includes('content')) {
            implementationSteps += "1. Analyze your existing content for SEO opportunities\n";
            implementationSteps += "2. Create a content improvement plan based on keyword research\n";
            implementationSteps += "3. Update and optimize your most important pages first\n";
            implementationSteps += "4. Monitor organic traffic and rankings to measure impact\n\n";
          } else if (title.includes('backlink') || title.includes('link')) {
            implementationSteps += "1. Analyze your current backlink profile\n";
            implementationSteps += "2. Identify high-quality websites in your industry for outreach\n";
            implementationSteps += "3. Create valuable content worthy of backlinks\n";
            implementationSteps += "4. Implement a targeted outreach campaign\n\n";
          } else {
            implementationSteps += "1. Analyze the current state of your website\n";
            implementationSteps += "2. Prioritize the recommendations by impact and effort\n";
            implementationSteps += "3. Implement changes methodically, testing as you go\n";
            implementationSteps += "4. Monitor results and adjust your strategy as needed\n\n";
          }
        }
        
        // Finalize the implementation guide
        if (implementationSteps !== "Implementation steps:\n\n") {
          implementation = implementationSteps + "Tools needed: Google Search Console, Google Analytics, Screaming Frog, and a text editor or CMS access.";
        }
      }
    }
    
    // Default recommendation if none was extracted or provided
    if (!recommended && description) {
      recommended = 'Implement the improvements outlined in the description';
    }
    
    // If no implementation instructions but recommendation exists, use that
    if (!implementation && recommended) {
      implementation = `Implementation steps:\n\n1. ${recommended}\n2. Test the changes on your website\n3. Monitor results in Google Search Console and Analytics`;
    }
    
    // Format the description to be more readable
    const formattedDescription = description
      // Replace bullet point style formatting with cleaner headings
      .replace(/- Rationale:/g, '**Rationale:**')
      .replace(/- Recommendation:/g, '\n\n**Recommendation:**')
      // Replace other generic bullet points with proper formatting
      .replace(/- ([A-Z])/g, '\n• $1')
      // Add some spacing between sections
      .replace(/\.\s+-/g, '.\n\n-');
    
    // Return a normalized issue with improved structure
    return normalizeIssue({
      id: rec.id || `rec-${index}`,
      title: rec.title || 'SEO Recommendation',
      description: formattedDescription,
      category: rec.category || 'content',
      priority: rec.priority || 'medium',
      url: rec.url || '',
      current: current,
      recommended: recommended || 'Follow the recommendations in the description',
      implementation: implementation || 'Implement the changes as described above'
    });
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
      security: [] as any[],
      seo: [] as any[],
      bestPractices: [] as any[],
      accessibility: [] as any[]
    },
    pageSpeed: {
      mobile: { performance: 0, cls: 0, fcp: 0, lcp: 0, tbt: 0 },
      desktop: { performance: 0, cls: 0, fcp: 0, lcp: 0, tbt: 0 }
    },
    metrics: {
      performance: {
        desktop: {},
        mobile: {}
      }
    },
    mozData: {
      domainAuthority: 0,
      pageAuthority: 0,
      linkingDomains: 0,
      totalLinks: 0,
      topBacklinks: []
    }
  };
}

/**
 * Generates a summary of the score transformation for better transparency
 */
function generateScoreTransformSummary(
  originalScore: number, 
  adjustedScore: number,
  totalIssues: number,
  seoIssues: number = 0,
  performanceIssues: number = 0, 
  usabilityIssues: number = 0,
  linkIssues: number = 0
) {
  const summary = {
    originalScore,
    adjustedScore,
    difference: adjustedScore - originalScore,
    issuesCounts: {
      total: totalIssues,
      seo: seoIssues,
      performance: performanceIssues,
      usability: usabilityIssues,
      links: linkIssues,
      critical: Math.round(totalIssues * 0.2) // Estimate if not provided
    },
    explanation: ''
  };

  if (totalIssues === 0) {
    summary.explanation = 'Excellent SEO health with no detected issues. Only achieved by the top 1% of websites.';
  } else if (summary.difference === 0) {
    summary.explanation = 'Score accurately reflects industry standards for websites with this issue profile.';
  } else if (originalScore > 90 && totalIssues > 5) {
    summary.explanation = 'Score was adjusted to better reflect industry standards. Perfect scores are rare with this many issues.';
  } else if (summary.difference < 0) {
    const severityDescription = 
      seoIssues > 5 ? 'critical issues requiring immediate attention' : 
      seoIssues > 0 ? 'significant issues that should be addressed soon' :
      totalIssues > 15 ? 'numerous issues affecting overall SEO health' :
      'moderate issues that could be improved';
    
    summary.explanation = `Score of ${adjustedScore} represents a site with ${severityDescription}.`;
  } else {
    summary.explanation = `Score was adjusted to ${adjustedScore} based on industry benchmarks and issue analysis.`;
  }

  return summary;
}

// Update an audit record with fixes needed metadata
async function updateAuditWithFixesNeeded(auditId: string, fixesNeeded: number) {
  try {
    const supabase = await createClient();
    
    // Get user data
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return false;
    }
    
    // Update the audit with the metadata
    const { error } = await supabase
      .from("audits")
      .update({
        metadata: { fixes_needed: fixesNeeded },
        updated_at: new Date().toISOString()
      })
      .eq("id", auditId);
    
    if (error) {
      console.error('Error updating audit metadata:', error);
      return false;
    }
    
    console.log('Successfully updated audit metadata with fixes_needed:', fixesNeeded);
    return true;
  } catch (error) {
    console.error('Error in updateAuditWithFixesNeeded:', error);
    return false;
  }
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
    
    // Add debug logging for the report structure
    if (rawReport) {
      console.log('Raw report structure available fields:', Object.keys(rawReport));
      console.log('Page speed data available:', !!rawReport.pageSpeed);
      if (rawReport.pageSpeed) {
        console.log('Page speed mobile score:', rawReport.pageSpeed.mobile?.performance);
        console.log('Page speed desktop score:', rawReport.pageSpeed.desktop?.performance);
      }
      console.log('Moz data available:', !!rawReport.mozData);
      if (rawReport.mozData) {
        console.log('Domain authority:', rawReport.mozData.domainAuthority);
      }
    }
    
    const transformedReport = transformReportData(rawReport);
    
    console.log('Transformed report summary:', {
      hasPageSpeed: !!transformedReport?.pageSpeed,
      hasIssues: !!transformedReport?.issues,
      hasPerformanceIssues: !!transformedReport?.issues?.performance
    });
    
    // Count total issues for fixes needed
    const totalIssues = Object.values(transformedReport.issues).reduce((total, issues) => total + issues.length, 0);
    
    // Update the audit's metadata with fixes needed count if we have issues
    if (totalIssues > 0) {
      await updateAuditWithFixesNeeded(auditId, totalIssues);
    }
    
    // Update audit score in the database if it differs from our calculated score and we have issues
    if (transformedReport.score.overall && 
        transformedReport.score.overall !== auditData.score && 
       Object.values(transformedReport.issues).some(issues => issues.length > 0)) {
      
      console.log('Updating audit score in database from', auditData.score, 'to', transformedReport.score.overall);
      
      // Update the audit score in the database
      await supabase
        .from("audits")
        .update({
          score: transformedReport.score.overall,
          updated_at: new Date().toISOString()
        })
        .eq("id", auditId);
      
      // Also update the audit data object for this session
      auditData.score = transformedReport.score.overall;
    }
    
    // Format the data to match the component props
    const formattedData = {
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
    
    // Log structured data for debugging
    console.log('Formatted data metrics:', {
      pageSpeed: {
        mobile: formattedData.audit.report.pageSpeed?.mobile?.performance || 'N/A',
        desktop: formattedData.audit.report.pageSpeed?.desktop?.performance || 'N/A'
      },
      mozData: {
        domainAuthority: formattedData.audit.report.mozData?.domainAuthority || 'N/A'
      }
    });
    
    return formattedData;
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
  
  return (
    <div className="container mx-auto py-6">
      <AuditHeader
        auditId={auditData.audit.id}
        projectId={auditData.project.id}
        projectName={auditData.project.name}
        projectUrl={auditData.project.url}
        status={auditData.audit.status}
        createdAt={auditData.audit.createdAt}
        auditData={auditData.audit}
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
            />
          </section>

          <Separator />

          <section id="technical-seo" className="pt-2">
            <h2 className="text-2xl font-bold mb-4">Technical SEO</h2>
            <p className="text-muted-foreground mb-6">
              Analysis of technical aspects affecting your website's visibility to search engines.
            </p>
            
            <div className="space-y-6">
              {auditData.audit.report.issues.canonicalLinks?.length > 0 && (
                <IssuesTable
                  title="Canonical Tag Issues"
                  description="Problems with canonical URL implementation"
                  issues={auditData.audit.report.issues.canonicalLinks}
                  category="canonicalLinks"
                  projectId={auditData.project.id}
                  auditId={auditData.audit.id}
                />
              )}
              
              {auditData.audit.report.issues.security?.length > 0 && (
                <IssuesTable
                  title="Security Issues"
                  description="Security concerns that may affect SEO performance"
                  issues={auditData.audit.report.issues.security}
                  category="security"
                  projectId={auditData.project.id}
                  auditId={auditData.audit.id}
                />
              )}
              
              {/* Display technical-related issues from the seo category */}
              {auditData.audit.report.issues.seo?.filter(issue => 
                issue.category === 'technical' || 
                issue.title?.toLowerCase().includes('technical') ||
                issue.description?.toLowerCase().includes('technical')
              )?.length > 0 && (
                <IssuesTable
                  title="Technical Optimization Issues"
                  description="Technical problems affecting SEO performance"
                  issues={auditData.audit.report.issues.seo.filter(issue => 
                    issue.category === 'technical' || 
                    issue.title?.toLowerCase().includes('technical') ||
                    issue.description?.toLowerCase().includes('technical')
                  )}
                  category="technical"
                  projectId={auditData.project.id}
                  auditId={auditData.audit.id}
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
              {auditData.audit.report.issues.metaDescription?.length > 0 && (
                <IssuesTable
                  title="Meta Description Issues"
                  description="Problems with meta description implementation"
                  issues={auditData.audit.report.issues.metaDescription}
                  category="metaDescription"
                  projectId={auditData.project.id}
                  auditId={auditData.audit.id}
                />
              )}
              
              {auditData.audit.report.issues.titleTags?.length > 0 && (
                <IssuesTable
                  title="Title Tag Issues"
                  description="Problems with page title implementation"
                  issues={auditData.audit.report.issues.titleTags}
                  category="titleTags"
                  projectId={auditData.project.id}
                  auditId={auditData.audit.id}
                />
              )}
              
              {auditData.audit.report.issues.headings?.length > 0 && (
                <IssuesTable
                  title="Heading Structure Issues"
                  description="Problems with heading hierarchy"
                  issues={auditData.audit.report.issues.headings}
                  category="headings"
                  projectId={auditData.project.id}
                  auditId={auditData.audit.id}
                />
              )}
              
              {auditData.audit.report.issues.images?.length > 0 && (
                <IssuesTable
                  title="Image Optimization Issues"
                  description="Problems with image implementation and alt tags"
                  issues={auditData.audit.report.issues.images}
                  category="images"
                  projectId={auditData.project.id}
                  auditId={auditData.audit.id}
                />
              )}
              
              {/* Display content-related issues from the seo category */}
              {auditData.audit.report.issues.seo?.filter(issue => 
                issue.category === 'content' || 
                issue.title?.toLowerCase().includes('content') ||
                issue.description?.toLowerCase().includes('content')
              )?.length > 0 && (
                <IssuesTable
                  title="Content Optimization Issues"
                  description="Content problems affecting SEO performance"
                  issues={auditData.audit.report.issues.seo.filter(issue => 
                    issue.category === 'content' || 
                    issue.title?.toLowerCase().includes('content') ||
                    issue.description?.toLowerCase().includes('content')
                  )}
                  category="content"
                  projectId={auditData.project.id}
                  auditId={auditData.audit.id}
                />
              )}
              
              {/* Schema Validation Section */}
              {auditData.audit.report.issues.schemaMarkup && (
                <SchemaValidationSection
                  schemaIssues={auditData.audit.report.issues.schemaMarkup}
                  projectId={auditData.project.id}
                  auditId={auditData.audit.id}
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
              performanceIssues={auditData.audit.report.issues.performance || []}
              projectId={auditData.project.id}
              auditId={auditData.audit.id}
            />
          </section>

          <Separator />

          <section id="ai-recommendations" className="pt-2">
            <AiRecommendations 
              recommendations={auditData.audit.report.issues.seo || []} 
              projectId={auditData.project.id}
              auditId={auditData.audit.id}
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

/**
 * Helper function to map a recommendation from the API to our frontend issue format
 */
function mapRecommendationToIssue(recommendation: any) {
  return {
    id: recommendation.id || `rec-${Math.random().toString(36).substr(2, 9)}`,
    url: recommendation.url || '',
    title: recommendation.title || 'Unnamed recommendation',
    description: recommendation.description || 'No description provided',
    priority: recommendation.priority || 'medium',
    current: recommendation.current || 'Not specified',
    recommended: recommendation.recommended || recommendation.solution || 'No specific recommendation',
    implementation: recommendation.implementation || 'No implementation details provided',
    category: recommendation.category || 'general'
  };
}

/**
 * Helper function for more accurate category score adjustment
 */
function adjustCategoryScore(baseScore: number, issueCount: number, deductionPerIssue: number, minScore: number) {
  if (issueCount === 0) return baseScore;
  
  // Apply more significant deductions with a cap
  const maxDeduction = 40; // Higher cap for more significant score adjustments
  const deduction = Math.min(issueCount * deductionPerIssue, maxDeduction);
  
  // Calculate adjusted score
  return Math.max(minScore, Math.round(baseScore - deduction));
}

/**
 * Maps page speed metrics from API format to our frontend format
 */
function mapPageSpeedMetrics(pageSpeedData: any) {
  if (!pageSpeedData) {
    return {
      score: 0,
      firstContentfulPaint: 0,
      speedIndex: 0,
      largestContentfulPaint: 0,
      timeToInteractive: 0,
      totalBlockingTime: 0,
      cumulativeLayoutShift: 0
    };
  }
  
  return {
    score: Math.round(pageSpeedData.performance || 0),
    firstContentfulPaint: pageSpeedData.fcp || 0,
    speedIndex: pageSpeedData.si || 0,
    largestContentfulPaint: pageSpeedData.lcp || 0,
    timeToInteractive: pageSpeedData.tti || 0,
    totalBlockingTime: pageSpeedData.tbt || 0,
    cumulativeLayoutShift: pageSpeedData.cls || 0
  };
}

// Function to safely validate and normalize URLs
function normalizeUrl(url: string | undefined): string {
  if (!url) return '';
  
  // Check if URL is already a valid absolute URL
  try {
    new URL(url);
    return url; // It's already valid
  } catch (e) {
    // Not a valid URL
    
    // Check if it might be a relative URL that just needs a protocol
    if (url.startsWith('/')) {
      return url; // Keep it as is, it's a relative path
    }
    
    // Try to make it a valid URL if it looks like a domain
    if (url.includes('.') && !url.includes(' ')) {
      try {
        const withProtocol = `https://${url.startsWith('www.') ? '' : 'www.'}${url}`;
        new URL(withProtocol);
        return withProtocol;
      } catch (e) {
        // Still not valid
      }
    }
    
    // If all else fails, return empty string to prevent URL constructor errors
    return '';
  }
}

// Helper function to safely map an issue to a normalized format
function normalizeIssue(issue: any): any {
  return {
    ...issue,
    id: issue.id || `issue-${Math.random().toString(36).substr(2, 9)}`,
    title: issue.title || 'Unnamed issue',
    description: issue.description || 'No description provided',
    priority: issue.priority || 'medium',
    url: normalizeUrl(issue.url),
    current: issue.current || 'Not specified',
    recommended: issue.recommended || issue.solution || 'No specific recommendation',
    implementation: issue.implementation || 'No implementation details provided',
    category: issue.category || 'general',
    // Preserve the affectedImages array if it exists
    affectedImages: issue.affectedImages || []
  };
}

/**
 * Generate specific recommendations based on schema issues
 */
function getSchemaRecommendation(issue: {
  title?: string;
  schemaDetails?: {
    missingSchema?: boolean;
    type?: string;
  }
}): string {
  if (!issue || !issue.title) return 'Fix schema markup issues';
  
  // Missing schema entirely
  if (issue.schemaDetails?.missingSchema) {
    return 'Add appropriate schema.org JSON-LD markup to help search engines understand your content.';
  }
  
  // Invalid JSON
  if (issue.title.includes('Invalid schema')) {
    return 'Fix the JSON syntax errors in your schema markup. Ensure it is valid JSON-LD format.';
  }
  
  // Missing @context
  if (issue.title.includes('missing @context')) {
    return 'Add the @context property with value "https://schema.org" to your schema markup.';
  }
  
  // Missing @type
  if (issue.title.includes('missing @type')) {
    return 'Add an appropriate @type property to your schema markup (e.g., "WebPage", "Product", "Article").';
  }
  
  // Incomplete properties
  if (issue.title.includes('Incomplete schema properties')) {
    const schemaType = issue.schemaDetails?.type || '';
    
    switch (schemaType) {
      case 'WebPage':
        return 'Add required properties to your WebPage schema: name and description.';
      case 'Product':
        return 'Add required properties to your Product schema: name, offers, and/or aggregateRating.';
      case 'Article':
      case 'BlogPosting':
        return 'Add required properties to your Article schema: headline and author.';
      case 'Organization':
        return 'Add required properties to your Organization schema: name and url.';
      case 'LocalBusiness':
        return 'Add required properties to your LocalBusiness schema: name and address.';
      case 'Event':
        return 'Add required properties to your Event schema: name and startDate.';
      case 'FAQPage':
        return 'Add required properties to your FAQPage schema: mainEntity with question and answer properties.';
      default:
        return `Add required properties to your ${schemaType} schema according to schema.org specifications.`;
    }
  }
  
  return 'Fix schema markup according to schema.org guidelines.';
}

/**
 * Generate implementation guides for schema issues
 */
function getSchemaImplementationGuide(issue: {
  title?: string;
  schemaDetails?: {
    missingSchema?: boolean;
    type?: string;
  }
}): string {
  if (!issue) return 'Follow schema.org guidelines to implement structured data.';
  
  // Base implementation guide
  let guide = 'Implementation steps:\n\n';
  
  // Missing schema entirely
  if (issue.schemaDetails?.missingSchema) {
    guide += '1. Determine the appropriate schema type for your content (e.g., WebPage, Product, Article)\n';
    guide += '2. Create a new <script type="application/ld+json"> tag in the <head> section\n';
    guide += '3. Add the JSON-LD markup with @context and @type properties\n';
    guide += '4. Add all required properties for your chosen schema type\n';
    guide += '5. Test your implementation with Google\'s Rich Results Test\n';
    return guide;
  }
  
  // Invalid JSON
  if (issue.title?.includes('Invalid schema')) {
    guide += '1. Locate the problematic JSON-LD script in your page\'s HTML\n';
    guide += '2. Check for syntax errors: missing commas, quotes, or brackets\n';
    guide += '3. Use a JSON validator to identify and fix specific issues\n';
    guide += '4. Test your fixed schema with Google\'s Rich Results Test\n';
    return guide;
  }
  
  // Missing @context
  if (issue.title?.includes('missing @context')) {
    guide += '1. Add the @context property to your schema:\n';
    guide += '   ```\n';
    guide += '   "@context": "https://schema.org",\n';
    guide += '   ```\n';
    guide += '2. Place it at the beginning of your JSON-LD object\n';
    guide += '3. Test with Google\'s Rich Results Test\n';
    return guide;
  }
  
  // Missing @type
  if (issue.title?.includes('missing @type')) {
    guide += '1. Determine the appropriate schema type for your content\n';
    guide += '2. Add the @type property to your schema:\n';
    guide += '   ```\n';
    guide += '   "@type": "WebPage", // or Product, Article, etc.\n';
    guide += '   ```\n';
    guide += '3. Test with Google\'s Rich Results Test\n';
    return guide;
  }
  
  // Incomplete properties
  if (issue.title?.includes('Incomplete schema properties')) {
    const schemaType = issue.schemaDetails?.type || '';
    
    guide += `1. Add the following required properties to your ${schemaType} schema:\n\n`;
    
    switch (schemaType) {
      case 'WebPage':
        guide += '   - name: The title of the page\n';
        guide += '   - description: A brief description of the page content\n';
        break;
      case 'Product':
        guide += '   - name: The product name\n';
        guide += '   - offers: Price and availability information\n';
        guide += '   - aggregateRating: Review information if available\n';
        break;
      case 'Article':
      case 'BlogPosting':
        guide += '   - headline: The article headline\n';
        guide += '   - author: The person or organization who wrote the article\n';
        guide += '   - datePublished: The date the article was published\n';
        break;
      case 'Organization':
        guide += '   - name: The organization name\n';
        guide += '   - url: The URL of the organization\'s website\n';
        guide += '   - logo: URL to the organization\'s logo image\n';
        break;
      case 'LocalBusiness':
        guide += '   - name: The business name\n';
        guide += '   - address: The physical address\n';
        guide += '   - telephone: Contact phone number\n';
        break;
      case 'Event':
        guide += '   - name: The event name\n';
        guide += '   - startDate: When the event begins\n';
        guide += '   - location: Where the event will be held\n';
        break;
      case 'FAQPage':
        guide += '   - mainEntity: An array of questions and answers\n';
        guide += '     Each item should have:\n';
        guide += '     - @type: "Question"\n';
        guide += '     - name: The question text\n';
        guide += '     - acceptedAnswer: { @type: "Answer", text: "Answer text" }\n';
        break;
      default:
        guide += '   - Refer to schema.org for specific requirements\n';
    }
    
    guide += '\n2. Test your implementation with Google\'s Rich Results Test\n';
    return guide;
  }
  
  // Generic fallback
  guide += '1. Review your schema markup against schema.org guidelines\n';
  guide += '2. Implement the missing or corrected structured data\n';
  guide += '3. Test with Google\'s Rich Results Test\n';
  
  return guide;
} 