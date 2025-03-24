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
      // Redirect to the project page with an error parameter
      return NextResponse.redirect(
        new URL(`/projects/${id}?error=audit_limit_reached`, request.url)
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
      return NextResponse.redirect(
        new URL(`/projects/${id}?error=create_audit_failed`, request.url)
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
          
        throw new Error(errorData.error || "Failed to start audit with crawler service");
      }
    } catch (error) {
      console.error("Error starting audit with crawler service:", error);
      return NextResponse.redirect(
        new URL(`/projects/${id}?error=create_audit_failed`, request.url)
      );
    }
    
    // Redirect back to the project page with success parameter
    return NextResponse.redirect(
      new URL(`/projects/${id}?success=audit_started`, request.url)
    );
  } catch (error) {
    console.error("Error in quick audit:", error);
    return NextResponse.redirect(
      new URL(`/projects/${context.params.id}?error=unexpected_error`, request.url)
    );
  }
} 