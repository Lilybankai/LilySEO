import { NextResponse } from "next/server";

export async function GET() {
  try {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;

    if (!endpoint || !apiKey) {
      return NextResponse.json(
        { error: 'Azure OpenAI credentials not configured' },
        { status: 500 }
      );
    }

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
            content: 'Please analyze the following SEO task: Optimize a website homepage. Respond with a brief confirmation that you understand.',
          },
        ]
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Azure OpenAI request failed: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      message: 'Azure OpenAI connection test successful',
      response: data,
    });
  } catch (error: any) {
    console.error('Azure OpenAI test error:', error);
    return NextResponse.json(
      { error: `Failed to test Azure OpenAI connection: ${error.message}` },
      { status: 500 }
    );
  }
} 