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

    // Get project details along with subscription tier
    const { data: project, error } = await supabase
      .from('projects')
      .select('id, name, url, description, crawl_frequency, created_at, user_id, subscription_tier')
      .eq('id', params.id)
      .eq('user_id', session.session.user.id)
      .single();

    if (error) {
      console.error('Error fetching project:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Error fetching project details' }),
        { status: 500 }
      );
    }

    if (!project) {
      return new NextResponse(
        JSON.stringify({ error: 'Project not found or unauthorized' }),
        { status: 404 }
      );
    }

    // If no subscription tier is set, get user's tier from profiles
    if (!project.subscription_tier) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', session.session.user.id)
        .single();
      
      project.subscription_tier = profile?.subscription_tier || 'free';
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Unexpected error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500 }
    );
  }
} 