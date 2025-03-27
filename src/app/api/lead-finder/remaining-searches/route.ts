import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the user from the server session
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Call the RPC function to get remaining searches
    const { data, error } = await supabase.rpc(
      "get_user_remaining_searches",
      { user_uuid: user.id }
    );

    if (error) {
      console.error("Error getting remaining searches:", error);
      return NextResponse.json(
        { error: "Failed to get remaining searches", details: error.message },
        { status: 500 }
      );
    }
    
    console.log(`User ${user.id} calculated remaining searches:`, data);
    
    // TEMPORARY FIX: Override the remaining searches with the Serper credits
    // Change this to match your actual Serper credits or a reasonable number
    const overrideSearches = 1400; // Based on your Serper dashboard showing 1,467
    
    return NextResponse.json({ 
      remaining_searches: overrideSearches, 
      // Include the original calculation for debugging
      calculated_searches: data || 0 
    });

  } catch (error: any) {
    console.error("Error in remaining-searches API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
} 