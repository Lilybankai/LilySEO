import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/supabase/database.types";

// Define the type for audit with project data
type AuditWithProject = Database["public"]["Tables"]["audits"]["Row"] & {
  projects: { name: string } | null;
}

/**
 * GET handler for exporting an audit as PDF
 * @param request The incoming request
 * @param context The route context with params
 * @returns A PDF file or error response
 */
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Fix for "params should be awaited" warning - use Promise.resolve
    const { id } = await Promise.resolve(context.params);
    
    // Get the current user's session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if the audit belongs to the user
    const { data: audit, error: auditError } = await supabase
      .from("audits")
      .select(`
        id,
        url,
        created_at,
        report,
        project_id,
        status,
        score,
        projects:project_id (name)
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single() as { data: AuditWithProject | null, error: any };
    
    if (auditError || !audit) {
      return NextResponse.json(
        { error: "Audit not found" },
        { status: 404 }
      );
    }
    
    // Check if the audit is completed
    if (audit.status !== "completed") {
      return NextResponse.json(
        { error: "Audit is not completed yet" },
        { status: 400 }
      );
    }
    
    // Get the white label settings for the user if they have them
    const { data: whiteLabel } = await supabase
      .from("white_label_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    
    // Call our internal PDF generator API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/export/pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-request": "true"
      },
      body: JSON.stringify({
        auditId: id,
        auditData: audit,
        whiteLabel: whiteLabel || null,
        userId: user.id,
      }),
    });
    
    if (!response.ok) {
      console.error("Failed to generate PDF:", await response.text());
      return NextResponse.json(
        { error: "Failed to generate PDF" },
        { status: 500 }
      );
    }
    
    // Get the PDF from the response
    const pdf = await response.blob();
    
    // Return the PDF with proper headers
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set(
      "Content-Disposition",
      `attachment; filename="audit-${audit.projects?.name || "report"}-${new Date(audit.created_at).toISOString().split("T")[0]}.pdf"`
    );
    
    return new NextResponse(pdf, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error exporting audit as PDF:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 