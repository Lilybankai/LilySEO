import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Unified AI content generation API
 * 
 * This endpoint generates all needed AI content for a PDF report in a single request,
 * allowing for more consistent and cohesive content across sections.
 */
export async function POST(request: Request) {
  console.log('[Unified AI Content Generator] Request received');
  // Track the start time for performance monitoring
  const startTime = Date.now();
  const requestId = `req_${Math.random().toString(36).substring(2, 15)}`;
  
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log(`[Unified AI Content Generator][${requestId}] Authentication failed - no user found`);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.log(`[Unified AI Content Generator][${requestId}] Authentication successful for user: ${user.id}`);
    
    // Parse request
    const body = await request.json();
    const { data } = body;
    
    console.log(`[Unified AI Content Generator][${requestId}] Data received:`, JSON.stringify({
      dataType: typeof data,
      hasUrl: !!data?.url,
      url: data?.url?.substring(0, 50),
      dataKeys: Object.keys(data || {}),
      issuesCount: data?.issues?.length || 0,
      userId: user.id
    }));
    
    if (!data) {
      console.log(`[Unified AI Content Generator][${requestId}] Error: Missing required parameters`);
      return NextResponse.json(
        { error: 'Missing required parameter: data' },
        { status: 400 }
      );
    }
    
    // Check Azure OpenAI API credentials before proceeding
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
    
    console.log(`[Unified AI Content Generator][${requestId}] Azure OpenAI config check:`, {
      hasEndpoint: !!endpoint,
      endpointPrefix: endpoint?.substring(0, 30),
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length,
      hasDeploymentName: !!deploymentName,
      deploymentName: deploymentName,
    });
    
    if (!endpoint || !apiKey || !deploymentName) {
      console.error(`[Unified AI Content Generator][${requestId}] Azure OpenAI credentials missing`);
      throw new Error('Azure OpenAI credentials not fully configured');
    }
    
    // Generate the prompts for each section
    const executiveSummaryPrompt = generateExecutiveSummaryPrompt(data);
    const recommendationsPrompt = generateRecommendationsPrompt(data);
    const technicalExplanationsPrompt = generateTechnicalExplanationsPrompt(data);
    
    // Log prompt lengths for debugging
    console.log(`[Unified AI Content Generator][${requestId}] Prompt lengths:`, {
      executiveSummaryPromptLength: executiveSummaryPrompt.length,
      recommendationsPromptLength: recommendationsPrompt.length,
      technicalExplanationsPromptLength: technicalExplanationsPrompt.length
    });
    
    // Call Azure OpenAI for each section in parallel
    console.log(`[Unified AI Content Generator][${requestId}] Generating content for all sections`);
    
    try {
      const [executiveSummary, recommendations, technicalExplanations] = await Promise.all([
        callAzureOpenAI(executiveSummaryPrompt, false, `${requestId}_exec`).catch(error => {
          console.error(`[Unified AI Content Generator][${requestId}] Executive summary generation failed:`, error);
          return "Unable to generate executive summary due to an API error. Please try again later.";
        }),
        callAzureOpenAI(recommendationsPrompt, false, `${requestId}_rec`).catch(error => {
          console.error(`[Unified AI Content Generator][${requestId}] Recommendations generation failed:`, error);
          return "Unable to generate recommendations due to an API error.";
        }),
        callAzureOpenAI(technicalExplanationsPrompt, true, `${requestId}_tech`).catch(error => {
          console.error(`[Unified AI Content Generator][${requestId}] Technical explanations generation failed:`, error);
          return "{}";
        })
      ]);
      
      // Parse the JSON response for technical explanations
      let parsedTechnicalExplanations: Record<string, string> = {};
      try {
        console.log(`[Unified AI Content Generator][${requestId}] Parsing technical explanations`);
        console.log(`[Unified AI Content Generator][${requestId}] Technical explanations type:`, typeof technicalExplanations);
        console.log(`[Unified AI Content Generator][${requestId}] Technical explanations first 100 chars:`, 
          typeof technicalExplanations === 'string' ? technicalExplanations.substring(0, 100) + '...' : 'Not a string');
          
        parsedTechnicalExplanations = JSON.parse(technicalExplanations);
        console.log(`[Unified AI Content Generator][${requestId}] Successfully parsed technical explanations with ${Object.keys(parsedTechnicalExplanations).length} items`);
      } catch (error) {
        console.error(`[Unified AI Content Generator][${requestId}] Error parsing technical explanations:`, error);
        console.log(`[Unified AI Content Generator][${requestId}] Raw technical explanations response:`, technicalExplanations);
        // Create a fallback if parsing fails
        parsedTechnicalExplanations = {};
        (data.issues || []).slice(0, 5).forEach((issue: any) => {
          if (issue && issue.id) {
            parsedTechnicalExplanations[issue.id] = 
              `Technical explanation for: ${issue.title}. This is a fallback explanation due to parsing error.`;
          }
        });
      }
      
      // Process recommendations to ensure they're in an array format
      const recommendationsArray = recommendations
        .split('\n\n')
        .filter((rec: string) => rec.trim().length > 0)
        .map((rec: string) => rec.trim());
      
      console.log(`[Unified AI Content Generator][${requestId}] Content generation successful:`, {
        summaryLength: executiveSummary?.length || 0,
        recommendationsCount: recommendationsArray?.length || 0,
        technicalExplanationsCount: Object.keys(parsedTechnicalExplanations).length
      });
      
      // Capture total processing time
      const totalTime = Date.now() - startTime;
      console.log(`[Unified AI Content Generator][${requestId}] Total processing time: ${totalTime}ms`);
      
      // Create the response
      const response = {
        executiveSummary,
        recommendations: recommendationsArray,
        technicalExplanations: parsedTechnicalExplanations,
        generatedAt: new Date().toISOString(),
        processingTimeMs: totalTime,
        requestId: requestId
      };
      
      // Log debug info to help diagnose client-side issues
      console.log(`[Unified AI Content Generator][${requestId}] Response data structure:`, 
        JSON.stringify({
          hasExecutiveSummary: !!response.executiveSummary,
          execSummaryLength: response.executiveSummary?.length,
          recommendationsCount: response.recommendations?.length,
          technicalExplanationsCount: Object.keys(response.technicalExplanations).length
        })
      );
      
      return NextResponse.json(response);
    } catch (apiError) {
      console.error(`[Unified AI Content Generator][${requestId}] API call error:`, apiError);
      throw apiError; // Re-throw to be caught by outer try/catch
    }
  } catch (error) {
    console.error(`[Unified AI Content Generator][${requestId}] Error:`, error);
    // Return a proper error response with more details
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = {
      error: 'Failed to generate content',
      details: errorMessage,
      timestamp: new Date().toISOString(),
      requestId: requestId
    };
    
    console.log(`[Unified AI Content Generator][${requestId}] Returning error response:`, errorResponse);
    
    return NextResponse.json(
      errorResponse,
      { status: 500 }
    );
  }
}

