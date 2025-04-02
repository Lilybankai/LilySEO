import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';

export interface CompetitorWithMetrics {
  id: string;
  project_id: string;
  name: string;
  url: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  last_analyzed: string | null;
  created_at: string;
  updated_at: string;
  analysis?: {
    metrics: {
      seo: {
        domainAuthority: number;
        pageAuthority: number;
        totalBacklinks: number;
      };
      content: {
        totalPages: number;
        avgWordCount: number;
        readabilityScore: number;
        contentGrade: 'A' | 'B' | 'C' | 'D' | 'F';
        topTopics: string[];
      };
      keywords: {
        totalKeywords: number;
        rankingKeywords: number;
        topKeywords: Array<{
          keyword: string;
          position: number;
          volume: number;
          difficulty: number;
        }>;
      };
      market: {
        authority: number;
        visibility: number;
        size: number;
      };
    }
  };
}

export interface CompetitorAnalysisHistory {
  id: string;
  competitor_id: string;
  created_at: string;
  metrics: any;
}

export async function getCompetitors(projectId: string): Promise<CompetitorWithMetrics[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('competitors')
    .select(`
      *,
      competitor_analysis (*)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching competitors:', error);
    throw new Error('Failed to fetch competitors');
  }
  
  return data?.map(competitor => {
    const analysis = competitor.competitor_analysis?.[0];
    return {
      ...competitor,
      analysis: analysis ? {
        metrics: analysis.metrics
      } : undefined
    };
  }) || [];
}

export async function getCompetitor(projectId: string, competitorId: string): Promise<CompetitorWithMetrics> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('competitors')
    .select(`
      *,
      competitor_analysis (*)
    `)
    .eq('id', competitorId)
    .eq('project_id', projectId)
    .single();
  
  if (error) {
    console.error('Error fetching competitor:', error);
    throw new Error('Failed to fetch competitor details');
  }
  
  const analysis = data.competitor_analysis?.[0];
  
  return {
    ...data,
    analysis: analysis ? {
      metrics: analysis.metrics
    } : undefined
  };
}

export async function getCompetitorHistory(competitorId: string): Promise<CompetitorAnalysisHistory[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('competitor_analysis_history')
    .select('*')
    .eq('competitor_id', competitorId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching competitor history:', error);
    throw new Error('Failed to fetch competitor history');
  }
  
  return data || [];
}

export async function getAllCompetitors(): Promise<CompetitorWithMetrics[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('competitors')
    .select(`
      *,
      competitor_analysis (*)
    `)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching all competitors:', error);
    throw new Error('Failed to fetch competitors');
  }
  
  return data?.map(competitor => {
    const analysis = competitor.competitor_analysis?.[0];
    return {
      ...competitor,
      analysis: analysis ? {
        metrics: analysis.metrics
      } : undefined
    };
  }) || [];
}

export async function getCompetitorKeywords(competitorId: string): Promise<any[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('competitor_keywords')
    .select('*')
    .eq('competitor_id', competitorId)
    .order('position', { ascending: true });
  
  if (error) {
    console.error('Error fetching competitor keywords:', error);
    throw new Error('Failed to fetch competitor keywords');
  }
  
  return data || [];
} 