import { createClient } from "@/lib/supabase/client";

export interface TodoRecommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime?: string;
}

export interface TodoRecommendationRequest {
  projectId: string;
  projectName?: string;
  todoTitle?: string;
  todoDescription?: string;
  existingTodos?: string[];
}

/**
 * Generate AI recommendations for new todo tasks
 */
export async function generateTodoRecommendations(
  request: TodoRecommendationRequest
): Promise<TodoRecommendation[]> {
  try {
    const response = await fetch('/api/ai/todo-recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Error generating recommendations: ${response.statusText}`);
    }

    const data = await response.json();
    return data.recommendations || [];
  } catch (error) {
    console.error('Error generating todo recommendations:', error);
    return [];
  }
}

/**
 * Generate subtasks or follow-up tasks for a specific todo
 */
export async function generateSubtasks(
  projectId: string,
  todoTitle: string,
  todoDescription?: string
): Promise<TodoRecommendation[]> {
  return generateTodoRecommendations({
    projectId,
    todoTitle,
    todoDescription
  });
}

/**
 * Save AI recommendations to a todo task
 */
export async function saveRecommendationsToTodo(
  todoId: string,
  recommendations: TodoRecommendation[]
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('todos')
      .update({ ai_recommendations: recommendations })
      .eq('id', todoId);
    
    if (error) {
      console.error('Error saving recommendations:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving recommendations:', error);
    return false;
  }
}

/**
 * Create new todos from AI recommendations
 */
export async function createTodosFromRecommendations(
  projectId: string,
  recommendations: TodoRecommendation[],
  parentTodoId?: string
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Map recommendations to todo objects
    const todos = recommendations.map(rec => ({
      project_id: projectId,
      user_id: user.id,
      title: rec.title,
      description: rec.description,
      status: 'todo',
      priority: rec.priority,
      parent_id: parentTodoId,
      ai_generated: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    const { error } = await supabase
      .from('todos')
      .insert(todos);
    
    if (error) {
      console.error('Error creating todos from recommendations:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error creating todos from recommendations:', error);
    return false;
  }
}

/**
 * Test the connection to Azure OpenAI
 */
export async function testAzureOpenAIConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/test-openai', {
      method: 'GET',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.error || 'Failed to connect to Azure OpenAI'
      };
    }

    return {
      success: true,
      message: data.message || 'Successfully connected to Azure OpenAI'
    };
  } catch (error) {
    console.error('Error testing Azure OpenAI connection:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 