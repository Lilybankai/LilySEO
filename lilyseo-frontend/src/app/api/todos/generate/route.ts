import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { generateTodosFromAudit } from "@/lib/todo-service";

/**
 * POST handler for generating todos from an audit
 * @param request The incoming request
 * @returns A response with the number of todos generated
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
    const { auditId, projectId } = await request.json();
    
    if (!auditId || !projectId) {
      return NextResponse.json(
        { error: "Audit ID and project ID are required" },
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
    
    // Verify that the audit belongs to the project
    const { data: audit, error: auditError } = await supabase
      .from("audits")
      .select("id, status")
      .eq("id", auditId)
      .eq("project_id", projectId)
      .single();
    
    if (auditError || !audit) {
      return NextResponse.json(
        { error: "Audit not found or access denied" },
        { status: 404 }
      );
    }
    
    // Only generate todos from completed audits
    if (audit.status !== "completed") {
      return NextResponse.json(
        { error: "Can only generate todos from completed audits" },
        { status: 400 }
      );
    }
    
    // Generate todos from the audit
    const result = await generateTodosFromAudit(auditId, projectId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to generate todos" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Generated ${result.count} todos from audit`
    });
  } catch (error: any) {
    console.error("Error generating todos:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
} 