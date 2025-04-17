import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { checkEnterpriseAccess } from "@/services/lead-finder"
import { redirect } from "next/navigation"
import { Suspense } from "react"

export const metadata = {
  title: "Lead Finder | LilySEO",
  description: "Find and manage potential leads for your business"
}

export default async function LeadFinderLayout({
  children
}: {
  children: React.ReactNode
}) {
  // Check if user has enterprise access
  let hasAccess = false;
  
  try {
    hasAccess = await checkEnterpriseAccess();
  } catch (error) {
    console.error("Error checking enterprise access:", error);
    // We'll use client-side fallback check
  }
  
  // If no server-side access, redirect to debug tools
  if (!hasAccess) {
    redirect("/dashboard/debug-tools?error=no-enterprise-access");
  }
  
  return (
    <DashboardLayout>
      <Suspense fallback={<div>Loading...</div>}>
        {children}
      </Suspense>
    </DashboardLayout>
  )
} 