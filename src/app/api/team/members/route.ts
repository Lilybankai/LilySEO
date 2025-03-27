import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createTestNotification } from '@/services/notifications';

// GET: Fetch team members for the current team owner
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get team members where the current user is the team owner
    const { data: teamMembers, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching team members:', error);
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      );
    }

    return NextResponse.json({ teamMembers });
  } catch (error) {
    console.error('Error in team members API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// POST: Create a new team member invitation
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    // Check for required fields
    if (!body.email || !body.permissions) {
      return NextResponse.json(
        { error: 'Email and permissions are required' },
        { status: 400 }
      );
    }

    // Check if user is under their team member limit
    const checkResult = await supabase.rpc('check_team_member_limit', {
      p_team_owner_id: userId
    });

    if (checkResult.error) {
      console.error('Error checking team member limit:', checkResult.error);
      return NextResponse.json(
        { error: 'Failed to check team member limit' },
        { status: 500 }
      );
    }

    // If the result is false, team member limit has been reached
    if (checkResult.data === false) {
      return NextResponse.json(
        { error: 'Team member limit reached for your subscription tier' },
        { status: 403 }
      );
    }

    // Create the team member invitation using RPC function
    const { data, error } = await supabase.rpc('add_team_member', {
      p_team_owner_id: userId,
      p_email: body.email,
      p_name: body.name || '',
      p_permissions: body.permissions
    });

    if (error) {
      console.error('Error creating team member invitation:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create team member invitation' },
        { status: 500 }
      );
    }

    // Send a notification to the owner about the invitation
    await createTestNotification(
      'Team Invitation Sent',
      `You've sent an invitation to ${body.email} to join your team.`
    );

    return NextResponse.json({ teamMember: data });
  } catch (error) {
    console.error('Error in team members API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 