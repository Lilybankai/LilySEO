import { createClient } from "@/lib/supabase/server";
import { checkFeatureAccess, logApiUsage } from "@/lib/api-utils";
import { createSuccessResponse, createErrorResponse } from "@/types/api";

// Azure OpenAI environment variables
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;

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

    // Extract domain for better branded keywords
    const domain = normalizedUrl.replace(/^https?:\/\//, '').replace(/www\./, '').split('/')[0];
    const domainName = domain.split('.')[0];
    
    // Prepare prompt for Azure OpenAI - optimized for o1-mini limitations
    const prompt = `Generate 15-20 SEO keyword suggestions for the website ${normalizedUrl}${industry ? ` in the ${industry} industry` : ''}. 
    
Include 5 keyword types:
1. Branded keywords containing "${domainName}"
2. Location-based keywords (global, local, etc.)
3. Long-tail keywords (4+ words)
4. Question keywords (how, what, why, etc.)
5. General keywords

List all keywords without numbering or categories.`;
    
    try {
      console.log('Making Azure OpenAI request with prompt:', prompt);
      
      // Direct fetch to Azure OpenAI API
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
          max_completion_tokens: 300  // Increased token limit
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error('Azure OpenAI API error:', error);
        return createErrorResponse('Failed to generate keyword suggestions', 500);
      }
      
      const result = await response.json();
      
      // Process the response
      let suggestedKeywords: string[] = [];
      try {
        const content = result.choices[0]?.message?.content?.trim() || "";
        console.log('Raw content from API:', content);
        
        if (content) {
          // Clean up the response and extract keywords
          suggestedKeywords = content
            .split(/[\n]/)  // Split by newlines first
            .flatMap((line: string) => line.split(/[,]/).map((k: string) => k.trim()))  // Then by commas
            .map((kw: string) => kw
              .replace(/^\d+\.\s*/, '')  // Remove numbering
              .replace(/^-\s*/, '')      // Remove bullet points
              .replace(/^["'`]+|["'`]+$/g, '') // Remove quotes
              .trim()
            )
            .filter((kw: string) => 
              kw.length > 2 && 
              !/^\d+$/.test(kw) &&  // No pure numbers
              !kw.toLowerCase().includes('keyword') // No meta-references
            );
        }
        
        // Organize keywords into categories to check which ones need filling
        const categorized = {
          branded: [] as string[],
          location: [] as string[],
          longTail: [] as string[],
          question: [] as string[],
          general: [] as string[]
        };
        
        // Categorize existing keywords
        suggestedKeywords.forEach((keyword: string) => {
          const lowerKeyword = keyword.toLowerCase();
          
          // Branded keywords (contain domain name)
          if (domainName && lowerKeyword.includes(domainName.toLowerCase())) {
            categorized.branded.push(keyword);
            return;
          }
          
          // Question keywords (start with how, what, why, when, where, which)
          if (/^(how|what|why|when|where|which)\s/.test(lowerKeyword)) {
            categorized.question.push(keyword);
            return;
          }
          
          // Location-based keywords (contain location names)
          if (/\b(global|local|regional|national|international|worldwide|country|city|america|europe|asia)\b/.test(lowerKeyword)) {
            categorized.location.push(keyword);
            return;
          }
          
          // Long-tail keywords (4+ words)
          if (keyword.split(' ').length >= 4) {
            categorized.longTail.push(keyword);
            return;
          }
          
          // General keywords (everything else)
          categorized.general.push(keyword);
        });
        
        console.log('Keywords by category:', categorized);
        
        // Add fallbacks for each category that has fewer than 2 items
        // Branded keywords fallbacks
        if (categorized.branded.length < 2) {
          const brandedFallbacks = [
            `${domainName}`,
            `${domainName} services`,
            `${domainName} pricing`,
            `${domainName} reviews`,
            `${domainName} alternatives`,
            `best ${domainName} plans`
          ];
          
          for (const fallback of brandedFallbacks) {
            if (!suggestedKeywords.includes(fallback)) {
              suggestedKeywords.push(fallback);
              categorized.branded.push(fallback);
              if (categorized.branded.length >= 3) break;
            }
          }
        }
        
        // Location-based keywords fallbacks
        if (categorized.location.length < 2) {
          const locationFallbacks = [
            `${industry || domainName} near me`,
            `local ${industry || 'business'} services`,
            `global ${industry || 'business'} solutions`,
            `${industry || 'business'} in united states`,
            `international ${industry || 'business'} providers`,
            `${industry || 'business'} services worldwide`
          ];
          
          for (const fallback of locationFallbacks) {
            if (!suggestedKeywords.includes(fallback)) {
              suggestedKeywords.push(fallback);
              categorized.location.push(fallback);
              if (categorized.location.length >= 3) break;
            }
          }
        }
        
        // Long-tail keywords fallbacks
        if (categorized.longTail.length < 2) {
          const longTailFallbacks = [
            `best ${industry || 'business'} tools for enterprises`,
            `affordable ${industry || 'business'} solutions for startups`,
            `${industry || 'business'} services for small companies`,
            `how to choose the right ${industry || 'business'} provider`,
            `top rated ${industry || 'business'} platforms for professionals`,
            `${industry || 'business'} automation tools for teams`
          ];
          
          for (const fallback of longTailFallbacks) {
            if (!suggestedKeywords.includes(fallback)) {
              suggestedKeywords.push(fallback);
              categorized.longTail.push(fallback);
              if (categorized.longTail.length >= 3) break;
            }
          }
        }
        
        // Question keywords fallbacks
        if (categorized.question.length < 2) {
          const questionFallbacks = [
            `how to find ${industry || 'business'} solutions`,
            `why use ${domainName} for ${industry || 'business'}`,
            `what makes a good ${industry || 'business'} platform`,
            `how does ${industry || 'business'} automation work`,
            `when to upgrade ${industry || 'business'} tools`,
            `which ${industry || 'business'} service is best`
          ];
          
          for (const fallback of questionFallbacks) {
            if (!suggestedKeywords.includes(fallback)) {
              suggestedKeywords.push(fallback);
              categorized.question.push(fallback);
              if (categorized.question.length >= 3) break;
            }
          }
        }
        
        // General keywords fallbacks
        if (categorized.general.length < 2) {
          const generalFallbacks = [
            `${industry || 'business'} software`,
            `${industry || 'business'} tools`,
            `${industry || 'business'} platforms`,
            `${industry || 'business'} solutions`,
            `${industry || 'business'} services`,
            `affordable ${industry || 'business'}`
          ];
          
          for (const fallback of generalFallbacks) {
            if (!suggestedKeywords.includes(fallback)) {
              suggestedKeywords.push(fallback);
              categorized.general.push(fallback);
              if (categorized.general.length >= 3) break;
            }
          }
        }
        
        console.log('Final keywords by category:', categorized);
        console.log('Final processed keywords:', suggestedKeywords);
      } catch (error) {
        console.error("Error parsing AI response:", error);
        return createErrorResponse("Failed to parse keyword suggestions", 500);
      }
      
      // Helper function to extract domain name
      function extractDomainName(url: string): string {
        try {
          const domain = new URL(url).hostname;
          return domain.replace(/^www\./, '').split('.')[0];
        } catch (e) {
          return "";
        }
      }
      
      // Log API usage
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