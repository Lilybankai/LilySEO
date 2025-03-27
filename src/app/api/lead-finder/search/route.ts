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
    const maxResults = searchParams.get("maxResults") || "20";
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
    if (remainingSearches <= 0) {
      return NextResponse.json(
        { 
          error: "No searches remaining", 
          message: "You have reached your monthly search limit. Please purchase more searches."
        },
        { status: 402 }
      );
    }

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

    // Create request payload for Serper API
    const requestPayload: any = {
      q: searchQuery,
      gl: countryCode,
      num: parseInt(maxResults, 10),
      type: "places"  // Specify we want local places results
    };
    
    // Add optional parameters if available
    if (lat && lng) {
      requestPayload.ll = `${lat},${lng}`;
    }
    
    // Convert radius from km to meters
    if (radius) {
      const radiusMeters = parseInt(radius, 10) * 1000;
      requestPayload.radius = Math.min(radiusMeters, 50000); // Cap at 50km
    }
    
    console.log("Making Serper API request with payload:", JSON.stringify({
      ...requestPayload
    }, null, 2));

    // Make request to Serper API
    console.log(`Attempting to call Serper API at: ${SERPER_API_URL}`);
    console.log(`Request method: POST, Headers: X-API-KEY, Content-Type: application/json`);
    
    let response;
    try {
      response = await axios.post(SERPER_API_URL, requestPayload, {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });
    } catch (apiError: any) {
      console.error("Error calling Serper API:", apiError.message);
      console.error("Error details:", apiError.response ? {
        status: apiError.response.status,
        statusText: apiError.response.statusText,
        data: apiError.response.data
      } : "No response details");
      
      return NextResponse.json(
        { 
          error: "Search API error", 
          message: apiError.message,
          details: apiError.response ? apiError.response.data : null
        },
        { status: 500 }
      );
    }
    
    console.log("Serper API response status:", response.status);
    
    if (!response.data) {
      console.error("Serper API returned empty response data");
      return NextResponse.json(
        { error: "Search API returned empty response" },
        { status: 500 }
      );
    }
    
    console.log("Response data keys:", Object.keys(response.data));
    
    // Extract places from response - Serper uses 'places' field for local results
    let results = [];
    
    // Check if it's a places search result
    if (response.data.places && Array.isArray(response.data.places)) {
      console.log(`Found ${response.data.places.length} places in places field`);
      results = response.data.places;
    }
    // Check if it's a local search result
    else if (response.data.local && response.data.local.results) {
      console.log(`Found ${response.data.local.results.length} places in local.results field`);
      results = response.data.local.results;
    }
    // Check if it's in localResults
    else if (response.data.localResults) {
      console.log(`Found ${response.data.localResults.length} places in localResults field`);
      results = response.data.localResults;
    }
    // Check if it's in organic results
    else if (response.data.organic) {
      console.log(`Found ${response.data.organic.length} places in organic field`);
      results = response.data.organic;
    }
    // No results found
    else {
      console.warn("No places found in Serper API response");
      console.log("Response structure:", JSON.stringify(Object.keys(response.data), null, 2));
      
      return NextResponse.json({
        results: [],
        remaining_searches: remainingSearches - 1,
        message: "No places found for your search criteria",
        debug: { responseKeys: Object.keys(response.data) }
      });
    }
    
    console.log(`Serper API returned ${results.length} places`);
    if (results.length > 0) {
      console.log("Sample result structure:", JSON.stringify(results[0] || {}, null, 2).substring(0, 500));
    }
    
    // Enrich top results with place details if we have time
    const placesToEnrich = Math.min(3, results.length);
    if (placesToEnrich > 0) {
      console.log(`Enriching top ${placesToEnrich} results with place details`);
      
      for (let i = 0; i < placesToEnrich; i++) {
        if (results[i].place_id) {
          try {
            console.log(`Fetching place details for ${results[i].place_id}`);
            const placeDetails = await getPlaceDetails(results[i].place_id, apiKey);
            
            if (placeDetails && placeDetails.places && placeDetails.places.length > 0) {
              const detailsData = placeDetails.places[0];
              // Merge the place details with the result
              results[i] = {
                ...results[i],
                website: detailsData.website || results[i].website,
                phone: detailsData.phoneNumber || results[i].phone,
                hours: detailsData.workingHours || results[i].hours,
                detailed_hours: detailsData.workingHours,
                description: detailsData.description,
                thumbnail: detailsData.thumbnailUrl || results[i].thumbnail,
                full_address: detailsData.address || results[i].address,
                // Add additional enriched data as needed
              };
              
              console.log(`Enhanced data for ${results[i].title}`);
            }
          } catch (err) {
            console.error(`Error enriching place details: ${err}`);
            // Continue with other enrichments if one fails
          }
        }
      }
    }

    // Process and standardize results to match the expected format
    results = results.map((result: any) => {
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
    let locationWarning = null;
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
    const requestedMax = parseInt(maxResults, 10);
    console.log(`Limiting results to ${requestedMax} as requested (from ${results.length} available)`);
    results = results.slice(0, requestedMax);

    // Record search in database
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from("lead_searches").insert({
        user_id: user.id,
        search_query: query,
        location: location,
        results_count: results.length,
      });
    }

    // Return results
    return NextResponse.json({
      results,
      remaining_searches: remainingSearches - 1, // Decrement by one for this search
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