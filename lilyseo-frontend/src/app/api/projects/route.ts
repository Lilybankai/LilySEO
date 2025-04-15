import { NextResponse } from 'next/server';
// Import the newer Supabase SSR client
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
// Correct the import path for Database types
import { Database } from '@/lib/supabase/database.types';

export async function GET() {
  // Await the cookie store first
  const cookieStore = await cookies();

  // Create the SSR client with cookie handling adapted for Route Handlers
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Ensure cookieStore.set is called correctly
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle potential errors during cookie setting (e.g., invalid options)
            console.error('Failed to set cookie:', error);
            // Depending on your error handling strategy, you might throw
            // or handle this specifically in the context of the request.
          }
        },
        remove(name: string, options: CookieOptions) {
           // Ensure cookieStore.set is called correctly for removal
           try {
             cookieStore.set({ name, value: '', ...options });
           } catch (error) {
             console.error('Failed to remove cookie:', error);
             // Handle potential errors during cookie removal
           }
        },
      },
    }
  );

  try {
    // Get the user session using the SSR client
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
    
    if (sessionError) {
      console.error("[API Route] Error getting user session:", sessionError);
      // Provide a more specific error message if possible
      const errorMessage = sessionError.message || 'Failed to validate user session';
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    if (!user) {
      console.log('[API Route] No authenticated user found via SSR client');
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    console.log(`[API Route] Authenticated user found via SSR client: ${user.id}`);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[API Route] Error fetching projects:', error);
      return NextResponse.json(
        { error: 'Failed to fetch projects', details: error.message },
        { status: 500 }
      );
    }

    console.log(`[API Route] Returning ${data?.length || 0} projects for user ${user.id}`);
    return NextResponse.json({ data });
    
  } catch (error: any) {
    // Catch unexpected errors in the try block
    console.error('[API Route] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message || 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 