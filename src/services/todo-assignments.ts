import { createClient } from "@/lib/supabase/client";
import { TeamMember } from "@/types/todos";

/**
 * Assign a todo to a team member
 */
export async function assignTodoToTeamMember(
  todoId: string,
  assignedTo: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/todos/assign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ todoId, assignedTo }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to assign todo'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error assigning todo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get team members with permission to be assigned todos
 */
export async function getEligibleTeamMembers(): Promise<TeamMember[]> {
  try {
    const supabase = createClient();
    
    // Get team members where the current user is the team owner
    // and they have the correct permissions (admin or member, not viewer)
    const { data: teamMembers, error } = await supabase
      .from('team_members')
      .select('*')
      .in('permissions', ['admin', 'member'])
      .eq('status', 'active');
    
    if (error) {
      console.error('Error fetching eligible team members:', error);
      return [];
    }
    
    return teamMembers || [];
  } catch (error) {
    console.error('Error getting eligible team members:', error);
    return [];
  }
}

/**
 * Get all todos assigned to a specific team member
 */
export async function getTodosByAssignee(assigneeId: string) {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('todos')
      .select('*, projects(*)')
      .eq('assigned_to', assigneeId)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching assigned todos:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting assigned todos:', error);
    return [];
  }
}

/**
 * Get todos assigned by the current user (where they're the owner)
 */
export async function getTodosAssignedByMe() {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Get todos where the current user is the owner (user_id) but they're assigned to someone else
    const { data, error } = await supabase
      .from('todos')
      .select('*, projects(*)')
      .eq('user_id', user.id)
      .not('assigned_to', 'is', null)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching todos assigned by me:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting todos assigned by me:', error);
    return [];
  }
}

/**
 * Get todos assigned to the current user
 */
export async function getTodosAssignedToMe() {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('todos')
      .select('*, projects(*)')
      .eq('assigned_to', user.id)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching todos assigned to me:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting todos assigned to me:', error);
    return [];
  }
}

/**
 * Get user info for a specific user ID
 */
export async function getUserInfo(userId: string) {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
} 