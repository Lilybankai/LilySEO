import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * POST handler for bulk actions on audits
 * @param request The incoming request
 * @returns A response or redirect
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const selectedAudits = formData.getAll("selectedAudits") as string[];
    const action = formData.get("action") as string;
    
    // Validate inputs
    if (!selectedAudits || selectedAudits.length === 0) {
      return NextResponse.json(
        { error: "No audits selected" },
        { status: 400 }
      );
    }
    
    if (!action) {
      return NextResponse.json(
        { error: "No action specified" },
        { status: 400 }
      );
    }
    
    // Get the current user's session
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Handle different actions
    switch (action) {
      case "delete":
        // Delete the selected audits
        const { error } = await supabase
          .from("audits")
          .delete()
          .in("id", selectedAudits)
          .eq("user_id", session.user.id);
        
        if (error) {
          return NextResponse.json(
            { error: "Failed to delete audits" },
            { status: 500 }
          );
        }
        
        // Invalidate the cache
        revalidatePath("/audits");
        
        // Redirect back to the audits page with a success message
        return NextResponse.redirect(new URL("/audits?deleted=true", request.url));
        
      case "export-pdf":
        // Queue PDF export for all selected audits
        // This is a server-side process, so we'll redirect to a new page showing the export status
        return NextResponse.redirect(new URL(`/audits/export?format=pdf&ids=${selectedAudits.join(",")}`, request.url));
        
      case "export-csv":
        // Queue CSV export for all selected audits
        return NextResponse.redirect(new URL(`/audits/export?format=csv&ids=${selectedAudits.join(",")}`, request.url));
        
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in bulk action:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 