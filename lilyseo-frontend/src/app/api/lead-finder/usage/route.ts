"use server";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkEnterpriseAccess, getRemainingSearches, getSearchHistory } from "@/services/lead-finder";

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

    // Get remaining searches for the current month
    const remainingSearches = await getRemainingSearches();
    
    // Get the user's search history
    const searchHistory = await getSearchHistory();
    
    // Get monthly limit
    const supabase = await createClient();
    const { data: limit } = await supabase
      .from("usage_limits")
      .select("monthly_limit")
      .eq("plan_type", "enterprise")
      .eq("feature_name", "lead_searches")
      .single();
    
    const monthlyLimit = limit?.monthly_limit || 250;
    
    // Calculate current month usage
    const currentDate = new Date();
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
    
    // Get the search count directly from the database
    const { data: searchCount, error: countError } = await supabase
      .from("lead_searches")
      .select("id", { count: "exact" })
      .gte("search_date", currentMonthStart);
    
    const usedSearches = searchCount || 0;
    
    // Get user's purchased packages
    const { data: { user } } = await supabase.auth.getUser();
    const { data: packages } = await supabase
      .from("user_search_packages")
      .select(`
        id,
        package_id,
        remaining_searches,
        purchase_date,
        expiry_date,
        search_packages:package_id (
          name,
          searches_count,
          price
        )
      `)
      .eq("user_id", user?.id || '')
      .order("purchase_date", { ascending: false });
    
    return NextResponse.json({
      user_id: user?.id,
      remaining_searches: remainingSearches,
      monthly_limit: monthlyLimit,
      used_searches: usedSearches,
      search_history: searchHistory,
      purchased_packages: packages || []
    });
  } catch (error: any) {
    console.error("Error fetching usage statistics:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch usage statistics" },
      { status: 500 }
    );
  }
} 