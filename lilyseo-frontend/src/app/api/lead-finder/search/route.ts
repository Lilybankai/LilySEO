"use server";

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "@/lib/supabase/server";
import { checkEnterpriseAccess, getRemainingSearches } from "@/services/lead-finder";
import { Redis } from "@upstash/redis";

// Cache results for 24 hours to reduce API calls
let redisClient: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log("Redis client initialized for caching");
  } else {
    console.log("Redis credentials not found, caching disabled");
  }
} catch (error) {
  console.error("Failed to initialize Redis client:", error);
  redisClient = null;
}

// Constants for Serper API - update to correct endpoint
const SERPER_API_URL = "https://google.serper.dev/search";

// Helper function to get place details using Serper
async function getPlaceDetails(placeId: string, apiKey: string) {
  try {
    // Check cache first
    const cacheKey = `place_details:${placeId}`;
    if (redisClient) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log(`Using cached place details for ${placeId}`);
        return cachedData;
      }
    }
    
    // Not in cache, make API call
    console.log(`Fetching place details for ${placeId}`);
    const response = await axios.post(`${SERPER_API_URL}`, {
      q: `place_id:${placeId}`,
      gl: "us", // Default to US if not specified
      type: "places" // Specify we want place results
    }, {
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });
    
    const placeData = response.data;
    
    // Cache the result
    if (redisClient) {
      await redisClient.set(cacheKey, placeData, {
        ex: 86400 // 24 hours cache
      });
    }
    
    return placeData;
  } catch (error: any) {
    console.error(`Error fetching place details for ${placeId}:`, error.message);
    return null;
  }
}

