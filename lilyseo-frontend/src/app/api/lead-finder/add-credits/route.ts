import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // This endpoint is admin-only and uses the service role
    const supabase = await getAdminSupabase();
    
    // Get the requested credits and user ID from the request body
    const { userId, credits } = await request.json();
    
    if (!userId || !credits || typeof credits !== 'number' || credits <= 0) {
      return NextResponse.json(
        { error: "Invalid parameters. Provide userId and credits (positive number)" },
        { status: 400 }
      );
    }

    // Verify the user exists in the database
    const { data: userExists, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    
    if (userError || !userExists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get the Medium Package for reference or create one if it doesn't exist
    let packageId: string;
    
    const { data: packageData, error: packageError } = await supabase
      .from("lead_search_packages")
      .select("id")
      .eq("name", "Medium Package")
      .maybeSingle();
    
    if (packageError || !packageData) {
      // Create a medium package if it doesn't exist
      const { data: newPackage, error: createError } = await supabase
        .from("lead_search_packages")
        .insert({
          name: "Medium Package",
          description: "100 additional lead searches",
          searches_count: 100,
          price: 34.99,
          active: true
        })
        .select()
        .single();
      
      if (createError || !newPackage) {
        return NextResponse.json(
          { error: "Failed to create search package" },
          { status: 500 }
        );
      }
      
      packageId = newPackage.id;
    } else {
      packageId = packageData.id;
    }

    // Add credits to the user
    const { data, error } = await supabase
      .from("user_search_packages")
      .insert({
        user_id: userId,
        package_id: packageId,
        remaining_searches: credits
      });
    
    if (error) {
      return NextResponse.json(
        { error: "Failed to add credits", details: error.message },
        { status: 500 }
      );
    }

    // Check the total remaining searches
    const { data: remainingData, error: remainingError } = await supabase.rpc(
      "get_user_remaining_searches",
      { user_uuid: userId }
    );

    if (remainingError) {
      console.error("Error getting remaining searches:", remainingError);
    }

    // Log the successful operation
    console.log(`Added ${credits} search credits for user ${userId}. Total remaining: ${remainingData || credits}`);

    return NextResponse.json({ 
      success: true, 
      credits_added: credits,
      total_remaining: remainingData || credits
    });
  } catch (error: any) {
    console.error("Error adding search credits:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
} 