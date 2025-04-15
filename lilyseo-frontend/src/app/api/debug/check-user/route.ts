import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function GET() {
  try {
    const supabase = createClient();
    const authResponse = await supabase.auth.getUser();
    
    // Check if there's a user
    if (!authResponse.data?.user) {
      return NextResponse.json(
        { 
          status: "error", 
          message: "No authenticated user found",
          auth: {
            user: null,
            error: authResponse.error?.message || "No user"
          }
        },
        { status: 401 }
      );
    }

    const userId = authResponse.data.user.id;
    const email = authResponse.data.user.email;

    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // Get a debug response with all the info
    return NextResponse.json({
      status: "success",
      auth: {
        user: {
          id: userId,
          email: email
        },
        error: authResponse.error?.message
      },
      profile: {
        data: profile,
        error: profileError?.message
      },
      instructions: {
        upgrade: "Run the following SQL command in Supabase SQL Editor:",
        sql: `UPDATE public.profiles SET subscription_tier = 'enterprise' WHERE id = '${userId}';`
      }
    });
  } catch (error: any) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      { 
        status: "error", 
        message: "Internal server error", 
        error: error.message 
      },
      { status: 500 }
    );
  }
} 