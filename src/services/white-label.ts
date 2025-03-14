import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'

export type WhiteLabelSettings = Database['public']['Tables']['white_label_settings']['Row']
export type WhiteLabelSettingsInsert = Database['public']['Tables']['white_label_settings']['Insert']
export type WhiteLabelSettingsUpdate = Database['public']['Tables']['white_label_settings']['Update']

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
  const supabase = createClient()
  
  // Check if settings already exist
  const { data: existingSettings } = await supabase
    .from('white_label_settings')
    .select('id')
    .single()
  
  let result
  
  if (existingSettings) {
    // Update existing settings
    result = await supabase
      .from('white_label_settings')
      .update(settings)
      .eq('id', existingSettings.id)
      .select()
      .single()
  } else {
    // Create new settings
    result = await supabase
      .from('white_label_settings')
      .insert({
        ...settings,
        user_id: (await supabase.auth.getUser()).data.user?.id
      } as WhiteLabelSettingsInsert)
      .select()
      .single()
  }
  
  if (result.error) {
    console.error('Error saving white label settings:', result.error)
    return null
  }
  
  // Clear the cache after saving
  clearWhiteLabelSettingsCache();
  
  return result.data
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
  const supabase = createClient()
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_status')
    .single()
  
  if (error || !profile) {
    console.error('Error checking white label access:', error)
    return false
  }
  
  // Only pro and enterprise users with active subscriptions have access
  const hasAccess = 
    (profile.subscription_tier === 'pro' || profile.subscription_tier === 'enterprise') && 
    (profile.subscription_status === 'active' || profile.subscription_status === 'trialing')
  
  return hasAccess
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