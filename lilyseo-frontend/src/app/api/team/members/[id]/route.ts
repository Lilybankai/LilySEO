import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createTestNotification } from '@/services/notifications';

// GET: Get specific team member details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const memberId = params.id;

    // Get the team member
    const { data: teamMember, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', memberId)
      .eq('team_owner_id', userId)
      .single();

    if (error) {
      console.error('Error fetching team member:', error);
      return NextResponse.json(
        { error: 'Failed to fetch team member details' },
        { status: 500 }
      );
    }

    return NextResponse.json({ teamMember });
  } catch (error) {
    console.error('Error in team member API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// PATCH: Update a team member (permissions, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const memberId = params.id;
    const body = await request.json();

    // Validate the request
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'No update data provided' },
        { status: 400 }
      );
    }

    // Check if the user is the team owner
    const { data: teamMember, error: fetchError } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', memberId)
      .eq('team_owner_id', userId)
      .single();

    if (fetchError || !teamMember) {
      console.error('Error fetching team member or not found:', fetchError);
      return NextResponse.json(
        { error: 'Team member not found or you do not have permission' },
        { status: 404 }
      );
    }

    // Update the team member
    const updateData: any = {};
    if (body.permissions) updateData.permissions = body.permissions;
    if (body.status) updateData.status = body.status;
    if (body.name) updateData.name = body.name;
    
    // Always update the timestamp
    updateData.updated_at = new Date().toISOString();

    const { data: updatedMember, error: updateError } = await supabase
      .from('team_members')
      .update(updateData)
      .eq('id', memberId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating team member:', updateError);
      return NextResponse.json(
        { error: 'Failed to update team member' },
        { status: 500 }
      );
    }

    // If permissions were updated, send a notification
    if (body.permissions && body.permissions !== teamMember.permissions) {
      await createTestNotification(
        'Team Member Role Updated',
        `${teamMember.name || teamMember.email}'s role has been updated to ${body.permissions}.`
      );
    }

    return NextResponse.json({ teamMember: updatedMember });
  } catch (error) {
    console.error('Error in team member API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a team member
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const memberId = params.id;

    // Check if the user is the team owner
    const { data: teamMember, error: fetchError } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', memberId)
      .eq('team_owner_id', userId)
      .single();

    if (fetchError || !teamMember) {
      console.error('Error fetching team member or not found:', fetchError);
      return NextResponse.json(
        { error: 'Team member not found or you do not have permission' },
        { status: 404 }
      );
    }

    // Delete the team member
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);

    if (deleteError) {
      console.error('Error deleting team member:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete team member' },
        { status: 500 }
      );
    }

    // Send a notification
    await createTestNotification(
      'Team Member Removed',
      `${teamMember.name || teamMember.email} has been removed from your team.`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in team member API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 