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

    const { data: competitor, error } = await supabase
      .from('competitors')
      .select('*')
      .eq('id', params.competitorId)
      .eq('project_id', params.id)
      .single();

    if (error) {
      console.error('Error fetching competitor details:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Error fetching competitor details' }),
        { status: 500 }
      );
    }

    if (!competitor) {
      return new NextResponse(
        JSON.stringify({ error: 'Competitor not found' }),
        { status: 404 }
      );
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

export async function DELETE(
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

    // Delete the competitor
    const { error } = await supabase
      .from('competitors')
      .delete()
      .eq('id', params.competitorId)
      .eq('project_id', params.id);

    if (error) {
      console.error('Error deleting competitor:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Error deleting competitor' }),
        { status: 500 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500 }
    );
  }
} 