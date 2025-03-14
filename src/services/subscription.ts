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