/**
 * Generate a prompt for executive summary
 */
function generateExecutiveSummaryPrompt(data: any): string {
  return `
Generate a professional, concise executive summary for an SEO audit report with the following details:

URL: ${data.url}
Domain: ${data.domainName}
Overall Score: ${data.overallScore}/100

Category Scores:
${Object.entries(data.categoryScores || {})
  .map(([category, score]) => `- ${category}: ${score}/100`)
  .join('\n')}

Top Issues:
${(data.issues || [])
  .filter((issue: any) => issue.severity === 'high')
  .slice(0, 5)
  .map((issue: any) => `- ${issue.title}`)
  .join('\n')}

Top Strengths:
${(data.strengths || []).map((strength: string) => `- ${strength}`).join('\n')}

Instructions:
1. Keep the summary concise (240-280 words) and professional
2. Highlight the overall health of the site based on the score
3. Identify patterns across categories and suggest strategic focus areas
4. Provide a forward-looking statement about potential improvements
5. Explain the business impact of addressing the key issues
6. Use a confident, data-driven tone that would appeal to executives
7. Incorporate SEO industry best practices and current standards

Output the executive summary in paragraph form, with no headings or additional formatting.
`;
}

/**
 * Generate a prompt for recommendations
 */
function generateRecommendationsPrompt(data: any): string {
  return `
Generate actionable, prioritized SEO recommendations based on these issues found for ${data.url}:

${(data.issues || [])
  .slice(0, 10)
  .map((issue: any) => 
    `- ${issue.title} (${issue.severity} severity, ${issue.category} category)
     Description: ${issue.description}`
  )
  .join('\n\n')}

Instructions:
1. Create 5-7 strategic, actionable recommendations that address these issues
2. Prioritize recommendations based on:
   - Potential business impact
   - Implementation difficulty
   - Long-term SEO value
   - Search engine algorithm considerations
3. Each recommendation should include:
   - A clear actionable title
   - Specific steps to implement the solution
   - Expected outcome and why it matters
   - Approximate timeline for seeing results
4. Focus on solutions that will have the most significant impact on organic search visibility
5. Use a clear, authoritative tone appropriate for both technical and non-technical stakeholders
6. Consider modern SEO best practices and recent search engine algorithm changes

Format each recommendation as a separate paragraph. Do not number them or add extra headings.
`;
}

