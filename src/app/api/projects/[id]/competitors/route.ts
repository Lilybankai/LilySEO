import { NextRequest, NextResponse } from 'next/server';
// Use the project's createClient which internally uses createServerAdapter
import { createClient } from '@/lib/supabase/server';
// Remove unused import
// import { cookies } from 'next/headers'; 
import { Database } from '@/types/supabase';
import { z } from 'zod';

// Schema for validating competitor data
const competitorSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  name: z.string().optional(),
});

// ... GET function needs similar refactoring if used from client-side with auth ...
// For now, let's focus on POST
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Await the client creation
    const supabase = await createClient();
    // Use getUser for authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401 }
      );
    }

    // First check if the project belongs to the user
    const { data: project, error: projectCheckError } = await supabase
      .from('projects')
      .select('id') // Only select needed field
      .eq('id', params.id)
      .eq('user_id', user.id)
      .maybeSingle(); // Use maybeSingle to handle not found gracefully

    if (projectCheckError) {
      console.error('Error checking project ownership:', projectCheckError);
      return new NextResponse(
        JSON.stringify({ error: 'Error checking project access' }),
        { status: 500 }
      );
    }

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
    console.error('Unexpected error in GET /competitors:', error);
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
    const projectId = params.id; 
    
    console.log(`[API POST /projects/${projectId}/competitors] Received request`);
    
    // Validate input
    const result = competitorSchema.safeParse(body);
    if (!result.success) {
      console.error(`[API POST /projects/${projectId}/competitors] Input validation failed:`, result.error.issues);
      return new NextResponse(
        JSON.stringify({ error: result.error.issues[0].message }),
        { status: 400 }
      );
    }
    
    const { url, name } = result.data;
    console.log(`[API POST /projects/${projectId}/competitors] Validated input: url=${url}, name=${name}`);
    
    // Await the creation of the Supabase client using the project's setup
    const supabase = await createClient(); 
    
    // Use getUser() for secure authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(`[API POST /projects/${projectId}/competitors] Authentication failed:`, authError?.message || 'No user');
      return new NextResponse(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401 }
      );
    }
    
    console.log(`[API POST /projects/${projectId}/competitors] User authenticated: ${user.id}`);

    // First check if the project belongs to the user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id, competitor_limit') 
      .eq('id', projectId) 
      .eq('user_id', user.id)
      .single();

    // Log the specific error if one occurred
    if (projectError) {
      console.error(`[API POST /projects/${projectId}/competitors] Database error checking project access for user ${user.id}:`, projectError);
      // Return a 500 if it was a database error, not a 404
      return new NextResponse(
        JSON.stringify({ error: 'Database error checking project access' }),
        { status: 500 } 
      );
    }
    
    // Log if the project was simply not found (null result, no error)
    if (!project) {
      console.error(`[API POST /projects/${projectId}/competitors] Project not found for user ${user.id}. Query returned null.`);
      return new NextResponse(
        JSON.stringify({ error: 'Project not found or unauthorized' }),
        { status: 404 }
      );
    }
    
    console.log(`[API POST /projects/${projectId}/competitors] User ${user.id} authorized for project ${project.id}`);

    // Use the competitor_limit from the project, default to a low number if not set
    const limit = project.competitor_limit ?? 3; 
    console.log(`[API POST /projects/${projectId}/competitors] Using competitor limit from project data: ${limit}`);

    // Count existing competitors
    const { count, error: countError } = await supabase
      .from('competitors')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId); 

    if (countError) {
      console.error('Error counting competitors:', countError);
      return new NextResponse(
        JSON.stringify({ error: 'Error checking competitor limit' }),
        { status: 500 }
      );
    }

    console.log(`[API POST /projects/${projectId}/competitors] Checking competitor count limit (Limit: ${limit}, Current: ${count})`);

    if ((count || 0) >= limit) {
      console.warn(`[API POST /projects/${projectId}/competitors] Competitor limit reached for user ${user.id}`);
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
      .eq('project_id', projectId) 
      .ilike('url', url)
      .limit(1);

    if (existingError) {
      console.error(`[API POST /projects/${projectId}/competitors] Error checking existing competitor:`, existingError);
    } else if (existingCompetitor && existingCompetitor.length > 0) {
      console.warn(`[API POST /projects/${projectId}/competitors] Competitor URL ${url} already exists for project ${projectId}`);
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
    console.log(`[API POST /projects/${projectId}/competitors] Competitor name determined: ${competitorName}`);

    // Add the competitor
    console.log(`[API POST /projects/${projectId}/competitors] Inserting competitor into database...`);
    const { data: competitor, error } = await supabase
      .from('competitors')
      .insert({
        project_id: projectId, 
        user_id: user.id,
        url: url,
        name: competitorName,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error(`[API POST /projects/${projectId}/competitors] Error adding competitor to DB:`, error);
      return new NextResponse(
        JSON.stringify({ error: 'Error adding competitor' }),
        { status: 500 }
      );
    }
    
    console.log(`[API POST /projects/${projectId}/competitors] Competitor added successfully: ID=${competitor.id}`);

    // Queue analysis job (optional - keep existing logic)
    console.log(`[API POST /projects/${projectId}/competitors] Queueing analysis job for competitor ID: ${competitor.id}`);
    const { error: queueError } = await supabase
      .from('analysis_queue')
      .insert({
        competitor_id: competitor.id,
        project_id: projectId, 
        user_id: user.id,
        status: 'pending',
        competitor_url: url,
        competitor_name: competitorName,
      });

    if (queueError) {
      console.error(`[API POST /projects/${projectId}/competitors] Error queueing analysis job:`, queueError);
      // We don't want to fail the whole request if just queueing fails
    }
    
    console.log(`[API POST /projects/${projectId}/competitors] Request completed successfully.`);
    return NextResponse.json(competitor);
  } catch (error: any) {
    // Log error at the beginning of the catch block
    // Use params.id here as projectId might not be defined if error happened early
    console.error(`[API POST /projects/${params.id}/competitors] Unexpected error:`, error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500 }
    );
  }
} 