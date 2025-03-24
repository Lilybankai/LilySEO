"use server";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkEnterpriseAccess, saveLead, getUserLeads, updateLead, deleteLead } from "@/services/lead-finder";

export async function GET(request: NextRequest) {
  try {
    // Check if user has enterprise access
    const hasAccess = await checkEnterpriseAccess();
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Enterprise access required" },
        { status: 403 }
      );
    }

    // Get leads for the current user
    const leads = await getUserLeads();
    
    return NextResponse.json({ leads });
  } catch (error: any) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user has enterprise access
    const hasAccess = await checkEnterpriseAccess();
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Enterprise access required" },
        { status: 403 }
      );
    }

    // Parse the lead data from the request body
    const leadData = await request.json();
    
    // Validate required fields
    if (!leadData.business_name) {
      return NextResponse.json(
        { error: "Business name is required" },
        { status: 400 }
      );
    }
    
    // Save the lead
    const savedLead = await saveLead(leadData);
    
    if (!savedLead) {
      return NextResponse.json(
        { error: "Failed to save lead" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ lead: savedLead });
  } catch (error: any) {
    console.error("Error saving lead:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save lead" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if user has enterprise access
    const hasAccess = await checkEnterpriseAccess();
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Enterprise access required" },
        { status: 403 }
      );
    }

    // Parse the lead data from the request body
    const { id, ...leadData } = await request.json();
    
    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "Lead ID is required" },
        { status: 400 }
      );
    }
    
    // Update the lead
    const updatedLead = await updateLead(id, leadData);
    
    if (!updatedLead) {
      return NextResponse.json(
        { error: "Failed to update lead" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ lead: updatedLead });
  } catch (error: any) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update lead" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if user has enterprise access
    const hasAccess = await checkEnterpriseAccess();
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Enterprise access required" },
        { status: 403 }
      );
    }

    // Get the lead ID from the request URL
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    
    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "Lead ID is required" },
        { status: 400 }
      );
    }
    
    // Delete the lead
    const success = await deleteLead(id);
    
    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete lead" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting lead:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete lead" },
      { status: 500 }
    );
  }
} 