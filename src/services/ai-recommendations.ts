import { createClient } from "@/lib/supabase/client"

export interface AiRecommendation {
  type: 'keyword' | 'crawl_setting' | 'competitor' | 'general'
  title: string
  description: string
  confidence: 'high' | 'medium' | 'low'
}

export interface AiRecommendationRequest {
  url: string
  industry?: string
  keywords?: string[]
  competitors?: string[]
  crawlFrequency?: 'monthly' | 'weekly' | 'daily'
  crawlDepth?: number
}

/**
 * Generate AI recommendations for a project based on the provided information
 */
export async function generateAiRecommendations(
  request: AiRecommendationRequest
): Promise<AiRecommendation[]> {
  try {
    // Call the API route that will use Azure OpenAI
    const response = await fetch('/api/ai/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`Error generating recommendations: ${response.statusText}`)
    }

    const data = await response.json()
    return data.recommendations
  } catch (error) {
    console.error('Error generating AI recommendations:', error)
    return []
  }
}

/**
 * Generate industry-specific recommendations based on the website URL and industry
 */
export async function detectIndustry(url: string): Promise<string | null> {
  try {
    const response = await fetch('/api/ai/detect-industry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    })

    if (!response.ok) {
      throw new Error(`Error detecting industry: ${response.statusText}`)
    }

    const data = await response.json()
    return data.industry
  } catch (error) {
    console.error('Error detecting industry:', error)
    return null
  }
}

/**
 * Get recommended competitors based on the website URL and industry
 */
export async function getRecommendedCompetitors(
  url: string,
  industry?: string
): Promise<{ name: string; url: string }[]> {
  try {
    const response = await fetch('/api/ai/recommend-competitors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, industry }),
    })

    if (!response.ok) {
      throw new Error(`Error getting recommended competitors: ${response.statusText}`)
    }

    const data = await response.json()
    return data.competitors
  } catch (error) {
    console.error('Error getting recommended competitors:', error)
    return []
  }
}

/**
 * Get recommended keywords based on the website URL and industry
 */
export async function getRecommendedKeywords(
  url: string,
  industry?: string
): Promise<string[]> {
  try {
    const response = await fetch('/api/ai/recommend-keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, industry }),
    })

    if (!response.ok) {
      throw new Error(`Error getting recommended keywords: ${response.statusText}`)
    }

    const data = await response.json()
    return data.keywords
  } catch (error) {
    console.error('Error getting recommended keywords:', error)
    return []
  }
}

/**
 * Save a project template
 */
export async function saveProjectTemplate(
  name: string,
  description: string | null,
  templateData: any,
  industry?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error("User not authenticated")
    }
    
    // Insert the template
    const { data, error } = await supabase
      .from('project_templates')
      .insert({
        name,
        description,
        organization_id: user.id,
        template_data: templateData,
        industry,
        is_default: false
      })
      .select('id')
      .single()
    
    if (error) {
      throw error
    }
    
    return { success: true, id: data.id }
  } catch (error) {
    console.error('Error saving project template:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get project templates for the current user's organization
 */
export async function getProjectTemplates(
  industry?: string
): Promise<any[]> {
  try {
    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error("User not authenticated")
    }
    
    // Query to get templates
    let query = supabase
      .from('project_templates')
      .select('*')
      .eq('organization_id', user.id)
    
    // Filter by industry if provided
    if (industry) {
      query = query.eq('industry', industry)
    }
    
    const { data, error } = await query
    
    if (error) {
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Error getting project templates:', error)
    return []
  }
} 