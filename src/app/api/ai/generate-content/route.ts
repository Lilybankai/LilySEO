import { NextResponse } from 'next/server';

/**
 * Supported content generation types
 */
type ContentType = 'executive-summary' | 'recommendations' | 'technical-explanations';

/**
 * Process OpenAI API requests for generating PDF content
 */
export async function POST(request: Request) {
  console.log('[AI Content Generator] Request received');
  try {
    // Parse request
    const body = await request.json();
    const { type, data } = body;
    
    console.log(`[AI Content Generator] Content type: ${type}`);
    console.log(`[AI Content Generator] Data received:`, JSON.stringify({
      dataType: typeof data,
      hasUrl: !!data?.url,
      dataKeys: Object.keys(data || {})
    }));
    
    if (!type || !data) {
      console.log('[AI Content Generator] Error: Missing required parameters');
      return NextResponse.json(
        { error: 'Missing required parameters: type and data' },
        { status: 400 }
      );
    }
    
    // Generate the appropriate prompt based on content type
    console.log('[AI Content Generator] Generating prompt');
    const prompt = generatePrompt(type as ContentType, data);
    
    // Call Azure OpenAI
    console.log('[AI Content Generator] Calling Azure OpenAI API');
    const content = await callAzureOpenAI(prompt);
    
    console.log('[AI Content Generator] API call successful, content generated');
    console.log(`[AI Content Generator] Content length: ${content.length} characters`);
    
    return NextResponse.json({ content });
  } catch (error) {
    console.error('[AI Content Generator] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}

/**
 * Generate an appropriate prompt based on content type and data
 */
function generatePrompt(type: ContentType, data: any): string {
  switch (type) {
    case 'executive-summary':
      return generateExecutiveSummaryPrompt(data);
    case 'recommendations':
      return generateRecommendationsPrompt(data);
    case 'technical-explanations':
      return generateTechnicalExplanationsPrompt(data);
    default:
      throw new Error(`Unsupported content type: ${type}`);
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
${(data.topIssues || []).map((issue: string) => `- ${issue}`).join('\n')}

Top Strengths:
${(data.topStrengths || []).map((strength: string) => `- ${strength}`).join('\n')}

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
async function callAzureOpenAI(prompt: string): Promise<string> {
  // Use Azure OpenAI endpoint as provided in environment variables
  // This should target the gpt-4o-2 (2024-11-20) deployment
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
  
  console.log(`[Azure OpenAI] Using deployment: ${deploymentName}`);
  console.log(`[Azure OpenAI] Endpoint configured: ${endpoint ? 'Yes' : 'No'}`);
  console.log(`[Azure OpenAI] API key configured: ${apiKey ? 'Yes' : 'No'}`);
  
  if (!endpoint || !apiKey || !deploymentName) {
    console.error('[Azure OpenAI] Credentials not configured properly');
    throw new Error('Azure OpenAI credentials not configured');
  }
  
  try {
    console.log(`[Azure OpenAI] Sending request to endpoint`);
    console.log(`[Azure OpenAI] Prompt length: ${prompt.length} characters`);
    
    // Construct the Azure OpenAI API URL
    const fullApiUrl = endpoint.includes(deploymentName) ? 
      `${endpoint}/chat/completions?api-version=2023-05-15` : 
      `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2023-05-15`;
    
    console.log(`[Azure OpenAI] Constructed API URL: ${fullApiUrl.substring(0, 60)}...`);
    
    const requestBody = {
      messages: [
        {
          role: 'system',
          content: 'You are an expert SEO consultant helping generate professional content for SEO audit reports. Provide factual, helpful, and concise responses. You have access to GPT-4o-2 capabilities for detailed analysis.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      model: "gpt-4o-2", // Explicitly specify the model
    };
    
    console.log(`[Azure OpenAI] Request body:`, JSON.stringify({
      messageCount: requestBody.messages.length,
      modelName: requestBody.model,
      temperature: requestBody.temperature,
    }));
    
    const response = await fetch(fullApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`[Azure OpenAI] Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Azure OpenAI] API error: ${response.status} ${errorText}`);
      throw new Error(`Azure OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log(`[Azure OpenAI] Response received successfully`);
    console.log(`[Azure OpenAI] Response data:`, JSON.stringify({
      hasChoices: !!data.choices,
      choicesCount: data.choices?.length,
      responseLength: data.choices?.[0]?.message?.content?.length,
    }));
    
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('[Azure OpenAI] API error:', error);
    throw error;
  }
} 