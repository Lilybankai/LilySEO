"use server";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkEnterpriseAccess, getSearchPackages, purchaseSearchPackage } from "@/services/lead-finder";

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

    // Get available search packages
    const packages = await getSearchPackages();
    
    return NextResponse.json({ packages });
  } catch (error: any) {
    console.error("Error fetching search packages:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch search packages" },
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

    // Parse the package data from the request body
    const { packageId } = await request.json();
    
    // Validate required fields
    if (!packageId) {
      return NextResponse.json(
        { error: "Package ID is required" },
        { status: 400 }
      );
    }
    
    // Purchase the package
    const success = await purchaseSearchPackage(packageId);
    
    if (!success) {
      return NextResponse.json(
        { error: "Failed to purchase package" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: "Package purchased successfully"
    });
  } catch (error: any) {
    console.error("Error purchasing package:", error);
    return NextResponse.json(
      { error: error.message || "Failed to purchase package" },
      { status: 500 }
    );
  }
} 