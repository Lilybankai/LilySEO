import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Edit Project | LilySEO",
  description: "Edit your SEO project settings",
};

export default async function EditProjectPage({
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
  
  // Get the project
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();
  
  if (error || !project) {
    // If project doesn't exist or user doesn't have access, redirect to projects page
    redirect("/projects");
  }
  
  return (
    <div className="container py-10">
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href={`/projects/${project.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Link>
        </Button>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Edit Project</h1>
        
        {/* 
          Placeholder for ProjectForm component. 
          This component would need to be implemented separately with form fields for editing a project.
        */}
        <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm p-8">
          <div className="text-center p-10">
            <h2 className="text-xl font-medium mb-2">Project Edit Form</h2>
            <p className="text-muted-foreground mb-4">
              Edit form would go here with fields for project name, URL, description, etc.
            </p>
            <Button asChild>
              <Link href={`/projects/${project.id}`}>
                Return to Project
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 