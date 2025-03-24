import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server'

// Define the request and response types
interface RecommendationRequest {
  url: string
  industry?: string
  keywords?: string[]
  competitors?: string[]
  crawlFrequency?: 'monthly' | 'weekly' | 'daily'
  crawlDepth?: number
}

interface Recommendation {
  type: 'keyword' | 'crawl_setting' | 'competitor' | 'general'
  title: string
  description: string
  confidence: 'high' | 'medium' | 'low'
}

export async function POST(request: Request) {
  try {
    // Authenticate the user
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Parse the request body
    const body: RecommendationRequest = await request.json()
    
    // Validate required fields
    if (!body.url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }
    
    // Initialize Azure OpenAI client
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT
    const apiKey = process.env.AZURE_OPENAI_API_KEY
    
    if (!endpoint || !apiKey) {
      return NextResponse.json(
        { error: 'OpenAI configuration is missing' },
        { status: 500 }
      )
    }
    
    // Construct the prompt
    const prompt = constructPrompt(body)
    
    try {
      // Direct fetch to Azure OpenAI API
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: prompt
            },
          ],
          max_completion_tokens: 1000
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error('Azure OpenAI API error:', error);
        return NextResponse.json(
          { error: 'Failed to generate recommendations' },
          { status: 500 }
        );
      }
      
      const result = await response.json();
      
      // Parse the recommendations from the response
      const recommendations = parseRecommendations(result.choices[0]?.message?.content || '');
      
      // Return the recommendations
      return NextResponse.json({ recommendations });
    } catch (error) {
      console.error('Error calling Azure OpenAI:', error);
      return NextResponse.json(
        { error: 'Failed to generate recommendations' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}

/**
 * Construct the prompt for the OpenAI API
 */
function constructPrompt(data: RecommendationRequest): string {
  return `
Please analyze the following website and provide SEO recommendations:

Website URL: ${data.url}
${data.industry ? `Industry: ${data.industry}` : ''}
${data.keywords && data.keywords.length > 0 ? `Target Keywords: ${data.keywords.join(', ')}` : ''}
${data.competitors && data.competitors.length > 0 ? `Competitors: ${data.competitors.join(', ')}` : ''}
${data.crawlFrequency ? `Current Crawl Frequency: ${data.crawlFrequency}` : ''}
${data.crawlDepth !== undefined ? `Current Crawl Depth: ${data.crawlDepth}` : ''}

Based on this information, provide 5-7 specific, actionable recommendations for improving the website's SEO performance. 

For each recommendation, include:
1. A short, descriptive title
2. A detailed explanation of the recommendation
3. The type of recommendation (keyword, crawl_setting, competitor, or general)
4. A confidence level (high, medium, or low)

Format your response as a JSON array of recommendations, like this:
[
  {
    "type": "keyword",
    "title": "Target Long-Tail Keywords",
    "description": "Based on your industry, consider targeting these long-tail keywords...",
    "confidence": "high"
  },
  ...
]
`
}

/**
 * Parse the recommendations from the OpenAI response
 */
function parseRecommendations(response: string): Recommendation[] {
  try {
    // Extract JSON from the response
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return generateFallbackRecommendations()
    }
    
    const recommendations = JSON.parse(jsonMatch[0])
    
    // Validate the recommendations
    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      return generateFallbackRecommendations()
    }
    
    // Ensure each recommendation has the required fields
    return recommendations.map((rec: any) => ({
      type: ['keyword', 'crawl_setting', 'competitor', 'general'].includes(rec.type) 
        ? rec.type 
        : 'general',
      title: rec.title || 'Recommendation',
      description: rec.description || 'No description provided',
      confidence: ['high', 'medium', 'low'].includes(rec.confidence) 
        ? rec.confidence 
        : 'medium'
    }))
  } catch (error) {
    console.error('Error parsing recommendations:', error)
    return generateFallbackRecommendations()
  }
}

/**
 * Generate fallback recommendations if parsing fails
 */
function generateFallbackRecommendations(): Recommendation[] {
  return [
    {
      type: 'general',
      title: 'Improve Page Speed',
      description: 'Fast-loading pages improve user experience and SEO rankings. Consider optimizing images, minifying CSS and JavaScript, and leveraging browser caching.',
      confidence: 'high'
    },
    {
      type: 'keyword',
      title: 'Conduct Keyword Research',
      description: 'Identify relevant keywords for your industry and incorporate them naturally into your content, meta descriptions, and headers.',
      confidence: 'high'
    },
    {
      type: 'crawl_setting',
      title: 'Optimize Crawl Settings',
      description: 'Consider increasing your crawl frequency to ensure search engines have the most up-to-date version of your site.',
      confidence: 'medium'
    }
  ]
} 