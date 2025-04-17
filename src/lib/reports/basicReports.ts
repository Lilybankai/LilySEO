import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'

// Define interfaces for the report summaries
export interface TechnicalIssuesSummary {
  projectId: string;
  auditId: string;
  auditDate: string;
  errorPages4xx: number;
  errorPages5xx: number;
  slowPages: number;
  redirectIssues: number;
  // Add more specific metrics as needed based on audit data structure
  sampleErrorUrls?: string[];
}

export interface OnPageSeoSummary {
  projectId: string;
  auditId: string;
  auditDate: string;
  pagesWithMissingTitles: number;
  pagesWithMissingDescriptions: number;
  pagesWithDuplicateTitles: number;
  pagesWithDuplicateDescriptions: number;
  averageReadabilityScore?: number;
  // Add more specific metrics as needed
  sampleProblemUrls?: string[];
}

// Interface for the health trend report
export interface HealthTrendDataPoint {
  auditDate: string;
  overallScore: number;
  // Add other key metrics if desired (e.g., totalIssues, performanceScore)
}

export interface OverallHealthTrendReport {
  projectId: string;
  trendData: HealthTrendDataPoint[];
  startDate?: string;
  endDate?: string;
}

/**
 * Fetches and summarizes technical SEO issues from the latest audit report.
 * @param projectId The ID of the project.
 * @param supabase The Supabase client instance.
 * @returns A promise resolving to the TechnicalIssuesSummary or null if no data found.
 */
export async function getTechnicalIssuesSummary(
  projectId: string,
  supabase: SupabaseClient<Database>
): Promise<TechnicalIssuesSummary | null> {
  console.log(`Fetching technical issues summary for project: ${projectId}`);

  // 1. Find the latest audit for the project, fetching the 'report' blob
  const { data: latestAudit, error: auditError } = await supabase
    .from('audits') // Reverted to 'audits' table
    .select('id, created_at, report') // Fetch the report JSON blob
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (auditError) {
    console.error(`Error fetching latest audit for project ${projectId}:`, auditError);
    return null;
  }

  if (!latestAudit) {
    console.log(`No audit found for project ${projectId}.`);
    return null; // No audit found for this project
  }
  
  const auditId = latestAudit.id;
  const auditDate = latestAudit.created_at;
  const reportData = latestAudit.report as any; // Cast report data

  // 2. Check if report data exists and has the expected structure (e.g., the 'audits' key)
  if (!reportData?.audits) { 
     console.warn(`No 'audits' key found in report blob for audit ${auditId}. Check the structure log above.`);
     // Return summary with zeros as the expected structure is missing
     return {
       projectId,
       auditId,
       auditDate,
       errorPages4xx: 0, 
       errorPages5xx: 0,
       slowPages: 0,
       redirectIssues: 0,
     };
  }
  
  // 3. Extract specific metrics from the report JSON blob
  const audits = reportData.audits;
  
  const httpStatusCodeAudit = audits['http-status-code']?.details?.items;
  const errorPages4xx = httpStatusCodeAudit?.filter((item: any) => item.statusCode >= 400 && item.statusCode < 500).length ?? 0;
  const errorPages5xx = httpStatusCodeAudit?.filter((item: any) => item.statusCode >= 500).length ?? 0;
  
  const serverResponseTimeAudit = audits['server-response-time']?.details?.items;
  const slowPages = serverResponseTimeAudit?.filter((item: any) => item.responseTime > 1000).length ?? 0; 
  
  const redirectIssuesAudit = audits['redirects']?.details?.items;
  const redirectIssues = redirectIssuesAudit?.length ?? 0; 

  return {
    projectId,
    auditId,
    auditDate,
    errorPages4xx,
    errorPages5xx,
    slowPages,
    redirectIssues,
  };
}

/**
 * Fetches and summarizes on-page SEO issues from the latest audit report.
 * @param projectId The ID of the project.
 * @param supabase The Supabase client instance.
 * @returns A promise resolving to the OnPageSeoSummary or null if no data found.
 */