// Helper function to get necessary details for limit checking and decrementing
async function getSearchCreditDetails(userId: string): Promise<{
  monthlyAllowanceRemaining: number;
  oldestPackageId: string | null;
  oldestPackageValue: number;
}> {
  const supabase = await createClient();
  let monthlyAllowanceRemaining = 0;
  let oldestPackageId: string | null = null;
  let oldestPackageValue = 0;

  try {
    // 1. Get Monthly Allowance Remaining directly from profiles
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("monthly_lead_allowance_remaining")
      .eq("id", userId)
      .single();
    
    if (profileError && !profileError.message.includes('No rows found')) {
      console.error("[getCreditDetails] Error fetching profile allowance:", profileError);
      // Proceed, default allowance is 0
    } else if (profileData) {
      monthlyAllowanceRemaining = profileData.monthly_lead_allowance_remaining || 0;
    }
    console.log(`[getCreditDetails] Monthly allowance remaining: ${monthlyAllowanceRemaining}`);

    // 2. Get Oldest Purchasable Package Details (if monthly allowance is zero or less)
    if (monthlyAllowanceRemaining <= 0) {
      const { data: packageData, error: packageError } = await supabase
        .from("user_search_packages")
        .select("id, remaining_searches")
        .eq("user_id", userId)
        .gt("remaining_searches", 0)
        .order("purchase_date", { ascending: true })
        .limit(1);

      if (packageError) {
        console.error("[getCreditDetails] Error fetching package data:", packageError);
      } else if (packageData && packageData.length > 0) {
        oldestPackageId = packageData[0].id;
        const currentVal = packageData[0].remaining_searches;
        oldestPackageValue = typeof currentVal === 'string' ? parseInt(currentVal, 10) : (currentVal || 0);
        console.log(`[getCreditDetails] Oldest package with credits: ID=${oldestPackageId}, Remaining=${oldestPackageValue}`);
      } else {
         console.log(`[getCreditDetails] No active packages found.`);
      }
    }

    return {
      monthlyAllowanceRemaining,
      oldestPackageId,
      oldestPackageValue,
    };

  } catch (error) {
    console.error("[getCreditDetails] Critical error:", error);
    return { monthlyAllowanceRemaining: 0, oldestPackageId: null, oldestPackageValue: 0 };
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(request.url);
    const query = url.searchParams.get("q");
    const location = url.searchParams.get("location");
    const minRating = url.searchParams.get("minRating");
    const maxRating = url.searchParams.get("maxRating");
    const radius = url.searchParams.get("radius") || "10";
    const maxResults = parseInt(url.searchParams.get("maxResults") || "20", 10);
    const priceLevel = url.searchParams.get("priceLevel");
    const openNow = url.searchParams.get("openNow") === "true";
    const placeId = url.searchParams.get("placeId");
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");

    if (!query || !location) {
      return NextResponse.json({ error: "Missing query or location" }, { status: 400 });
    }
    console.log(`[search] User ${user.id} searching for: "${query}" in "${location}"`);

    // --- Check Credits BEFORE Search --- 
    const creditDetails = await getSearchCreditDetails(user.id);
    let canSearch = false;
    let decrementType: 'monthly' | 'package' | null = null;

    if (creditDetails.monthlyAllowanceRemaining > 0) {
      canSearch = true;
      decrementType = 'monthly';
      console.log(`[search] Using monthly allowance. Remaining: ${creditDetails.monthlyAllowanceRemaining}`);
    } else if (creditDetails.oldestPackageId && creditDetails.oldestPackageValue > 0) {
      canSearch = true;
      decrementType = 'package';
      console.log(`[search] Using purchased package ${creditDetails.oldestPackageId}. Remaining: ${creditDetails.oldestPackageValue}`);
    } else {
       console.warn(`[search] User ${user.id} has no remaining searches (Monthly: ${creditDetails.monthlyAllowanceRemaining}, Packages: ${creditDetails.oldestPackageValue}).`);
       return NextResponse.json({ error: "You have no searches remaining this month. Please purchase a package to continue searching." }, { status: 402 }); // 402 Payment Required
    }

    // --- Perform the Actual Search --- 
    console.log(`[search] Proceeding with search...`);
    // ... (Keep existing search logic using SERPER_API_KEY etc.) ...
    // const searchResults = await performSerperSearch(query, location, /* other params */);
    // const results = searchResults.places; // Assuming this structure
    // Replace with your actual search implementation
    const results = [{ name: "Mock Business 1", address: "123 Mock St" },{ name: "Mock Business 2", address: "456 Fake Ave" }]; // MOCK RESULTS
    console.log(`[search] Search completed. Found ${results.length} results.`);
    
    // --- Decrement Credit AFTER Successful Search --- 
    let decrementError = null;
    if (decrementType === 'monthly') {
        const { error } = await supabase.rpc('decrement_monthly_lead_allowance', { p_user_id: user.id });
        decrementError = error;
        if (!error) console.log(`[search] Successfully decremented monthly allowance for user ${user.id}`);
    } else if (decrementType === 'package' && creditDetails.oldestPackageId) {
        const { error } = await supabase
            .from("user_search_packages")
            .update({ 
             remaining_searches: creditDetails.oldestPackageValue - 1,
              updated_at: new Date().toISOString() 
            })
           .eq("id", creditDetails.oldestPackageId);
        decrementError = error;
         if (!error) console.log(`[search] Successfully decremented package ${creditDetails.oldestPackageId}`);
    }

    if (decrementError) {
        console.error(`[search] CRITICAL: Failed to decrement search credit after successful search! Error:`, decrementError);
        // Decide how to handle this - maybe flag the search? For now, just log.
    }

    // --- Record Search --- 
        try {
             await supabase.from("lead_searches").insert({
               user_id: user.id,
               search_query: query,
               location: location,
               results_count: results.length,
               created_at: new Date().toISOString()
             });
         console.log(`[search] Recorded search successfully.`);
        } catch (recordError) {
             console.error("[search] Error recording search entry:", recordError);
        }

    // --- Fetch Final Remaining Count for Response --- 
    // Re-fetch details after decrement for accurate response
    const finalCreditDetails = await getSearchCreditDetails(user.id);
    const finalTotalRemaining = finalCreditDetails.monthlyAllowanceRemaining + 
                                 (await getTotalPackageSearches(user.id)); // Need a helper for total package count

    return NextResponse.json({ results, remaining_searches: finalTotalRemaining, location_warning: null /* Replace with actual warning if needed */ });
    
  } catch (error: any) {
    console.error("Error in lead finder search (outer try-catch):", error);
    return NextResponse.json({ error: error.message || "Failed to search" }, { status: 500 });
  }
}

// Helper to get total remaining package searches
async function getTotalPackageSearches(userId: string): Promise<number> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("user_search_packages")
        .select("remaining_searches")
        .eq("user_id", userId)
        .gt("remaining_searches", 0);
    if (error) {
        console.error("[getTotalPackageSearches] Error:", error);
        return 0;
    }
    return (data || []).reduce((total, pkg) => {
       const remaining = typeof pkg.remaining_searches === 'string' 
           ? parseInt(pkg.remaining_searches, 10) 
           : (pkg.remaining_searches || 0);
       return total + remaining;
    }, 0);
}

