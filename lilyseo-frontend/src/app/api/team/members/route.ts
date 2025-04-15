import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createTestNotification } from '@/services/notifications';
import { sendEmail } from '@/services/email';
import { TeamMember } from "@/types/todos";

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

    const inviterId = session.user.id;
    const inviterEmail = session.user.email || 'Unknown Email';
    const body = await request.json();

    // Validate input
    if (!body.email || !body.permissions) {
      return NextResponse.json({ error: 'Email and permissions are required' }, { status: 400 });
    }

    // Check team member limit (existing logic)
    const checkResult = await supabase.rpc('check_team_member_limit', { p_team_owner_id: inviterId });
    if (checkResult.error || checkResult.data === false) {
      const errorMsg = checkResult.error ? 'Failed to check limit' : 'Team member limit reached';
      console.error(errorMsg, checkResult.error);
      return NextResponse.json({ error: errorMsg }, { status: checkResult.error ? 500 : 403 });
    }

    // Get inviter's name from profiles table
    const { data: inviterProfile, error: inviterError } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', inviterId)
        .single();

    const inviterName = inviterProfile ? `${inviterProfile.first_name || ''} ${inviterProfile.last_name || ''}`.trim() : 'A LilySEO User';

    // Create the team member invitation using RPC function
    // This RPC function should return the newly created team_member record including the invite_token
    const { data: newMemberData, error: rpcError } = await supabase.rpc('add_team_member', {
      p_team_owner_id: inviterId,
      p_email: body.email,
      p_name: body.name || '',
      p_permissions: body.permissions
    });

    if (rpcError || !newMemberData) {
      console.error('Error creating team member invitation via RPC:', rpcError);
      return NextResponse.json({ error: rpcError?.message || 'Failed to create team member invitation' }, { status: 500 });
    }

    // Type assertion might be needed depending on RPC return type
    const newMember = newMemberData as unknown as TeamMember;

    // Send invitation email using the new service
    if (newMember.inviteToken) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const acceptUrl = `${appUrl}/auth/accept-invite?token=${newMember.inviteToken}`;

      const emailResult = await sendEmail({
        to: newMember.email,
        subject: `You're invited to join ${inviterName}'s team on LilySEO`,
        templateName: 'team-invitation',
        templateData: {
          inviteeName: newMember.name || 'there', // Use provided name or generic greeting
          inviterName: inviterName,
          inviterEmail: inviterEmail,
          acceptUrl: acceptUrl
        }
      });

      if (!emailResult.success) {
        // Log the error, but maybe don't fail the whole request?
        // The invite is still created in the DB.
        console.error(`Failed to send invitation email to ${newMember.email}:`, emailResult.error);
      }
    } else {
        console.warn(`No invite token generated for new member ${newMember.id}. Cannot send email.`);
    }

    // Send a notification to the owner (existing logic)
    await createTestNotification(
      'Team Invitation Sent',
      `You've sent an invitation to ${body.email} to join your team.`
    );

    // Return the newly created member data from the RPC
    return NextResponse.json({ teamMember: newMember });

  } catch (error) {
    console.error('Error in POST /api/team/members:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
} 