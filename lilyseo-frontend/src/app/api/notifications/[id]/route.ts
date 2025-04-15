import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PUT /api/notifications/[id]
 * Marks a notification as read
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    // Verify the notification belongs to the user
    const { data: notification, error: fetchError } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();
    
    if (fetchError || !notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }
    
    // Mark notification as read
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    
    if (error) {
      console.error("Error updating notification:", error);
      return NextResponse.json(
        { error: "Failed to update notification" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Error in notification update API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 