import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TodoDetailsDialog } from "@/components/todos/dialogs/todo-details-dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Todo Details | LilySEO",
  description: "View and manage task details",
};

export default async function TodoDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }
  
  // Get the todo item
  const { data: todo, error } = await supabase
    .from("todos")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();
  
  if (error || !todo) {
    // If todo doesn't exist or user doesn't have access, redirect to todos page
    redirect("/todos");
  }
  
  return (
    <div className="container py-6">
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/todos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Todos
          </Link>
        </Button>
      </div>
      
      <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{todo.title}</h1>
        
        <div className="grid gap-6">
          {todo.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Description</h3>
              <div className="text-lg">{todo.description}</div>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</h3>
              <div className="capitalize">{todo.status}</div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Priority</h3>
              <div className="capitalize">{todo.priority}</div>
            </div>
            
            {todo.due_date && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Due Date</h3>
                <div>{new Date(todo.due_date).toLocaleDateString()}</div>
              </div>
            )}
            
            {todo.assigned_to && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Assigned To</h3>
                <div>{todo.assigned_to}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 