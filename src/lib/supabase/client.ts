import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

// Create a single instance of the Supabase client to avoid multiple instances
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

export const createClient = () => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("⚠️ CRITICAL: Missing Supabase environment variables!");
    console.error(`URL defined: ${!!supabaseUrl}, Key defined: ${!!supabaseAnonKey}`);
    throw new Error('Missing Supabase environment variables')
  }

  try {
    console.log("🔌 Creating new browser Supabase client with URL:", supabaseUrl);
    
    // Use createBrowserClient instead of createClient for better cookie handling
    supabaseInstance = createBrowserClient<Database>(
      supabaseUrl,
      supabaseAnonKey
    );
    
    // Test the connection
    supabaseInstance.auth.getSession().then(({ data }) => {
      console.log("✅ Supabase client session check:", data.session ? "Active session" : "No active session");
    }).catch(err => {
      console.error("❌ Supabase client session check failed:", err);
    });
    
    return supabaseInstance;
  } catch (error) {
    console.error("❌ Failed to create Supabase client:", error);
    throw error;
  }
} 