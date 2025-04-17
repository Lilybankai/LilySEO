import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

// Import the necessary types from the frontend definitions
import { PdfTheme } from '@/context/ThemeContext'; 

// Explicitly mark the route as dynamic
export const dynamic = 'force-dynamic';

// Define crawler service types locally for clarity (or import if shared)
interface CrawlerClientDetails {
  name: string;
  preparedBy: string; // Corresponds to company name in theme?
  email?: string;
  phone?: string;
  website?: string;
}

interface CrawlerPdfGenerationOptions {
  auditData: any; 
  clientDetails: CrawlerClientDetails;
  customNotes?: string;
  logoUrl?: string;
  primaryColor: string;
  coverStyle: number;
  generateAiContent?: boolean;
}

const CRAWLER_API_URL = process.env.CRAWLER_API_URL || 'http://localhost:3001';
// Directly reference process.env here for logging
const PDF_API_KEY_VALUE = process.env.PDF_API_KEY;

// --- Helper function to fetch audit data ---
async function getAuditData(supabase: any, projectId: string): Promise<any> {
  console.log(`[PDF Generate API] Fetching latest completed report data for projectId: ${projectId}`);
  
  // Fetch the latest report data directly from the audit_reports table for the given project
  // Assuming the latest row in audit_reports for the project corresponds to the latest completed audit data.
  const { data: reportRecord, error: reportError } = await supabase
    .from('audit_reports') // Query the audit_reports table
    .select('report_data') // Select the JSONB column containing the report
    .eq('project_id', projectId)
    .order('created_at', { ascending: false }) // Get the most recent report for the project
    .limit(1)
    .maybeSingle(); // Use maybeSingle to handle cases where no report might exist yet

  if (reportError) {
    console.error('[PDF Generate API] Error fetching latest report data:', reportError);
    throw new Error(`Failed to fetch latest report data for project ${projectId}: ${reportError.message}`);
  }

  if (!reportRecord || !reportRecord.report_data) {
      console.error(`[PDF Generate API] No report data found for project ${projectId} in audit_reports table.`);
      // Decide how to handle this: throw error, return null, return empty object?
      // Throwing an error might be appropriate if report data is essential.
      throw new Error(`No report data found for project ${projectId}`);
  }

  console.log(`[PDF Generate API] Latest report data fetched successfully for projectId: ${projectId}.`);
  
  // Return the actual report data object from the report_data column
  return reportRecord.report_data;
}
// --- End Helper function ---

export async function POST(request: Request) {
  console.log(`[PDF Generate API] Attempting to load PDF_API_KEY. Value: ${PDF_API_KEY_VALUE ? 'Loaded (' + PDF_API_KEY_VALUE.substring(0, 5) + '...)' : 'MISSING or Empty'}`);

  const cookieStore = cookies();

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
    console.log(`[PDF Generate API] Starting request to ${CRAWLER_API_URL}/api/pdf/generate`);

    // 1. Authenticate User
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('[PDF Generate API] Authentication error:', userError?.message || 'User not found');
      return NextResponse.json({ error: `Authentication failed: ${userError?.message || 'User not found'}` }, { status: 401 });
    }
    console.log('[PDF Generate API] User authenticated:', user.id);

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        console.log('[PDF Generate API] Session error:', sessionError?.message || 'Session not found');
        return NextResponse.json({ error: `Authentication failed: ${sessionError?.message || 'Session not found'}` }, { status: 401 });
    }

    // 2. Get Request Body from Client
    const clientRequestBody = await request.json();
    const { theme, templateId, projectId } = clientRequestBody as { theme: PdfTheme, templateId: string, projectId: string };

    if (!theme || !templateId || !projectId) {
        return NextResponse.json({ error: 'Missing required fields in request body: theme, templateId, projectId' }, { status: 400 });
    }
    console.log(`[PDF Generate API] Received from client - ProjectId: ${projectId}, TemplateId: ${templateId}`);

    // 3. Fetch Audit Data (using helper function)
    const auditData = await getAuditData(supabase, projectId);

    // 4. Construct Payload for Crawler Service
    const clientDetails: CrawlerClientDetails = {
        name: theme.clientName || 'Client',
        preparedBy: theme.preparedBy || 'LilySEO', // Assuming theme.preparedBy is company name
        // email, phone, website could potentially come from user profile or theme if added
    };

    const crawlerPayload: CrawlerPdfGenerationOptions = {
        auditData: auditData, // The fetched audit data
        clientDetails: clientDetails, // Constructed client details
        customNotes: theme.customNotes,
        logoUrl: theme.logoUrl,
        primaryColor: theme.primaryColor || '#000000', // Ensure defaults if missing
        coverStyle: theme.coverStyle || 1, // Ensure defaults if missing
        generateAiContent: true, // Enable AI content generation
    };
    console.log('[PDF Generate API] Constructed payload for crawler:', { 
        hasAuditData: !!crawlerPayload.auditData,
        clientName: crawlerPayload.clientDetails.name,
        preparedBy: crawlerPayload.clientDetails.preparedBy,
        primaryColor: crawlerPayload.primaryColor
     });

    // 5. Forward Request to Crawler Service
    const response = await fetch(`${CRAWLER_API_URL}/api/pdf/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'x-api-key': PDF_API_KEY_VALUE || '',
        'x-user-id': user.id
      },
      body: JSON.stringify(crawlerPayload) // Send the constructed payload
    });

    // 6. Handle Response
    if (!response.ok) {
      const error = await response.json();
      console.error('[PDF Generate API] Crawler service error response:', error);
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    console.log('[PDF Generate API] Success response from crawler:', JSON.stringify(data).substring(0, 100) + '...');
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[PDF Generate API] Top-level error:', error);
    // Distinguish between specific errors and generic ones
    const errorMessage = error.message || 'Internal server error';
    const status = error instanceof Error && error.message.includes('No audit found') ? 404 : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
} 