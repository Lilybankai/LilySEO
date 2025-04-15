/**
 * Utility functions for API routes
 */

// Types for feature limits
export type FeatureType = 'ai_recommendations' | 'ai_content' | 'ai_keywords' | 'reports' | 'audits';

interface SubscriptionCheck {
  allowed: boolean;
  message: string;
}

/**
 * Checks if a user has enough remaining quota for a specific subscription feature
 * This is a standalone implementation to avoid bundling issues
 */
export async function checkFeatureAccess(
  supabase: any,
  userId: string,
  featureType: FeatureType,
  count: number = 1
): Promise<SubscriptionCheck> {
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

/**
 * Logs API usage in the database
 */
export async function logApiUsage(
  supabase: any, 
  userId: string, 
  endpoint: FeatureType, 
  tokensUsed: number = 0, 
  status: 'success' | 'error' = 'success'
) {
  try {
    await supabase.from('ai_api_logs').insert({
      user_id: userId,
      endpoint,
      tokens_used: tokensUsed,
      status
    });
    return true;
  } catch (error) {
    console.error(`Error logging ${endpoint} API usage:`, error);
    return false;
  }
} 