import { createClient } from "@/lib/supabase/server";

// Subscription plan limits
export const SUBSCRIPTION_LIMITS = {
  FREE: {
    projects: 3,
    auditsPerMonth: 10,
  },
  PRO: {
    projects: 10,
    auditsPerMonth: 50,
  },
  BUSINESS: {
    projects: 25,
    auditsPerMonth: 200,
  },
  ENTERPRISE: {
    projects: -1, // Unlimited
    auditsPerMonth: -1, // Unlimited
  },
};

// Get user's subscription plan
export async function getUserSubscriptionPlan(userId: string) {
  const supabase = await createClient();
  
  // Get user's subscription from the database
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();
  
  // Default to FREE plan if no subscription found
  if (!subscription) {
    return {
      plan: "FREE",
      ...SUBSCRIPTION_LIMITS.FREE,
    };
  }
  
  // Return the appropriate plan limits
  const plan = subscription.plan.toUpperCase();
  return {
    plan,
    ...SUBSCRIPTION_LIMITS[plan as keyof typeof SUBSCRIPTION_LIMITS],
  };
}

// Get user's audit limits
export async function getUserAuditLimits(userId: string) {
  const supabase = await createClient();
  
  // Get user's subscription plan
  const subscription = await getUserSubscriptionPlan(userId);
  
  // If unlimited audits, return unlimited
  if (subscription.auditsPerMonth === -1) {
    return {
      total: -1,
      used: 0,
      remaining: -1,
      isLimited: false,
    };
  }
  
  // Get the first day of the current month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Count audits created this month
  const { count } = await supabase
    .from("audits")
    .select("*", { count: "exact", head: true })
    .eq("created_by", userId)
    .gte("created_at", firstDayOfMonth.toISOString());
  
  const used = count || 0;
  const total = subscription.auditsPerMonth;
  const remaining = total - used;
  
  return {
    total,
    used,
    remaining,
    isLimited: true,
  };
} 