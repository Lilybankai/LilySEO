import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'

// Add a function that checks if we're on the server-side
const isServerSide = () => typeof window === 'undefined';

// Create a server-specific import that won't be bundled on the client side
let getServerClient: any = null;
if (isServerSide()) {
  // Dynamic import only on server side
  getServerClient = async () => {
    const { createClient: createServerClient } = await import('@/lib/supabase/server');
    return createServerClient();
  };
}

export type WhiteLabelSettings = Database['public']['Tables']['white_label_settings']['Row']
export type WhiteLabelSettingsInsert = Database['public']['Tables']['white_label_settings']['Insert']
export type WhiteLabelSettingsUpdate = Database['public']['Tables']['white_label_settings']['Update']

// Add PDF defaults types
export interface PdfDefaults {
  font_family: string;
  page_size: 'A4' | 'LETTER' | 'LEGAL';
  color_mode: 'Full' | 'Grayscale';
  output_quality: 'Draft' | 'Standard' | 'High';
  include_options: {
    executiveSummary: boolean;
    technicalSEO: boolean;
    onPageSEO: boolean;
    offPageSEO: boolean;
    performance: boolean;
    userExperience: boolean;
    insights: boolean;
    recommendations: boolean;
    charts: boolean;
    branding: boolean;
  };
}

// Extend the WhiteLabelSettings type to include pdf_defaults
declare module '@/lib/supabase/database.types' {
  interface Tables {
    white_label_settings: {
      Row: {
        pdf_defaults?: PdfDefaults;
      } & Database['public']['Tables']['white_label_settings']['Row'];
      Insert: {
        pdf_defaults?: PdfDefaults;
      } & Database['public']['Tables']['white_label_settings']['Insert'];
      Update: {
        pdf_defaults?: PdfDefaults;
      } & Database['public']['Tables']['white_label_settings']['Update'];
    }
  }
}

export type NavigationItem = {
  name: string
  href: string
  current: boolean
}

export type FooterNavigationItem = {
  name: string
  href: string
}

export type FooterNavigation = {
  main?: FooterNavigationItem[]
  legal?: FooterNavigationItem[]
}

export type SocialLinks = {
  facebook?: string
  twitter?: string
  instagram?: string
  linkedin?: string
  github?: string
}

/**
 * Uploads a logo file to Supabase storage and returns the public URL
 */
