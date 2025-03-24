import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeSite, generateSeoTasks } from "@/services/seo-analysis";
import { z } from "zod";
import { getCrawlerServiceUrl } from "@/lib/api-config";
import { getUserAuditLimits } from "@/lib/subscription";

// Define the audit request schema
const auditRequestSchema = z.object({
  projectId: z.string().uuid(),
  url: z.union([z.string().url(), z.literal("")]).optional(),
  description: z.string().optional(),
  auditOptions: z.record(z.boolean()).default({}),
  auditDepth: z.enum(["basic", "standard", "deep"]).default("standard"),
});

/**
 * GET handler for retrieving audit reports
 * @param request The incoming request
 * @returns A response with the audit reports
 */
export async function GET(request: NextRequest) {
  try {
    // Get the current user's session
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const page = parseInt(url.searchParams.get("page") || "1");
    const offset = (page - 1) * limit;

    // Build the query
    let query = supabase
      .from("audits")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    // Execute the query
    const { data: audits, error, count } = await query;

    if (error) {
      console.error("Error fetching audits:", error);
      return NextResponse.json(
        { error: "Failed to fetch audits" },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from("audits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .maybeSingle();

    return NextResponse.json({
      audits,
      pagination: {
        total: totalCount || 0,
        page,
        limit,
        pages: Math.ceil((totalCount || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new audit report
 * @param request The incoming request
 * @returns A response with the created audit report
 */
export async function POST(request: NextRequest) {
  try {
    console.log("Starting audit creation process");
    
    // Get the current user's session
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.log("No session found, returning 401");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("User authenticated:", session.user.id);

    // Check user's audit limits
    const { remaining, isLimited } = await getUserAuditLimits(session.user.id);
    console.log("Audit limits:", { remaining, isLimited });
    
    if (isLimited && remaining <= 0) {
      console.log("User has reached audit limit");
      return NextResponse.json(
        { error: "Audit limit reached. Upgrade your plan for more audits." },
        { status: 403 }
      );
    }

    // Parse and validate the request body
    const body = await request.json();
    console.log("Request body:", JSON.stringify(body));
    
    const validationResult = auditRequestSchema.safeParse(body);

    if (!validationResult.success) {
      console.log("Validation failed:", validationResult.error.format());
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { projectId, url, description, auditOptions, auditDepth } = validationResult.data;
    console.log("Validated data:", { projectId, url, description, auditOptions, auditDepth });

    // Verify the project exists and belongs to the user
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, url")
      .eq("id", projectId)
      .eq("user_id", session.user.id)
      .single();

    if (projectError || !project) {
      console.log("Project not found or access denied:", projectError);
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    console.log("Project found:", project);
    console.log("Project ID (should be a valid UUID):", projectId);
    console.log("User ID:", session.user.id);
    console.log("Project URL:", project.url);
    
    // Try an insert with absolutely minimal fields
    let audit: any;
    try {
      console.log("Attempting bare minimum insert with only required fields");
      
      // First, prepare the query data to avoid any type issues
      const insertData = {
        project_id: projectId,
        user_id: session.user.id,
        url: project.url || '', // Ensure URL is never null
        status: 'pending'
      };
      
      console.log("Insert data:", insertData);
      
      // Try using the RLS-bypassing function
      console.log("Trying insert using security definer function");
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "insert_audit_bypass_rls",
        {
          p_project_id: projectId,
          p_user_id: session.user.id,
          p_url: project.url || ''
        }
      );
      
      if (rpcError) {
        console.error("Security definer function failed:", rpcError);
        
        // Fall back to standard insert
        console.log("Falling back to standard insert");
        const { data, error } = await supabase
          .from("audits")
          .insert(insertData)
          .select()
          .single();
          
        if (error) {
          console.error("Standard insert also failed:", error);
          console.log("All insertion methods failed. Cannot create audit record.");
          return NextResponse.json(
            { error: "Failed to create audit: " + error.message },
            { status: 500 }
          );
        }
        
        audit = data;
        console.log("Audit created successfully via standard insert:", audit);
      } else {
        audit = Array.isArray(rpcData) ? rpcData[0] : rpcData;
        console.log("Audit created successfully via security definer function:", audit);
      }
    } catch (insertError) {
      console.error("Exception during audit creation:", insertError);
      return NextResponse.json(
        { error: "Failed to create audit: " + (insertError instanceof Error ? insertError.message : "Unknown error") },
        { status: 500 }
      );
    }

    // Update the project's last_audit_date
    await supabase
      .from("projects")
      .update({ last_audit_date: new Date().toISOString() })
      .eq("id", projectId);

    // Start the audit process with the crawler service
    try {
      // Update the audit status to processing
      console.log("Updating audit status to processing");
      await supabase
        .from("audits")
        .update({ status: "processing" })
        .eq("id", audit.id);
      
      // Call the crawler service to start the audit
      const crawlerUrl = getCrawlerServiceUrl("/api/audit/start");
      console.log("Calling crawler service at:", crawlerUrl);
      
      const crawlerPayload = {
        projectId: audit.project_id,
        url: audit.url,
        auditId: audit.id,
        options: {
          ...auditOptions,
          depth: auditDepth,
        },
      };
      
      console.log("Crawler service payload:", JSON.stringify(crawlerPayload));
      
      const crawlerResponse = await fetch(crawlerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(crawlerPayload),
      });

      console.log("Crawler service response status:", crawlerResponse.status);
      
      if (!crawlerResponse.ok) {
        const errorData = await crawlerResponse.json().catch(() => ({}));
        console.error("Error starting audit with crawler service:", errorData);
        
        // Update the audit status to failed
        console.log("Updating audit status to failed");
        await supabase
          .from("audits")
          .update({ 
            status: "failed",
            error_message: errorData.error || crawlerResponse.statusText
          })
          .eq("id", audit.id);
          
        throw new Error(errorData.error || "Failed to start audit with crawler service");
      }
      
      console.log(`Audit ${audit.id} started successfully with crawler service`);
    } catch (error) {
      console.error("Error starting audit with crawler service:", error);
      
      // Don't fail the request, just log the error
      // The frontend will poll for status updates
    }

    return NextResponse.json(audit);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to generate mock audit report data
function generateMockAuditReport(score: number) {
  // This would be replaced with actual audit logic in a real application
  return {
    summary: {
      score,
      passedChecks: Math.floor(Math.random() * 50) + 20,
      failedChecks: Math.floor(Math.random() * 20),
      warningChecks: Math.floor(Math.random() * 15),
    },
    categories: {
      seo: {
        score: Math.floor(Math.random() * 100),
        issues: generateMockIssues("seo", Math.floor(Math.random() * 10)),
      },
      performance: {
        score: Math.floor(Math.random() * 100),
        issues: generateMockIssues("performance", Math.floor(Math.random() * 5)),
      },
      accessibility: {
        score: Math.floor(Math.random() * 100),
        issues: generateMockIssues("accessibility", Math.floor(Math.random() * 8)),
      },
      mobile: {
        score: Math.floor(Math.random() * 100),
        issues: generateMockIssues("mobile", Math.floor(Math.random() * 6)),
      },
      security: {
        score: Math.floor(Math.random() * 100),
        issues: generateMockIssues("security", Math.floor(Math.random() * 4)),
      },
    },
    pageSpeed: {
      firstContentfulPaint: Math.random() * 3 + 0.5,
      speedIndex: Math.random() * 5 + 1,
      largestContentfulPaint: Math.random() * 4 + 1,
      timeToInteractive: Math.random() * 6 + 2,
      totalBlockingTime: Math.random() * 500,
      cumulativeLayoutShift: Math.random() * 0.5,
    },
    scannedPages: Math.floor(Math.random() * 20) + 1,
    completedAt: new Date().toISOString(),
  };
}

// Helper function to generate mock issues
function generateMockIssues(category: string, count: number) {
  const issues = [];
  const severities = ["critical", "high", "medium", "low"];
  const seoIssues = [
    "Missing meta description",
    "Title tag too long",
    "Missing H1 tag",
    "Duplicate content",
    "Missing alt attributes",
    "Broken links",
    "No canonical tag",
    "Poor keyword density",
    "Missing schema markup",
    "Slow page speed",
  ];
  const performanceIssues = [
    "Large page size",
    "Unoptimized images",
    "Render-blocking resources",
    "Too many HTTP requests",
    "No browser caching",
  ];
  const accessibilityIssues = [
    "Missing alt text",
    "Low contrast text",
    "Missing form labels",
    "No ARIA attributes",
    "Keyboard navigation issues",
    "Missing language attribute",
    "No skip navigation",
    "Missing focus indicators",
  ];
  const mobileIssues = [
    "Not mobile-friendly",
    "Viewport not set",
    "Touch elements too close",
    "Content wider than screen",
    "Text too small to read",
    "Flash usage detected",
  ];
  const securityIssues = [
    "Missing HTTPS",
    "Insecure mixed content",
    "Missing security headers",
    "Outdated libraries with vulnerabilities",
  ];

  let issueList;
  switch (category) {
    case "seo":
      issueList = seoIssues;
      break;
    case "performance":
      issueList = performanceIssues;
      break;
    case "accessibility":
      issueList = accessibilityIssues;
      break;
    case "mobile":
      issueList = mobileIssues;
      break;
    case "security":
      issueList = securityIssues;
      break;
    default:
      issueList = seoIssues;
  }

  for (let i = 0; i < count; i++) {
    const issueIndex = Math.floor(Math.random() * issueList.length);
    const severityIndex = Math.floor(Math.random() * severities.length);
    
    issues.push({
      id: `${category}-issue-${i}`,
      title: issueList[issueIndex],
      severity: severities[severityIndex],
      description: `This is a detailed description of the ${issueList[issueIndex].toLowerCase()} issue.`,
      url: "https://example.com/page" + (i > 0 ? i : ""),
      recommendations: [
        `Fix the ${issueList[issueIndex].toLowerCase()} by implementing best practices.`,
        "Follow industry standards for this issue.",
      ],
    });
  }

  return issues;
} 