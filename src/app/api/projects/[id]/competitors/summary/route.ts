import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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

    // Get competitor count
    const { count: totalCompetitors, error: countError } = await supabase
      .from('competitors')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', params.id);

    if (countError) {
      console.error('Error counting competitors:', countError);
      return new NextResponse(
        JSON.stringify({ error: 'Error counting competitors' }),
        { status: 500 }
      );
    }

    // Count analyzed competitors
    const { count: analyzedCompetitors, error: analyzedError } = await supabase
      .from('competitors')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', params.id)
      .eq('status', 'completed');

    if (analyzedError) {
      console.error('Error counting analyzed competitors:', analyzedError);
    }

    // Count in-progress competitors
    const { count: inProgressCompetitors, error: inProgressError } = await supabase
      .from('competitors')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', params.id)
      .in('status', ['pending', 'in_progress']);

    if (inProgressError) {
      console.error('Error counting in-progress competitors:', inProgressError);
    }

    // Get competitor limit based on subscription tier
    let competitorLimit = 3; // Default for free tier
    if (project.subscription_tier === 'pro') {
      competitorLimit = 10;
    } else if (project.subscription_tier === 'business') {
      competitorLimit = 25;
    } else if (project.subscription_tier === 'enterprise') {
      competitorLimit = 100;
    }

    return NextResponse.json({
      totalCompetitors: totalCompetitors || 0,
      analyzedCompetitors: analyzedCompetitors || 0,
      inProgressCompetitors: inProgressCompetitors || 0,
      competitorLimit,
      hasReachedLimit: (totalCompetitors || 0) >= competitorLimit
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500 }
    );
  }
} 