/**
 * Generate a prompt for technical explanations
 */
function generateTechnicalExplanationsPrompt(data: any): string {
  return `
Generate detailed technical explanations for each of these SEO issues:

${(data.issues || [])
  .slice(0, 10)
  .map((issue: any) => 
    `ID: ${issue.id}
Title: ${issue.title}
Category: ${issue.category}
Description: ${issue.description}
Examples: ${(issue.examples || []).join(', ')}
`
  )
  .join('\n---\n')}

Instructions:
1. For each issue, provide a comprehensive technical explanation that includes:
   - The underlying technical mechanism that causes this issue
   - How search engines specifically process and evaluate this element
   - The direct SEO impact and ranking factors affected
   - Industry standard best practices for resolution
   - Common implementation challenges and how to overcome them
   - Measurable metrics that would show improvement after fixing

2. Include specific code examples or technical details where relevant
3. Reference how modern search engine algorithms (including recent updates) treat these factors
4. Explain both the immediate impact and long-term SEO consequences
5. Use technically precise language while remaining accessible to SEO professionals
6. Keep each explanation concise (120-180 words) but comprehensive

Format the response as a JSON object with issue IDs as keys and explanations as values:
{
  "issue-id-1": "Technical explanation for first issue...",
  "issue-id-2": "Technical explanation for second issue..."
}
`;
}

/**
 * Call Azure OpenAI API to generate content
 */
