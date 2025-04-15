"use client";

import { CompetitorWithMetrics } from "./competitor-service";

export type RecommendationType = 'topics' | 'outlines' | 'titles';

interface AIRecommendationResponse {
  content: string;
  error?: string;
}

export async function generateContentRecommendations(
  competitorData: CompetitorWithMetrics,
  topic: string,
  recommendationType: RecommendationType
): Promise<AIRecommendationResponse> {
  try {
    // Prepare the prompt based on recommendation type
    let prompt = "";
    const topTopics = competitorData.analysis?.metrics.content?.topTopics || [];
    const contentGrade = competitorData.analysis?.metrics.content?.contentGrade || 'C';
    const avgWordCount = competitorData.analysis?.metrics.content?.avgWordCount || 1000;
    
    if (recommendationType === 'topics') {
      prompt = `Create a content topic cluster around "${topic}" for a website in the ${topTopics.join(', ')} industry. 
      The cluster should include a core topic, 5-7 related subtopics, and 3-5 content piece ideas. 
      Format as markdown with headers.`;
    } else if (recommendationType === 'outlines') {
      prompt = `Create a detailed article outline for a piece about "${topic}". 
      The competitor's content is grade ${contentGrade} with an average of ${avgWordCount} words. 
      Create an outline that would help outrank this content. 
      Format as markdown with a title and section headers with bullet points for subsections.`;
    } else {
      prompt = `Generate 5 compelling article titles about "${topic}" that would perform well in search results. 
      The titles should be engaging, include the target keyword, and be optimized for CTR. 
      Format as a numbered list in markdown.`;
    }

    // Make request to our Azure OpenAI endpoint via our API route
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        competitorData: {
          name: competitorData.name,
          url: competitorData.url,
          topics: topTopics,
          contentGrade,
          avgWordCount
        },
        maxTokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate recommendations');
    }

    const data = await response.json();
    return { content: data.content };
  } catch (error) {
    console.error('Error generating content recommendations:', error);
    return { 
      content: '',
      error: (error as Error).message || 'Failed to generate recommendations' 
    };
  }
} 