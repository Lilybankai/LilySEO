import { createClient } from "@/lib/supabase/client";
import { TeamMember, TeamMemberPermission } from "@/types/todos";

/**
 * Get all team members for the current user (where user is team owner)
 */
export async function getTeamMembers(): Promise<TeamMember[]> {
  try {
    const response = await fetch('/api/team/members', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching team members: ${response.statusText}`);
    }

    const data = await response.json();
    return data.teamMembers || [];
  } catch (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
}

/**
 * Invite a new team member
 */
export async function inviteTeamMember(
  email: string,
  name: string,
  permissions: TeamMemberPermission
): Promise<{ success: boolean; teamMember?: TeamMember; error?: string }> {
  try {
    const response = await fetch('/api/team/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name, permissions }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to invite team member'
      };
    }

    return {
      success: true,
      teamMember: data.teamMember
    };
  } catch (error) {
    console.error('Error inviting team member:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Resend a team invitation
 */
export async function resendInvitation(
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/team/invitations/resend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ memberId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to resend invitation'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error resending invitation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Remove a team member
 */
export async function removeTeamMember(
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/team/members/${memberId}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to remove team member'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error removing team member:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update a team member's permissions
 */
export async function updateTeamMemberPermissions(
  memberId: string,
  permissions: TeamMemberPermission
): Promise<{ success: boolean; teamMember?: TeamMember; error?: string }> {
  try {
    const response = await fetch(`/api/team/members/${memberId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ permissions }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to update team member permissions'
      };
    }

    return {
      success: true,
      teamMember: data.teamMember
    };
  } catch (error) {
    console.error('Error updating team member permissions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get the current user's subscription tier and team member limit
 */
export async function getTeamMemberLimit(): Promise<{ tier: string; teamMemberLimit: number }> {
  const supabase = createClient();
  
  try {
    // Get the user's subscription tier from their profile
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return { tier: 'free', teamMemberLimit: 0 };
    }
    
    const tier = profile?.subscription_tier || 'free';
    
    // Get the team member limit for this tier
    const { data: limit, error: limitError } = await supabase
      .from('subscription_limits')
      .select('team_member_limit')
      .eq('subscription_tier', tier)
      .single();
    
    if (limitError) {
      console.error('Error fetching subscription limits:', limitError);
      return { tier, teamMemberLimit: 0 };
    }
    
    return { 
      tier, 
      teamMemberLimit: limit?.team_member_limit || 0 
    };
  } catch (error) {
    console.error('Error getting team member limit:', error);
    return { tier: 'free', teamMemberLimit: 0 };
  }
} 