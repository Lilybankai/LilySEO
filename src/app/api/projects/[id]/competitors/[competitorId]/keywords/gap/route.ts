import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function GET(
  request: Request,
  { params }: { params: { id: string; competitorId: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: session } = await supabase.auth.getSession();

    if (!session.session) {
      return new NextResponse(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401 }
      );
    }

    // First check if the project belongs to the user
    const { data: project } = await supabase
      .from('projects')
      .select('id, user_id, subscription_tier')
      .eq('id', params.id)
      .eq('user_id', session.session.user.id)
      .single();

    if (!project) {
      return new NextResponse(
        JSON.stringify({ error: 'Project not found or unauthorized' }),
        { status: 404 }
      );
    }

    // Check if the competitor belongs to the project
    const { data: competitor } = await supabase
      .from('competitors')
      .select('id, name, url')
      .eq('id', params.competitorId)
      .eq('project_id', params.id)
      .single();

    if (!competitor) {
      return new NextResponse(
        JSON.stringify({ error: 'Competitor not found or not associated with this project' }),
        { status: 404 }
      );
    }

    // Get keyword opportunities for this competitor
    const { data: opportunities, error: opportunitiesError } = await supabase
      .from('keyword_opportunities')
      .select('*')
      .eq('project_id', params.id)
      .eq('competitor_id', params.competitorId)
      .order('opportunity_score', { ascending: false });

    if (opportunitiesError) {
      console.error('Error fetching keyword opportunities:', opportunitiesError);
      return new NextResponse(
        JSON.stringify({ error: 'Error fetching keyword opportunities' }),
        { status: 500 }
      );
    }

    // Get competitor keywords
    const { data: competitorKeywords, error: competitorKeywordsError } = await supabase
      .from('competitor_keywords')
      .select('*')
      .eq('competitor_id', params.competitorId);

    if (competitorKeywordsError) {
      console.error('Error fetching competitor keywords:', competitorKeywordsError);
      return new NextResponse(
        JSON.stringify({ error: 'Error fetching competitor keywords' }),
        { status: 500 }
      );
    }

    // Get project keywords
    const { data: projectKeywords, error: projectKeywordsError } = await supabase
      .from('project_keywords')
      .select('*')
      .eq('project_id', params.id);

    if (projectKeywordsError) {
      console.error('Error fetching project keywords:', projectKeywordsError);
      return new NextResponse(
        JSON.stringify({ error: 'Error fetching project keywords' }),
        { status: 500 }
      );
    }

    // Process keyword data for analysis
    const competitorKeywordSet = new Set(competitorKeywords?.map(k => k.keyword) || []);
    const projectKeywordSet = new Set(projectKeywords?.map(k => k.keyword) || []);
    
    // Keywords competitor ranks for but you don't
    const uniqueToCompetitor = competitorKeywords?.filter(k => !projectKeywordSet.has(k.keyword)) || [];
    
    // Keywords you rank for but competitor doesn't
    const uniqueToProject = projectKeywords?.filter(k => !competitorKeywordSet.has(k.keyword)) || [];
    
    // Keywords both rank for
    const sharedKeywords = competitorKeywords?.filter(k => projectKeywordSet.has(k.keyword))
      .map(ck => {
        // Find the corresponding project keyword
        const pk = projectKeywords?.find(pk => pk.keyword === ck.keyword);
        return {
          keyword: ck.keyword,
          competitorPosition: ck.position,
          projectPosition: pk?.position,
          positionDifference: (pk?.position || 100) - (ck.position || 100),
          volume: ck.volume || pk?.volume,
          difficulty: ck.difficulty || pk?.difficulty
        };
      }) || [];
    
    // Sort shared keywords by position difference (negative means competitor ranks better)
    const sortedSharedKeywords = sharedKeywords.sort((a, b) => a.positionDifference - b.positionDifference);

    // Prepare the response
    const response = {
      competitor: {
        id: competitor.id,
        name: competitor.name,
        url: competitor.url
      },
      keywordCounts: {
        competitorTotal: competitorKeywords?.length || 0,
        projectTotal: projectKeywords?.length || 0,
        uniqueToCompetitor: uniqueToCompetitor.length,
        uniqueToProject: uniqueToProject.length,
        shared: sharedKeywords.length
      },
      keywordGaps: {
        uniqueToCompetitor: uniqueToCompetitor.slice(0, 50), // Limit to 50 for performance
        uniqueToProject: uniqueToProject.slice(0, 50),
        shared: sortedSharedKeywords.slice(0, 50)
      },
      opportunities: opportunities || [],
      // Apply tier-based limitations
      meta: {
        tier: project.subscription_tier,
        // Free tier gets limited data
        limitApplied: project.subscription_tier === 'free',
        maxOpportunities: project.subscription_tier === 'free' ? 5 : 
                          project.subscription_tier === 'pro' ? 50 : 
                          500
      }
    };

    // Apply tier-based limitations to response data
    if (project.subscription_tier === 'free') {
      response.opportunities = (opportunities || []).slice(0, 5);
      response.keywordGaps.uniqueToCompetitor = uniqueToCompetitor.slice(0, 5);
      response.keywordGaps.uniqueToProject = uniqueToProject.slice(0, 5);
      response.keywordGaps.shared = sortedSharedKeywords.slice(0, 5);
    } else if (project.subscription_tier === 'pro') {
      response.opportunities = (opportunities || []).slice(0, 50);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500 }
    );
  }
} 