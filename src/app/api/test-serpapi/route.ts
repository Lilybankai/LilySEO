"use server";

import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    // Use hardcoded SerpAPI key
    const apiKey = "1dcc12f76da69ab0e37ecf1422e357168c13f17531c8f2c7f48b7d050a0ffe28";
    
    // Basic request parameters
    const requestParams = {
      engine: "google_maps",
      q: "restaurants",
      location: "London, UK",
      hl: "en",
      gl: "gb",
      type: "search",
      api_key: apiKey,
      num: 5  // Limit to 5 results for testing
    };
    
    console.log("Making test SerpAPI request");
    
    // Call SerpAPI
    const response = await axios.get("https://serpapi.com/search", {
      params: requestParams
    });
    
    console.log("SerpAPI test response status:", response.status);
    console.log("SerpAPI test has results:", !!response.data.local_results);
    console.log("SerpAPI test results count:", response.data.local_results?.length || 0);
    
    // Process and extract coordinates
    const results = response.data.local_results || [];
    const processedResults = results.map((result: any) => {
      // Extract GPS coordinates
      if (result.gps_coordinates) {
        result.latitude = result.gps_coordinates.latitude;
        result.longitude = result.gps_coordinates.longitude;
        console.log(`Test coordinates for ${result.title}: Lat ${result.latitude}, Lng ${result.longitude}`);
      } else {
        console.log(`No coordinates found for ${result.title}`);
      }
      
      return {
        title: result.title,
        place_id: result.place_id,
        address: result.address,
        phone: result.phone,
        website: result.website,
        rating: result.rating,
        latitude: result.latitude,
        longitude: result.longitude,
        hasCoordinates: !!result.latitude && !!result.longitude
      };
    });
    
    // Log count of results with coordinates
    const resultsWithCoordinates = processedResults.filter((r: any) => r.latitude && r.longitude).length;
    console.log(`Test total results: ${processedResults.length}, Results with coordinates: ${resultsWithCoordinates}`);
    
    return NextResponse.json({
      success: true,
      results: processedResults,
      raw: response.data
    });
  } catch (error: any) {
    console.error("Error in test SerpAPI:", error);
    
    return NextResponse.json(
      { 
        error: error.message || "Failed to test SerpAPI",
        details: error.response?.data || null
      },
      { status: 500 }
    );
  }
} 