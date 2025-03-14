import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { WhiteLabelSettingsForm } from "@/components/white-label/settings-form";
import { checkWhiteLabelAccess } from "@/services/white-label";

export const metadata: Metadata = {
  title: "White Label Settings | LilySEO",
  description: "Customize the appearance of your SEO platform with white label settings.",
};

export default async function WhiteLabelPage() {
  // Check if user is authenticated
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect("/login");
  }
  
  // Check if user has access to white label features
  const hasAccess = await checkWhiteLabelAccess();
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">White Label Settings</h1>
        <p className="text-muted-foreground mt-2">
          Customize the appearance of your SEO platform with your own branding.
        </p>
      </div>
      
      {hasAccess ? (
        <WhiteLabelSettingsForm />
      ) : (
        <UpgradePrompt />
      )}
    </div>
  );
}

function UpgradePrompt() {
  return (
    <div className="bg-muted/50 rounded-lg p-8 text-center">
      <h2 className="text-2xl font-semibold mb-4">Unlock White Label Features</h2>
      <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
        White label features allow you to customize the platform with your own branding, 
        including logo, colors, and custom domain. This feature is available exclusively 
        for Pro and Enterprise subscribers.
      </p>
      <div className="flex justify-center gap-4">
        <a 
          href="/pricing" 
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-md font-medium"
        >
          View Pricing Plans
        </a>
      </div>
    </div>
  );
} 