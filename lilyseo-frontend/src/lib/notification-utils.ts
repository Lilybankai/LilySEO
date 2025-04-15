import { createClient } from "@/lib/supabase/client";

/**
 * Create a new notification for a user
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        title,
        message,
        is_read: false
      });
    
    if (error) {
      console.error("Error creating notification:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in createNotification:", error);
    return false;
  }
}

/**
 * Create a notification for audit completion
 */
export async function notifyAuditComplete(
  userId: string,
  projectName: string,
  auditId: string
): Promise<boolean> {
  const title = "Audit Complete";
  const message = `Your SEO audit for "${projectName}" has been completed and is ready to view.`;
  
  return createNotification(userId, title, message);
}

/**
 * Create a notification for new todos generated
 */
export async function notifyNewTodos(
  userId: string,
  projectName: string,
  todoCount: number
): Promise<boolean> {
  const title = "New SEO Tasks";
  const message = `${todoCount} new optimization ${todoCount === 1 ? 'task has' : 'tasks have'} been created for "${projectName}".`;
  
  return createNotification(userId, title, message);
}

/**
 * Create a notification for ranking changes
 */
export async function notifyRankingChanges(
  userId: string,
  projectName: string,
  improvedCount: number,
  decreasedCount: number
): Promise<boolean> {
  const title = "Ranking Changes";
  
  let message = `Ranking update for "${projectName}": `;
  
  if (improvedCount > 0 && decreasedCount > 0) {
    message += `${improvedCount} keyword${improvedCount === 1 ? '' : 's'} improved and ${decreasedCount} decreased.`;
  } else if (improvedCount > 0) {
    message += `${improvedCount} keyword${improvedCount === 1 ? '' : 's'} improved in rankings.`;
  } else if (decreasedCount > 0) {
    message += `${decreasedCount} keyword${decreasedCount === 1 ? '' : 's'} decreased in rankings.`;
  } else {
    message += `No significant changes in keyword rankings.`;
  }
  
  return createNotification(userId, title, message);
}

/**
 * Create a notification for subscription changes
 */
export async function notifySubscriptionChange(
  userId: string,
  tier: string
): Promise<boolean> {
  const title = "Subscription Updated";
  const message = `Your subscription has been updated to the ${tier} plan.`;
  
  return createNotification(userId, title, message);
}

/**
 * Create a notification for payment issues
 */
export async function notifyPaymentIssue(
  userId: string
): Promise<boolean> {
  const title = "Payment Issue";
  const message = "There was an issue processing your latest payment. Please update your payment method to avoid service interruption.";
  
  return createNotification(userId, title, message);
}

/**
 * Create a notification for white label access
 */
export async function notifyWhiteLabelAccess(
  userId: string,
  granted: boolean
): Promise<boolean> {
  const title = "White Label Access";
  const message = granted 
    ? "White label feature access has been granted to your account." 
    : "Your white label feature access has expired.";
  
  return createNotification(userId, title, message);
} 