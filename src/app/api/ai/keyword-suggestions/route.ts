import { createClient } from "@/lib/supabase/server";
import { checkFeatureAccess, logApiUsage } from "@/lib/api-utils";
import { createSuccessResponse, createErrorResponse } from "@/types/api";

// Azure OpenAI environment variables
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2023-05-15';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Check if Azure OpenAI credentials are configured
    if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_ENDPOINT) {
      return createErrorResponse('Azure OpenAI API not configured', 500);
    }
    
    // Create Supabase client using the proper async client
    const supabase = await createClient();
    
    // Check if the user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return createErrorResponse('Not authenticated', 401);
    }
    
    // Check subscription limits using our standalone utility
    const { allowed, message } = await checkFeatureAccess(
      supabase,
      session.user.id,
      'ai_keywords',
      1
    );
    
    if (!allowed) {
      return createErrorResponse(message, 403);
    }
    
    // Parse request body
    const body = await request.json();
    const { url, industry, projectName } = body;
    
    if (!url) {
      return createErrorResponse('URL is required', 400);
    }
    
    // Normalize URL for processing
    const normalizedUrl = url.startsWith('http') 
      ? url 
      : `https://${url}`;
    
    // Prepare prompt for Azure OpenAI - much simpler for o1-mini
    const prompt = `URL: ${normalizedUrl}${industry ? ` Industry: ${industry}` : ''}. Generate 10 SEO keywords.`;
    
    try {
      console.log('Making Azure OpenAI request with prompt:', prompt);
      
      // Direct fetch to Azure OpenAI API using the complete endpoint from .env
      const response = await fetch(AZURE_OPENAI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_OPENAI_API_KEY,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_completion_tokens: 100  // Reduced token limit
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error('Azure OpenAI API error:', error);
        return createErrorResponse('Failed to generate keyword suggestions', 500);
      }
      
      const result = await response.json();
      
      // Add detailed logging
      console.log('Azure OpenAI API complete response:', JSON.stringify(result, null, 2));
      
      // Process the response - handle plain text response
      let suggestedKeywords: string[] = [];
      try {
        const content = result.choices[0]?.message?.content?.trim() || "";
        console.log('Raw content from API:', content);
        
        if (content) {
          // Try to parse as JSON first if it happens to be JSON
          try {
            if (content.includes('[') && content.includes(']')) {
              // Extract JSON array if it's wrapped in code blocks or has extra text
              // Use a non-dotAll regex to avoid ES2018 requirement
              const jsonMatch = content.match(/\[([\s\S]*)\]/);
              if (jsonMatch) {
                console.log('Found JSON match:', jsonMatch[0]);
                suggestedKeywords = JSON.parse(jsonMatch[0]);
              }
            }
          } catch (jsonError) {
            console.log('Not valid JSON, processing as text:', jsonError);
          }
          
          // If still empty, process as plain text
          if (suggestedKeywords.length === 0) {
            // Split by common delimiters and clean up
            suggestedKeywords = content
              .split(/[\n,.-]/)
              .map((kw: string) => kw.trim())
              .filter((kw: string) => kw.length > 2 && !kw.toLowerCase().includes('keyword') && !/^\d+\./.test(kw));
          }
        }
        
        // If still empty, provide fallback keywords based on the URL/industry
        if (suggestedKeywords.length === 0) {
          const domain = normalizedUrl.replace(/^https?:\/\//, '').replace(/www\./, '').split('/')[0];
          suggestedKeywords = [
            domain,
            `${domain} services`,
            `${domain} benefits`,
            `${domain} pricing`,
            industry || 'business',
            `${industry || 'business'} solutions`,
            `best ${industry || 'business'} provider`,
            `${industry || 'business'} tips`,
            `affordable ${industry || 'business'} services`,
            `${industry || 'business'} near me`
          ];
        }
        
        console.log('Final processed keywords:', suggestedKeywords);
      } catch (error) {
        console.error("Error parsing AI response:", error);
        suggestedKeywords = [];
      }
      
      // Log API usage with our standalone utility
      await logApiUsage(
        supabase, 
        session.user.id, 
        'ai_keywords', 
        result.usage?.total_tokens || 0
      );
      
      return createSuccessResponse({
        keywords: suggestedKeywords,
        count: suggestedKeywords.length
      });
    } catch (error: any) {
      console.error("Error calling Azure OpenAI:", error);
      return createErrorResponse(error.message || "An error occurred while generating keyword suggestions", 500);
    }
  } catch (error: any) {
    console.error("Error in keyword suggestions API:", error);
    return createErrorResponse(error.message || "An error occurred while generating keyword suggestions", 500);
  }
} 