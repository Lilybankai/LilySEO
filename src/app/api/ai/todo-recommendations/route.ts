import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';

// Define the request and response types
interface TodoRecommendationRequest {
  projectId: string;
  projectName?: string;
  todoTitle?: string;
  todoDescription?: string;
  existingTodos?: string[];
}

interface TodoRecommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime?: string;
}

export async function POST(request: Request) {
  try {
    // Authenticate the user
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const body: TodoRecommendationRequest = await request.json();
    
    // Validate required fields
    if (!body.projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }
    
    // Initialize Azure OpenAI client
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    
    if (!endpoint || !apiKey) {
      return NextResponse.json(
        { error: 'OpenAI configuration is missing' },
        { status: 500 }
      );
    }
    
    // Get additional project information if needed
    let projectName = body.projectName;
    if (!projectName) {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('name')
        .eq('id', body.projectId)
        .single();
      
      if (!projectError && project) {
        projectName = project.name;
      }
    }
    
    // Get existing todos if not provided
    let existingTodos = body.existingTodos;
    if (!existingTodos || existingTodos.length === 0) {
      const { data: todos, error: todosError } = await supabase
        .from('todos')
        .select('title')
        .eq('project_id', body.projectId)
        .limit(10);
      
      if (!todosError && todos) {
        existingTodos = todos.map(todo => todo.title);
      }
    }
    
    // Construct the prompt
    const prompt = constructPrompt({
      ...body,
      projectName,
      existingTodos
    });
    
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
          { error: 'Failed to generate todo recommendations' },
          { status: 500 }
        );
      }
      
      const result = await response.json();
      
      // Parse the recommendations from the response
      const recommendations = parseRecommendations(result.choices[0]?.message?.content || '');
      
      // Save recommendations to the database if there's a specific todo
      if (body.todoTitle && recommendations.length > 0) {
        await supabase
          .from('todos')
          .update({ 
            ai_recommendations: recommendations 
          })
          .eq('title', body.todoTitle)
          .eq('project_id', body.projectId);
      }
      
      // Return the recommendations
      return NextResponse.json({ recommendations });
    } catch (error) {
      console.error('Error calling Azure OpenAI:', error);
      return NextResponse.json(
        { error: 'Failed to generate todo recommendations' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating todo recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate todo recommendations' },
      { status: 500 }
    );
  }
}

/**
 * Construct the prompt for the OpenAI API
 */
function constructPrompt(data: TodoRecommendationRequest & { projectName?: string; existingTodos?: string[] }): string {
  return `
You are an SEO expert assisting with task management. Please provide recommendations for SEO-related tasks.

Project: ${data.projectName || 'SEO Project'}
${data.todoTitle ? `Task Title: ${data.todoTitle}` : ''}
${data.todoDescription ? `Task Description: ${data.todoDescription}` : ''}

${data.existingTodos && data.existingTodos.length > 0 
    ? `Existing tasks in this project:
${data.existingTodos.map(todo => `- ${todo}`).join('\n')}` 
    : ''}

${data.todoTitle
    ? `Please provide 3 subtasks or follow-up actions for this specific task. Make them actionable, specific, and relevant to the task.`
    : `Please suggest 5 new SEO tasks for this project. Make them specific, actionable, and prioritized.`}

For each task, include:
1. A clear, concise title
2. A brief description explaining what needs to be done
3. Priority level (high, medium, or low)
4. Estimated time to complete (optional)

Format your response as a JSON array, like this:
[
  {
    "title": "Task title",
    "description": "Detailed description",
    "priority": "high|medium|low",
    "estimatedTime": "1 hour"
  },
  ...
]
`;
}

/**
 * Parse the recommendations from the OpenAI response
 */
function parseRecommendations(response: string): TodoRecommendation[] {
  try {
    // Extract JSON from the response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return generateFallbackRecommendations();
    }
    
    const recommendations = JSON.parse(jsonMatch[0]);
    
    // Validate the recommendations
    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      return generateFallbackRecommendations();
    }
    
    // Ensure each recommendation has the required fields
    return recommendations.map((rec: any) => ({
      title: rec.title || 'Untitled Task',
      description: rec.description || 'No description provided',
      priority: ['high', 'medium', 'low'].includes(rec.priority) 
        ? rec.priority 
        : 'medium',
      estimatedTime: rec.estimatedTime || undefined
    }));
  } catch (error) {
    console.error('Error parsing recommendations:', error);
    return generateFallbackRecommendations();
  }
}

/**
 * Generate fallback recommendations if parsing fails
 */
function generateFallbackRecommendations(): TodoRecommendation[] {
  return [
    {
      title: 'Conduct Keyword Research',
      description: 'Identify high-value keywords related to your industry and analyze competition.',
      priority: 'high',
      estimatedTime: '2 hours'
    },
    {
      title: 'Optimize Meta Descriptions',
      description: 'Update meta descriptions for key pages using target keywords and compelling calls to action.',
      priority: 'medium',
      estimatedTime: '1 hour'
    },
    {
      title: 'Technical SEO Audit',
      description: 'Check for technical issues like broken links, slow loading pages, and mobile compatibility.',
      priority: 'high',
      estimatedTime: '3 hours'
    }
  ];
} 