import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/supabase/database.types";

// Define the type for audit with project data
type AuditWithProject = Database["public"]["Tables"]["audits"]["Row"] & {
  projects: { name: string } | null;
}

// Define interface for issue data
interface AuditIssue {
  category: string;
  title?: string;
  severity?: string;
  url?: string;
  description?: string;
  recommendation?: string;
  [key: string]: any; // Allow additional properties
}

/**
 * GET handler for exporting an audit as CSV
 * @param request The incoming request
 * @param context The route context with params
 * @returns A CSV file or error response
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
      .eq("user_id", session.user.id)
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
    
    // Parse the report data
    const reportData = audit.report as any;
    
    if (!reportData) {
      return NextResponse.json(
        { error: "No report data available" },
        { status: 400 }
      );
    }
    
    // Generate CSV data
    const csvRows: string[] = [];
    
    // Add CSV headers
    csvRows.push([
      "Category",
      "Issue",
      "Severity",
      "URL",
      "Description",
      "Recommendation"
    ].join(","));
    
    // Extract issues from the report
    const issues: AuditIssue[] = [];
    
    // Technical issues
    if (reportData.issues?.technical) {
      reportData.issues.technical.forEach((issue: any) => {
        issues.push({
          category: "Technical",
          ...issue
        });
      });
    }
    
    // Content issues
    if (reportData.issues?.content) {
      reportData.issues.content.forEach((issue: any) => {
        issues.push({
          category: "Content",
          ...issue
        });
      });
    }
    
    // Performance issues
    if (reportData.issues?.performance) {
      reportData.issues.performance.forEach((issue: any) => {
        issues.push({
          category: "Performance",
          ...issue
        });
      });
    }
    
    // Add each issue to the CSV
    issues.forEach((issue: AuditIssue) => {
      csvRows.push([
        escapeCsvField(issue.category),
        escapeCsvField(issue.title || ""),
        escapeCsvField(issue.severity || ""),
        escapeCsvField(issue.url || audit.url),
        escapeCsvField(issue.description || ""),
        escapeCsvField(issue.recommendation || "")
      ].join(","));
    });
    
    // Join rows with newlines to create the CSV content
    const csvContent = csvRows.join("\n");
    
    // Return the CSV with proper headers
    const headers = new Headers();
    headers.set("Content-Type", "text/csv");
    headers.set(
      "Content-Disposition",
      `attachment; filename="audit-${audit.projects?.name || "report"}-${new Date(audit.created_at).toISOString().split("T")[0]}.csv"`
    );
    
    return new NextResponse(csvContent, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error exporting audit as CSV:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Helper function to escape CSV fields
 * @param field The field to escape
 * @returns The escaped field
 */
function escapeCsvField(field: any): string {
  if (field === null || field === undefined) {
    return "";
  }
  
  const stringField = String(field);
  
  // If the field contains quotes, commas, or newlines, it needs to be enclosed in quotes
  if (stringField.includes('"') || stringField.includes(',') || stringField.includes('\n')) {
    // Double up any quotes in the field
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  
  return stringField;
} 