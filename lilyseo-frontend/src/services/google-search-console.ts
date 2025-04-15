import { createClient } from "@/lib/supabase/client"

/**
 * Check if a project is connected to Google Search Console
 */
export async function isProjectConnectedToGSC(projectId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error("User not authenticated")
    }
    
    // Check if there's a GSC connection for this project
    const { data, error } = await supabase
      .from('google_search_console_connections')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking GSC connection:', error)
      return false
    }
    
    return !!data
  } catch (error) {
    console.error('Error checking GSC connection:', error)
    return false
  }
}

/**
 * Get the Google Search Console connection for a project
 */
export async function getGSCConnection(projectId: string): Promise<any | null> {
  try {
    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error("User not authenticated")
    }
    
    // Get the GSC connection for this project
    const { data, error } = await supabase
      .from('google_search_console_connections')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single()
    
    if (error) {
      if (error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error getting GSC connection:', error)
      }
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error getting GSC connection:', error)
    return null
  }
}

/**
 * Generate a Google OAuth URL for connecting to Search Console
 */
export async function generateGSCAuthUrl(projectId: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/google/auth?projectId=${projectId}`)
    
    if (!response.ok) {
      throw new Error(`Error generating GSC auth URL: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.url
  } catch (error) {
    console.error('Error generating GSC auth URL:', error)
    return null
  }
}

/**
 * Disconnect a project from Google Search Console
 */
export async function disconnectFromGSC(projectId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error("User not authenticated")
    }
    
    // Delete the GSC connection for this project
    const { error } = await supabase
      .from('google_search_console_connections')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', user.id)
    
    if (error) {
      console.error('Error disconnecting from GSC:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error disconnecting from GSC:', error)
    return false
  }
} 