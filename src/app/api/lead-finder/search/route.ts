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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
        console.error("[search] Error getting user:", userError);
        return NextResponse.json({ error: "Authentication error fetching user" }, { status: 500 });
    }
    
    if (!user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const initialRemainingData = await getRemainingSearchesDetails(user.id);
    
    // Check enterprise access (using profiles table primarily)
    const { data: profileData } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();
    
    const isEnterprise = profileData?.subscription_tier === 'enterprise';

    // BEGIN ACCESS CHECK (using profile data)
    if (!isEnterprise) {
       console.warn(`[search] User ${user.id} does not have enterprise access (tier: ${profileData?.subscription_tier}). Denying search.`);
      return NextResponse.json(
         { error: "Enterprise access required for Lead Finder" },
        { status: 403 }
      );
    }
    // END ACCESS CHECK

    // Get search parameters ...
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");
    const location = searchParams.get("location");
    const minRating = searchParams.get("minRating");
    const maxRating = searchParams.get("maxRating");
    const radius = searchParams.get("radius") || "10";
    const maxResults = parseInt(searchParams.get("maxResults") || "20", 10);
    const priceLevel = searchParams.get("priceLevel");
    const openNow = searchParams.get("openNow") === "true";
    const placeId = searchParams.get("placeId");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    // Validate parameters ...
    if (!query || !location) {
      return NextResponse.json(
        { error: "Missing required parameters: query and location" },
        { status: 400 }
      );
    }

    // Credit check already done above with initialRemainingData
    const initialTotalRemaining = initialRemainingData.totalRemaining;
    if (process.env.NODE_ENV !== 'development' && initialTotalRemaining <= 0) {
      return NextResponse.json(
        { 
          error: "No searches remaining", 
          message: "You have reached your monthly search limit or have no packages left."
        },
        { status: 402 }
      );
    }
    
    // Serper API Key Logic
    let apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
      apiKey = "9289df896676abed6287d6344ea67af7c792cac2"; // Use fallback if needed
      console.log("Using hardcoded fallback Serper API key");
    }
    console.log("Using Serper API key:", apiKey ? `${apiKey.substring(0, 5)}... (${apiKey.length} chars)` : "Key missing");

    // Serper API Call Setup
    const locationLower = location.toLowerCase();
    let countryCode = "us"; 
    if (locationLower.includes("uk") || locationLower.includes("united kingdom") || 
        locationLower.includes("england") || locationLower.includes("scotland") || 
        locationLower.includes("wales") || locationLower.includes("northern ireland")) {
      countryCode = "gb";
    } else if (locationLower.includes("usa") || locationLower.includes("united states") || 
               locationLower.includes("america") || locationLower.endsWith("us")) {
      countryCode = "us";
    } else if (locationLower.includes("spain")) {
      countryCode = "es";
    }
    
    const cleanLocation = location.replace(/@-?\d+\.\d+,-?\d+\.\d+/g, '').trim();
    let searchQuery = query;
    if (cleanLocation) {
      searchQuery += ` in ${cleanLocation}`;
    }

    const baseRequestPayload: any = {
      q: searchQuery,
      gl: countryCode,
      num: 10, 
      type: "places"
    };
    if (lat && lng) { baseRequestPayload.ll = `${lat},${lng}`; }
    if (radius) {
      const radiusMeters = parseInt(radius, 10) * 1000;
       baseRequestPayload.radius = Math.min(radiusMeters, 50000);
    }
    
    const batchCount = Math.ceil(maxResults / 10);
    const apiCalls = Math.min(batchCount, 5);
    console.log(`Making ${apiCalls} Serper API requests to fetch up to ${apiCalls * 10} results`);

    const allResults: any[] = [];
    let locationWarning: string | null = null;
    for (let i = 0; i < apiCalls; i++) {
      // Only add pagination parameters after first request
      const requestPayload = { ...baseRequestPayload };
      if (i > 0) {
        // Serper uses 'start' parameter for pagination, convert to string
        requestPayload.start = (i * 10).toString();
      }
      
      console.log(`[search - LOOP] Request ${i+1}/${apiCalls} with payload:`, JSON.stringify({
        ...requestPayload,
        apiKey: "[REDACTED]"
      }, null, 2));

      try {
        // Make request to Serper API
        const response = await axios.post(SERPER_API_URL, requestPayload, {
          headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        });
        
        console.log(`[search - LOOP] Request ${i+1} status:`, response.status);
        
        if (!response.data) {
          console.error(`[search - LOOP] Request ${i+1} returned empty response data`);
          continue;
        }
        
        // Extract places from response
        let batchResults: any[] = [];
        
        // Check places field
        if (response.data.places && Array.isArray(response.data.places)) {
          console.log(`[search - LOOP] Found ${response.data.places.length} places in places field for request ${i+1}`);
          batchResults = response.data.places;
        }
        // Check local field
        else if (response.data.local && response.data.local.results) {
          console.log(`[search - LOOP] Found ${response.data.local.results.length} places in local.results field for request ${i+1}`);
          batchResults = response.data.local.results;
        }
        // Check localResults field
        else if (response.data.localResults) {
          console.log(`[search - LOOP] Found ${response.data.localResults.length} places in localResults field for request ${i+1}`);
          batchResults = response.data.localResults;
        }
        
        if (batchResults.length === 0) {
          console.warn(`[search - LOOP] No places found in response data for request ${i+1}`);
          // If first request returns no results, we can stop
          if (i === 0) break;
          // If a subsequent request returns no results, we've reached the end
          break;
        }
        
        // Check if we need to capture location warning (Only relevant for first request)
        if (i === 0 && response.data.searchMetadata && response.data.searchMetadata.locationInfo) {
          const locationInfo = response.data.searchMetadata.locationInfo;
          if (locationInfo.detectedLocation && !locationInfo.using_map_coordinates && locationInfo.detectedLocation !== cleanLocation) {
            locationWarning = `Results may be from ${locationInfo.detectedLocation.toUpperCase()} instead of the specified location. Try adding the country name to your search.`;
             console.warn("[search - LOOP] Location mismatch warning triggered.");
          }
        }
        
        // Add these results to our collection
        allResults.push(...batchResults);
        
        // If we have enough results, we can stop making more requests
        if (allResults.length >= maxResults) {
           console.log(`[search - LOOP] Reached maxResults (${maxResults}), stopping API calls.`);
           break;
        }
        
        // Add a small delay between requests to avoid rate limiting
        if (i < apiCalls - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (apiError: any) {
        console.error(`[search - LOOP] Error in request ${i+1}:`, apiError.message);
        // If first request fails, propagate the error
        if (i === 0) {
          return NextResponse.json(
            { 
              error: "Search API error during first request", 
              message: apiError.message,
              details: apiError.response ? apiError.response.data : null
            },
            { status: 500 }
          );
        }
        // If subsequent requests fail, we'll just use what we have so far
        console.warn(`[search - LOOP] Subsequent API request failed. Continuing with ${allResults.length} results collected so far.`);
        break;
      }
    }
    
    // Check results AFTER the loop
    if (allResults.length === 0) {
       console.warn("[search] No results found across all API calls");
       // Return 200 OK but with empty results and the warning
       return NextResponse.json({ 
         results: [], 
         remaining_searches: initialTotalRemaining, // No decrement if no results
         location_warning: locationWarning || "No results found for your search. Try adjusting your search criteria."
        });
     }
    console.log(`[search] Serper API returned ${allResults.length} places total across API calls`);
    
    // Deduplicate results by place_id
    const seenPlaceIds = new Set<string>();
    const uniqueResults = allResults.filter(result => {
      if (!result.place_id) return true; 
      if (seenPlaceIds.has(result.place_id)) return false;
      seenPlaceIds.add(result.place_id);
      return true;
    });
    console.log(`[search] After deduplication: ${uniqueResults.length} unique places`);
    
    // Process and normalize results
    let results = uniqueResults.map((result: any) => {
      // Create a standardized result object
      const standardizedResult: any = {
        title: result.title || result.name,
        address: result.address || result.formattedAddress || result.snippet,
        phone: result.phoneNumber || result.phone,
        website: result.website || result.link,
        rating: result.rating || (result.ratingValue ? parseFloat(result.ratingValue) : null),
        reviews_count: result.reviewsCount || result.user_ratings_total || result.ratingCount,
        place_id: result.placeId || result.place_id || result.id,
        type: result.categories || result.types || [],
        thumbnail: result.thumbnailUrl || result.thumbnail || result.imageUrl || (result.thumbnails && result.thumbnails[0]),
      };
      
      // Extract price level
      if (result.priceLevel) {
        standardizedResult.price_level = result.priceLevel.toString();
      } else if (result.price && typeof result.price === 'string') {
        standardizedResult.price_level = result.price.length.toString();
      }
      
      // Extract GPS coordinates
      if (result.latitude && result.longitude) {
        standardizedResult.latitude = result.latitude;
        standardizedResult.longitude = result.longitude;
      } else if (result.coordinates) {
        standardizedResult.latitude = result.coordinates.latitude || result.coordinates.lat;
        standardizedResult.longitude = result.coordinates.longitude || result.coordinates.lng;
      } else if (result.gps_coordinates) {
        standardizedResult.latitude = result.gps_coordinates.latitude;
        standardizedResult.longitude = result.gps_coordinates.longitude;
      }
      
      // Process hours information
      if (result.workingHours || result.hours || result.openingHours) {
        const hours = result.workingHours || result.hours || result.openingHours;
        if (typeof hours === 'string') {
          standardizedResult.hours = hours.replace(/<[^>]*>/g, '');
        } else if (Array.isArray(hours)) {
          standardizedResult.hours = hours.join(', ');
        } else if (typeof hours === 'object') {
          standardizedResult.hours_data = hours;
           try { standardizedResult.hours = JSON.stringify(hours); } 
           catch (e) { standardizedResult.hours = 'Hours information available'; }
         }
       }
       
       // Add a data_qualified_count field
      let qualityScore = 0;
      if (standardizedResult.latitude && standardizedResult.longitude) qualityScore += 2;
      if (standardizedResult.website) qualityScore += 1;
      if (standardizedResult.phone) qualityScore += 1;
      if (standardizedResult.hours) qualityScore += 1;
      standardizedResult.data_quality = qualityScore;
      
      return standardizedResult;
    });

    // Filter by rating if specified
    if (minRating) {
      const min = parseFloat(minRating);
      results = results.filter((result: any) => 
        result.rating && parseFloat(result.rating) >= min
      );
    }
    if (maxRating) {
      const max = parseFloat(maxRating);
      results = results.filter((result: any) => 
        result.rating && parseFloat(result.rating) <= max
      );
    }
    // Filter by price level if specified
    if (priceLevel && priceLevel !== "any") {
      const level = parseInt(priceLevel, 10);
      results = results.filter((result: any) => 
        result.price_level && parseInt(result.price_level, 10) === level
      );
    }

    // Log count of results with coordinates
    const resultsWithCoordinates = results.filter((r: any) => r.latitude && r.longitude).length;
     console.log(`[search] After filtering: ${results.length} results, ${resultsWithCoordinates} with coordinates`);

     // Check location warning again after filtering (if still relevant)
    if (results.length > 0 && countryCode) {
      const expectedCountry = countryCode === "gb" ? "united kingdom" : 
                             countryCode === "us" ? "united states" : "";
      if (expectedCountry) {
        const countryMatches = results.filter((result: any) => 
          result.address && 
          (result.address.toLowerCase().includes(expectedCountry) || 
           result.address.toLowerCase().includes(countryCode))
        ).length;
        if (countryMatches / results.length < 0.2) {
          locationWarning = `Results may not be from ${expectedCountry.toUpperCase()}. Try adding the country name to your search.`;
           console.warn("[search] Location mismatch warning triggered after filtering.");
        }
      }
    }

    // Limit results to the requested number (maxResults)
     const requestedMax = parseInt(searchParams.get("maxResults") || "20", 10); // Recalculate here just in case
     console.log(`[search] Limiting final results to ${requestedMax} (from ${results.length} filtered)`);
     results = results.slice(0, Math.min(requestedMax, 100)); // Keep MAX_SAFE_RESULTS at 100
     
     // Apply final safety checks
    results = results.map((result: any) => {
       if (result.type && Array.isArray(result.type) && result.type.length > 20) result.types = result.types.slice(0, 20);
       else if (result.type && !Array.isArray(result.type)) result.type = [result.type];
       else if (!result.type) result.type = [];
       // ... other safety checks ...
       Object.keys(result).forEach(key => { if (result[key] === undefined) delete result[key]; });
      return result;
    });

    // BEGIN REVISED DATABASE UPDATE
    let finalRemainingAfterSearch = initialTotalRemaining; 
    let creditDecremented = false;
    if (user) {
      try {
        // Restore original decrement logic
        if (initialRemainingData.packageRemaining > 0 && initialRemainingData.packageIdToDecrement) {
          const packageIdToDecrement = initialRemainingData.packageIdToDecrement; // Use consistent name
          
          console.log(`[search] Attempting to decrement package ${packageIdToDecrement} from ${initialRemainingData.packageCurrentValue} to ${initialRemainingData.packageCurrentValue - 1}`);
          
          // Perform the actual decrement update
          const { error: updateError } = await supabase
            .from("user_search_packages")
            .update({ 
              remaining_searches: initialRemainingData.packageCurrentValue - 1, // Correct decrement
              updated_at: new Date().toISOString() 
            })
            .eq("id", packageIdToDecrement);

          // Log the response
          console.log(`[search] Supabase update response: error=${JSON.stringify(updateError)}`);

          if (updateError) {
            console.error(`[search] Error decrementing package ${packageIdToDecrement}:`, updateError);
          } else {
            console.log(`[search] Successfully initiated decrement for package ${packageIdToDecrement}. Old: ${initialRemainingData.packageCurrentValue}, New: ${initialRemainingData.packageCurrentValue - 1}.`);
            finalRemainingAfterSearch = initialTotalRemaining - 1;
            creditDecremented = true;
          }
        } else if (initialRemainingData.remainingMonthly > 0) {
           // Decrement from monthly logic remains the same
           console.log(`[search] No package found or package error. Using monthly allowance.`);
           finalRemainingAfterSearch = initialTotalRemaining - 1; 
           creditDecremented = true;
        } else {
           // No credits left logic remains the same
           console.warn(`[search] User ${user.id} performed search, but no credit could be decremented. Total was ${initialTotalRemaining}.`);
           // finalRemainingAfterSearch remains initialTotalRemaining
           // creditDecremented remains false
        }

        // Record the search AFTER attempting decrement
        try {
             await supabase.from("lead_searches").insert({
               user_id: user.id,
               search_query: query,
               location: location,
               results_count: results.length,
               created_at: new Date().toISOString()
             });
             console.log(`[search] Recorded search successfully for user ${user.id}.`);
        } catch (recordError) {
             console.error("[search] Error recording search entry:", recordError);
        }

      } catch (dbError) {
        console.error("[search] Error during database operations (decrement/record):", dbError);
         finalRemainingAfterSearch = initialTotalRemaining; // Revert count on error
      }
    }
    // END REVISED DATABASE UPDATE
    return NextResponse.json({ results, remaining_searches: finalRemainingAfterSearch, location_warning: locationWarning });
    
  } catch (error: any) {
    console.error("Error in lead finder search (outer try-catch):", error);
    return NextResponse.json(
      { error: error.message || "Failed to search" },
      { status: 500 }
    );
  }
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