export async function getOnPageSeoSummary(
  projectId: string,
  supabase: SupabaseClient<Database>
): Promise<OnPageSeoSummary | null> {
  console.log(`Fetching on-page SEO summary for project: ${projectId}`)

  const { data: latestAudit, error: auditError } = await supabase
    .from('audits')
    .select('id, created_at, report') // Potentially select more fields or query related tables if needed
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (auditError || !latestAudit) {
    console.error(`Error fetching latest audit for project ${projectId}:`, auditError)
    return null
  }

  const reportData = latestAudit.report as any // Cast needed if type is not fully defined

  if (!reportData?.audits) {
     console.warn(`No detailed audit data found in latest audit ${latestAudit.id} for project ${projectId}`)
     return {
        projectId: projectId,
        auditId: latestAudit.id,
        auditDate: latestAudit.created_at,
        pagesWithMissingTitles: 0,
        pagesWithMissingDescriptions: 0,
        pagesWithDuplicateTitles: 0,
        pagesWithDuplicateDescriptions: 0,
     }
  }

  // --- Placeholder Logic --- 
  // TODO: Replace with actual logic based on your audit report structure.
  // Example pseudo-code:
  const pagesWithMissingTitles = reportData.audits['document-title']?.details?.items?.filter((item: any) => !item.title).length || 0;
  const pagesWithMissingDescriptions = reportData.audits['meta-description']?.details?.items?.filter((item: any) => !item.description).length || 0;
  // Duplicate detection might require more complex analysis or be pre-calculated in the audit service
  const pagesWithDuplicateTitles = 0; // Placeholder
  const pagesWithDuplicateDescriptions = 0; // Placeholder
  // --- End Placeholder Logic ---

  console.log(`Generated on-page summary for audit ${latestAudit.id}`)

  return {
    projectId: projectId,
    auditId: latestAudit.id,
    auditDate: latestAudit.created_at,
    pagesWithMissingTitles: pagesWithMissingTitles, // Replace with parsed value
    pagesWithMissingDescriptions: pagesWithMissingDescriptions, // Replace with parsed value
    pagesWithDuplicateTitles: pagesWithDuplicateTitles, // Replace with parsed value
    pagesWithDuplicateDescriptions: pagesWithDuplicateDescriptions, // Replace with parsed value
    // averageReadabilityScore: ... // Calculate if available
    // sampleProblemUrls: [...] // Optionally extract sample URLs
  }
}

/**
 * Fetches the overall health score trend over time.
 * @param projectId The ID of the project.
 * @param supabase The Supabase client instance.
 * @param startDate Optional start date (ISO string).
 * @param endDate Optional end date (ISO string).
 * @returns A promise resolving to the OverallHealthTrendReport or null.
 */
export async function getOverallHealthTrend(
  projectId: string,
  supabase: SupabaseClient<Database>,
  startDate?: string,
  endDate?: string
): Promise<OverallHealthTrendReport | null> {
  console.log(`Fetching health trend for project: ${projectId} (Range: ${startDate} - ${endDate})`);

  let query = supabase
    .from('audit_metrics_history')
    .select('created_at, overall_score') // Select relevant metrics
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  // Apply date filters if provided
  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    // Adjust endDate to include the whole day if needed, depending on timestamp precision
    // Example: add 1 day if endDate is just a date string
    query = query.lte('created_at', endDate);
  }

  // Add a reasonable limit or implement pagination if history can be very long
  query = query.limit(100); // Example limit

  const { data, error } = await query;

  if (error) {
    console.error(`Error fetching audit history for project ${projectId}:`, error);
    return null;
  }

  if (!data || data.length === 0) {
    console.log(`No audit history found for project ${projectId} in the specified range.`);
    return {
      projectId: projectId,
      trendData: [],
      startDate: startDate,
      endDate: endDate,
    };
  }

  const trendData: HealthTrendDataPoint[] = data.map(entry => ({
    auditDate: entry.created_at!,
    overallScore: entry.overall_score!,
    // Map other selected metrics here
  }));

  return {
    projectId: projectId,
    trendData: trendData,
    startDate: startDate,
    endDate: endDate,
  };
} 