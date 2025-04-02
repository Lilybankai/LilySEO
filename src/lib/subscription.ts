import { createClient } from "@/lib/supabase/server";

// Subscription plan limits
export const SUBSCRIPTION_LIMITS = {
  FREE: {
    projects: 3,
    auditsPerMonth: 10,
  },
  PRO: {
    projects: 15,
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
  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();
  
  if (subError && subError.code !== 'PGRST116') { // Ignore "No rows found" error
    // Keep error log
    console.error("[getUserSubscriptionPlan] Error fetching subscription:", subError);
    // Fallback to FREE on error
    return {
      plan: "FREE",
      ...SUBSCRIPTION_LIMITS.FREE,
    };
  }

  if (!subscription) {
    return {
      plan: "FREE",
      ...SUBSCRIPTION_LIMITS.FREE,
    };
  }
  
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

/**
 * Checks if a user has enough remaining quota for a specific subscription feature
 */
export async function processSubscriptionRequirements(
  supabase: any,
  userId: string,
  featureType: 'ai_recommendations' | 'ai_content' | 'ai_keywords' | 'reports' | 'audits',
  count: number = 1
): Promise<{ allowed: boolean; message: string }> {
  try {
    // Get user's subscription tier
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error checking subscription:', profileError);
      return { 
        allowed: false, 
        message: 'Unable to verify subscription status' 
      };
    }

    const tier = profile?.subscription_tier?.toUpperCase() || 'FREE';
    
    // Define limits based on feature type and tier
    const limits: Record<string, Record<string, number>> = {
      ai_recommendations: {
        FREE: 15,
        PRO: 100,
        ENTERPRISE: -1  // unlimited
      },
      ai_content: {
        FREE: 5,
        PRO: 50,
        ENTERPRISE: -1
      },
      ai_keywords: {
        FREE: 10,
        PRO: 100,
        ENTERPRISE: -1
      },
      reports: {
        FREE: 3,
        PRO: 20,
        ENTERPRISE: -1
      },
      audits: {
        FREE: 1,
        PRO: 10,
        ENTERPRISE: -1
      }
    };

    // Get the limit for the user's tier
    const limit = limits[featureType][tier] || 0;
    
    // If unlimited (-1), allow the operation
    if (limit === -1) {
      return { allowed: true, message: 'Unlimited access' };
    }

    // Count usage in the current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayFormatted = firstDayOfMonth.toISOString();
    
    const { count: used, error: usageError } = await supabase
      .from('ai_api_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('endpoint', featureType)
      .gte('created_at', firstDayFormatted);

    if (usageError) {
      console.error('Error checking usage:', usageError);
      return { 
        allowed: true,  // Default to allowing if we can't check
        message: 'Usage check failed, proceeding anyway' 
      };
    }

    // Check if user has enough remaining quota
    const remaining = limit - (used || 0);
    if (remaining < count) {
      return {
        allowed: false,
        message: `You've reached your monthly limit for this feature. Upgrade your plan for more.`
      };
    }

    return {
      allowed: true,
      message: `Operation allowed. ${remaining - count} uses remaining this month.`
    };
  } catch (error) {
    console.error('Error processing subscription requirements:', error);
    return { 
      allowed: true,  // Default to allowing if there's an error
      message: 'Error checking subscription, proceeding anyway'
    };
  }
} 