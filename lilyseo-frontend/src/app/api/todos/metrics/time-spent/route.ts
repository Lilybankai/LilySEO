import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET handler for retrieving monthly time spent metrics
 * @param request The incoming request
 * @returns A response with the metrics data in the format {month: string, time: number}[]
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    
    // Authenticate the user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Query for total time spent by month
    let query = supabase
      .from("todo_metrics")
      .select("month, total_time_spent")
      .eq("user_id", user.id);
    
    // Add project filter if provided
    if (projectId) {
      query = query.eq("project_id", projectId);
    }
    
    // Execute the query
    const { data, error } = await query
      .order("month", { ascending: false })
      .limit(12); // Last 12 months
    
    if (error) {
      console.error('Error fetching time spent metrics:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    // Transform data to the expected format
    const timeData = (data || []).map(item => ({
      month: item.month,
      time: item.total_time_spent || 0
    }));
    
    console.log(`Fetched time spent metrics for ${timeData.length} months`);
    
    return NextResponse.json(timeData);
  } catch (error: any) {
    console.error('Unhandled error in GET /api/todos/metrics/time-spent:', error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
} 