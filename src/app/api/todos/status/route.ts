import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { createTestNotification } from '@/services/notifications';

export async function PATCH(request: Request) {
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
    console.log("Request body:", body);
    
    // Validate required fields
    if (!body.todoId || !body.status) {
      return NextResponse.json(
        { error: 'Todo ID and status are required' },
        { status: 400 }
      );
    }
    
    // Get the current todo to check permissions and get previous status
    const { data: todo, error: todoError } = await supabase
      .from('todos')
      .select('*, projects(*)')
      .eq('id', body.todoId)
      .single();
    
    if (todoError || !todo) {
      console.error('Error fetching todo:', todoError);
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission to update this todo
    // Allow if: user is todo owner, user is assigned to the todo, or user is admin
    const isOwner = todo.user_id === userId;
    const isAssignee = todo.assigned_to === userId;
    
    // Check if user is admin team member of the todo owner
    let isAdmin = false;
    if (!isOwner && !isAssignee) {
      try {
        const { data: teamMembership, error: teamError } = await supabase
          .from('team_members')
          .select('*')
          .eq('user_id', userId)
          .eq('team_owner_id', todo.user_id)
          .eq('permissions', 'admin')
          .eq('status', 'active')
          .single();
        
        isAdmin = teamMembership !== null && !teamError;
      } catch (error) {
        console.error('Error checking team membership:', error);
        // Continue with isAdmin = false
      }
    }
    
    if (!isOwner && !isAssignee && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to update this todo' },
        { status: 403 }
      );
    }
    
    // Additional update fields
    const updateData: any = {
      status: body.status,
      updated_at: new Date().toISOString()
    };
    
    // If status is 'completed', set completion_date
    if (body.status.toLowerCase() === 'completed') {
      updateData.completion_date = new Date().toISOString();
    }
    
    // If time_spent is provided, add it
    if (body.timeSpent && typeof body.timeSpent === 'number') {
      updateData.time_spent = (todo.time_spent || 0) + body.timeSpent;
      updateData.time_tracked_at = new Date().toISOString();
    }
    
    console.log("Updating todo with data:", updateData);
    
    // Update the todo with the new status
    const { data: updatedTodo, error: updateError } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', body.todoId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating todo status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update todo status: ' + updateError.message },
        { status: 500 }
      );
    }
    
    // Create notifications based on status change - wrap in try/catch to prevent errors
    try {
      const previousStatus = todo.status;
      const newStatus = body.status;
      
      // Only create notification if status actually changed
      if (previousStatus !== newStatus) {
        try {
          // Use a single, simpler notification approach that's more likely to work
          const { data: notification, error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: userId, // Send to the current user (simpler than trying to notify others)
              title: `Task Status Updated: ${todo.title}`,
              message: `Task status changed from ${previousStatus} to ${newStatus}.`,
              is_read: false,
              created_at: new Date().toISOString()
            });
          
          if (notificationError) {
            console.error('Error creating notification:', notificationError);
          } else {
            console.log('Notification created successfully:', notification);
          }
        } catch (error) {
          console.error('Failed to create notification:', error);
        }
      }
    } catch (error) {
      console.error('Error handling notifications:', error);
      // Continue despite notification errors
    }
    
    // Return the updated todo
    return NextResponse.json({ 
      success: true,
      todo: updatedTodo
    });
  } catch (error) {
    console.error('Error in update todo status API:', error);
    return NextResponse.json(
      { error: 'Failed to process request: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 