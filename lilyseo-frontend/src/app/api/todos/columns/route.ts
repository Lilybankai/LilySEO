import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET handler for retrieving todo columns configuration
 * @param request The incoming request
 * @returns A response with the columns data
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get user data
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Default columns if none are found
    const defaultColumns = [
      { id: 'col-1', title: 'To Do', status: 'pending', color: '#3B82F6' },
      { id: 'col-2', title: 'In Progress', status: 'in_progress', color: '#F59E0B' },
      { id: 'col-3', title: 'Review', status: 'review', color: '#8B5CF6' },
      { id: 'col-4', title: 'Completed', status: 'completed', color: '#10B981' },
    ];
    
    // Try to get custom columns from database
    const { data: customColumns, error } = await supabase
      .from("todo_columns")
      .select("*")
      .eq("user_id", user.id)
      .order("position", { ascending: true });
    
    if (error) {
      console.error("Error fetching columns:", error);
      // Return default columns if there's an error
      return NextResponse.json(defaultColumns);
    }
    
    // Return custom columns if they exist, otherwise return defaults
    return NextResponse.json(customColumns.length > 0 ? customColumns : defaultColumns);
  } catch (error: any) {
    console.error("Error in columns API:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
} 