// This file is deprecated - please use one of:
// - server-adapter.ts for app directory components
// - middleware-client.ts for middleware
// - server-pages.ts for pages directory API routes

// Re-export from server-adapter to maintain compatibility
export { createServerAdapter as createClient } from './server-adapter'

// Re-export other necessary functions
import { createServerClient } from '@supabase/ssr'
import { Database } from './database.types'

// Helper to check if we're in a browser environment
const isBrowser = typeof window !== 'undefined'

/**
 * Creates a Supabase client for middleware
 * This version is intended for use in Next.js middleware or API routes
 */
export const createMiddlewareClient = (request: Request, response: Response) => {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Extract cookies from request
          const cookies = request.headers.get('cookie') || ''
          const cookie = cookies.split(';').find(c => c.trim().startsWith(`${name}=`))
          if (!cookie) return undefined
          return cookie.split('=')[1]
        },
        set(name: string, value: string, options: any) {
          // Set cookie header
          response.headers.append('Set-Cookie', `${name}=${value}; Path=/`)
        },
        remove(name: string, options: any) {
          // Remove cookie by setting empty value and immediate expiry
          response.headers.append('Set-Cookie', `${name}=; Path=/; Max-Age=0`)
        },
      },
    }
  )
}

/**
 * Creates an admin Supabase client
 * This function is only callable in the App Router
 */
export const getAdminSupabase = async () => {
  if (isBrowser) {
    throw new Error('getAdminSupabase should not be called in browser environments')
  }
  
  // Dynamic import to avoid build errors (only loads in server environment)
  const { cookies } = await import('next/headers')
  const cookieStore = cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle the error or ignore it
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle the error or ignore it
          }
        },
      },
    }
  )
} 