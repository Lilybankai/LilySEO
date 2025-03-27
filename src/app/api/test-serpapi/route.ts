"use server";

import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    // Use the Serper API key instead of SerpAPI for testing
    const apiKey = process.env.SERPER_API_KEY || "9289df896676abed6287d6344ea67af7c792cac2";
    
    console.log("Making test SerpAPI request");
    console.log(`Using Serper API key: ${apiKey.substring(0, 5)}... (${apiKey.length} chars)`);
    
    // Simple throttling to avoid overloading the API
    const requestPayload = {
      "q": "cafe in Ontario, Canada",
      "gl": "ca",
      "num": 3, // Limit to 3 results for testing to reduce quota usage
      "type": "places",
      "ll": "51.253775,-85.3232139",
      "radius": 50000
    };
    
    console.log("Making Serper API request with payload:", JSON.stringify(requestPayload, null, 2));
    
    // Use Serper API instead of SerpAPI
    console.log("Attempting to call Serper API at: https://google.serper.dev/search");
    console.log("Request method: POST, Headers: X-API-KEY, Content-Type: application/json");
    
    const response = await axios.post("https://google.serper.dev/search", 
      requestPayload,
      {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );
    
    console.log("Serper API response status:", response.status);
    
    if (!response.data) {
      console.error("Serper API returned empty response data");
      return NextResponse.json(
        { success: false, error: "Empty response from Serper API" },
        { status: 500 }
      );
    }
    
    console.log("Response data keys:", Object.keys(response.data));
    
    // Extract places - Serper API structure
    let places = [];
    if (response.data.places && Array.isArray(response.data.places)) {
      console.log(`Found ${response.data.places.length} places in places field`);
      places = response.data.places;
    } else {
      console.warn("No places found in Serper API response");
    }
    
    if (places.length > 0) {
      console.log("Sample result structure:", JSON.stringify(places[0], null, 2));
    }
    
    // Enhance results with coordinates info for debugging
    const resultsWithCoordinates = places.filter((r: any) => r.latitude && r.longitude).length;
    console.log(`Total results: ${places.length}, Results with coordinates: ${resultsWithCoordinates}`);
    
    // Limit results to prevent array size issues
    const limitedResults = places.slice(0, 10);
    
    return NextResponse.json({
      success: true,
      resultsCount: places.length,
      remainingSearches: 500 - 1, // Mock value for testing
      firstFewResults: limitedResults
    });
  } catch (error: any) {
    console.error("Error in test SerpAPI:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to test SerpAPI",
        details: error.response?.data || null,
        status: error.response?.status || 500
      },
      { status: error.response?.status || 500 }
    );
  }
} 