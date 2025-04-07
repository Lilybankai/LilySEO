/**
 * Utility functions for transforming audit issue data
 */

// Define issue type
export interface Issue {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low' | 'info';
  examples?: string[];
}

// Define category type
export interface IssueCategory {
  category: string;
  items: Issue[];
}

/**
 * Maps a priority/severity from the API to our standard severity levels
 */
export const mapSeverity = (priority: string | undefined): 'high' | 'medium' | 'low' | 'info' => {
  if (!priority) return 'info';
  
  switch(priority.toLowerCase()) {
    case 'critical':
    case 'high':
      return 'high';
    case 'medium':
    case 'moderate':
      return 'medium';
    case 'low':
    case 'minor':
      return 'low';
    default:
      return 'info';
  }
};

/**
 * Transforms raw issue objects to our standardized Issue format
 */
export const transformIssue = (rawIssue: any): Issue => {
  return {
    title: rawIssue.title || rawIssue.message || 'Issue',
    description: rawIssue.description || rawIssue.details || '',
    severity: mapSeverity(rawIssue.severity || rawIssue.priority),
    examples: rawIssue.examples || rawIssue.instances || rawIssue.urls || undefined
  };
};

/**
 * Organizes issues into categories based on the audit data structure
 */
export const categorizeIssues = (auditData: any): IssueCategory[] => {
  const reportData = auditData.report || {};
  const issues = reportData.issues || {};
  
  const categories: IssueCategory[] = [];
  
  // On-page SEO issues
  const onPageIssues: Issue[] = [
    ...(issues.metaDescription || []).map(transformIssue),
    ...(issues.titleTags || []).map(transformIssue),
    ...(issues.headings || []).map(transformIssue)
  ];
  
  if (onPageIssues.length > 0) {
    categories.push({
      category: 'On-Page SEO',
      items: onPageIssues
    });
  }
  
  // Technical SEO issues
  const technicalIssues: Issue[] = [
    ...(issues.images || []).map(transformIssue),
    ...(issues.links || []).map(transformIssue),
    ...(issues.performance || []).map(transformIssue),
    ...(issues.schemaMarkup || []).map(transformIssue)
  ];
  
  if (technicalIssues.length > 0) {
    categories.push({
      category: 'Technical SEO',
      items: technicalIssues
    });
  }
  
  // User Experience issues
  const uxIssues: Issue[] = [
    ...(issues.mobile || []).map(transformIssue),
    ...(issues.security || []).map(transformIssue)
  ];
  
  if (uxIssues.length > 0) {
    categories.push({
      category: 'User Experience',
      items: uxIssues
    });
  }
  
  // Content issues
  const contentIssues: Issue[] = [
    ...(issues.content || []).map(transformIssue),
    ...(issues.keywords || []).map(transformIssue)
  ];
  
  if (contentIssues.length > 0) {
    categories.push({
      category: 'Content',
      items: contentIssues
    });
  }
  
  // Sort issues by severity within each category
  categories.forEach(category => {
    category.items.sort((a, b) => {
      const severityOrder = { 'high': 0, 'medium': 1, 'low': 2, 'info': 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  });
  
  return categories;
};

/**
 * Counts issues by severity across all categories
 */
export const countIssuesBySeverity = (categories: IssueCategory[]) => {
  const counts = {
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    total: 0
  };
  
  categories.forEach(category => {
    category.items.forEach(issue => {
      counts[issue.severity]++;
      counts.total++;
    });
  });
  
  return counts;
};

/**
 * Generate prioritized recommendations based on issues
 */
export const generateRecommendations = (categories: IssueCategory[], limit: number = 5): string[] => {
  // Flatten all high severity issues across categories
  const highPriorityIssues = categories
    .flatMap(category => category.items)
    .filter(issue => issue.severity === 'high');
  
  const recommendations: string[] = [];
  
  // Add recommendations for high-priority issues first
  if (highPriorityIssues.length > 0) {
    highPriorityIssues.slice(0, Math.min(highPriorityIssues.length, limit)).forEach(issue => {
      recommendations.push(`Fix ${issue.title.toLowerCase()}`);
    });
  }
  
  // Add category-specific recommendations if we still have room
  if (recommendations.length < limit) {
    // Check for on-page SEO issues
    const onPageCategory = categories.find(c => c.category === 'On-Page SEO');
    if (onPageCategory && onPageCategory.items.length > 0) {
      recommendations.push('Improve on-page SEO elements for better search visibility');
    }
    
    // Check for technical issues
    const technicalCategory = categories.find(c => c.category === 'Technical SEO');
    if (technicalCategory && technicalCategory.items.length > 0) {
      recommendations.push('Address technical SEO issues to improve site performance and indexability');
    }
    
    // Check for UX issues
    const uxCategory = categories.find(c => c.category === 'User Experience');
    if (uxCategory && uxCategory.items.length > 0) {
      recommendations.push('Enhance user experience to reduce bounce rate and improve engagement');
    }
  }
  
  // Add general recommendations if needed to reach the limit
  const generalRecommendations = [
    'Regularly update your content to keep it fresh and relevant',
    'Focus on building high-quality backlinks from authoritative websites',
    'Monitor your site\'s performance and make continuous improvements',
    'Ensure your website is mobile-friendly and loads quickly',
    'Create compelling, keyword-rich content that addresses user search intent'
  ];
  
  // Fill remaining slots with general recommendations
  while (recommendations.length < limit) {
    const randomIndex = Math.floor(Math.random() * generalRecommendations.length);
    const recommendation = generalRecommendations[randomIndex];
    
    // Only add if not already in the list
    if (!recommendations.includes(recommendation)) {
      recommendations.push(recommendation);
    }
    
    // Safety check in case we run out of unique recommendations
    if (recommendations.length >= limit || recommendations.length >= generalRecommendations.length + highPriorityIssues.length) {
      break;
    }
  }
  
  return recommendations;
}; 