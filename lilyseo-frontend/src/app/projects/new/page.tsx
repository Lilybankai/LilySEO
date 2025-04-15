import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NewProjectForm } from "@/components/projects/new-project-form"

export const metadata: Metadata = {
  title: "Create New Project | LilySEO",
  description: "Add a new website to track with LilySEO",
}

export default async function NewProjectPage() {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }
  
  // Check if this is the user's first project
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
  
  const isFirstProject = !error && (!projects || projects.length === 0)
  
  return (
    <div className="container max-w-3xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Create New Project</h1>
        <p className="text-muted-foreground">
          Add a website to start tracking and improving its SEO performance
        </p>
      </div>
      
      <NewProjectForm userId={user.id} isFirstTime={isFirstProject} />
    </div>
  )
} 