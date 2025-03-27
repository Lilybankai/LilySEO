import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCrawlerServiceUrl } from "@/lib/api-config";
import { getUserAuditLimits } from "@/lib/subscription";

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    const id = context.params.id;
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    
    // Get project details
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();
    
    if (!project) {
      return NextResponse.redirect(new URL("/projects", request.url));
    }
    
    // Check user's audit limits
    const { remaining, isLimited } = await getUserAuditLimits(user.id);
    
    if (isLimited && remaining <= 0) {
      // Return JSON error response for audit limit reached
      return NextResponse.json(
        { 
          success: false, 
          error: "Audit limit reached",
          message: "You've reached your monthly audit limit. Upgrade your plan for more audits."
        },
        { status: 403 }
      );
    }
    
    // Default audit options
    const auditOptions = {
      checkSeo: true,
      checkPerformance: true,
      checkMobile: true,
      checkSecurity: true,
      checkAccessibility: true,
    };
    
    // Create a new audit record
    const { data: audit, error } = await supabase
      .from("audits")
      .insert({
        project_id: id,
        user_id: user.id,
        url: project.url,
        status: "pending",
        report: {
          description: "Quick audit",
          options: auditOptions,
          depth: "standard",
        },
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating audit:", error);
      return NextResponse.json(
        { 
          success: false, 
          error: "Create audit failed",
          message: error.message || "Failed to create audit record"
        },
        { status: 500 }
      );
    }
    
    // Start the audit process with the crawler service
    try {
      // Update the audit status to processing
      await supabase
        .from("audits")
        .update({ status: "processing" })
        .eq("id", audit.id);
      
      // Call the crawler service to start the audit
      const crawlerResponse = await fetch(getCrawlerServiceUrl("/api/audit/start"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: audit.project_id,
          url: audit.url,
          auditId: audit.id,
          options: {
            ...auditOptions,
            depth: "standard",
          },
        }),
      });

      if (!crawlerResponse.ok) {
        const errorData = await crawlerResponse.json().catch(() => ({}));
        console.error("Error starting audit with crawler service:", errorData);
        
        // Update the audit status to failed
        await supabase
          .from("audits")
          .update({ 
            status: "failed",
            error_message: errorData.error || crawlerResponse.statusText
          })
          .eq("id", audit.id);
          
        return NextResponse.json(
          { 
            success: false, 
            error: "Start audit failed",
            message: errorData.error || "Failed to start audit with crawler service"
          },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error("Error starting audit with crawler service:", error);
      return NextResponse.json(
        { 
          success: false, 
          error: "Crawler service error",
          message: error instanceof Error ? error.message : "Failed to communicate with crawler service"
        },
        { status: 500 }
      );
    }
    
    // Instead of redirecting, return JSON with the audit ID and success message
    // This allows the client-side Javascript to use the audit ID for polling
    return NextResponse.json({
      success: true,
      message: "Audit started successfully",
      auditId: audit.id,
      projectId: id
    });
  } catch (error) {
    console.error("Error in quick audit:", error);
    
    // Return error as JSON
    return NextResponse.json(
      { 
        success: false, 
        error: "An unexpected error occurred",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 