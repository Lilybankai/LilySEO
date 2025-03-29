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
    // Check if user has enterprise access
    const hasAccess = await checkEnterpriseAccess();
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Enterprise access required" },
        { status: 403 }
      );
    }

    // Get search parameters from request
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");
    const location = searchParams.get("location");
    const minRating = searchParams.get("minRating");
    const maxRating = searchParams.get("maxRating");
    const radius = searchParams.get("radius") || "10"; // Default to 10km
    const maxResults = parseInt(searchParams.get("maxResults") || "20", 10);
    const priceLevel = searchParams.get("priceLevel");
    const openNow = searchParams.get("openNow") === "true";
    
    // Get explicit location parameters
    const placeId = searchParams.get("placeId");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    // Validate parameters
    if (!query || !location) {
      return NextResponse.json(
        { error: "Missing required parameters: query and location" },
        { status: 400 }
      );
    }

    // Check if user has remaining searches
    const remainingSearches = await getRemainingSearches();
    console.log("Remaining searches according to our system:", remainingSearches);
    
    // Only check remaining searches if not in development mode
    if (process.env.NODE_ENV !== 'development' && remainingSearches <= 0) {
      return NextResponse.json(
        { 
          error: "No searches remaining", 
          message: "You have reached your monthly search limit. Please purchase more searches."
        },
        { status: 402 }
      );
    }
    
    // Always allow searches to proceed since we know we have Serper credits
    
    // Load Serper API key from environment variables
    let apiKey = process.env.SERPER_API_KEY;
    
    // For development, use the provided key if env variable isn't set
    if (!apiKey) {
      apiKey = "9289df896676abed6287d6344ea67af7c792cac2";
      console.log("Using hardcoded fallback Serper API key");
    }
    
    // Log the API key debug info (first few chars only for security)
    console.log("Using Serper API key:", apiKey ? `${apiKey.substring(0, 5)}... (${apiKey.length} chars)` : "Key missing");

    // Extract country code from location if possible
    const locationLower = location.toLowerCase();
    let countryCode = "us"; // Default to US
    
    // Check for common country indicators in the location string
    if (locationLower.includes("uk") || locationLower.includes("united kingdom") || 
        locationLower.includes("england") || locationLower.includes("scotland") || 
        locationLower.includes("wales") || locationLower.includes("northern ireland")) {
      countryCode = "gb";
    } else if (locationLower.includes("usa") || locationLower.includes("united states") || 
               locationLower.includes("america") || locationLower.endsWith("us")) {
      countryCode = "us";
    } else if (locationLower.includes("canada")) {
      countryCode = "ca";
    } else if (locationLower.includes("australia")) {
      countryCode = "au";
    } else if (locationLower.includes("france")) {
      countryCode = "fr";
    } else if (locationLower.includes("germany")) {
      countryCode = "de";
    } else if (locationLower.includes("japan")) {
      countryCode = "jp";
    } else if (locationLower.includes("italy")) {
      countryCode = "it";
    } else if (locationLower.includes("spain")) {
      countryCode = "es";
    }
    
    // Clean location for search query
    const cleanLocation = location.replace(/@-?\d+\.\d+,-?\d+\.\d+/g, '').trim();
    
    // Build search query combining business type and location
    let searchQuery = query;
    if (cleanLocation) {
      searchQuery += ` in ${cleanLocation}`;
    }

    // Create base request payload for Serper API
    const baseRequestPayload: any = {
      q: searchQuery,
      gl: countryCode,
      num: 10, // Serper's places search type max is 10 per request
      type: "places"  // Specify we want local places results
    };
    
    // Add optional parameters if available
    if (lat && lng) {
      baseRequestPayload.ll = `${lat},${lng}`;
    }
    
    // Convert radius from km to meters
    if (radius) {
      const radiusMeters = parseInt(radius, 10) * 1000;
      baseRequestPayload.radius = Math.min(radiusMeters, 50000); // Cap at 50km
    }
    
    // Calculate how many API calls we need to make
    const batchCount = Math.ceil(maxResults / 10);
    const apiCalls = Math.min(batchCount, 5); // Limit to 5 API calls (50 results max)
    
    console.log(`Making ${apiCalls} Serper API requests to fetch up to ${apiCalls * 10} results`);
    
    // Make multiple requests to get more results
    const allResults: any[] = [];
    let locationWarning: string | null = null;
    
    for (let i = 0; i < apiCalls; i++) {
      // Only add pagination parameters after first request
      const requestPayload = { ...baseRequestPayload };
      if (i > 0) {
        // Serper uses 'start' parameter for pagination, convert to string
        requestPayload.start = (i * 10).toString();
      }
      
      console.log(`Request ${i+1}/${apiCalls} with payload:`, JSON.stringify({
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
        
        console.log(`Request ${i+1} status:`, response.status);
        
        if (!response.data) {
          console.error(`Request ${i+1} returned empty response data`);
          continue;
        }
        
        // Extract places from response
        let batchResults: any[] = [];
        
        // Check places field
        if (response.data.places && Array.isArray(response.data.places)) {
          console.log(`Found ${response.data.places.length} places in places field for request ${i+1}`);
          batchResults = response.data.places;
        }
        // Check local field
        else if (response.data.local && response.data.local.results) {
          console.log(`Found ${response.data.local.results.length} places in local.results field for request ${i+1}`);
          batchResults = response.data.local.results;
        }
        // Check localResults field
        else if (response.data.localResults) {
          console.log(`Found ${response.data.localResults.length} places in localResults field for request ${i+1}`);
          batchResults = response.data.localResults;
        }
        
        if (batchResults.length === 0) {
          console.warn(`No places found in response data for request ${i+1}`);
          // If first request returns no results, we can stop
          if (i === 0) break;
          // If a subsequent request returns no results, we've reached the end
          break;
        }
        
        // Check if we need to capture location warning
        if (i === 0 && response.data.searchMetadata && response.data.searchMetadata.locationInfo) {
          const locationInfo = response.data.searchMetadata.locationInfo;
          if (locationInfo.detectedLocation && locationInfo.detectedLocation !== cleanLocation) {
            locationWarning = `Results may not be from ${locationInfo.detectedLocation.toUpperCase()}. Try adding the country name to your search.`;
          }
        }
        
        // Add these results to our collection
        allResults.push(...batchResults);
        
        // If we have enough results, we can stop making more requests
        if (allResults.length >= maxResults) break;
        
        // Add a small delay between requests to avoid rate limiting
        if (i < apiCalls - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (apiError: any) {
        console.error(`Error in request ${i+1}:`, apiError.message);
        // If first request fails, propagate the error
        if (i === 0) {
          return NextResponse.json(
            { 
              error: "Search API error", 
              message: apiError.message,
              details: apiError.response ? apiError.response.data : null
            },
            { status: 500 }
          );
        }
        // If subsequent requests fail, we'll just use what we have so far
        break;
      }
    }
    
    if (allResults.length === 0) {
      console.warn("No results found across all API calls");
      return NextResponse.json(
        { error: "No results found for your search", message: "Try adjusting your search criteria" },
        { status: 404 }
      );
    }
    
    console.log(`Serper API returned ${allResults.length} places total across ${apiCalls} requests`);
    
    // Deduplicate results by place_id to avoid duplicates across pagination
    const seenPlaceIds = new Set<string>();
    const uniqueResults = allResults.filter(result => {
      if (!result.place_id) return true; // Keep results without place_id
      if (seenPlaceIds.has(result.place_id)) return false; // Skip duplicates
      seenPlaceIds.add(result.place_id);
      return true;
    });
    
    console.log(`After deduplication: ${uniqueResults.length} unique places`);
    
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
        
        // Handle different formats of hours data
        if (typeof hours === 'string') {
          standardizedResult.hours = hours.replace(/<[^>]*>/g, '');
        } else if (Array.isArray(hours)) {
          standardizedResult.hours = hours.join(', ');
        } else if (typeof hours === 'object') {
          standardizedResult.hours_data = hours;
          try {
            standardizedResult.hours = JSON.stringify(hours);
          } catch (e) {
            standardizedResult.hours = 'Hours information available';
          }
        }
      }
      
      // Add a data_qualified_count field to indicate if we have good data
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
    console.log(`Total results: ${results.length}, Results with coordinates: ${resultsWithCoordinates}`);

    // Check if results might be from the wrong country
    if (results.length > 0 && countryCode) {
      // Simple heuristic - check if address contains country name
      const expectedCountry = countryCode === "gb" ? "united kingdom" : 
                             countryCode === "us" ? "united states" : "";
      
      if (expectedCountry) {
        const countryMatches = results.filter((result: any) => 
          result.address && 
          (result.address.toLowerCase().includes(expectedCountry) || 
           result.address.toLowerCase().includes(countryCode))
        ).length;
        
        // If less than 20% of results contain the expected country, add a warning
        if (countryMatches / results.length < 0.2) {
          locationWarning = `Results may not be from ${expectedCountry.toUpperCase()}. Try adding the country name to your search.`;
          console.warn(locationWarning);
        }
      }
    }

    // Limit results to the requested number (maxResults)
    const requestedMax = searchParams.get("maxResults") ? parseInt(searchParams.get("maxResults") as string, 10) : 20;
    console.log(`Limiting results to ${requestedMax} as requested (from ${results.length} available)`);
    
    // Add safety check - ensure results is not too large to prevent "Invalid array length" errors
    // Allow up to 100 results, but with safety checks
    const MAX_SAFE_RESULTS = 100; // Increased from 50 to 100
    results = results.slice(0, Math.min(requestedMax, MAX_SAFE_RESULTS));
    
    // Apply safety checks to each result's properties to prevent array size issues
    results = results.map((result: any) => {
      // Limit any array properties to reasonable sizes
      if (result.types && Array.isArray(result.types) && result.types.length > 20) {
        result.types = result.types.slice(0, 20);
      }
      if (result.type && Array.isArray(result.type) && result.type.length > 20) {
        result.type = result.type.slice(0, 20);
      }
      if (result.categories && Array.isArray(result.categories) && result.categories.length > 20) {
        result.categories = result.categories.slice(0, 20);
      }
      
      // Ensure all array properties are properly initialized
      if (result.type === undefined || result.type === null) {
        result.type = [];
      } else if (!Array.isArray(result.type) && typeof result.type === 'string') {
        // Convert single string to array if needed
        result.type = [result.type];
      }
      
      // Ensure values aren't undefined/null to prevent serialization issues
      Object.keys(result).forEach(key => {
        if (result[key] === undefined) {
          delete result[key]; // Remove undefined values that can cause serialization issues
        }
      });
      
      return result;
    });

    // Record search in database
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      try {
        // Add the search record first
        await supabase.from("lead_searches").insert({
          user_id: user.id,
          search_query: query,
          location: location,
          results_count: results.length,
        });
        
        // Then decrement remaining searches from user's search packages if they have any
        const { data: searchPackages } = await supabase
          .from("user_search_packages")
          .select("id, remaining_searches")
          .eq("user_id", user.id)
          .gt("remaining_searches", 0)
          .order("purchase_date", { ascending: true })
          .limit(1);
          
        if (searchPackages && searchPackages.length > 0) {
          const packageToUpdate = searchPackages[0];
          const currentRemaining = parseInt(packageToUpdate.remaining_searches as unknown as string);
          const newRemaining = Math.max(0, currentRemaining - 1);
          
          // Update the package with one less search
          await supabase
            .from("user_search_packages")
            .update({ 
              remaining_searches: newRemaining,
              updated_at: new Date().toISOString()
            })
            .eq("id", packageToUpdate.id);
            
          console.log(`Decremented search count for package ${packageToUpdate.id} from ${currentRemaining} to ${newRemaining}`);
        } else {
          console.log(`No search packages with remaining credits found for user ${user.id}`);
        }

      } catch (dbError) {
        // Just log the error, don't fail the entire search
        console.error("Error updating search credits:", dbError);
      }
    }

    // Get the updated remaining searches
    const updatedRemainingSearches = await getRemainingSearches();

    // Return results
    return NextResponse.json({
      results,
      remaining_searches: updatedRemainingSearches, // Use the freshly calculated value
      location_warning: locationWarning
    });
  } catch (error: any) {
    console.error("Error in lead finder search:", error);
    
    return NextResponse.json(
      { error: error.message || "Failed to search" },
      { status: 500 }
    );
  }
} 