import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Azure OpenAI environment variables
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2023-05-15';

export async function POST(request: NextRequest) {
  try {
    // Check if Azure OpenAI credentials are configured
    if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_ENDPOINT) {
      return NextResponse.json(
        { error: 'Azure OpenAI API not configured' },
        { status: 500 }
      );
    }

    // Authenticate the user
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check user's subscription tier
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      
      // Try to get subscription directly if profile doesn't include subscription_tier
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', session.user.id)
        .eq('active', true)
        .single();
      
      if (subscriptionError) {
        console.error('Error fetching subscription:', subscriptionError);
        return NextResponse.json(
          { error: 'Failed to validate subscription. Please contact support.' },
          { status: 500 }
        );
      }
      
      if (!subscription || (subscription.tier !== 'pro' && subscription.tier !== 'enterprise')) {
        return NextResponse.json(
          { error: 'This feature requires a Pro or Enterprise subscription' },
          { status: 403 }
        );
      }
    } else if (!profile || (profile.subscription_tier !== 'pro' && profile.subscription_tier !== 'enterprise')) {
      return NextResponse.json(
        { error: 'This feature requires a Pro or Enterprise subscription' },
        { status: 403 }
      );
    }

    // Parse the request
    const { prompt, competitorData, maxTokens = 1000 } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Enhanced system message
    const systemMessage = `You are an expert SEO and content marketing assistant. 
    You are helping a user create high-quality content to compete with their competitor.
    ${competitorData ? `Their competitor is ${competitorData.name} (${competitorData.url}).` : ''}
    ${competitorData?.topics?.length ? `The competitor's content covers these topics: ${competitorData.topics.join(', ')}.` : ''}
    ${competitorData?.contentGrade ? `The competitor's content quality grade is ${competitorData.contentGrade}.` : ''}
    ${competitorData?.avgWordCount ? `The competitor's content averages ${competitorData.avgWordCount} words per page.` : ''}
    Provide comprehensive, detailed, and actionable recommendations formatted in clean markdown.`;

    // Make the Azure OpenAI API call
    const azureResponse = await fetch(
      `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_OPENAI_API_KEY,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt }
          ],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      }
    );

    if (!azureResponse.ok) {
      const errorText = await azureResponse.text();
      console.error('Azure OpenAI API error:', errorText);
      return NextResponse.json(
        { error: 'Error from OpenAI API' },
        { status: azureResponse.status }
      );
    }

    const data = await azureResponse.json();
    const content = data.choices[0]?.message?.content || '';

    // Log API usage for billing/monitoring
    try {
      await supabase.from('ai_usage_logs').insert({
        user_id: session.user.id,
        feature: 'content_recommendations',
        tokens_used: data.usage?.total_tokens || 0,
        prompt_tokens: data.usage?.prompt_tokens || 0,
        completion_tokens: data.usage?.completion_tokens || 0,
      });
    } catch (logError) {
      // Don't fail the request if logging fails, just log the error
      console.error('Failed to log AI usage:', logError);
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error('AI generate API error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
} 