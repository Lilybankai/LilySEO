import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET handler for retrieving monthly completion rate metrics
 * @param request The incoming request
 * @returns A response with the metrics data in the format {month: string, rate: number}[]
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
    
    // Query to calculate completion rate by month
    let query = supabase
      .from("todo_metrics")
      .select("month, todos_created, todos_completed")
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
      console.error('Error fetching completion rate metrics:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    // Transform data to calculate rate for each month
    const rateData = (data || []).map(item => {
      // Calculate completion rate as percentage
      const rate = item.todos_created > 0
        ? Math.round((item.todos_completed / item.todos_created) * 100)
        : 0;
      
      return {
        month: item.month,
        rate
      };
    });
    
    console.log(`Fetched completion rate metrics for ${rateData.length} months`);
    
    return NextResponse.json(rateData);
  } catch (error: any) {
    console.error('Unhandled error in GET /api/todos/metrics/completion-rate:', error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
} 