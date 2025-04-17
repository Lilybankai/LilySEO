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

// Helper function to get necessary details for limit checking
async function getSearchCreditDetails(userId: string): Promise<{
  monthlyAllowanceRemaining: number;
  totalPackageRemaining: number;
  tier: string;
}> {
  const supabase = await createClient();
  let monthlyAllowanceRemaining = 0;
  let totalPackageRemaining = 0;
  let tier = 'free';

  try {
    // 1. Get Tier and Monthly Allowance Remaining from profiles
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("subscription_tier, monthly_lead_allowance_remaining")
      .eq("id", userId)
      .single();

    if (profileError && !profileError.message.includes('No rows found')) {
      console.error("[API][getRemaining] Error fetching profile:", profileError);
    } else if (profileData) {
      tier = profileData.subscription_tier ?? 'free';
      monthlyAllowanceRemaining = profileData.monthly_lead_allowance_remaining || 0;
    }
    console.log(`[API][getRemaining] Tier: ${tier}, Monthly allowance: ${monthlyAllowanceRemaining}`);

    // 2. Get Total Remaining from ALL Purchased Packages
    const { data: allPackages, error: allPackagesError } = await supabase
      .from("user_search_packages")
      .select("remaining_searches")
      .eq("user_id", userId)
      .gt("remaining_searches", 0);

    if (allPackagesError) {
      console.error("[API][getRemaining] Error fetching package totals:", allPackagesError);
    } else {
      totalPackageRemaining = (allPackages || []).reduce((total, pkg) => {
        const remaining = typeof pkg.remaining_searches === 'string'
          ? parseInt(pkg.remaining_searches, 10)
          : (pkg.remaining_searches || 0);
        return total + remaining;
      }, 0);
      console.log(`[API][getRemaining] Total remaining from packages: ${totalPackageRemaining}`);
    }

    return {
      monthlyAllowanceRemaining,
      totalPackageRemaining,
      tier,
    };

  } catch (error) {
    console.error("[API][getRemaining] Critical error:", error);
    return { monthlyAllowanceRemaining: 0, totalPackageRemaining: 0, tier: 'free' };
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

    const searchDetails = await getSearchCreditDetails(user.id);

    // Calculate total remaining searches
    const totalRemaining = searchDetails.monthlyAllowanceRemaining + searchDetails.totalPackageRemaining;

    // Construct the response object
    const responseBody = {
      remaining_searches: totalRemaining,
      monthly_allowance_remaining: searchDetails.monthlyAllowanceRemaining,
      purchased_remaining: searchDetails.totalPackageRemaining,
      subscription_tier: searchDetails.tier
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
export { getSearchCreditDetails }; 