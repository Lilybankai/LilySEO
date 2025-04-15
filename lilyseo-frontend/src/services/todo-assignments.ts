import { createClient } from "@/lib/supabase/client";
import { TeamMember, Todo } from "@/types/todos";

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
 * Get user info for a specific user ID (Consider if this is still needed or covered by getTodoById)
 */
// export async function getUserInfo(userId: string) { ... } 

/**
 * Get unassigned todos for the current user's team/organization
 */
export async function getUnassignedTeamTasks() {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('User not authenticated');

    // Find the team owner ID for the current user
    const { data: teamMembership, error: teamError } = await supabase
      .from('team_members')
      .select('team_owner_id')
      .eq('user_id', user.id)
      .eq('status', 'active') // Ensure user is an active member
      .maybeSingle(); // User might be owner or not on a team

    if (teamError) {
      console.error("Error fetching team membership:", teamError);
      throw new Error("Could not determine team membership.");
    }

    // Determine the relevant owner ID (either the user themselves if owner, or fetched owner ID)
    // If teamMembership is null, maybe they are the owner or not part of *any* team?
    // Let's assume for now we fetch tasks created by the *direct* team owner found.
    // If the user *is* the owner, their user_id would be the team_owner_id in other member records.
    // A simpler approach might be needed if users can be in multiple teams or structure is different.
    
    const ownerId = teamMembership?.team_owner_id || user.id; // Default to user's own ID if no specific team found?
                                                               // This logic needs refinement based on exact org structure.
    console.log(`Fetching unassigned tasks for owner ID: ${ownerId}`);

    // Get todos created by the determined owner that are not assigned
    const { data, error } = await supabase
      .from('todos')
      .select('*, projects(*)')
      .eq('user_id', ownerId) // Filter by the determined owner ID
      .is('assigned_to', null) // Filter for unassigned todos
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching unassigned team todos:', JSON.stringify(error, null, 2));
      return [];
    }
    
    console.log(`Fetched ${data?.length || 0} unassigned tasks.`);
    return data || [];
  } catch (error) {
    console.error('Error getting unassigned team todos:', error);
    return [];
  }
}

/**
 * Get a single todo by its ID, including project and assignee profile
 */
export async function getTodoById(id: string): Promise<Todo | null> {
  if (!id) {
    console.error("getTodoById called with null or undefined id");
    return null;
  }
  console.log(`Fetching todo with ID: ${id}`); // Log the ID being fetched
  try {
    const supabase = createClient();
    // Remove the direct profiles join since that relationship doesn't exist
    const { data, error } = await supabase
      .from('todos')
      .select('*, projects(id, name)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error("Supabase error fetching todo by ID:", JSON.stringify(error, null, 2)); // Log the full Supabase error
      // Consider mapping specific Supabase errors (like RLS violation) to clearer messages
      throw new Error(`Failed to fetch task details: ${error.message}`);
    }

    if (!data) {
      console.log(`No todo found for ID: ${id}`);
      return null; // No record found
    }

    console.log("Raw todo data fetched:", data);
    
    // Create the Todo object with project data but without profile data for now
    const formattedTodo: Todo = {
      ...(data as Omit<Todo, 'projects' | 'assigneeProfile'>),
      projects: data.projects,
      assigneeProfile: null // Initialize with null
    };
    
    // If there's an assignedTo value, fetch the profile data separately
    if (data.assignedTo) {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', data.assignedTo)
          .maybeSingle();
          
        if (!profileError && profileData) {
          formattedTodo.assigneeProfile = profileData;
        } else if (profileError) {
          console.error("Error fetching assignee profile:", profileError);
        }
      } catch (profileFetchError) {
        console.error("Failed to fetch assignee profile:", profileFetchError);
      }
    }

    console.log("Formatted todo data:", formattedTodo);
    return formattedTodo;

  } catch (error) {
    console.error('Generic error in getTodoById:', error);
    // Avoid returning null here, let the error propagate if needed or return a specific error state
    throw error; // Re-throw the error so the calling component knows about it
  }
}

/**
 * Update a todo item
 */
export async function updateTodo(id: string, updates: Partial<Todo>): Promise<{ success: boolean; error?: string }> {
  if (!id) {
    return { success: false, error: "Todo ID is required for update." };
  }
  console.log(`Updating todo ${id} with:`, updates);
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('todos')
      .update({ ...updates, updated_at: new Date().toISOString() }) // Ensure updated_at is set
      .eq('id', id);

    if (error) {
      console.error("Supabase error updating todo:", JSON.stringify(error, null, 2));
      return { success: false, error: error.message };
    }
    console.log(`Todo ${id} updated successfully.`);
    return { success: true };
  } catch (error) {
      console.error('Generic error updating todo:', error);
      return { success: false, error: 'An unexpected error occurred during update.' };
  }
}

/**
 * Get team members eligible for assignment
 */
export async function getTeamMembersForAssignment(): Promise<TeamMember[]> {
  console.log("Fetching team members for assignment...");
  try {
      const supabase = createClient();
      // This might need adjustment based on how team members are fetched for assignment context
      // e.g., fetching members associated with the current user's team
      const { data: teamMembers, error } = await supabase
          .from('team_members')
          .select('id, user_id, name, email, permissions, status') // Select specific fields
          // .in('permissions', ['admin', 'member']) // Maybe filter by permissions?
          .eq('status', 'active'); // Only active members
      
      if (error) {
          console.error('Supabase error fetching team members:', JSON.stringify(error, null, 2));
          return [];
      }
      console.log(`Fetched ${teamMembers?.length || 0} team members for assignment.`);
      // Map Supabase result (snake_case) to TeamMember type (camelCase if needed)
      const mappedMembers = teamMembers?.map(m => ({ 
        id: m.id, // Assuming team_members primary key is needed
        userId: m.user_id, // Map user_id
        name: m.name,
        email: m.email,
        permissions: m.permissions,
        status: m.status
      })) || [];
      return mappedMembers as TeamMember[];
  } catch (error) {
      console.error('Generic error fetching team members:', error);
      return [];
  }
} 