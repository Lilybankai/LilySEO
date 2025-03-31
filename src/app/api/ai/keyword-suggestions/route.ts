import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server'

// Define the request and response types
interface KeywordSuggestionRequest {
  url: string
  industry?: string
  description?: string
  location?: string
}

interface KeywordSuggestion {
  keyword: string
  category: 'branded' | 'long-tail' | 'question' | 'location-based' | 'general'
  relevance: 'high' | 'medium' | 'low'
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
    const body: KeywordSuggestionRequest = await request.json()
    
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
          { error: 'Failed to generate keyword suggestions' },
          { status: 500 }
        );
      }
      
      const result = await response.json();
      
      // Parse the suggestions from the response
      const suggestions = parseKeywordSuggestions(result.choices[0]?.message?.content || '');
      
      // Return the suggestions, limiting to 15
      return NextResponse.json({ 
        suggestions: suggestions.slice(0, 15) 
      });
    } catch (error) {
      console.error('Error calling Azure OpenAI:', error);
      return NextResponse.json(
        { error: 'Failed to generate keyword suggestions' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating keyword suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to generate keyword suggestions' },
      { status: 500 }
    )
  }
}

/**
 * Construct the prompt for the OpenAI API
 */
function constructPrompt(data: KeywordSuggestionRequest): string {
  return `
Please generate SEO keyword suggestions for the following website:

Website URL: ${data.url}
${data.industry ? `Industry: ${data.industry}` : ''}
${data.description ? `Description: ${data.description}` : ''}
${data.location ? `Location: ${data.location}` : ''}

Based on this information, provide up to 15 specific, relevant keyword suggestions that would help improve the website's SEO performance.

Categorize the keywords into the following types:
- branded: Keywords that include the brand/company name
- long-tail: Longer, more specific keyword phrases
- question: Keywords phrased as questions (what, how, why, etc.)
- location-based: Keywords that include location information
- general: Other relevant keywords that don't fit the above categories

For each keyword suggestion, include:
1. The keyword phrase
2. The category (branded, long-tail, question, location-based, or general)
3. A relevance score (high, medium, or low)

Format your response as a JSON array of keyword suggestions, like this:
[
  {
    "keyword": "example keyword phrase",
    "category": "long-tail",
    "relevance": "high"
  },
  ...
]

Ensure that:
- No more than 15 keywords are provided
- Keywords are diverse and cover different user intents
- Location-based keywords are included if location is provided
- Keywords are relevant to the website's industry and description
`
}

/**
 * Parse the keyword suggestions from the OpenAI response
 */
function parseKeywordSuggestions(response: string): KeywordSuggestion[] {
  try {
    // Extract JSON from the response
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return generateFallbackSuggestions()
    }
    
    const suggestions = JSON.parse(jsonMatch[0])
    
    // Validate the suggestions
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      return generateFallbackSuggestions()
    }
    
    // Ensure each suggestion has the required fields
    return suggestions.map((suggestion: any) => ({
      keyword: suggestion.keyword || 'Suggestion',
      category: ['branded', 'long-tail', 'question', 'location-based', 'general'].includes(suggestion.category) 
        ? suggestion.category 
        : 'general',
      relevance: ['high', 'medium', 'low'].includes(suggestion.relevance) 
        ? suggestion.relevance 
        : 'medium'
    }))
  } catch (error) {
    console.error('Error parsing keyword suggestions:', error)
    return generateFallbackSuggestions()
  }
}

/**
 * Generate fallback keyword suggestions if parsing fails
 */
function generateFallbackSuggestions(): KeywordSuggestion[] {
  return [
    {
      keyword: "SEO best practices",
      category: "general",
      relevance: "high"
    },
    {
      keyword: "how to improve website ranking",
      category: "question",
      relevance: "medium"
    },
    {
      keyword: "long-tail keyword optimization strategy",
      category: "long-tail",
      relevance: "high"
    }
  ]
} 