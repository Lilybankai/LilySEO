import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface UserData {
  id: string;
  subscription_level?: string;
}

interface ProfileData {
  id: string;
  subscription_tier?: string;
}

interface SearchPackage {
  remaining_searches: number;
}

interface UsageLimitData {
  monthly_limit: number;
}

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the user from the server session
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Define a default number of searches
    const DEFAULT_SEARCHES = 100;
    let calculatedSearches = 0;

    try {
      // Fetch remaining searches through SQL query instead of RPC function
      // This works around the permission denied error
      const { data: searchPackages, error: packageError } = await supabase
        .from("user_search_packages")
        .select("remaining_searches")
        .eq("user_id", user.id);

      if (packageError) {
        console.error("Error fetching user_search_packages:", packageError);
        // Continue with default value
      } else {
        // Sum up remaining searches from all packages
        calculatedSearches = (searchPackages as SearchPackage[] || []).reduce((total, pkg) => 
          total + (pkg.remaining_searches || 0), 0);
      }
    } catch (queryError) {
      console.error("Failed to execute search packages query:", queryError);
      // Continue with default value
    }
    
    console.log(`User ${user.id} calculated remaining searches:`, calculatedSearches);
    
    // Check if user has enterprise tier
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("subscription_level")
      .eq("id", user.id)
      .single();
    
    if (userError) {
      console.error("Error fetching user subscription:", userError);
      // Fallback to profiles table
      const { data: profileData } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", user.id)
        .single();
        
      // For enterprise users, show a higher number
      const profileTier = profileData ? (profileData as ProfileData).subscription_tier : undefined;
      const isEnterprise = profileTier === 'enterprise';
      
      // Fetch monthly limit from usage_limits table
      const { data: limitData } = await supabase
        .from("usage_limits")
        .select("monthly_limit")
        .eq("plan_type", isEnterprise ? 'enterprise' : 'free')
        .eq("feature_name", "lead_finder_searches")
        .single();
        
      const monthlyLimit = limitData ? (limitData as UsageLimitData).monthly_limit : (isEnterprise ? 250 : 0);
      
      // Count searches used this month
      const { count: usedSearches } = await supabase
        .from("lead_searches")
        .select("id", { count: 'exact', head: false })
        .eq("user_id", user.id)
        .gte("created_at", new Date(new Date().setDate(1)).toISOString());
        
      const remainingMonthly = Math.max(0, monthlyLimit - (usedSearches || 0));
      const totalRemaining = remainingMonthly + calculatedSearches;
      
      return NextResponse.json({ 
        remaining_searches: totalRemaining,
        calculated_searches: calculatedSearches,
        subscription_tier: profileTier || 'free'
      });
    }
    
    // For enterprise users, show a higher number
    const userSubscription = userData ? (userData as UserData).subscription_level : undefined;
    const isEnterprise = userSubscription === 'enterprise';
    
    // Fetch monthly limit from usage_limits table
    const { data: limitData } = await supabase
      .from("usage_limits")
      .select("monthly_limit")
      .eq("plan_type", isEnterprise ? 'enterprise' : 'free')
      .eq("feature_name", "lead_finder_searches")
      .single();
      
    const monthlyLimit = limitData ? (limitData as UsageLimitData).monthly_limit : (isEnterprise ? 250 : 0);
    
    // Count searches used this month
    const { count: usedSearches } = await supabase
      .from("lead_searches")
      .select("id", { count: 'exact', head: false })
      .eq("user_id", user.id)
      .gte("created_at", new Date(new Date().setDate(1)).toISOString());
      
    const remainingMonthly = Math.max(0, monthlyLimit - (usedSearches || 0));
    const totalRemaining = remainingMonthly + calculatedSearches;
    
    return NextResponse.json({ 
      remaining_searches: totalRemaining,
      calculated_searches: calculatedSearches,
      subscription_tier: userSubscription || 'free'
    });

  } catch (error: any) {
    console.error("Error in remaining-searches API:", error);
    // Provide a fallback value instead of failing
    return NextResponse.json({ 
      remaining_searches: 50,
      error_details: error.message,
      note: "Using fallback value due to error"
    });
  }
} 