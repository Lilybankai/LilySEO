import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { createClient } from "@/lib/supabase/server";
import { CompetitorsNav } from "../../components/competitors/competitors-nav";

export default async function Layout({ children }: { children: ReactNode }) {
  // Check if user is authenticated
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  // If user is not authenticated, redirect to login
  if (!session) {
    redirect("/auth/login");
  }
  
  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <CompetitorsNav />
        <div className="flex-1">
          {children}
        </div>
      </div>
    </DashboardLayout>
  );
} 