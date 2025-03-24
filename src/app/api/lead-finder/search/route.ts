"use server";

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "@/lib/supabase/server";
import { checkEnterpriseAccess, getRemainingSearches } from "@/services/lead-finder";

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
    const maxResults = searchParams.get("maxResults") || "10";
    const priceLevel = searchParams.get("priceLevel");
    const openNow = searchParams.get("openNow") === "true";

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

    // Try to load the API key from the hard-coded value in .env if it's not available
    let apiKey = process.env.SERPAPI_KEY;
    
    // Log the API key debug info
    console.log("Using SerpAPI key:", apiKey ? `${apiKey.substring(0, 10)}... (${apiKey.length} chars)` : "Key missing");

    if (!apiKey) {
      // For emergency testing, use the hard-coded key from the .env file if process.env is not working
      apiKey = "1dcc12f76da69ab0e37ecf1422e357168c13f17531c8f2c7f48b7d050a0ffe28";
      console.log("Using hardcoded fallback key");
    }

    // Call SerpApi with correct parameters
    // See: https://serpapi.com/google-maps-api
    const requestParams: any = {
      engine: "google_maps",
      q: query,
      location: location,
      hl: "en",
      type: "search",
      api_key: apiKey,
      num: parseInt(maxResults, 10)
    };
    
    // Set country code (gl) based on location
    // Default to UK (gb) if location contains UK indicators
    if (location.toLowerCase().includes("uk") || 
        location.toLowerCase().includes("united kingdom") ||
        location.toLowerCase().includes("england") ||
        location.toLowerCase().includes("scotland") ||
        location.toLowerCase().includes("wales") ||
        location.toLowerCase().includes("northern ireland")) {
      requestParams.gl = "gb"; // United Kingdom
    } else if (location.toLowerCase().includes("usa") || 
              location.toLowerCase().includes("united states") ||
              location.toLowerCase().includes("america")) {
      requestParams.gl = "us"; // United States
    } else {
      // Try to extract country information from the location
      const locationParts = location.split(",");
      const lastPart = locationParts[locationParts.length - 1]?.trim().toLowerCase();
      
      // Map common country names to country codes
      const countryMap: Record<string, string> = {
        "uk": "gb",
        "united kingdom": "gb",
        "england": "gb",
        "great britain": "gb",
        "usa": "us",
        "united states": "us",
        "america": "us",
        "canada": "ca",
        "australia": "au",
        "germany": "de",
        "france": "fr",
        "spain": "es",
        "italy": "it"
      };
      
      // Set country code if we found a match
      if (lastPart && countryMap[lastPart]) {
        requestParams.gl = countryMap[lastPart];
      } else {
        // Default to UK since that's what the user wanted
        requestParams.gl = "gb";
      }
    }
    
    // Add radius if specified
    if (radius) {
      requestParams.radius = parseInt(radius, 10) * 1000; // Convert km to meters
    }
    
    // Add open now parameter if specified
    if (openNow) {
      requestParams.open_now = "1";
    }
    
    console.log("SerpAPI request params:", { ...requestParams, api_key: "REDACTED" });
    
    let response;
    try {
      response = await axios.get("https://serpapi.com/search", {
        params: requestParams
      });
      
      console.log("SerpAPI response status:", response.status);
      console.log("SerpAPI response has results:", !!response.data.local_results);
      console.log("SerpAPI results count:", response.data.local_results?.length || 0);
    } catch (error: any) {
      console.error("Error calling SerpAPI:", error);
      
      // More detailed error logging
      if (error.response) {
        console.error("SerpAPI error response:", {
          status: error.response.status,
          data: error.response.data
        });
      }
      
      if (error.response?.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded" },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: error.message || "Failed to search using SerpAPI" },
        { status: 500 }
      );
    }

    // Extract relevant data
    let results = response.data.local_results || [];

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
        result.price_level && result.price_level.length === level
      );
    }

    // Process and enhance results
    results = results.map((result: any) => {
      // Convert price_level string (e.g., "$$") to a number for easier filtering
      if (result.price_level) {
        result.price_level = result.price_level.length.toString();
      }
      
      // Extract GPS coordinates if available
      if (result.gps_coordinates) {
        result.latitude = result.gps_coordinates.latitude;
        result.longitude = result.gps_coordinates.longitude;
        console.log(`Extracted coordinates for ${result.title}: Lat ${result.latitude}, Lng ${result.longitude}`);
      } else {
        console.log(`No coordinates found for ${result.title}`);
      }
      
      return result;
    });

    // Log count of results with coordinates
    const resultsWithCoordinates = results.filter((r: any) => r.latitude && r.longitude).length;
    console.log(`Total results: ${results.length}, Results with coordinates: ${resultsWithCoordinates}`);

    // Limit results
    results = results.slice(0, parseInt(maxResults));

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
    });
  } catch (error: any) {
    console.error("Error in lead finder search:", error);
    
    return NextResponse.json(
      { error: error.message || "Failed to search" },
      { status: 500 }
    );
  }
} 