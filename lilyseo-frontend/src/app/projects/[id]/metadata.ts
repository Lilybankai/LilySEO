import { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"

interface ProjectPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const supabase = await createClient()
  
  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", params.id)
    .single()
  
  if (!project) {
    return {
      title: "Project Not Found | LilySEO",
    }
  }
  
  return {
    title: `${project.name} | LilySEO`,
    description: `SEO performance for ${project.name}`,
  }
} 