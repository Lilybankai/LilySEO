import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST handler for preparing data for PDF export
 * This route now simply fetches the necessary data and returns it
 * The actual PDF generation happens client-side with React-PDF
 * @param request The incoming request with audit data and optional white label settings
 * @returns The data needed for client-side PDF generation
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { auditId, userId } = body;
    
    if (!auditId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }
    
    // Check if this request is coming from our internal API
    const isInternalRequest = request.headers.get('x-internal-request') === 'true';
    
    // Only check authentication for external requests
    if (!isInternalRequest) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || user.id !== userId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      
      // Fetch the audit data
      const { data: audit, error: auditError } = await supabase
        .from("audits")
        .select("*, projects:project_id(*)")
        .eq("id", auditId)
        .single();
      
      if (auditError || !audit) {
        return NextResponse.json(
          { error: "Audit not found" },
          { status: 404 }
        );
      }
      
      // Fetch user's subscription tier from profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier, subscription_status")
        .eq("id", user.id)
        .single();
      
      // Check for Pro OR Enterprise plans
      const isPremiumUser = !!profile && 
                           profile.subscription_status === 'active' && 
                           (profile.subscription_tier === 'pro' || profile.subscription_tier === 'enterprise');
      
      let whiteLabel = null;
      
      if (isPremiumUser) {
        const { data: whiteLabelData } = await supabase
          .from("white_label_settings")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .single();
        
        whiteLabel = whiteLabelData;
      }
      
      // Return the data needed for client-side PDF generation
      return NextResponse.json({
        auditData: audit,
        whiteLabel,
        isPro: isPremiumUser
      });
    }
    
    // For internal requests, we assume the data is provided in the request
    return NextResponse.json({
      success: true,
      message: "Internal request processed successfully"
    });
  } catch (error) {
    console.error("Error preparing PDF data:", error);
    return NextResponse.json(
      { error: "Failed to prepare PDF data" },
      { status: 500 }
    );
  }
} 