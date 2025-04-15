import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function GET() {
  // This endpoint should only be used in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode" },
      { status: 403 }
    );
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Update the user's subscription tier to enterprise
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_tier: "enterprise" })
      .eq("id", user.id);

    if (error) {
      console.error("Error setting enterprise tier:", error);
      return NextResponse.json(
        { error: "Failed to update user tier", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User successfully upgraded to enterprise tier",
      userId: user.id
    });
  } catch (error: any) {
    console.error("Error in set-enterprise API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
} 