async function callAzureOpenAI(prompt: string, expectJson: boolean = false, requestLabel: string = 'unlabeled'): Promise<string> {
  // Use Azure OpenAI endpoint as provided in environment variables
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
  
  console.log(`[Azure OpenAI][${requestLabel}] Using deployment: ${deploymentName}`);
  console.log(`[Azure OpenAI][${requestLabel}] Endpoint configured: ${endpoint ? 'Yes' : 'No'}`);
  console.log(`[Azure OpenAI][${requestLabel}] API key configured: ${apiKey ? 'Yes' : 'No'}`);
  
  if (!endpoint || !apiKey || !deploymentName) {
    console.error(`[Azure OpenAI][${requestLabel}] Credentials not configured properly`);
    throw new Error('Azure OpenAI credentials not configured');
  }
  
  try {
    console.log(`[Azure OpenAI][${requestLabel}] Sending request to endpoint: ${endpoint.substring(0, 20)}...`);
    console.log(`[Azure OpenAI][${requestLabel}] Prompt length: ${prompt.length} characters`);
    console.log(`[Azure OpenAI][${requestLabel}] Expecting JSON: ${expectJson}`);
    
    // Construct the Azure OpenAI API URL
    const apiUrl = endpoint;
    
    // If endpoint doesn't already include the deployment name, append it
    const fullApiUrl = endpoint.includes(deploymentName) ? 
      `${endpoint}/chat/completions?api-version=2023-05-15` : 
      `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2023-05-15`;
    
    console.log(`[Azure OpenAI][${requestLabel}] Constructed API URL: ${fullApiUrl.substring(0, 60)}...`);
    
    const systemMessage = expectJson
      ? 'You are an expert SEO consultant helping generate technical explanations in JSON format. Your response must be valid JSON with issue IDs as keys and explanations as values.'
      : 'You are an expert SEO consultant helping generate professional content for SEO audit reports. Provide factual, helpful, and concise responses.';
    
    const requestBody = {
      messages: [
        {
          role: 'system',
          content: systemMessage
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: expectJson ? 0.1 : 0.7, // Lower temperature for JSON to ensure valid formatting
      max_tokens: 1500,
      n: 1,
      stream: false
    };
    
    console.log(`[Azure OpenAI][${requestLabel}] Request body:`, JSON.stringify({
      messageCount: requestBody.messages.length,
      systemMessage: systemMessage.substring(0, 50) + '...',
      promptFirstChars: prompt.substring(0, 50) + '...',
      temperature: requestBody.temperature,
      max_tokens: requestBody.max_tokens
    }));
    
    // Track request start time for performance monitoring
    const requestStartTime = Date.now();
    
    // Make the API request
    console.log(`[Azure OpenAI][${requestLabel}] Making API request to ${fullApiUrl.substring(0, 60)}...`);
    const response = await fetch(fullApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    });
    
    // Calculate request duration
    const requestDuration = Date.now() - requestStartTime;
    console.log(`[Azure OpenAI][${requestLabel}] Request completed in ${requestDuration}ms with status ${response.status}`);
    
    // Check if the response was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Azure OpenAI][${requestLabel}] API request failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Azure OpenAI API request failed: ${response.status} ${response.statusText}`);
    }
    
    // Parse the response
    const responseData = await response.json();
    console.log(`[Azure OpenAI][${requestLabel}] Response received with status ${response.status}`);
    console.log(`[Azure OpenAI][${requestLabel}] Response structure:`, JSON.stringify({
      hasChoices: Array.isArray(responseData.choices),
      choicesCount: Array.isArray(responseData.choices) ? responseData.choices.length : 0,
      firstChoiceRole: responseData.choices?.[0]?.message?.role,
      usagePromptTokens: responseData.usage?.prompt_tokens,
      usageCompletionTokens: responseData.usage?.completion_tokens,
      usageTotalTokens: responseData.usage?.total_tokens
    }));
    
    // Extract and return the content
    const content = responseData.choices[0]?.message?.content;
    if (!content) {
      console.error(`[Azure OpenAI][${requestLabel}] No content in response:`, JSON.stringify(responseData));
      // Log the full response body if content is missing
      console.error(`[Azure OpenAI][${requestLabel}] Full response body:`, JSON.stringify(responseData, null, 2));
      throw new Error('No content in Azure OpenAI response');
    }
    
    console.log(`[Azure OpenAI][${requestLabel}] Content received (${content.length} chars)`);
    console.log(`[Azure OpenAI][${requestLabel}] First 100 chars of content: ${content.substring(0, 100)}...`);
    console.log(`[Azure OpenAI][${requestLabel}] Last 50 chars of content: ...${content.substring(content.length - 50)}`);
    
    // For JSON responses, validate that it's proper JSON
    if (expectJson) {
      try {
        JSON.parse(content);
        console.log(`[Azure OpenAI][${requestLabel}] Successfully validated JSON content`);
      } catch (error) {
        console.warn(`[Azure OpenAI][${requestLabel}] Response is not valid JSON:`, error);
        // Log the invalid JSON content for debugging
        console.warn(`[Azure OpenAI][${requestLabel}] Invalid JSON content received:`, content);
        // We'll still return the content and let the caller handle this
      }
    }
    
    return content;
  } catch (error) {
    console.error(`[Azure OpenAI][${requestLabel}] Error calling API:`, error);
    throw error;
  }
} 