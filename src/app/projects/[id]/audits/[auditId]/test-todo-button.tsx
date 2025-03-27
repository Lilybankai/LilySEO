"use client"

import { TodoButton } from '@/components/ui/todo-button'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'

async function directSqlCall(projectId: string, title: string, description: string) {
  try {
    const response = await fetch('/api/debug/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        sql: `
          SELECT test_add_todo_safely(
            '${title}',
            '${description}',
            'medium',
            'pending',
            '${projectId}',
            null,
            null
          );
        `
      }),
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Direct SQL call failed:", error);
    return { error: "Failed to call SQL function" };
  }
}

export default function TestTodoButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const handleDirectSqlCall = async () => {
    setIsLoading(true);
    try {
      const res = await directSqlCall(
        '005bf5ee-b735-4962-8f40-c3fcf8ba3aa7',
        'Test SQL Direct Todo',
        'This is a test todo created via direct SQL call'
      );
      setResult(res);
      if (res.success) {
        toast.success('Direct SQL todo added successfully');
      } else {
        toast.error('Direct SQL todo failed: ' + (res.error || 'Unknown error'));
      }
    } catch (error) {
      console.error("SQL call error:", error);
      setResult({ error: "Exception occurred" });
      toast.error('SQL call exception occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Test Todo Button</h1>
      <p>Click the button below to test adding a todo item:</p>
      
      <div className="p-4 border rounded-lg">
        <h2 className="text-lg font-medium mb-4">Standard TodoButton Component</h2>
        <TodoButton 
          issueId="test-issue-123"
          recommendation="This is a test recommendation"
          projectId="005bf5ee-b735-4962-8f40-c3fcf8ba3aa7"
          auditId="29e758dd-20dd-498f-b4f2-d227d1f24759"
        />
      </div>
      
      <div className="p-4 border rounded-lg">
        <h2 className="text-lg font-medium mb-4">Direct SQL Function Call</h2>
        <Button 
          onClick={handleDirectSqlCall}
          disabled={isLoading}
        >
          {isLoading ? 'Adding...' : 'Add Todo via Direct SQL'}
        </Button>
        
        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded overflow-auto max-h-40">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
} 