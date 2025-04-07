/**
 * PDF Error Handling Utilities
 * 
 * This file contains utilities for validating, sanitizing, and providing fallbacks
 * for data used in PDF report generation. These utilities help ensure that the PDF
 * generation process is resilient against missing or malformed data.
 */

/**
 * Validates if audit data contains the minimum required properties to generate a PDF
 */
export function isValidAuditData(auditData: any): boolean {
  if (!auditData) return false;
  
  // At minimum, we need either projects or report data
  return !!(auditData.projects || auditData.report);
}

/**
 * Provides safe access to nested properties with fallbacks
 */
export function safeGet<T>(obj: any, path: string, defaultValue: T): T {
  try {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === undefined || current === null) {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current === undefined || current === null ? defaultValue : current;
  } catch (error) {
    console.warn(`Error accessing path ${path}:`, error);
    return defaultValue;
  }
}

/**
 * Type for the dashboard data with all potential properties made optional
 * to handle cases where the structure might be incomplete
 */
export type SafeAuditData = {
  url?: string;
  status?: string;
  projects?: {
    name?: string;
    domain?: string;
    created_at?: string;
  };
  report?: {
    technical_seo?: any;
    on_page_seo?: any;
    off_page_seo?: any;
    user_experience?: any;
    performance?: any;
    structured_data?: any;
  };
  // Optional properties for scores
  scores?: {
    overall?: number;
    categories?: {
      technical_seo?: number;
      on_page_seo?: number;
      off_page_seo?: number;
      user_experience?: number;
      performance?: number;
    };
  };
  // Issues data
  issues?: Array<{
    id?: string;
    category?: string;
    severity?: string;
    title?: string;
    description?: string;
    impact?: string;
    recommendation?: string;
  }>;
};

/**
 * Transform and sanitize raw audit data to ensure safe access
 * for PDF generation, providing fallbacks as needed
 */
export function sanitizeAuditData(rawData: any): SafeAuditData {
  if (!rawData) {
    console.error('No audit data provided');
    return { status: 'error', url: 'No data available' };
  }
  
  // Create a basic safe object with defaults
  const safeData: SafeAuditData = {
    url: safeGet(rawData, 'url', 'Unknown URL'),
    status: safeGet(rawData, 'status', 'unknown'),
    projects: {
      name: safeGet(rawData, 'projects.name', 'Unnamed Project'),
      domain: safeGet(rawData, 'projects.domain', safeGet(rawData, 'url', 'unknown.com')),
      created_at: safeGet(rawData, 'projects.created_at', new Date().toISOString()),
    },
    report: {},
    scores: {
      overall: safeGet(rawData, 'scores.overall', 0),
      categories: {
        technical_seo: safeGet(rawData, 'scores.categories.technical_seo', 0),
        on_page_seo: safeGet(rawData, 'scores.categories.on_page_seo', 0),
        off_page_seo: safeGet(rawData, 'scores.categories.off_page_seo', 0),
        user_experience: safeGet(rawData, 'scores.categories.user_experience', 0),
        performance: safeGet(rawData, 'scores.categories.performance', 0),
      },
    },
    issues: [],
  };
  
  // Safely copy report data if available
  if (rawData.report) {
    safeData.report = {
      technical_seo: safeGet(rawData, 'report.technical_seo', {}),
      on_page_seo: safeGet(rawData, 'report.on_page_seo', {}),
      off_page_seo: safeGet(rawData, 'report.off_page_seo', {}),
      user_experience: safeGet(rawData, 'report.user_experience', {}),
      performance: safeGet(rawData, 'report.performance', {}),
      structured_data: safeGet(rawData, 'report.structured_data', {}),
    };
  }
  
  // Process issues with validation
  if (Array.isArray(rawData.issues)) {
    safeData.issues = rawData.issues.map((issue: any) => ({
      id: safeGet(issue, 'id', `issue-${Math.random().toString(36).substr(2, 9)}`),
      category: safeGet(issue, 'category', 'Uncategorized'),
      severity: safeGet(issue, 'severity', 'medium'),
      title: safeGet(issue, 'title', 'Unnamed Issue'),
      description: safeGet(issue, 'description', 'No description provided'),
      impact: safeGet(issue, 'impact', 'Unknown impact'),
      recommendation: safeGet(issue, 'recommendation', 'No recommendation provided'),
    }));
  }
  
  return safeData;
}

/**
 * Validate client information for PDF reports
 */
export function validateClientInfo(clientInfo: any): {
  name: string;
  email: string;
  phone: string;
  website: string;
} {
  return {
    name: safeGet(clientInfo, 'name', ''),
    email: safeGet(clientInfo, 'email', ''),
    phone: safeGet(clientInfo, 'phone', ''),
    website: safeGet(clientInfo, 'website', ''),
  };
}

/**
 * Generate categorized issues summary with counts
 */
