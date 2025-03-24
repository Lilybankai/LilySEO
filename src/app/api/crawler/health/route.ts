import { NextRequest, NextResponse } from "next/server";
import { getCrawlerServiceUrl } from "@/lib/api-config";

/**
 * GET handler for checking the crawler service health
 * @param request The incoming request
 * @returns A response indicating if the crawler service is available
 */
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(getCrawlerServiceUrl("/health"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Set a timeout to avoid hanging if the service is down
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      return NextResponse.json({ status: "available" });
    } else {
      return NextResponse.json(
        { status: "unavailable", error: response.statusText },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Error checking crawler service health:", error);
    return NextResponse.json(
      { status: "unavailable", error: "Failed to connect to crawler service" },
      { status: 503 }
    );
  }
} 