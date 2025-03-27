import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createTestNotification } from '@/services/notifications';

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

    // Validate request
    if (!body.memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    // Check if the member exists and belongs to this user
    const { data: member, error: fetchError } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', body.memberId)
      .eq('team_owner_id', userId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !member) {
      console.error('Error fetching team member or not found:', fetchError);
      return NextResponse.json(
        { error: 'Invitation not found or you do not have permission' },
        { status: 404 }
      );
    }

    // Generate a new invite token and set expiration date
    const inviteToken = crypto.randomUUID();
    const inviteExpiresAt = new Date();
    inviteExpiresAt.setDate(inviteExpiresAt.getDate() + 7); // 7 days from now

    // Update the invitation
    const { data: updatedMember, error: updateError } = await supabase
      .from('team_members')
      .update({
        invite_token: inviteToken,
        invite_expires_at: inviteExpiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', body.memberId)
      .select()
      .single();

    if (updateError) {
      console.error('Error resending invitation:', updateError);
      return NextResponse.json(
        { error: 'Failed to resend invitation' },
        { status: 500 }
      );
    }

    // In a real-world application, you would send an email here
    // For now, we'll just create a notification
    await createTestNotification(
      'Invitation Resent',
      `You've resent an invitation to ${member.email}.`
    );

    return NextResponse.json({
      success: true,
      message: 'Invitation resent successfully'
    });
  } catch (error) {
    console.error('Error in resend invitation API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 