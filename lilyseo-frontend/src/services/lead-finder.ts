"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Database } from "@/lib/supabase/database.types";

export type Lead = Database['public']['Tables']['leads']['Row'];
export type LeadInsert = Omit<Database['public']['Tables']['leads']['Insert'], 'user_id'> & { user_id?: string };
export type LeadUpdate = Database['public']['Tables']['leads']['Update'];

export type LeadSearch = Database['public']['Tables']['lead_searches']['Row'];
export type LeadSearchInsert = Database['public']['Tables']['lead_searches']['Insert'];

export type SearchPackage = Database['public']['Tables']['search_packages']['Row'];
export type UserSearchPackage = Database['public']['Tables']['user_search_packages']['Row'];

/**
 * Check if the user has enterprise access
 * @returns Boolean indicating if the user has enterprise access
 */
export async function checkEnterpriseAccess(): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) return false;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", session.user.id)
      .single();
    
    if (error) {
      console.error("Error checking enterprise access:", error);
      return false;
    }
    
    return data?.subscription_tier === "enterprise";
  } catch (error) {
    console.error("Error checking enterprise access:", error);
    return false;
  }
}

/**
 * Set user to enterprise tier (helper for development)
 * @returns Boolean indicating if the operation was successful
 */
export async function setUserToEnterpriseTier(): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) return false;
    
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_tier: "enterprise" })
      .eq("id", session.user.id);
    
    if (error) {
      console.error("Error setting enterprise tier:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error setting enterprise tier:", error);
    return false;
  }
}

/**
 * Get user's remaining searches for the current month
 * @returns Number of remaining searches
 */
export async function getRemainingSearches(): Promise<number> {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return 0;
    
    const { data, error } = await supabase.rpc(
      "get_user_remaining_searches",
      { user_uuid: user.id }
    );
    
    if (error) {
      console.error("Error getting remaining searches:", error);
      // Return a default number to prevent blocking searches
      return 100; // Default fallback value
    }
    
    // TEMPORARY FIX: Ensure we always have some searches available 
    // We'll use the Serper API credits instead of our calculation
    return Math.max(50, data || 0); // Ensure at least 50 searches are available
  } catch (error) {
    console.error("Error getting remaining searches:", error);
    // Return a default number to prevent blocking searches
    return 50; // Default fallback value for any errors
  }
}

/**
 * Search for businesses using SerpApi
 * @param query Search query
 * @param location Location
 * @param minRating Minimum rating
 * @param maxRating Maximum rating
 * @param maxResults Maximum number of results
 * @returns Search results
 */
export async function searchBusinesses(
  query: string,
  location: string,
  minRating?: number,
  maxRating?: number,
  maxResults: number = 10
): Promise<any> {
  try {
    const supabase = await createClient();
    
    // Check enterprise access
    const hasAccess = await checkEnterpriseAccess();
    if (!hasAccess) {
      throw new Error("Enterprise access required");
    }
    
    // Check remaining searches
    const remainingSearches = await getRemainingSearches();
    if (remainingSearches <= 0) {
      throw new Error("No searches remaining. Please purchase more searches.");
    }
    
    // Call SerpApi
    const response = await fetch("https://serpapi.com/search", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 }, // Cache for 1 minute
      cache: "no-store",
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch from SerpApi");
    }
    
    const data = await response.json();
    
    // Filter results based on rating if provided
    let results = data.local_results || [];
    
    if (minRating !== undefined) {
      results = results.filter((result: any) => 
        result.rating && parseFloat(result.rating) >= minRating
      );
    }
    
    if (maxRating !== undefined) {
      results = results.filter((result: any) => 
        result.rating && parseFloat(result.rating) <= maxRating
      );
    }
    
    // Limit results
    results = results.slice(0, maxResults);
    
    // Record the search in database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("lead_searches").insert({
        user_id: user.id,
        search_query: query,
        location: location,
        results_count: results.length,
      });
    }
    
    return results;
  } catch (error) {
    console.error("Error searching businesses:", error);
    throw error;
  }
}

