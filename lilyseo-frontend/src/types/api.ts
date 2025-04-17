/**
 * Type definitions for Next.js API routes
 */

// Re-export NextResponse to avoid import errors
export type APIResponse<T = any> = Response & {
  json: () => Promise<T>;
};

// Helper for creating standardized API responses
export function createApiResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// Helper for error responses
export function createErrorResponse(error: string, status = 500): Response {
  return createApiResponse({ error }, status);
}

// Helper for success responses
export function createSuccessResponse(data: any): Response {
  return createApiResponse(data, 200);
} 