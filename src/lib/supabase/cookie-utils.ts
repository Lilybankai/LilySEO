/**
 * Utility functions for handling Supabase cookies
 * Specifically addressing the base64 prefix issue
 */

/**
 * Safely parses a Supabase cookie string that might have a base64 prefix
 * @param cookieStr The cookie string value
 * @returns The parsed cookie value or null if parsing fails
 */
export function parseSupabaseCookie(cookieStr: string | undefined): any {
  if (!cookieStr) return null;
  
  try {
    // Handle cookies with base64- prefix
    if (cookieStr.startsWith('base64-')) {
      // We don't need to remove the prefix for Supabase's internal handling
      // Just return the string as is
      return cookieStr;
    }
    
    // Regular JSON parsing for non-prefixed cookies
    return JSON.parse(cookieStr);
  } catch (error) {
    console.error('Error parsing cookie:', error);
    return null;
  }
}

/**
 * Creates a custom cookie handler for Supabase client
 */
export function createCustomCookieHandler() {
  return {
    getItem: (key: string): string | null => {
      // In browser environments
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        const cookie = cookies.find(c => c.trim().startsWith(`${key}=`));
        if (!cookie) return null;
        
        const cookieValue = cookie.split('=')[1].trim();
        return cookieValue;
      }
      return null;
    },
    setItem: (key: string, value: string): void => {
      // In browser environments
      if (typeof document !== 'undefined') {
        document.cookie = `${key}=${value}; path=/; max-age=${60 * 60 * 24 * 365}`;
      }
    },
    removeItem: (key: string): void => {
      // In browser environments
      if (typeof document !== 'undefined') {
        document.cookie = `${key}=; path=/; max-age=0`;
      }
    }
  };
} 