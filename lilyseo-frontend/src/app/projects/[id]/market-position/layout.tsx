import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function MarketPositionLayout({ 
  children,
  params 
}: { 
  children: ReactNode,
  params: { id: string }
}) {
  // Check if user is authenticated
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  // If user is not authenticated, redirect to login
  if (!session) {
    redirect("/auth/login")
  }
  
  // Check if user owns this project
  const projectId = params.id
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', session.user.id)
    .single()
  
  if (error || !project) {
    // Project not found or user doesn't have access
    redirect("/projects")
  }
  
  // Check if user has enterprise subscription
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', session.user.id)
    .single()
  
  if (profileError) {
    console.error("Error fetching profile:", profileError)
    // Continue to avoid blocking access due to DB error
  } else if (profile && profile.subscription_tier !== 'enterprise') {
    // User doesn't have enterprise subscription
    redirect("/settings/subscription?required=enterprise")
  }

  return <>{children}</>
} 