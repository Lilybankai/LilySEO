import { NextRequest, NextResponse } from "next/server";

/**
 * GET handler for the daily cron job
 * This endpoint is triggered by a cron job service (like Vercel Cron)
 * and calls the verify-audits endpoint to check and schedule audits
 * 
 * @param request The incoming request
 * @returns A response with the cron job status
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the cron secret to ensure this is only called by authorized services
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization header" },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(" ")[1];
    const expectedToken = process.env.CRON_SECRET;
    
    if (!token || token !== expectedToken) {
      return NextResponse.json(
        { error: "Invalid authorization token" },
        { status: 401 }
      );
    }
    
    // Call the verify-audits endpoint
    const verifyAuditsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/scheduler/verify-audits`,
      {
        method: "GET",
        headers: {
          "x-api-key": process.env.SCHEDULER_API_KEY || "",
          "Content-Type": "application/json",
        },
      }
    );
    
    if (!verifyAuditsResponse.ok) {
      const errorData = await verifyAuditsResponse.json();
      throw new Error(`Failed to verify audits: ${JSON.stringify(errorData)}`);
    }
    
    const verifyAuditsData = await verifyAuditsResponse.json();
    
    return NextResponse.json({
      success: true,
      message: "Daily cron job completed successfully",
      verifyAuditsResult: verifyAuditsData,
    });
  } catch (error) {
    console.error("Error in daily cron job:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 