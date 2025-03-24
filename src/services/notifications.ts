import { createClient } from "@/lib/supabase/client";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Get all notifications for the current user
 */
export async function getUserNotifications(): Promise<Notification[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
  
  return data || [];
}

/**
 * Get unread notification count for the current user
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = createClient();
  
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false);
  
  if (error) {
    console.error("Error fetching unread notification count:", error);
    return 0;
  }
  
  return count || 0;
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(id: string): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);
  
  if (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
  
  return true;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false);
  
  if (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }
  
  return true;
}

/**
 * Create a new notification (for testing)
 */
export async function createTestNotification(title: string, message: string): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error("No user found");
    return false;
  }
  
  const { error } = await supabase
    .from("notifications")
    .insert({
      user_id: user.id,
      title,
      message,
      is_read: false
    });
  
  if (error) {
    console.error("Error creating notification:", error);
    return false;
  }
  
  return true;
} 