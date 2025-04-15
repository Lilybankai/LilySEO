import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get user profile to check subscription tier
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("subscription_tier, subscription_status")
      .eq("id", session.user.id)
      .single();
    
    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }
    
    // Check if user has access to white label features
    const hasAccess = 
      (profile.subscription_tier === "pro" || profile.subscription_tier === "enterprise") && 
      (profile.subscription_status === "active" || profile.subscription_status === "trialing");
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Subscription required", requiresUpgrade: true },
        { status: 403 }
      );
    }
    
    // Fetch white label settings
    const { data: settings, error: settingsError } = await supabase
      .from("white_label_settings")
      .select("*")
      .eq("user_id", session.user.id)
      .single();
    
    if (settingsError && settingsError.code !== "PGRST116") { // PGRST116 is "no rows returned" error
      console.error("Error fetching white label settings:", settingsError);
      return NextResponse.json(
        { error: "Failed to fetch white label settings" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ settings, hasAccess });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get user profile to check subscription tier
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("subscription_tier, subscription_status")
      .eq("id", session.user.id)
      .single();
    
    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }
    
    // Check if user has access to white label features
    const hasAccess = 
      (profile.subscription_tier === "pro" || profile.subscription_tier === "enterprise") && 
      (profile.subscription_status === "active" || profile.subscription_status === "trialing");
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Subscription required", requiresUpgrade: true },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Check if settings already exist
    const { data: existingSettings } = await supabase
      .from("white_label_settings")
      .select("id")
      .eq("user_id", session.user.id)
      .single();
    
    let result;
    
    if (existingSettings) {
      // Update existing settings
      result = await supabase
        .from("white_label_settings")
        .update({
          ...body,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingSettings.id)
        .select()
        .single();
    } else {
      // Create new settings
      result = await supabase
        .from("white_label_settings")
        .insert({
          ...body,
          user_id: session.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
    }
    
    if (result.error) {
      console.error("Error saving white label settings:", result.error);
      return NextResponse.json(
        { error: "Failed to save white label settings" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ settings: result.data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 