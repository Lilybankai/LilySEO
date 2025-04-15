import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function POST(
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

    // Get the competitor
    const { data: competitor, error: competitorError } = await supabase
      .from('competitors')
      .select('*')
      .eq('id', params.competitorId)
      .eq('project_id', params.id)
      .single();

    if (competitorError || !competitor) {
      return new NextResponse(
        JSON.stringify({ error: 'Competitor not found' }),
        { status: 404 }
      );
    }

    // Check if there's an analysis in progress
    if (competitor.status === 'in_progress' || competitor.status === 'pending') {
      return new NextResponse(
        JSON.stringify({ error: 'Analysis already in progress' }),
        { status: 400 }
      );
    }

    // Update the competitor status to pending
    const { error: updateError } = await supabase
      .from('competitors')
      .update({ status: 'pending' })
      .eq('id', params.competitorId);

    if (updateError) {
      console.error('Error updating competitor status:', updateError);
      return new NextResponse(
        JSON.stringify({ error: 'Error updating competitor status' }),
        { status: 500 }
      );
    }

    // Queue the analysis job by inserting a record into the queue table
    const { error: queueError } = await supabase
      .from('analysis_queue')
      .insert({
        competitor_id: params.competitorId,
        project_id: params.id,
        user_id: session.session.user.id,
        status: 'pending',
        subscription_tier: project.subscription_tier,
        competitor_url: competitor.url,
        competitor_name: competitor.name,
      });

    if (queueError) {
      console.error('Error queueing analysis job:', queueError);
      
      // Revert the competitor status
      await supabase
        .from('competitors')
        .update({ status: 'failed' })
        .eq('id', params.competitorId);
        
      return new NextResponse(
        JSON.stringify({ error: 'Error queueing analysis job' }),
        { status: 500 }
      );
    }

    return NextResponse.json({ status: 'pending' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500 }
    );
  }
} 