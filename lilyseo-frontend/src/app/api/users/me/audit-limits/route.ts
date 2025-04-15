import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserAuditLimits } from "@/lib/subscription";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get user's audit limits
    const limits = await getUserAuditLimits(user.id);
    
    return NextResponse.json(limits);
  } catch (error) {
    console.error("Error getting audit limits:", error);
    return NextResponse.json(
      { error: "Failed to get audit limits" },
      { status: 500 }
    );
  }
} 