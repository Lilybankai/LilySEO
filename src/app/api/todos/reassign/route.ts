import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { createTestNotification } from '@/services/notifications';

export async function POST(request: Request) {
  try {
    // Authenticate the user
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.todoId || !body.assigneeId) {
      return NextResponse.json(
        { error: 'Todo ID and assignee ID are required' },
        { status: 400 }
      );
    }
    
    // Check if the assignee exists and is a valid team member
    const { data: assignee, error: assigneeError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', body.assigneeId)
      .single();
    
    if (assigneeError || !assignee) {
      return NextResponse.json(
        { error: 'Assignee not found' },
        { status: 404 }
      );
    }
    
    // Get the current todo to check permissions and previous assignee
    const { data: todo, error: todoError } = await supabase
      .from('todos')
      .select('*')
      .eq('id', body.todoId)
      .single();
    
    if (todoError || !todo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission to reassign this todo
    // User should be either the owner of the todo or an admin team member
    const isOwner = todo.user_id === userId;
    
    let isAdmin = false;
    if (!isOwner) {
      const { data: teamMembership, error: teamError } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', userId)
        .eq('team_owner_id', todo.user_id)
        .eq('permissions', 'admin')
        .eq('status', 'active')
        .single();
      
      isAdmin = teamMembership !== null && !teamError;
    }
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to reassign this todo' },
        { status: 403 }
      );
    }
    
    // Verify the assignee is on the team
    const { data: teamMember, error: teamMemberError } = await supabase
      .from('team_members')
      .select('*')
      .eq('user_id', body.assigneeId)
      .eq('team_owner_id', todo.user_id)
      .eq('status', 'active')
      .single();
    
    if (teamMemberError || !teamMember) {
      return NextResponse.json(
        { error: 'Assignee is not an active team member' },
        { status: 400 }
      );
    }
    
    // Store the previous assignee for notification
    const previousAssigneeId = todo.assigned_to;
    
    // Update the todo with the new assignee
    const { data: updatedTodo, error: updateError } = await supabase
      .from('todos')
      .update({
        assigned_to: body.assigneeId,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.todoId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error reassigning todo:', updateError);
      return NextResponse.json(
        { error: 'Failed to reassign todo' },
        { status: 500 }
      );
    }
    
    // Get assignee profile information for notifications
    const { data: newAssigneeProfile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', body.assigneeId)
      .single();
    
    let previousAssigneeName = "No one";
    if (previousAssigneeId) {
      const { data: prevProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', previousAssigneeId)
        .single();
      
      if (prevProfile) {
        previousAssigneeName = prevProfile.full_name;
      }
    }
    
    const newAssigneeName = newAssigneeProfile?.full_name || 'Unknown user';
    
    // Create notifications
    
    // 1. Notify the new assignee
    if (body.assigneeId !== userId) {
      const { error: newAssigneeNotificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: body.assigneeId,
          title: `New Task Assigned: ${todo.title}`,
          message: `You have been assigned a new task: "${todo.title}". Previously assigned to ${previousAssigneeName}.`,
          is_read: false
        });
      
      if (newAssigneeNotificationError) {
        console.error('Error creating notification for new assignee:', newAssigneeNotificationError);
      }
    }
    
    // 2. Notify the previous assignee (if there was one and it's not the same as new assignee)
    if (previousAssigneeId && previousAssigneeId !== body.assigneeId) {
      const { error: prevAssigneeNotificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: previousAssigneeId,
          title: `Task Reassigned: ${todo.title}`,
          message: `Task "${todo.title}" has been reassigned from you to ${newAssigneeName}.`,
          is_read: false
        });
      
      if (prevAssigneeNotificationError) {
        console.error('Error creating notification for previous assignee:', prevAssigneeNotificationError);
      }
    }
    
    // 3. Notify the owner (if they're not the one doing the reassignment)
    if (todo.user_id !== userId) {
      const { error: ownerNotificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: todo.user_id,
          title: `Task Reassigned: ${todo.title}`,
          message: `Task "${todo.title}" has been reassigned from ${previousAssigneeName} to ${newAssigneeName}.`,
          is_read: false
        });
      
      if (ownerNotificationError) {
        console.error('Error creating notification for owner:', ownerNotificationError);
      }
    }
    
    // For testing, also create a notification using the test service
    await createTestNotification(
      `Task Reassigned: ${todo.title}`,
      `Task has been reassigned from ${previousAssigneeName} to ${newAssigneeName}.`
    );
    
    // Return the updated todo
    return NextResponse.json({ 
      success: true,
      todo: updatedTodo
    });
  } catch (error) {
    console.error('Error in reassign todo API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 