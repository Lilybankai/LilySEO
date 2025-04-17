import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server'

// Define the request type
interface IndustryDetectionRequest {
  url: string
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
    const body: IndustryDetectionRequest = await request.json()
    
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
    const prompt = `
    Based on the URL ${body.url}, determine the most likely industry or category for this website.
    
    Choose from one of the following categories:
    - E-commerce
    - Technology
    - Healthcare
    - Finance
    - Education
    - Travel
    - Food & Beverage
    - Real Estate
    - Entertainment
    - Manufacturing
    - Professional Services
    - Non-profit
    - Other
    
    Return only the category name, nothing else.
    `
    
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
          max_completion_tokens: 50
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error('Azure OpenAI API error:', error);
        return NextResponse.json(
          { error: 'Failed to detect industry' },
          { status: 500 }
        );
      }
      
      const result = await response.json();
      
      // Get the industry from the response
      const industry = result.choices[0]?.message?.content?.trim() || 'Other'
      
      // Return the industry
      return NextResponse.json({ industry });
    } catch (error) {
      console.error('Error calling Azure OpenAI:', error);
      return NextResponse.json(
        { error: 'Failed to detect industry' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error detecting industry:', error)
    return NextResponse.json(
      { error: 'Failed to detect industry' },
      { status: 500 }
    )
  }
} 