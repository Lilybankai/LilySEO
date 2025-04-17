/**
 * Handles API responses, parsing JSON and providing consistent error handling
 * @param response - The fetch API response
 * @returns Promise with parsed response data or error
 */
export async function handleApiResponse(response: Response): Promise<{ success: boolean; [key: string]: any }> {
  try {
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Server responded with ${response.status}: ${response.statusText}`,
        status: response.status
      };
    }
    
    return {
      success: true,
      ...data
    };
  } catch (error) {
    console.error('Error handling API response:', error);
    return {
      success: false,
      error: 'Failed to process API response.',
      status: response.status
    };
  }
}

/**
 * Formats an error message for display
 * @param error - The error object or string
 * @returns Formatted error message
 */
export function formatErrorMessage(error: any): string {
  if (!error) {
    return 'An unknown error occurred';
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return JSON.stringify(error);
}

/**
 * Creates a query string from parameters
 * @param params - Object with parameters
 * @returns URL query string
 */
export function createQueryString(params: Record<string, any>): string {
  const filteredParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map(v => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`).join('&');
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');
  
  return filteredParams ? `?${filteredParams}` : '';
} 