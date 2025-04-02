import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { z } from 'zod';

// Schema for validating competitor data
const competitorSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  name: z.string().optional(),
});

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
      .select('*')
      .eq('id', params.id)
      .eq('user_id', session.session.user.id)
      .single();

    if (!project) {
      return new NextResponse(
        JSON.stringify({ error: 'Project not found or unauthorized' }),
        { status: 404 }
      );
    }

    // Get competitors
    const { data: competitors, error } = await supabase
      .from('competitors')
      .select('*')
      .eq('project_id', params.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching competitors:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Error fetching competitors' }),
        { status: 500 }
      );
    }

    return NextResponse.json(competitors || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = competitorSchema.safeParse(body);
    if (!result.success) {
      return new NextResponse(
        JSON.stringify({ error: result.error.issues[0].message }),
        { status: 400 }
      );
    }
    
    const { url, name } = result.data;
    
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
      .select('id, subscription_tier, user_id')
      .eq('id', params.id)
      .eq('user_id', session.session.user.id)
      .single();

    if (!project) {
      return new NextResponse(
        JSON.stringify({ error: 'Project not found or unauthorized' }),
        { status: 404 }
      );
    }

    // Check competitor limit based on subscription tier
    let limit = 3; // Default for free tier
    if (project.subscription_tier === 'pro') {
      limit = 10;
    } else if (project.subscription_tier === 'business') {
      limit = 25;
    } else if (project.subscription_tier === 'enterprise') {
      limit = 100;
    }

    // Count existing competitors
    const { count, error: countError } = await supabase
      .from('competitors')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', params.id);

    if (countError) {
      console.error('Error counting competitors:', countError);
      return new NextResponse(
        JSON.stringify({ error: 'Error checking competitor limit' }),
        { status: 500 }
      );
    }

    if ((count || 0) >= limit) {
      return new NextResponse(
        JSON.stringify({ 
          error: `You have reached your plan's limit of ${limit} competitors. Please upgrade to add more.` 
        }),
        { status: 400 }
      );
    }

    // Check if the URL already exists for this project
    const { data: existingCompetitor, error: existingError } = await supabase
      .from('competitors')
      .select('id')
      .eq('project_id', params.id)
      .ilike('url', url)
      .limit(1);

    if (existingError) {
      console.error('Error checking existing competitor:', existingError);
    } else if (existingCompetitor && existingCompetitor.length > 0) {
      return new NextResponse(
        JSON.stringify({ error: 'This competitor URL already exists in your project' }),
        { status: 400 }
      );
    }

    // Extract domain from URL for name if not provided
    let competitorName = name;
    if (!competitorName) {
      try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        competitorName = urlObj.hostname.replace(/^www\./i, '');
      } catch (e) {
        competitorName = url;
      }
    }

    // Add the competitor
    const { data: competitor, error } = await supabase
      .from('competitors')
      .insert({
        project_id: params.id,
        url: url,
        name: competitorName,
        status: 'pending',
        created_by: session.session.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding competitor:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Error adding competitor' }),
        { status: 500 }
      );
    }

    // Queue analysis job
    const { error: queueError } = await supabase
      .from('analysis_queue')
      .insert({
        competitor_id: competitor.id,
        project_id: params.id,
        user_id: session.session.user.id,
        status: 'pending',
        subscription_tier: project.subscription_tier,
        competitor_url: url,
        competitor_name: competitorName,
      });

    if (queueError) {
      console.error('Error queueing analysis job:', queueError);
      // We don't want to fail the whole request if just queueing fails
    }

    return NextResponse.json(competitor);
  } catch (error) {
    console.error('Unexpected error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500 }
    );
  }
} 