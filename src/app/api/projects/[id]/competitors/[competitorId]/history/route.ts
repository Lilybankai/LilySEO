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
    const days = daysParam ? parseInt(daysParam, 10) : 30;

    // Validate days parameter
    if (isNaN(days) || days <= 0) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid days parameter. Must be a positive number.' }),
        { status: 400 }
      );
    }

    // Determine maximum days based on subscription tier
    let maxDays = 1; // Default for free tier
    if (project.subscription_tier === 'enterprise') {
      maxDays = 365; // 12 months for enterprise
    } else if (project.subscription_tier === 'pro') {
      maxDays = 30; // 30 days for pro
    }

    // Limit days to maximum allowed
    const effectiveDays = Math.min(days, maxDays);

    // Use the database function to retrieve history with tier-based limitations
    const { data: history, error } = await supabase.rpc(
      'get_competitor_history',
      {
        p_competitor_id: params.competitorId,
        p_days: effectiveDays
      }
    );

    if (error) {
      console.error('Error fetching competitor history:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Error fetching competitor history' }),
        { status: 500 }
      );
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
        requestedDays: days,
        effectiveDays,
        maxDays,
        tier: project.subscription_tier,
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