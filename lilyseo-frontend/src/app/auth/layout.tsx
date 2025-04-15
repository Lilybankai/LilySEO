import { ReactNode } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function AuthLayout({
  children,
}: {
  children: ReactNode
}) {
  // Check if user is already authenticated
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  // If user is authenticated, redirect to dashboard
  if (session) {
    redirect("/dashboard")
  }
  
  return (
    <div className="min-h-screen flex">
      {/* Left side - Auth form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {children}
        </div>
      </div>
      
      {/* Right side - Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-primary text-primary-foreground">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <img 
              src="/Logos/LilySEO_logo_knockout.png" 
              alt="LilySEO Logo" 
              className="h-16 w-auto" 
            />
          </Link>
        </div>
        
        <div className="space-y-6">
          <h1 className="text-4xl font-bold tracking-tight">
            Boost Your Website's SEO Performance
          </h1>
          <p className="text-lg text-primary-foreground/80">
            Comprehensive SEO analysis, AI-powered recommendations, and actionable insights to improve your website's visibility.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-lg bg-primary-foreground/10">
              <h3 className="text-xl font-semibold mb-2">SEO Audits</h3>
              <p className="text-sm text-primary-foreground/80">
                Detailed analysis of your website's SEO performance
              </p>
            </div>
            <div className="p-6 rounded-lg bg-primary-foreground/10">
              <h3 className="text-xl font-semibold mb-2">AI Insights</h3>
              <p className="text-sm text-primary-foreground/80">
                Smart recommendations to improve your rankings
              </p>
            </div>
            <div className="p-6 rounded-lg bg-primary-foreground/10">
              <h3 className="text-xl font-semibold mb-2">Competitor Analysis</h3>
              <p className="text-sm text-primary-foreground/80">
                See how you stack up against competitors
              </p>
            </div>
            <div className="p-6 rounded-lg bg-primary-foreground/10">
              <h3 className="text-xl font-semibold mb-2">Actionable Tasks</h3>
              <p className="text-sm text-primary-foreground/80">
                Clear steps to improve your SEO performance
              </p>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-primary-foreground/60">
          © {new Date().getFullYear()} 
          <img 
            src="/Logos/LilySEO_logo_mark.png" 
            alt="LilySEO" 
            className="inline-block h-4 w-auto mx-1" 
          /> 
          All rights reserved.
        </div>
      </div>
    </div>
  )
} 