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
    const { data: { session }, error: sessionError } = await supabase.auth.getSession(); // Destructure error

    if (sessionError || !session) {
      console.error('Auth error:', sessionError);
      return new NextResponse(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
    }

    // Get project and user profile in one go to get the tier reliably
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        user_id,
        profiles ( subscription_tier )
      `)
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();

    if (projectError) {
      console.error('Error fetching project/profile:', projectError);
      // Check if the error is because the project wasn't found
      if (projectError.code === 'PGRST116') {
        return new NextResponse(JSON.stringify({ error: 'Project not found or unauthorized' }), { status: 404 });
      }
      return new NextResponse(JSON.stringify({ error: 'Database error fetching project' }), { status: 500 });
    }

    if (!projectData) {
      return new NextResponse(JSON.stringify({ error: 'Project not found or unauthorized' }), { status: 404 });
    }

    // Extract the tier, default to 'free' if profile data is missing or not an object
    const profileInfo = Array.isArray(projectData.profiles) ? projectData.profiles[0] : projectData.profiles;
    const userTier = profileInfo?.subscription_tier ?? 'free';
    console.log(`User tier for project ${params.id}: ${userTier}`);

    // Get competitor count
    const { count: totalCompetitors, error: countError } = await supabase
      .from('competitors')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', params.id);

    if (countError) {
      console.error('Error counting competitors:', countError);
      return new NextResponse(JSON.stringify({ error: 'Error counting competitors' }), { status: 500 });
    }

    // Count analyzed competitors
    const { count: analyzedCompetitors, error: analyzedError } = await supabase
      .from('competitors')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', params.id)
      .eq('status', 'completed');

    if (analyzedError) {
      console.error('Error counting analyzed competitors:', analyzedError);
      // Don't fail the request for this error, just log it
    }

    // Count in-progress competitors
    const { count: inProgressCompetitors, error: inProgressError } = await supabase
      .from('competitors')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', params.id)
      .in('status', ['pending', 'in_progress']);

    if (inProgressError) {
      console.error('Error counting in-progress competitors:', inProgressError);
      // Don't fail the request for this error, just log it
    }

    // Get competitor limit from usage_limits table
    let limitData: { monthly_limit: number } | null = null; 
    let limitError = null;

    try {
       const { data: fetchedLimitData, error: fetchError } = await supabase
         .from('usage_limits')
         .select('monthly_limit')
         .eq('plan_type', userTier)
         .eq('feature_name', 'max_competitors')
         .single();
        limitData = fetchedLimitData;
        limitError = fetchError;
    } catch (e) {
        console.error('Catch block: Error fetching limit:', e);
        limitError = e; // Assign caught error
    }
   

    if (limitError) {
       console.error(`Error fetching max_competitors limit for tier ${userTier}:`, limitError);
       // Use a default limit if fetch fails
       limitData = { monthly_limit: 3 }; 
    }

    // Handle unlimited (-1) vs defined limit, default to 3 if limitData is somehow null/undefined
    const competitorLimit = limitData?.monthly_limit === -1 ? Infinity : (limitData?.monthly_limit ?? 3);
    console.log(`Competitor limit for tier ${userTier}: ${competitorLimit}`);

    return NextResponse.json({
      totalCompetitors: totalCompetitors ?? 0,
      analyzedCompetitors: analyzedCompetitors ?? 0,
      inProgressCompetitors: inProgressCompetitors ?? 0,
      competitorLimit: competitorLimit === Infinity ? null : competitorLimit, // Return null for unlimited on frontend
      hasReachedLimit: (totalCompetitors ?? 0) >= competitorLimit
    });

  } catch (error) {
    console.error('Unexpected error in GET /competitors/summary:', error);
    return new NextResponse(JSON.stringify({ error: 'An unexpected error occurred' }), { status: 500 });
  }
} 