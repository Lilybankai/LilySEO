import { createClient } from "@/lib/supabase/client"

export type SubscriptionTier = 'free' | 'pro' | 'enterprise'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | null

export interface UserSubscription {
  isPro: boolean
  isEnterprise: boolean
  tier: string
  features: {
    maxProjects: number
    maxKeywordGroups: number
    maxCompetitors: number
    dailyCrawl: boolean
    weeklyCrawl: boolean
    advancedSettings: boolean
    prioritySupport: boolean
  }
}

export interface SubscriptionPlan {
  id: string
  name: string
  tier: SubscriptionTier
  price: number
  features: string[]
  recommended?: boolean
}

// Subscription plans data
export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    tier: 'free',
    price: 0,
    features: [
      '3 Projects',
      'Basic SEO analysis',
      'Monthly crawl',
      'Community support'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    tier: 'pro',
    price: 49,
    recommended: true,
    features: [
      '10 Projects',
      'Advanced SEO analysis',
      'Weekly crawl',
      'Competitor analysis',
      'White label reports',
      'Email support'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tier: 'enterprise',
    price: 199,
    features: [
      'Unlimited Projects',
      'Premium SEO analysis',
      'Daily crawl',
      'Unlimited competitor analysis',
      'White label dashboard',
      'Priority support',
      'Dedicated account manager'
    ]
  }
];

/**
 * Get the current user's subscription status and features
 */
export async function getUserSubscription(): Promise<UserSubscription> {
  const supabase = createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error("User not authenticated")
  }
  
  // Get the user's profile with subscription information
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("subscription_tier, subscription_status")
    .eq("id", user.id)
    .single()
  
  if (profileError) {
    console.error("Error fetching user profile:", profileError)
    // Return default free tier if profile can't be fetched
    return getSubscriptionFeatures("free")
  }
  
  // Check if subscription is active
  if (profile.subscription_status !== "active") {
    return getSubscriptionFeatures("free")
  }
  
  return getSubscriptionFeatures(profile.subscription_tier || "free")
}

/**
 * Get the features available for a specific subscription tier
 */
function getSubscriptionFeatures(tier: string): UserSubscription {
  const subscriptionTiers: Record<string, UserSubscription> = {
    free: {
      isPro: false,
      isEnterprise: false,
      tier: "free",
      features: {
        maxProjects: 3,
        maxKeywordGroups: 0,
        maxCompetitors: 3,
        dailyCrawl: false,
        weeklyCrawl: false,
        advancedSettings: false,
        prioritySupport: false,
      },
    },
    pro: {
      isPro: true,
      isEnterprise: false,
      tier: "pro",
      features: {
        maxProjects: 10,
        maxKeywordGroups: 5,
        maxCompetitors: 10,
        dailyCrawl: false,
        weeklyCrawl: true,
        advancedSettings: true,
        prioritySupport: false,
      },
    },
    enterprise: {
      isPro: true,
      isEnterprise: true,
      tier: "enterprise",
      features: {
        maxProjects: 50,
        maxKeywordGroups: 20,
        maxCompetitors: 30,
        dailyCrawl: true,
        weeklyCrawl: true,
        advancedSettings: true,
        prioritySupport: true,
      },
    },
  }
  
  return subscriptionTiers[tier.toLowerCase()] || subscriptionTiers.free
}

/**
 * Checks if the user has access to a specific feature based on their subscription
 * @param feature The feature to check access for
 * @returns Boolean indicating if the user has access
 */
export async function hasFeatureAccess(feature: 'weekly_crawl' | 'daily_crawl' | 'keyword_grouping' | 'competitor_analysis' | 'white_label'): Promise<boolean> {
  const subscription = await getUserSubscription()
  
  switch (feature) {
    case 'weekly_crawl':
      return subscription.isPro || subscription.isEnterprise
    case 'daily_crawl':
      return subscription.isEnterprise
    case 'keyword_grouping':
      return subscription.isPro || subscription.isEnterprise
    case 'competitor_analysis':
      return subscription.isPro || subscription.isEnterprise
    case 'white_label':
      return subscription.isPro || subscription.isEnterprise
    default:
      return false
  }
}

/**
 * Creates a PayPal order for the specified subscription plan
 */
export async function createPayPalSubscription(planId: string): Promise<{ orderID: string }> {
  try {
    const response = await fetch('/api/subscriptions/create-paypal-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create PayPal subscription');
    }

    return response.json();
  } catch (error) {
    console.error('Error creating PayPal subscription:', error);
    throw error;
  }
}

/**
 * Captures a PayPal order after user approval
 */
export async function capturePayPalOrder(orderID: string, planId: string): Promise<{ success: boolean }> {
  try {
    const response = await fetch('/api/subscriptions/capture-paypal-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderID, planId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to capture PayPal order');
    }

    return response.json();
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    throw error;
  }
}

/**
 * Updates user subscription and propagates changes to all projects via crawler service API
 */
export async function updateUserSubscription(userId: string, tier: SubscriptionTier): Promise<boolean> {
  try {
    // 1. Update subscription info in Supabase
    const supabase = createClient();
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        subscription_tier: tier,
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating profile subscription:", profileError);
      throw new Error("Failed to update subscription");
    }

    // 2. Call crawler service to update tier and propagate to all projects
    const crawlerServiceUrl = process.env.NEXT_PUBLIC_CRAWLER_SERVICE_URL;
    if (!crawlerServiceUrl) {
      console.error("Crawler service URL not defined in environment");
      return false;
    }

    const response = await fetch(`${crawlerServiceUrl}/api/project/update-tier`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, tier }),
    });

    if (!response.ok) {
      console.error("Error propagating tier to projects:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in updateUserSubscription:", error);
    return false;
  }
} 