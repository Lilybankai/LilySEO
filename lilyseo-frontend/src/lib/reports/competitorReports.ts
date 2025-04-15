import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types' // Using the consistent type

// --- Interfaces --- 

// Represents data for a single competitor in the snapshot
export interface CompetitorSnapshot {
  id: string;
  name: string;
  url: string;
  lastAnalysisDate?: string | null; 
  // Add key metrics from competitor_analysis.analysis_data
  // Example metrics (adjust based on actual analysis_data structure):
  domainAuthority?: number | null;
  linkingDomains?: number | null;
  keywordsTracked?: number | null; 
  estimatedTraffic?: number | null;
  // ... other relevant snapshot metrics
}

// Represents the overall report structure
export interface BasicCompetitorReport {
  projectId: string;
  competitors: CompetitorSnapshot[];
  reportDate: string;
  error?: string; // Optional error message
}

// --- Main Report Function --- 

/**
 * Fetches basic competitor data and their latest analysis snapshot.
 * @param projectId The ID of the project.
 * @param supabase The Supabase client instance.
 * @returns A promise resolving to the BasicCompetitorReport.
 */
export async function getBasicCompetitorReport(
  projectId: string,
  supabase: SupabaseClient<Database>
): Promise<BasicCompetitorReport> {
  console.log(`Fetching competitor snapshot for project: ${projectId}`);
  const reportDate = new Date().toISOString();

  // 1. Fetch competitors linked to the project
  const { data: competitorsData, error: competitorsError } = await supabase
    .from('competitors')
    .select('id, name, url') // Select basic info
    .eq('project_id', projectId);

  if (competitorsError) {
    console.error(`Error fetching competitors for project ${projectId}:`, competitorsError);
    return {
      projectId: projectId,
      competitors: [],
      reportDate: reportDate,
      error: 'Failed to fetch competitor list.'
    };
  }

  if (!competitorsData || competitorsData.length === 0) {
    return {
      projectId: projectId,
      competitors: [],
      reportDate: reportDate,
      error: 'No competitors configured for this project.'
    };
  }

  // 2. For each competitor, fetch their latest analysis data (if available)
  const competitorSnapshots: CompetitorSnapshot[] = [];
  for (const competitor of competitorsData) {
    const { data: analysisData, error: analysisError } = await supabase
      .from('competitor_analysis') // Assuming this table holds the latest/relevant analysis
      .select('created_at, analysis_data') // Select analysis results and date
      .eq('competitor_id', competitor.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle as analysis might not exist yet

    if (analysisError) {
      console.warn(`Error fetching analysis for competitor ${competitor.id}:`, analysisError);
      // Still include the competitor, but indicate missing analysis data
      competitorSnapshots.push({ ...competitor, lastAnalysisDate: null });
      continue;
    }

    // --- Placeholder Logic for extracting metrics --- 
    // TODO: Replace with actual extraction based on analysis_data structure
    const analysisJson = analysisData?.analysis_data as any;
    const snapshot: CompetitorSnapshot = {
      ...competitor,
      lastAnalysisDate: analysisData?.created_at || null,
      // Example metric extraction (adjust keys based on your JSON):
      domainAuthority: analysisJson?.seo_metrics?.domainAuthority || null,
      linkingDomains: analysisJson?.link_analysis?.linkingDomains || null,
      keywordsTracked: analysisJson?.keyword_data?.totalKeywords || null,
      estimatedTraffic: analysisJson?.traffic_data?.estimatedMonthlyVisits || null,
    };
    // --- End Placeholder Logic ---

    competitorSnapshots.push(snapshot);
  }

  return {
    projectId: projectId,
    competitors: competitorSnapshots,
    reportDate: reportDate,
  };
} 