export async function uploadLogo(file: File): Promise<string | null> {
  const supabase = createClient()
  
  // Get the current user ID
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('No authenticated user found')
    return null
  }
  
  // Generate a unique file name
  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}-${Date.now()}.${fileExt}`
  const filePath = `logos/${fileName}`
  
  // Upload the file to Supabase storage
  const { data, error } = await supabase.storage
    .from('white-label')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    })
  
  if (error) {
    console.error('Error uploading logo:', error)
    return null
  }
  
  // Get the public URL for the uploaded file
  const { data: { publicUrl } } = supabase.storage
    .from('white-label')
    .getPublicUrl(filePath)
  
  return publicUrl
}

// Cache for white label settings
let whiteLabelSettingsCache: {
  settings: WhiteLabelSettings | null;
  timestamp: number;
} | null = null;

// Cache expiration time in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

/**
 * Fetches white label settings for the current user with caching
 */
export async function fetchWhiteLabelSettings(): Promise<WhiteLabelSettings | null> {
  // Check if we have cached settings that are still valid
  if (
    whiteLabelSettingsCache && 
    whiteLabelSettingsCache.settings && 
    Date.now() - whiteLabelSettingsCache.timestamp < CACHE_EXPIRATION
  ) {
    return whiteLabelSettingsCache.settings;
  }
  
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('white_label_settings')
    .select('*')
    .single()
  
  if (error) {
    console.error('Error fetching white label settings:', error)
    return null
  }
  
  // Update the cache
  whiteLabelSettingsCache = {
    settings: data,
    timestamp: Date.now()
  };
  
  return data
}

/**
 * Clears the white label settings cache
 */
export function clearWhiteLabelSettingsCache(): void {
  whiteLabelSettingsCache = null;
}

/**
 * Creates or updates white label settings for the current user
 */
export async function saveWhiteLabelSettings(settings: WhiteLabelSettingsUpdate): Promise<WhiteLabelSettings | null> {
  console.log('SAVE ATTEMPT: Starting saveWhiteLabelSettings with settings:', JSON.stringify(settings, null, 2));
  try {
    const supabase = createClient();
    console.log('SAVE DEBUG: Supabase client created');
  
    // Check if settings already exist
    const { data: existingSettings, error: checkError } = await supabase
      .from('white_label_settings')
      .select('id')
      .single();
  
    if (checkError) {
      console.error('SAVE ERROR: Error checking existing settings:', checkError);
      return null;
    } else {
      console.log('SAVE DEBUG: Existing settings check result:', existingSettings ? `Found ID: ${existingSettings.id}` : 'No existing settings');
    }
  
    let result;
  
    if (existingSettings) {
      // Update existing settings
      console.log('SAVE DEBUG: Updating existing settings with ID:', existingSettings.id);
      console.log('SAVE DEBUG: PDF defaults being saved:', JSON.stringify(settings.pdf_defaults, null, 2));
    
      result = await supabase
        .from('white_label_settings')
        .update(settings)
        .eq('id', existingSettings.id)
        .select();
    } else {
      // Create new settings
      console.log('SAVE DEBUG: Creating new white label settings');
      const userData = await supabase.auth.getUser();
      const userId = userData.data.user?.id;
      console.log('SAVE DEBUG: User ID for new settings:', userId);
    
      if (!userId) {
        console.error('SAVE ERROR: No user ID available for creating settings');
        return null;
      }
    
      result = await supabase
        .from('white_label_settings')
        .insert({
          ...settings,
          user_id: userId
        } as WhiteLabelSettingsInsert)
        .select();
    }
  
    if (result.error) {
      console.error('SAVE ERROR: Error saving white label settings:', result.error);
      console.error('SAVE ERROR: Error details:', result.error.message, result.error.details);
      return null;
    }
  
    if (!result.data || result.data.length === 0) {
      console.error('SAVE ERROR: No data returned after save operation');
      return null;
    }
  
    console.log('SAVE SUCCESS: White label settings saved successfully:', JSON.stringify(result.data[0], null, 2));
  
    // Clear the cache after saving
    clearWhiteLabelSettingsCache();
  
    return result.data[0];
  } catch (error) {
    console.error('SAVE EXCEPTION: Unexpected error in saveWhiteLabelSettings:', error);
    return null;
  }
}

/**
 * Activates or deactivates white label settings
 */
export async function toggleWhiteLabelActive(isActive: boolean): Promise<boolean> {
  const supabase = createClient()
  
  const { data: existingSettings } = await supabase
    .from('white_label_settings')
    .select('id')
    .single()
  
  if (!existingSettings) {
    console.error('No white label settings found to toggle')
    return false
  }
  
  const { error } = await supabase
    .from('white_label_settings')
    .update({ is_active: isActive })
    .eq('id', existingSettings.id)
  
  if (error) {
    console.error('Error toggling white label settings:', error)
    return false
  }
  
  return true
}

/**
 * Checks if the current user has access to white label features
 * based on their subscription tier
 */
export async function checkWhiteLabelAccess(): Promise<boolean> {
  try {
    const supabase = createClient()
    
    console.log("Checking white label access...")
    
    // Get the current user ID first
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("Error getting user:", userError?.message || "No user found");
      return false;
    }
    
    console.log("User ID for profile query:", user.id);
    
    // Debug to check if we have a valid user ID
    if (!user.id) {
      console.error("Invalid user ID:", user);
      return false;
    }
    
    // Query profile with explicit user ID
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status')
      .eq('id', user.id)
      .single()
    
    if (error) {
      console.error("Error fetching profile:", error.message);
      console.error("Error details:", JSON.stringify(error));
      return false
    }
    
    if (!profile) {
      console.error("No profile found");
      return false
    }
    
    console.log("Profile data:", JSON.stringify(profile))
    
    // Only pro and enterprise users with active subscriptions have access
    const hasAccess = 
      (profile.subscription_tier === 'pro' || profile.subscription_tier === 'enterprise') && 
      (profile.subscription_status === 'active' || profile.subscription_status === 'trialing')
    
    console.log("Has white label access:", hasAccess)
    
    return hasAccess
  } catch (error) {
    console.error("Unexpected error in checkWhiteLabelAccess:", error);
    return false;
  }
}

/**
 * Gets default navigation items
 */
export function getDefaultNavigation(): NavigationItem[] {
  return [
    { name: 'Home', href: '/', current: true },
    { name: 'Features', href: '/features', current: false },
    { name: 'Pricing', href: '/pricing', current: false },
    { name: 'Blog', href: '/blog', current: false },
    { name: 'Contact', href: '/contact', current: false },
  ]
}

/**
 * Gets default footer navigation items
 */
export function getDefaultFooterNavigation(): FooterNavigation {
  return {
    main: [
      { name: 'Home', href: '/' },
      { name: 'Features', href: '/features' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'Blog', href: '/blog' },
      { name: 'About', href: '/about' },
      { name: 'Contact', href: '/contact' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
    ],
  }
}

/**
 * Gets default social links
 */
export function getDefaultSocialLinks(): SocialLinks {
  return {
    facebook: 'https://facebook.com',
    twitter: 'https://twitter.com',
    instagram: 'https://instagram.com',
    linkedin: 'https://linkedin.com',
    github: 'https://github.com',
  }
} 