/**
 * Save a lead to the database
 * @param lead Lead data
 * @returns Saved lead
 */
export async function saveLead(lead: LeadInsert): Promise<Lead | null> {
  try {
    const supabase = await createClient();
    
    // Check enterprise access
    const hasAccess = await checkEnterpriseAccess();
    if (!hasAccess) {
      throw new Error("Enterprise access required");
    }
    
    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Save lead
    const { data, error } = await supabase
      .from("leads")
      .insert({
        ...lead,
        user_id: user.id,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    revalidatePath('/lead-finder');
    return data;
  } catch (error) {
    console.error("Error saving lead:", error);
    return null;
  }
}

/**
 * Get user's leads
 * @returns List of leads
 */
export async function getUserLeads(): Promise<Lead[]> {
  try {
    const supabase = await createClient();
    
    // Check enterprise access
    const hasAccess = await checkEnterpriseAccess();
    if (!hasAccess) {
      throw new Error("Enterprise access required");
    }
    
    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Get leads
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error getting leads:", error);
    return [];
  }
}

/**
 * Update a lead
 * @param id Lead ID
 * @param lead Updated lead data
 * @returns Updated lead
 */
export async function updateLead(id: string, lead: LeadUpdate): Promise<Lead | null> {
  try {
    const supabase = await createClient();
    
    // Check enterprise access
    const hasAccess = await checkEnterpriseAccess();
    if (!hasAccess) {
      throw new Error("Enterprise access required");
    }
    
    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Update lead
    const { data, error } = await supabase
      .from("leads")
      .update(lead)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();
    
    if (error) throw error;
    
    revalidatePath('/lead-finder');
    return data;
  } catch (error) {
    console.error("Error updating lead:", error);
    return null;
  }
}

/**
 * Delete a lead
 * @param id Lead ID
 * @returns Success status
 */
export async function deleteLead(id: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // Check enterprise access
    const hasAccess = await checkEnterpriseAccess();
    if (!hasAccess) {
      throw new Error("Enterprise access required");
    }
    
    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Delete lead
    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    
    if (error) throw error;
    
    revalidatePath('/lead-finder');
    return true;
  } catch (error) {
    console.error("Error deleting lead:", error);
    return false;
  }
}

/**
 * Get available search packages
 * @returns List of search packages
 */
export async function getSearchPackages(): Promise<SearchPackage[]> {
  try {
    const supabase = await createClient();
    
    // Get packages
    const { data, error } = await supabase
      .from("search_packages")
      .select("*")
      .eq("active", true)
      .order("searches_count", { ascending: true });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error getting search packages:", error);
    return [];
  }
}

/**
 * Purchase a search package
 * @param packageId Package ID
 * @returns Success status
 */
export async function purchaseSearchPackage(packageId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // Check enterprise access
    const hasAccess = await checkEnterpriseAccess();
    if (!hasAccess) {
      throw new Error("Enterprise access required");
    }
    
    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Get package
    const { data: packageData, error: packageError } = await supabase
      .from("search_packages")
      .select("*")
      .eq("id", packageId)
      .single();
    
    if (packageError || !packageData) throw new Error("Package not found");
    
    // Create user package
    const { error } = await supabase
      .from("user_search_packages")
      .insert({
        user_id: user.id,
        package_id: packageId,
        remaining_searches: packageData.searches_count,
      });
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error purchasing package:", error);
    return false;
  }
}

/**
 * Get user's search history
 * @returns List of searches
 */
export async function getSearchHistory(): Promise<LeadSearch[]> {
  try {
    const supabase = await createClient();
    
    // Check enterprise access
    const hasAccess = await checkEnterpriseAccess();
    if (!hasAccess) {
      throw new Error("Enterprise access required");
    }
    
    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Get searches
    const { data, error } = await supabase
      .from("lead_searches")
      .select("*")
      .eq("user_id", user.id)
      .order("search_date", { ascending: false })
      .limit(50);
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error getting search history:", error);
    return [];
  }
} 