import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeCompetitor } from "@/services/competitor-analysis";

/**
 * POST handler for starting the analysis of a specific competitor
 * @param request The incoming request
 * @param context The route context with params
 * @returns A response indicating success or failure
 */
export async function POST(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    // In Next.js 14+, params should be accessed after being awaited
    const id = params.id;
    console.log(`Starting analysis for competitor ID: ${id}`);
    
    const supabase = await createClient();
    
    // Get user data
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("Unauthorized: No authenticated user found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Verify that the competitor belongs to the user and get project URL
    const { data: competitor, error: competitorError } = await supabase
      .from("competitors")
      .select(`
        *,
        projects:project_id (
          id,
          url
        )
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    
    if (competitorError || !competitor) {
      console.error("Error fetching competitor:", competitorError?.message || "Competitor not found");
      return NextResponse.json(
        { error: "Competitor not found or access denied" },
        { status: 404 }
      );
    }
    
    // Update status to in_progress
    const { error: updateError } = await supabase
      .from("competitors")
      .update({
        status: "in_progress",
        last_analyzed_at: new Date().toISOString(),
        error_message: null
      })
      .eq("id", id);
    
    if (updateError) {
      console.error("Error updating competitor status:", updateError.message);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Try to send the analysis request to the crawler service
    const crawlerServiceUrl = process.env.CRAWLER_SERVICE_URL;
    console.log(`Attempting to use crawler service at: ${crawlerServiceUrl}`);

    if (crawlerServiceUrl) {
      try {
        // Try the first API endpoint format: /api/competitors/:id/analyze
        const endpointUrl = `${crawlerServiceUrl}/api/competitors/${id}/analyze`;
        console.log(`Making request to crawler service: ${endpointUrl}`);
        
        const response = await fetch(endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ options: {} }),
          cache: 'no-store'
        });
        
        console.log(`Crawler service response status: ${response.status}`);
        
        if (response.ok) {
          const responseData = await response.json();
          console.log(`Crawler service response: ${JSON.stringify(responseData)}`);
          
          return NextResponse.json({ 
            success: true,
            message: "Analysis queued through crawler service",
            data: responseData
          });
        } else {
          // If the first endpoint fails, try the alternative format
          const alternateEndpoint = `${crawlerServiceUrl}/api/competitors/analyze/${id}`;
          console.log(`First endpoint failed, trying alternate: ${alternateEndpoint}`);
          
          const altResponse = await fetch(alternateEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ options: {} }),
            cache: 'no-store'
          });
          
          console.log(`Alternate endpoint response status: ${altResponse.status}`);
          
          if (altResponse.ok) {
            const altResponseData = await altResponse.json();
            console.log(`Alternate endpoint response: ${JSON.stringify(altResponseData)}`);
            
            return NextResponse.json({ 
              success: true,
              message: "Analysis queued through crawler service (alternate endpoint)",
              data: altResponseData
            });
          } else {
            // Both endpoints failed, fall back to local analysis
            throw new Error(`Both crawler service endpoints failed with status codes ${response.status} and ${altResponse.status}`);
          }
        }
      } catch (error: any) {
        console.error(`Error using crawler service: ${error.message}`);
        console.error("Falling back to local analysis");
        // Fall through to local analysis fallback
      }
    }

    // Use local analysis as fallback
    console.log(`Starting local analysis for competitor ${id}`);
    
    // Run the analysis in the background
    setTimeout(async () => {
      try {
        // Run the analysis - checking for both competitor_url and url fields to handle both table structures
        const competitorUrl = competitor.competitor_url || competitor.url;
        const projectUrl = competitor.projects?.url;
        
        if (!competitorUrl || !projectUrl) {
          throw new Error("Missing competitor URL or project URL");
        }
        
        const analysis = await analyzeCompetitor(competitorUrl, projectUrl);
        
        // Update the competitor with the analysis results
        await supabase
          .from("competitors")
          .update({
            status: "completed",
            analysis_data: analysis,
            last_analyzed_at: new Date().toISOString()
          })
          .eq("id", id);
          
        console.log(`Local analysis completed for competitor ${id}`);
      } catch (error: any) {
        console.error(`Error analyzing competitor ${id}:`, error);
        
        // Update with error status if analysis fails
        await supabase
          .from("competitors")
          .update({
            status: "error",
            error_message: error.message || "An error occurred during analysis"
          })
          .eq("id", id);
      }
    }, 100); // Small delay to ensure response is sent first
    
    return NextResponse.json({ 
      success: true,
      message: "Analysis started using local fallback" 
    });
  } catch (error: any) {
    console.error("Error in analyze competitor:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
} 