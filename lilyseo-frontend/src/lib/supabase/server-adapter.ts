import { createServerClient } from '@supabase/ssr'
import { Database } from './database.types'

/**
 * This is a safe adapter that doesn't directly import next/headers
 * but still provides server functionality. It uses dynamic imports
 * to avoid build-time issues with the pages directory.
 */
export async function createServerAdapter() {
  // Use the App Router Client, but only on the server side
  if (typeof window === 'undefined') {
    try {
      // Import the necessary Next.js functions
      const { cookies } = await import('next/headers')
      
      // Create a server client with async cookie methods
      return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            async get(name: string) {
              try {
                // Have to call cookies() each time to ensure we have the current request context
                const cookieStore = await cookies();
                const cookie = cookieStore.get(name);
                return cookie?.value;
              } catch (error) {
                console.error('Error getting cookie:', error);
                return undefined;
              }
            },
            async set(name: string, value: string, options: any) {
              try {
                const cookieStore = await cookies();
                cookieStore.set({ name, value, ...options });
              } catch (error) {
                console.error('Error setting cookie:', error);
              }
            },
            async remove(name: string, options: any) {
              try {
                const cookieStore = await cookies();
                cookieStore.set({ name, value: '', ...options });
              } catch (error) {
                console.error('Error removing cookie:', error);
              }
            },
          },
        }
      )
    } catch (error) {
      console.error('Failed to create app router client:', error)
      throw new Error('Failed to create Supabase client. If you are using Pages Router, use createPagesServerClient instead.')
    }
  } else {
    // If we're in the browser, we shouldn't be calling this function
    throw new Error('createServerAdapter should only be called on the server side')
  }
} 