export function generateIssuesSummary(issues: any[] = []): {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
  byCategoryCount: Record<string, number>;
} {
  const summary = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: issues.length,
    byCategoryCount: {} as Record<string, number>,
  };
  
  // Count by severity
  issues.forEach(issue => {
    const severity = safeGet(issue, 'severity', 'medium').toLowerCase();
    if (severity === 'critical') summary.critical++;
    else if (severity === 'high') summary.high++;
    else if (severity === 'medium') summary.medium++;
    else if (severity === 'low') summary.low++;
    
    // Count by category
    const category = safeGet(issue, 'category', 'Uncategorized');
    summary.byCategoryCount[category] = (summary.byCategoryCount[category] || 0) + 1;
  });
  
  return summary;
}

/**
 * Handles errors during PDF generation and provides user-friendly messages
 */
export function handlePdfGenerationError(error: any): string {
  console.error('PDF Generation Error:', error);
  
  // Map common errors to user-friendly messages
  if (error?.message?.includes('memory')) {
    return 'The report is too large to generate. Try excluding some sections or reducing the data.';
  }
  
  if (error?.message?.includes('network')) {
    return 'Network error occurred. Please check your connection and try again.';
  }
  
  if (error?.message?.includes('font')) {
    return 'Error loading fonts. Please refresh and try again.';
  }
  
  // Default generic message
  return 'An error occurred while generating the PDF. Please try again or contact support.';
}

/**
 * Logger for PDF generation process
 */
export function logPdfGeneration(
  stage: 'start' | 'processing' | 'complete' | 'error',
  details: Record<string, any> = {},
): void {
  const timestamp = new Date().toISOString();
  console.log(`[PDF Generation ${stage}] ${timestamp}:`, details);
  
  // In production, this could send logs to a monitoring service
  if (stage === 'error' && process.env.NODE_ENV === 'production') {
    // Example: Send to error monitoring service
    // errorMonitoringService.captureException(details.error);
  }
}

/**
 * Wraps a PDF generation function with error handling and logging
 */
export function withPdfErrorHandling<T>(
  fn: (...args: any[]) => T,
  errorHandler: (error: any) => T
): (...args: any[]) => T {
  return (...args: any[]) => {
    try {
      logPdfGeneration('start', { args: args.map(arg => typeof arg) });
      const result = fn(...args);
      logPdfGeneration('complete');
      return result;
    } catch (error) {
      logPdfGeneration('error', { error });
      return errorHandler(error);
    }
  };
}

/**
 * Utility function to log PDF generation events with timestamps
 */
export function logPdfEvent(
  eventType: 
    | 'color-parsing' 
    | 'color-conversion' 
    | 'color-error'
    | 'color-parsed'
    | 'color-fallback'
    | 'color-converted'
    | 'color-conversion-error'
    | 'theme-update' 
    | 'theme-init'
    | 'theme-colors'
    | 'theme-update-processed'
    | 'profile-creation' 
    | 'profile-create'
    | 'profile-created'
    | 'profile-create-error'
    | 'profile-update' 
    | 'profile-updated' 
    | 'profile-update-error'
    | 'profile-color-change'
    | 'profile-color-processed' 
    | 'pdf-generation' 
    | 'error'
    | 'chart-colors'
    | 'coverpage-colors'
    | 'coverpage-processed-colors',
  data: Record<string, any>
) {
  const timestamp = new Date().toISOString();
  console.log(`[PDF Event][${timestamp}][${eventType}]`, JSON.stringify(data, null, 2));
}

/**
 * Safely parse HSL color values to prevent errors
 * This is a defensive approach to handle potentially malformed HSL strings
 */
