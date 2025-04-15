import { Metadata } from "next"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProjectSettingsForm } from "@/components/projects/project-settings-form"

export const metadata: Metadata = {
  title: "Project Settings | LilySEO",
  description: "Configure your project settings",
}

export default async function ProjectSettingsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get project details
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (!project) {
    notFound()
  }

  return (
    <div className="container max-w-3xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Project Settings</h1>
        <p className="text-muted-foreground">
          Configure settings for {project.name}
        </p>
      </div>
      
      <ProjectSettingsForm userId={user.id} project={project} />
    </div>
  )
} 