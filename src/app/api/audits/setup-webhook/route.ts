import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * POST handler for setting up the webhook URL for a project
 * This endpoint should be called once during application setup
 * It sets the webhook URL for a specific project to receive audit completion notifications
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get user data
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get request body
    const { projectId } = await request.json();
    
    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }
    
    // Verify that the project belongs to the user
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();
    
    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }
    
    // Generate the webhook URL for this project
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   process.env.VERCEL_URL || 
                   "http://localhost:3000";
    
    const webhookUrl = `${baseUrl}/api/audits/webhook`;
    
    // Update the project with the webhook URL
    const { error: updateError } = await supabase
      .from("projects")
      .update({ webhook_url: webhookUrl })
      .eq("id", projectId);
    
    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update project webhook URL" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      webhookUrl
    });
  } catch (error: any) {
    console.error("Error setting up webhook:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
} 