import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'

// --- Interfaces --- 

export interface GSCPerformanceDataPoint {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCPerformanceReport {
  projectId: string;
  siteUrl: string;
  performanceData: GSCPerformanceDataPoint[];
  startDate: string;
  endDate: string;
  error?: string; // Optional error message
}

interface GSCConnection {
  access_token: string;
  refresh_token: string | null;
  token_expiry: string | null;
  site_url: string;
}

// --- Helper Functions --- 

// Placeholder for OAuth token refresh logic
async function refreshAccessTokenIfNeeded(connection: GSCConnection, supabase: SupabaseClient<Database>): Promise<string> {
  // TODO: Implement Google OAuth token refresh logic
  // 1. Check if token_expiry is close (e.g., within 5 minutes)
  // 2. If needed and refresh_token exists:
  //    a. Make POST request to Google token endpoint (https://oauth2.googleapis.com/token)
  //       with client_id, client_secret, refresh_token, grant_type='refresh_token'
  //    b. Parse the response for the new access_token and expires_in
  //    c. Update the connection record in Supabase with the new token and expiry
  //    d. Return the new access_token
  // 3. If refresh fails or not needed, return the current access_token

  console.warn('Token refresh logic is not implemented. Using existing token.');
  return connection.access_token; 
}

// --- Main Report Function --- 

/**
 * Fetches Google Search Console performance data for a project.
 * @param projectId The ID of the project.
 * @param supabase The Supabase client instance.
 * @param startDate Start date in YYYY-MM-DD format.
 * @param endDate End date in YYYY-MM-DD format.
 * @returns A promise resolving to the GSCPerformanceReport or null if connection fails.
 */
export async function getGSCPerformanceData(
  projectId: string,
  supabase: SupabaseClient<Database>,
  startDate: string, // Required: Ensure these are passed
  endDate: string   // Required: Ensure these are passed
): Promise<GSCPerformanceReport | null> {
  console.log(`Fetching GSC performance for project: ${projectId} (Range: ${startDate} - ${endDate})`);

  // 1. Get GSC connection details for the project
  const { data: connection, error: connError } = await supabase
    .from('google_search_console_connections')
    .select('access_token, refresh_token, token_expiry, site_url')
    .eq('project_id', projectId)
    .single();

  if (connError || !connection) {
    console.error(`Error fetching GSC connection for project ${projectId}:`, connError);
    return { 
      projectId: projectId, 
      siteUrl: '', 
      performanceData: [], 
      startDate: startDate, 
      endDate: endDate, 
      error: 'Google Search Console not connected for this project.' 
    };
  }

  try {
    // 2. Refresh token if necessary (placeholder)
    const accessToken = await refreshAccessTokenIfNeeded(connection as GSCConnection, supabase);

    // 3. Call GSC Search Analytics API
    const apiUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(connection.site_url)}/searchAnalytics/query`;
    
    const apiRequestBody = {
      startDate: startDate,
      endDate: endDate,
      dimensions: ['date'], // Group by date
      rowLimit: 10000, // Adjust as needed, max might be 25k? Check docs.
      // Optional: Add filters for specific pages, queries, devices etc.
      // type: 'web', // Default is web
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiRequestBody),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error(`GSC API Error (${response.status}):`, errorBody);
      throw new Error(errorBody.error?.message || `GSC API request failed with status ${response.status}`);
    }

    const result = await response.json();
    
    // 4. Format the data
    const performanceData: GSCPerformanceDataPoint[] = (result.rows || []).map((row: any) => ({
      date: row.keys[0], // First key corresponds to the 'date' dimension
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));

    console.log(`Successfully fetched ${performanceData.length} GSC data points for project ${projectId}`);

    return {
      projectId: projectId,
      siteUrl: connection.site_url,
      performanceData: performanceData,
      startDate: startDate,
      endDate: endDate,
    };

  } catch (error: any) {
    console.error(`Error processing GSC data for project ${projectId}:`, error);
    return {
      projectId: projectId,
      siteUrl: connection?.site_url || 'N/A',
      performanceData: [],
      startDate: startDate,
      endDate: endDate,
      error: `Failed to fetch GSC data: ${error.message}`,
    };
  }
} 