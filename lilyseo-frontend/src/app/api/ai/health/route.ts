import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Azure OpenAI environment variables
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;

/**
 * Health check endpoint for Azure OpenAI integration
 * Returns status of Azure OpenAI configuration and database tables
 */
export async function GET() {
  const status = {
    configured: false,
    apiKey: !!AZURE_OPENAI_API_KEY,
    endpoint: !!AZURE_OPENAI_ENDPOINT,
    tablesReady: false,
    error: null as string | null,
  };

  try {
    // Check if the required environment variables are set
    if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_ENDPOINT) {
      return NextResponse.json({
        ...status,
        error: 'Azure OpenAI environment variables not configured',
      });
    }

    // Check if the ai_usage_logs table exists
    const supabase = await createClient();
    try {
      const { error } = await supabase.from('ai_usage_logs').select('id').limit(1);
      
      // If there's no error, the table exists
      status.tablesReady = !error;
      
      // If there is an error, check if it's a "relation does not exist" error
      if (error) {
        console.warn('AI usage logs table check:', error.message);
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          status.error = 'The AI usage logs table has not been created yet. Run migrations first.';
        } else {
          status.error = `Database error: ${error.message}`;
        }
      }
    } catch (dbError) {
      console.error('Database check error:', dbError);
      status.error = 'Failed to check database tables';
    }

    // Set overall configuration status
    status.configured = status.apiKey && status.endpoint && status.tablesReady;

    return NextResponse.json(status);
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      ...status,
      error: (error as Error).message || 'An unexpected error occurred',
    });
  }
} 