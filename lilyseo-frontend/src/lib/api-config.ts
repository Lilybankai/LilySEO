/**
 * API Configuration
 * 
 * This file contains configuration for external API services used by the application.
 */

// Crawler Service API configuration
export const CRAWLER_SERVICE_API = {
  // Base URL for the crawler service API
  BASE_URL: process.env.NEXT_PUBLIC_CRAWLER_SERVICE_URL || 'http://localhost:3001',
  
  // API endpoints
  ENDPOINTS: {
    // Health check endpoint
    HEALTH: '/health',
    
    // Audit endpoints
    AUDIT: {
      START: '/api/audit/start',
      STATUS: '/api/audit/status',
      RESULTS: '/api/audit/results',
    },
    
    // MOZ API endpoints
    MOZ: {
      UPDATE: '/api/moz/update',
      STATUS: '/api/moz/status',
    },
    
    // PageSpeed API endpoints
    PAGESPEED: {
      UPDATE: '/api/pagespeed/update',
      STATUS: '/api/pagespeed/status',
    },
  },
};

/**
 * Get the URL for the crawler service API
 * @param path The path to append to the base URL
 * @returns The full URL for the crawler service API
 */
export function getCrawlerServiceUrl(path: string): string {
  // Use localhost:3001 in development mode
  const isDev = process.env.NODE_ENV === 'development';
  
  // Get the base URL from environment variables or fallback to development default
  const baseUrl = process.env.NEXT_PUBLIC_CRAWLER_SERVICE_URL || 
                 (isDev ? 'http://localhost:3001' : 'http://s4og044go8wogw8o0skooco8.37.27.219.0.sslip.io:3001');
  
  // Log the URL for debugging
  if (typeof window !== 'undefined' && isDev) {
    console.log(`[API Config] Using crawler service URL: ${baseUrl}${path}`);
  }
  
  return `${baseUrl}${path}`;
} 