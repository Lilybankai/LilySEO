import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * GET handler for deleting an audit
 * @param request The incoming request
 * @param context The route context with params
 * @returns A redirect to the audits page
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
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Delete the audit
    const { error } = await supabase
      .from("audits")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);
    
    if (error) {
      return NextResponse.json(
        { error: "Failed to delete audit" },
        { status: 500 }
      );
    }
    
    // Invalidate the cache
    revalidatePath("/audits");
    
    // Redirect back to the audits page with a success message
    return NextResponse.redirect(new URL("/audits?deleted=true", request.url));
  } catch (error) {
    console.error("Error deleting audit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 