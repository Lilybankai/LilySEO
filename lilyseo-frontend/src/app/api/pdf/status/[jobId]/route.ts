import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

// Explicitly mark the route as dynamic
export const dynamic = 'force-dynamic';

const API_URL = process.env.CRAWLER_API_URL || 'http://localhost:3001';
const API_KEY = process.env.PDF_API_KEY;

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  const cookieStore = cookies();
  const awaitedParams = await params;
  const jobId = awaitedParams.jobId;

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookieStore.get(name))?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignore errors in Server Components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Ignore errors in Server Components
          }
        },
      },
    }
  );

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log('[PDF Status API] Authentication error:', userError?.message || 'User not found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('[PDF Status API] User authenticated:', user.id);

    const { data: { session } } = await supabase.auth.getSession();
    const organizationId = (session?.user?.user_metadata as any)?.organizationId;
    console.log(`[PDF Status API] Forwarding with UserId: ${user.id}, OrgId: ${organizationId || 'Not Found'}`);

    const response = await fetch(`${API_URL}/api/pdf/status/${jobId}`, {
      headers: {
        'x-api-key': API_KEY || '',
        'x-user-id': user.id,
        ...(organizationId && { 'x-organization-id': organizationId }),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Failed to check PDF status (${response.status})`);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[PDF Status API] Status check failed:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500 }
    );
  }
} 