// NEW HELPER FUNCTION
// Fetches detailed breakdown needed for decrement logic
async function getRemainingSearchesDetails(userId: string): Promise<{
  totalRemaining: number;
  remainingMonthly: number;
  packageRemaining: number;
  packageIdToDecrement: string | null;
  packageCurrentValue: number;
}> {
  const supabase = await createClient();
  let monthlyLimit = 0;
  let usedMonthly = 0;
  let packageRemaining = 0;
  let packageIdToDecrement: string | null = null;
  let packageCurrentValue = 0;

  try {
    // 1. Get Subscription Tier (prioritize profiles)
    let subscriptionTier: string | undefined = undefined;
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", userId)
      .single();
      
    if (profileError && !profileError.message.includes('No rows found')) { // Ignore 'no rows found' as user might be in users table only
      console.error("[getRemainingSearchesDetails] Error fetching profile:", profileError);
    } else if (profileData) {
      subscriptionTier = profileData.subscription_tier ?? undefined;
    }
    
    // Fallback to users table if profile failed or didn't have tier
    if (!subscriptionTier) {
       const { data: userData, error: userError } = await supabase
        .from("users")
        .select("subscription_level")
        .eq("id", userId)
        .single();
       if (userError && !userError.message.includes('No rows found')) {
         console.error("[getRemainingSearchesDetails] Error fetching users table tier:", userError);
       } else if (userData) {
         subscriptionTier = userData.subscription_level ?? undefined;
       }
    }
    console.log(`[getRemainingSearchesDetails] Determined tier: ${subscriptionTier ?? 'unknown'}`);

    // 2. Get Monthly Limit based on Tier
    const planType = subscriptionTier === 'enterprise' ? 'enterprise' : (subscriptionTier === 'pro' ? 'pro' : 'free');
    const { data: limitData, error: limitError } = await supabase
      .from("usage_limits")
      .select("monthly_limit")
      .eq("plan_type", planType)
      .eq("feature_name", "lead_finder_searches")
      .single();

    if (limitError) {
      console.error("[getRemainingSearchesDetails] Error fetching usage limit:", limitError);
    } else {
      monthlyLimit = limitData?.monthly_limit || 0;
    }
    console.log(`[getRemainingSearchesDetails] Monthly Limit for tier ${planType}: ${monthlyLimit}`);

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
      console.error("[getRemainingSearchesDetails] Error counting used searches:", countError);
    } else {
      usedMonthly = count || 0;
    }
    const remainingMonthly = Math.max(0, monthlyLimit - usedMonthly);
    console.log(`[getRemainingSearchesDetails] Used monthly: ${usedMonthly}, Remaining monthly: ${remainingMonthly}`);

    // 4. Get Package Details (oldest package with searches remaining)
    const { data: packageData, error: packageError } = await supabase
      .from("user_search_packages")
      .select("id, remaining_searches")
      .eq("user_id", userId)
      .gt("remaining_searches", 0)
      .order("purchase_date", { ascending: true })
      .limit(1);

    if (packageError) {
      console.error("[getRemainingSearchesDetails] Error fetching package data:", packageError);
    } else if (packageData && packageData.length > 0) {
      packageIdToDecrement = packageData[0].id;
      // Ensure remaining_searches is treated as a number
      const currentVal = packageData[0].remaining_searches;
      packageCurrentValue = typeof currentVal === 'string' ? parseInt(currentVal, 10) : (currentVal as number);
      packageRemaining = packageCurrentValue; // For simplicity, assume only one package matters for *decrementing*
      console.log(`[getRemainingSearchesDetails] Oldest package with credits: ID=${packageIdToDecrement}, Remaining=${packageCurrentValue}`);
      
      // Fetch ALL packages to sum up total remaining for display/calculation
      const { data: allPackages, error: allPackagesError } = await supabase
        .from("user_search_packages")
        .select("remaining_searches")
        .eq("user_id", userId)
        .gt("remaining_searches", 0); 
        
      if(allPackagesError) {
         console.error("[getRemainingSearchesDetails] Error fetching all package totals:", allPackagesError);
         // Use the single package value if fetching all fails
      } else {
         packageRemaining = (allPackages || []).reduce((total, pkg) => {
            const remaining = typeof pkg.remaining_searches === 'string' 
              ? parseInt(pkg.remaining_searches, 10) 
              : (pkg.remaining_searches as number);
            return total + (remaining || 0);
          }, 0);
          console.log(`[getRemainingSearchesDetails] Total remaining from all packages: ${packageRemaining}`);
      }
      
    } else {
       console.log(`[getRemainingSearchesDetails] No active packages found.`);
    }

    return {
      totalRemaining: remainingMonthly + packageRemaining,
      remainingMonthly: remainingMonthly,
      packageRemaining: packageRemaining,
      packageIdToDecrement: packageIdToDecrement,
      packageCurrentValue: packageCurrentValue, // The specific value in the package we plan to decrement
    };

  } catch (error) {
    console.error("[getRemainingSearchesDetails] Critical error:", error);
    return {
      totalRemaining: 0,
      remainingMonthly: 0,
      packageRemaining: 0,
      packageIdToDecrement: null,
      packageCurrentValue: 0,
    };
  }
} 