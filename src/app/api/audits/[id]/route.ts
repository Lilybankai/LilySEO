import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET handler for retrieving a specific audit report
 * @param request The incoming request
 * @param params The route parameters
 * @returns A response with the audit report
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Get user data
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get the audit report
    const { data, error } = await supabase
      .from("audits")
      .select(`
        *,
        projects:project_id (
          id,
          name,
          url
        )
      `)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { error: "Audit report not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting a specific audit report
 * @param request The incoming request
 * @param params The route parameters
 * @returns A response indicating success or failure
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Get user data
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Verify that the audit report belongs to the user
    const { data: existingAudit, error: auditError } = await supabase
      .from("audits")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();
    
    if (auditError || !existingAudit) {
      return NextResponse.json(
        { error: "Audit report not found or access denied" },
        { status: 404 }
      );
    }
    
    // Delete the audit report
    const { error: deleteError } = await supabase
      .from("audits")
      .delete()
      .eq("id", params.id);
    
    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
} 