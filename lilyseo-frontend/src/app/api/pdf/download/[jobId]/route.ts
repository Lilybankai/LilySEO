import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

// Ensure these are loaded server-side (should NOT be NEXT_PUBLIC_)
const CRAWLER_API_URL = process.env.CRAWLER_API_URL;
// Use the correct env variable name matching your .env files
const PDF_API_KEY = process.env.PDF_API_KEY; 

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  // Explicitly get jobId - addresses potential Next.js warning
  const { jobId } = params;

  // Log the crawler URL and API Key presence (key value is secret)
  console.log('[PDF Download API] CRAWLER_API_URL:', CRAWLER_API_URL);
  console.log('[PDF Download API] PDF_API_KEY is set:', !!PDF_API_KEY);

  if (!CRAWLER_API_URL) {
    console.error('[PDF Download API] CRAWLER_API_URL environment variable is not set!');
    return NextResponse.json({ error: 'Internal server configuration error: Crawler URL missing.' }, { status: 500 });
  }
  if (!PDF_API_KEY) {
    // This is now critical for the crawler
    console.error('[PDF Download API] PDF_API_KEY environment variable is not set!');
    return NextResponse.json({ error: 'Internal server configuration error: Crawler API Key missing.' }, { status: 500 });
  }

  // Correct & Simplified Supabase client initialization for Route Handler
  // REMOVED the entire cookies object - getUser/getSession handle it.
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { /* No cookies object needed here */ }
  );

  try {
    // This will read cookies correctly without explicit handlers
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log('[PDF Download API] Authentication error:', userError?.message || 'User not found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('[PDF Download API] User authenticated:', user.id);

    const { data: { session } } = await supabase.auth.getSession();
    const organizationId = (session?.user?.user_metadata as any)?.organizationId;
    console.log(`[PDF Download API] Forwarding with UserId: ${user.id}, OrgId: ${organizationId || 'Not Found'}`);

    // Use the validated CRAWLER_API_URL and the correct jobId variable
    const response = await fetch(`${CRAWLER_API_URL}/api/pdf/download/${jobId}`, { // Use jobId variable
      headers: {
        'x-api-key': PDF_API_KEY, // Use the correct API key variable
        'x-user-id': user.id,
        ...(organizationId && { 'x-organization-id': organizationId }),
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[PDF Download API] Crawler service error (${response.status}):`, errorBody);
       try {
           const data = JSON.parse(errorBody);
           throw new Error(data.message || `Failed to download PDF (${response.status})`);
       } catch (parseError) {
           throw new Error(errorBody || `Failed to download PDF (${response.status})`);
       }
    }

    if (response.redirected) {
      console.log(`[PDF Download API] Following redirect from crawler to: ${response.url}`);
      return NextResponse.redirect(response.url);
    }

    if (!response.body) {
        console.error('[PDF Download API] PDF download response from crawler service had no body.');
      throw new Error('PDF download response from crawler service had no body.');
    }

    console.log('[PDF Download API] Streaming PDF content from crawler.');
    const headers = new Headers(response.headers);
    if (!headers.has('Content-Type') || headers.get('Content-Type')?.toLowerCase().includes('json')) {
      headers.set('Content-Type', 'application/pdf');
    }
    if (!headers.has('Content-Disposition')) {
       headers.set('Content-Disposition', `attachment; filename="seo-audit-${jobId.substring(0,8)}.pdf"`);
    }

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });

  } catch (error: any) {
    console.error('[PDF Download API] Download failed:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during PDF download.' },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}