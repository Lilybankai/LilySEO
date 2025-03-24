import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserAuditLimits } from "@/lib/subscription";
import { startAudit } from "@/lib/crawler-service";

/**
 * GET handler for verifying and triggering scheduled audits
 * This endpoint checks projects that are due for audits based on their crawl frequency
 * and schedules new audits if needed.
 * 
 * @param request The incoming request
 * @returns A response with the scheduled audit information
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const authResponse = await supabase.auth.getSession();
    
    // Verify API key if this is an automated call
    const apiKey = request.headers.get("x-api-key");
    const isAutomatedCall = !!apiKey;
    
    if (isAutomatedCall) {
      // Verify the API key matches the expected value (would typically store this in env)
      const expectedApiKey = process.env.SCHEDULER_API_KEY;
      if (apiKey !== expectedApiKey) {
        return NextResponse.json(
          { error: "Invalid API key" },
          { status: 401 }
        );
      }
    } else if (!authResponse.data.session) {
      // If not an automated call, verify user authentication
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Determine date ranges for different crawl frequencies
    const now = new Date();
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(now.getDate() - 1);
    
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);
    
    // Fetch active projects with their latest audit dates
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select(`
        id, 
        name, 
        url, 
        user_id, 
        crawl_frequency, 
        crawl_depth,
        status,
        audits (
          id,
          created_at,
          status
        )
      `)
      .eq("status", "active")
      .order("created_at", { foreignTable: "audits", ascending: false });
      
    if (projectsError) {
      console.error("Error fetching projects:", projectsError);
      return NextResponse.json(
        { error: "Failed to fetch projects" },
        { status: 500 }
      );
    }
    
    if (!projects || projects.length === 0) {
      return NextResponse.json(
        { message: "No active projects found" },
        { status: 200 }
      );
    }
    
    // Keep track of projects needing audits
    const projectsDueForAudit: any[] = [];
    
    // Process each project
    for (const project of projects) {
      // Skip if no user_id (should never happen)
      if (!project.user_id) continue;
      
      // Check if the user has reached their audit limit
      const { remaining } = await getUserAuditLimits(project.user_id);
      if (remaining <= 0) {
        console.log(`User ${project.user_id} has reached their audit limit. Skipping project ${project.id}`);
        continue;
      }
      
      // Get the latest audit for this project
      const latestAudit = project.audits && project.audits.length > 0 ? project.audits[0] : null;
      
      // Determine if a new audit is needed based on crawl frequency
      let needsAudit = false;
      
      if (!latestAudit) {
        // No previous audit, so need to create one
        needsAudit = true;
      } else {
        const latestAuditDate = new Date(latestAudit.created_at);
        
        switch (project.crawl_frequency) {
          case "daily":
            needsAudit = latestAuditDate < oneDayAgo;
            break;
          case "weekly":
            needsAudit = latestAuditDate < oneWeekAgo;
            break;
          case "monthly":
          default:
            needsAudit = latestAuditDate < oneMonthAgo;
            break;
        }
      }
      
      // Skip if no audit is needed
      if (!needsAudit) continue;
      
      // Create a new audit record
      const { data: audit, error: auditError } = await supabase
        .from("audits")
        .insert({
          project_id: project.id,
          user_id: project.user_id,
          url: project.url,
          status: "pending",
          scheduled: true
        })
        .select()
        .single();
      
      if (auditError) {
        console.error(`Error creating audit for project ${project.id}:`, auditError);
        continue;
      }
      
      // Start the audit with the crawler service
      try {
        await startAudit(
          project.id,
          project.url,
          audit.id,
          {
            crawlDepth: project.crawl_depth || 3
          }
        );
        
        // Update the audit status to processing
        await supabase
          .from("audits")
          .update({ status: "processing" })
          .eq("id", audit.id);
        
        projectsDueForAudit.push({
          projectId: project.id,
          projectName: project.name,
          auditId: audit.id,
          frequency: project.crawl_frequency
        });
      } catch (error) {
        console.error(`Error starting audit for project ${project.id}:`, error);
        
        // Update the audit status to failed
        await supabase
          .from("audits")
          .update({ 
            status: "failed",
            report: { error: "Failed to start audit with crawler service" }
          })
          .eq("id", audit.id);
      }
    }
    
    return NextResponse.json({
      message: "Scheduled audits verification completed",
      scheduledAudits: projectsDueForAudit.length,
      audits: projectsDueForAudit
    });
  } catch (error) {
    console.error("Error verifying scheduled audits:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 