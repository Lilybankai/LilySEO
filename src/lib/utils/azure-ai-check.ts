"use client";

/**
 * Helper function to check if Azure OpenAI is configured
 * @returns Boolean indicating if Azure OpenAI is set up
 */
export async function isAzureOpenAIConfigured(): Promise<boolean> {
  try {
    // Use the health check endpoint to verify Azure OpenAI configuration
    const response = await fetch('/api/ai/health', {
      method: 'GET',
      cache: 'no-store',
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.configured === true;
  } catch (error) {
    console.error('Error checking Azure OpenAI configuration:', error);
    return false;
  }
}

/**
 * Helper function to handle AI API errors
 * @param error Error object or string
 * @returns Formatted error message
 */
export function formatAIError(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  return 'An unexpected error occurred with the AI service';
} 