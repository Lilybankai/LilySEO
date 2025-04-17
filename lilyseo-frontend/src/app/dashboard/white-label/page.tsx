import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerAdapter } from "@/lib/supabase/server-adapter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "White Label Settings | LilySEO",
  description: "Customize the appearance of your SEO platform with white label settings.",
};

export default async function WhiteLabelPage() {
  // Check if user is authenticated
  const supabase = await createServerAdapter();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect("/auth/login");
  }
  
  // Check if user has access to white label features
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_status')
    .eq('id', session.user.id)
    .single();
    
  const hasAccess = profile && 
    (profile.subscription_tier === 'pro' || profile.subscription_tier === 'enterprise') && 
    (profile.subscription_status === 'active' || profile.subscription_status === 'trialing');
  
  return (
    <div className="container py-10 max-w-6xl">
      <h1 className="text-3xl font-bold mb-2">White Label Settings</h1>
      <p className="text-muted-foreground mb-6">
          Customize the appearance of your SEO platform with your own branding.
        </p>
      
      <Alert className="mb-6">
        <BookOpen className="h-4 w-4" />
        <AlertTitle>New PDF Customization</AlertTitle>
        <AlertDescription>
          Fully customize your PDF reports with your branding, colors, and content preferences in the PDF Export tab.
          Create and save templates for different clients or report types.
        </AlertDescription>
      </Alert>
      
      {hasAccess ? (
        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="domain">Domain</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
          </TabsList>
          
          <TabsContent value="branding" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Branding Settings</CardTitle>
                <CardDescription>
                  Customize the look and feel of your SEO platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo</Label>
                  <Input id="logo" type="file" accept="image/*" />
                  <p className="text-sm text-muted-foreground">
                    Recommended size: 200x50px. PNG or SVG with transparent background.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" placeholder="Your Company Name" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input id="primaryColor" type="color" className="w-16 h-10" defaultValue="#0f172a" />
                    <Input type="text" placeholder="#0f172a" className="flex-1" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input id="secondaryColor" type="color" className="w-16 h-10" defaultValue="#6366f1" />
                    <Input type="text" placeholder="#6366f1" className="flex-1" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="domain" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Custom Domain</CardTitle>
                <CardDescription>
                  Configure a custom domain for your SEO dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Custom Domain</Label>
                  <Input id="domain" placeholder="seo.yourcompany.com" />
                  <p className="text-sm text-muted-foreground">
                    You'll need to set up DNS records to point to our servers.
                  </p>
                </div>
                
                <div className="rounded-md bg-muted p-4">
                  <h4 className="mb-2 font-medium">DNS Configuration</h4>
                  <p className="text-sm mb-4">Add these records to your DNS configuration:</p>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <div className="font-mono">Type</div>
                      <div className="font-mono">Name</div>
                      <div className="font-mono">Value</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <div className="font-mono">CNAME</div>
                      <div className="font-mono">seo</div>
                      <div className="font-mono">cname.lilyseo.app</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <div className="font-mono">TXT</div>
                      <div className="font-mono">_lilyseo</div>
                      <div className="font-mono">domain-verification={session.user.id.substring(0, 8)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Verify Domain</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="options" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Additional Options</CardTitle>
                <CardDescription>
                  Configure additional white label settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="removeBranding" className="h-4 w-4" />
                  <Label htmlFor="removeBranding">Remove "Powered by LilySEO" branding</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="customEmails" className="h-4 w-4" />
                  <Label htmlFor="customEmails">Use custom branding in email notifications</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="customReports" className="h-4 w-4" />
                  <Label htmlFor="customReports">Use custom branding in PDF reports</Label>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Options</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
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
          href="/dashboard/subscription" 
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-md font-medium"
        >
          View Subscription Plans
        </a>
      </div>
    </div>
  );
} 