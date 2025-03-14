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
    throw new Error('Missing Supabase environment variables')
  }

  console.log("Creating browser Supabase client with URL:", supabaseUrl);
  
  // Use createBrowserClient instead of createClient for better cookie handling
  supabaseInstance = createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );
  
  return supabaseInstance;
} 