export const safeParseHsl = (hslString: string | null | undefined): { h: number, s: number, l: number } | null => {
  if (!hslString) {
    logPdfEvent('color-error', { type: 'null-input', value: hslString });
    return null;
  }
  
  try {
    // Clean up and normalize the input
    const normalized = hslString.trim().toLowerCase();
    
    // Log what we're trying to parse
    logPdfEvent('color-parsing', { 
      input: normalized,
      isHsl: normalized.startsWith('hsl'),
      length: normalized.length
    });
    
    // Basic validation
    if (!normalized.startsWith('hsl')) {
      logPdfEvent('color-error', { type: 'not-hsl', value: normalized });
      return null;
    }
    
    // Extract values using multiple regex patterns to support different HSL formats:
    
    // 1. Modern CSS format: hsl(220 70% 50%) - space separated values
    const modernHslRegex = /hsl\(\s*(\d+)(?:deg)?\s+(\d+)(?:\.\d+)?%\s+(\d+)(?:\.\d+)?%(?:\s*\/\s*(?:0?\.)?\d+)?\s*\)/;
    
    // 2. Traditional CSS format: hsl(220, 70%, 50%) - comma separated values
    const traditionalHslRegex = /hsl\(\s*(\d+)(?:deg)?\s*,\s*(\d+)(?:\.\d+)?%\s*,\s*(\d+)(?:\.\d+)?%(?:\s*,\s*(?:0?\.)?\d+)?\s*\)/;
    
    // 3. HSLA formats - same patterns with alpha
    const hslaModernRegex = /hsla\(\s*(\d+)(?:deg)?\s+(\d+)(?:\.\d+)?%\s+(\d+)(?:\.\d+)?%\s*(?:\/\s*(?:0?\.)?\d+)?\s*\)/;
    const hslaTraditionalRegex = /hsla\(\s*(\d+)(?:deg)?\s*,\s*(\d+)(?:\.\d+)?%\s*,\s*(\d+)(?:\.\d+)?%\s*,\s*(?:0?\.)?\d+\s*\)/;
    
    // Try each regex pattern to find a match
    let match = 
      normalized.match(modernHslRegex) ||
      normalized.match(traditionalHslRegex) ||
      normalized.match(hslaModernRegex) ||
      normalized.match(hslaTraditionalRegex);
    
    if (!match) {
      logPdfEvent('color-error', { type: 'regex-match-failed', value: normalized });
      return null;
    }
    
    // Parse numeric values (same for all formats)
    const h = parseInt(match[1], 10);
    const s = parseInt(match[2], 10);
    const l = parseInt(match[3], 10);
    
    // Validate parsed values
    if (isNaN(h) || isNaN(s) || isNaN(l)) {
      logPdfEvent('color-error', { type: 'nan-values', h, s, l, value: normalized });
      return null;
    }
    
    // Ensure values are in valid ranges
    const safeH = Math.max(0, Math.min(360, h));
    const safeS = Math.max(0, Math.min(100, s));
    const safeL = Math.max(0, Math.min(100, l));
    
    // Log successful parsing
    logPdfEvent('color-parsed', { h: safeH, s: safeS, l: safeL, original: normalized });
    
    return { h: safeH, s: safeS, l: safeL };
  } catch (error) {
    logPdfEvent('color-error', { 
      type: 'parse-exception', 
      value: hslString,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
};

/**
 * Convert HSL to HEX color safely with fallback
 */
export const safeHslToHex = (hslString: string | null | undefined, fallbackColor: string = '#3b82f6'): string => {
  // Additional validation before parsing - catch non-string values
  if (hslString === null || hslString === undefined || typeof hslString !== 'string') {
    logPdfEvent('color-fallback', { 
      original: String(hslString), 
      reason: 'invalid-input-type',
      fallback: fallbackColor 
    });
    return fallbackColor;
  }
  
  // Return the original color directly if it's already a hex color
  if (hslString.trim().startsWith('#')) {
    return hslString.trim();
  }
  
  // Parse HSL values
  const hsl = safeParseHsl(hslString);
  
  if (!hsl) {
    logPdfEvent('color-fallback', { 
      original: hslString, 
      fallback: fallbackColor 
    });
    return fallbackColor;
  }
  
  try {
    // Convert HSL to HEX
    const { h, s, l } = hsl;
    
    // HSL to RGB conversion logic
    const c = (1 - Math.abs(2 * l / 100 - 1)) * (s / 100);
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l / 100 - c / 2;
    
    let r, g, b;
    
    if (h >= 0 && h < 60) {
      [r, g, b] = [c, x, 0];
    } else if (h >= 60 && h < 120) {
      [r, g, b] = [x, c, 0];
    } else if (h >= 120 && h < 180) {
      [r, g, b] = [0, c, x];
    } else if (h >= 180 && h < 240) {
      [r, g, b] = [0, x, c];
    } else if (h >= 240 && h < 300) {
      [r, g, b] = [x, 0, c];
    } else {
      [r, g, b] = [c, 0, x];
    }
    
    // Convert RGB to HEX
    const toHex = (value: number) => {
      const hex = Math.round((value + m) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    
    logPdfEvent('color-converted', { 
      original: hslString, 
      parsed: { h, s, l }, 
      result: hexColor 
    });
    
    return hexColor;
  } catch (error) {
    logPdfEvent('color-conversion-error', { 
      original: hslString, 
      error: error instanceof Error ? error.message : String(error),
      fallback: fallbackColor 
    });
    return fallbackColor;
  }
};

/**
 * Convert HEX color to RGBA format with specified opacity
 */
export const hexToRgba = (hex: string, opacity: number = 1): string => {
  if (!hex || !hex.startsWith('#')) {
    logPdfEvent('color-error', { type: 'invalid-hex', value: hex });
    // Fallback to a semi-transparent gray
    return `rgba(100, 100, 100, ${Math.max(0, Math.min(1, opacity))})`;
  }
  
  try {
    let r = 0, g = 0, b = 0;
    // 3 digit hex
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } 
    // 6 digit hex
    else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      throw new Error('Failed to parse hex components');
    }
    
    const safeOpacity = Math.max(0, Math.min(1, opacity));
    const rgbaColor = `rgba(${r}, ${g}, ${b}, ${safeOpacity})`;
    
    logPdfEvent('color-conversion', { 
      original: hex, 
      opacity: safeOpacity,
      result: rgbaColor 
    });
    
    return rgbaColor;
    
  } catch (error) {
    logPdfEvent('color-conversion-error', { 
      original: hex, 
      opacity: opacity,
      error: error instanceof Error ? error.message : String(error),
      fallback: `rgba(100, 100, 100, ${Math.max(0, Math.min(1, opacity))})`
    });
    // Fallback on error
    return `rgba(100, 100, 100, ${Math.max(0, Math.min(1, opacity))})`;
  }
}; 