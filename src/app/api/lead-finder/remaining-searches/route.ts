import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

// Fetches detailed breakdown needed for decrement logic
async function getRemainingSearchesDetails(userId: string): Promise<{
  totalRemaining: number;
  remainingMonthly: number;
  packageRemaining: number;
  packageIdToDecrement: string | null;
  packageCurrentValue: number;
  tier: string;
}> {
  const supabase = await createClient();
  let monthlyLimit = 0;
  let usedMonthly = 0;
  let packageRemaining = 0;
  let packageIdToDecrement: string | null = null;
  let packageCurrentValue = 0;
  let tier = 'free';

  try {
    // 1. Get Subscription Tier (prioritize profiles)
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", userId)
      .single();
      
    if (profileError && !profileError.message.includes('No rows found')) {
      console.error("[API][getDetails] Error fetching profile:", profileError);
    } else if (profileData) {
      tier = profileData.subscription_tier ?? 'free';
    }
    
    if (tier === 'free') {
       const { data: userData, error: userError } = await supabase
        .from("users")
        .select("subscription_level")
        .eq("id", userId)
        .single();
       if (userError && !userError.message.includes('No rows found')) {
         console.error("[API][getDetails] Error fetching users table tier:", userError);
       } else if (userData) {
         tier = userData.subscription_level ?? 'free';
       }
    }
    console.log(`[API][getDetails] Determined tier: ${tier}`);

    // 2. Get Monthly Limit based on Tier
    const planType = tier === 'enterprise' ? 'enterprise' : (tier === 'pro' ? 'pro' : 'free');
    const { data: limitData, error: limitError } = await supabase
      .from("usage_limits")
      .select("monthly_limit")
      .eq("plan_type", planType)
      .eq("feature_name", "lead_finder_searches")
      .single();

    if (limitError) {
      console.error("[API][getDetails] Error fetching usage limit:", limitError);
    } else {
      monthlyLimit = limitData?.monthly_limit || 0;
    }
    console.log(`[API][getDetails] Monthly Limit for tier ${planType}: ${monthlyLimit}`);

    // 3. Count Used Monthly Searches
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    const { count, error: countError } = await supabase
      .from("lead_searches")
      .select("id", { count: "exact", head: false })
      .eq("user_id", userId)
      .gte("created_at", firstDayOfMonth.toISOString());

    if (countError) {
      console.error("[API][getDetails] Error counting used searches:", countError);
    } else {
      usedMonthly = count || 0;
    }
    const remainingMonthly = Math.max(0, monthlyLimit - usedMonthly);
    console.log(`[API][getDetails] Used monthly: ${usedMonthly}, Remaining monthly: ${remainingMonthly}`);

    // 4. Get Package Details
    const { data: packageData, error: packageError } = await supabase
      .from("user_search_packages")
      .select("id, remaining_searches")
      .eq("user_id", userId)
      .gt("remaining_searches", 0)
      .order("purchase_date", { ascending: true })
      .limit(1);

    if (packageError) {
      console.error("[API][getDetails] Error fetching package data:", packageError);
    } else if (packageData && packageData.length > 0) {
      packageIdToDecrement = packageData[0].id;
      const currentVal = packageData[0].remaining_searches;
      packageCurrentValue = typeof currentVal === 'string' ? parseInt(currentVal, 10) : (currentVal as number);
       
      const { data: allPackages, error: allPackagesError } = await supabase
        .from("user_search_packages")
        .select("remaining_searches")
        .eq("user_id", userId)
        .gt("remaining_searches", 0); 
        
      if(allPackagesError) {
         console.error("[API][getDetails] Error fetching all package totals:", allPackagesError);
         packageRemaining = packageCurrentValue; 
      } else {
         packageRemaining = (allPackages || []).reduce((total, pkg) => {
            const remaining = typeof pkg.remaining_searches === 'string' 
              ? parseInt(pkg.remaining_searches, 10) 
              : (pkg.remaining_searches as number);
            return total + (remaining || 0);
          }, 0);
      }
       console.log(`[API][getDetails] Total remaining from packages: ${packageRemaining}`);
    } else {
       console.log(`[API][getDetails] No active packages found.`);
    }

    return {
      totalRemaining: remainingMonthly + packageRemaining,
      remainingMonthly: remainingMonthly,
      packageRemaining: packageRemaining,
      packageIdToDecrement: packageIdToDecrement,
      packageCurrentValue: packageCurrentValue,
      tier: tier,
    };

  } catch (error) {
    console.error("[API][getDetails] Critical error:", error);
    return { totalRemaining: 0, remainingMonthly: 0, packageRemaining: 0, packageIdToDecrement: null, packageCurrentValue: 0, tier: 'free' };
  }
}

export async function GET(request: NextRequest) {
  // Add cache-busting headers
  const headers = new Headers();
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse(JSON.stringify({ error: "User not authenticated" }), { status: 401, headers });
    }

    const searchDetails = await getRemainingSearchesDetails(user.id);

    // Construct the response object
    const responseBody = {
      remaining_searches: searchDetails.totalRemaining,
      calculated_searches: searchDetails.packageRemaining, // Representing package credits
      monthly_remaining: searchDetails.remainingMonthly,
      subscription_tier: searchDetails.tier // Include the tier
    };
    
    return new NextResponse(JSON.stringify(responseBody), {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("[remaining-searches API] Error:", error);
    return new NextResponse(JSON.stringify({ error: error.message || "Failed to fetch remaining searches" }), {
      status: 500,
      headers,
    });
  }
}

// Re-export the helper function or keep it in a shared lib
export { getRemainingSearchesDetails }; 