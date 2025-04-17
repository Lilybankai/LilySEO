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

    // Get project and user profile to check ownership and get tier
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        user_id,
        profiles ( subscription_tier )
      `)
      .eq('id', params.id)
      .eq('user_id', session.session.user.id)
      .single();

    if (projectError || !projectData) {
      // Handle error or not found...
      const status = projectError?.code === 'PGRST116' ? 404 : 500;
      const message = status === 404 ? 'Project not found or unauthorized' : 'Database error fetching project';
      if (projectError) console.error('Error fetching project/profile:', projectError);
      return new NextResponse(JSON.stringify({ error: message }), { status });
    }
    
    // Extract user tier, default to 'free'
    const profileInfo = Array.isArray(projectData.profiles) ? projectData.profiles[0] : projectData.profiles;
    const userTier = profileInfo?.subscription_tier ?? 'free';
    console.log(`User tier for project ${params.id}: ${userTier}`);

    // Check if the competitor belongs to the project
    const { data: competitor } = await supabase
      .from('competitors')
      .select('id, name, url, status')
      .eq('id', params.competitorId)
      .eq('project_id', params.id)
      .single();

    if (!competitor) {
      return new NextResponse(
        JSON.stringify({ error: 'Competitor not found or not associated with this project' }),
        { status: 404 }
      );
    }

    // Extract query parameters - support 'days' parameter
    const url = new URL(request.url);
    const daysParam = url.searchParams.get('days');
    const requestedDays = daysParam ? parseInt(daysParam, 10) : 30;

    // Validate days parameter
    if (isNaN(requestedDays) || requestedDays <= 0) {
      return new NextResponse(JSON.stringify({ error: 'Invalid days parameter. Must be a positive number.' }), { status: 400 });
    }

    // Fetch maximum history days allowed for the tier
    const { data: limitData, error: limitError } = await supabase
      .from('usage_limits')
      .select('monthly_limit')
      .eq('plan_type', userTier)
      .eq('feature_name', 'competitor_history_days')
      .single();

    let maxDays = 1; // Default limit (free tier)
    if (limitError) {
        console.error(`Error fetching competitor_history_days limit for tier ${userTier}, using default:`, limitError);
    } else if (limitData) {
        // Use fetched limit, treat -1 as effectively infinite for comparison, but cap at a high number like 365 for practicality
        maxDays = limitData.monthly_limit === -1 ? 365 : limitData.monthly_limit;
    }
    console.log(`Max history days for tier ${userTier}: ${maxDays}`);

    // Limit requested days to maximum allowed by tier
    const effectiveDays = Math.min(requestedDays, maxDays);

    // Use the database function to retrieve history with tier-based limitations
    const { data: history, error: historyError } = await supabase.rpc(
      'get_competitor_history',
      {
        p_competitor_id: params.competitorId,
        p_days: effectiveDays
      }
    );

    if (historyError) {
      console.error('Error fetching competitor history:', historyError);
      return new NextResponse(JSON.stringify({ error: 'Error fetching competitor history' }), { status: 500 });
    }

    // Add metadata about the request
    const response = {
      competitor: {
        id: competitor.id,
        name: competitor.name,
        url: competitor.url,
        status: competitor.status
      },
      history: history || [],
      meta: {
        requestedDays: requestedDays,
        effectiveDays,
        maxDays,
        tier: userTier,
        count: history?.length || 0
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500 }
    );
  }
} 