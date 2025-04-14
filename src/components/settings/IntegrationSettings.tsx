"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";

interface UserProfile {
  id: string;
  google_refresh_token: string | null;
  // Add other profile fields if needed, e.g., email
  email?: string;
}

export function IntegrationSettings() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for callback query parameters
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const successParam = searchParams.get('success');
    const messageParam = searchParams.get('message');

    if (errorParam === 'google_auth_failed') {
      setError(messageParam || "Failed to connect Google Account. Please try again.");
      // Clear query params
      router.replace('/dashboard/settings'); 
    }
    if (successParam === 'google_connected') {
      setSuccessMessage("Successfully connected your Google Account!");
      // Clear query params
      router.replace('/dashboard/settings');
    }
  }, [searchParams, router]);

  // Fetch user profile to check connection status
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null); // Clear previous errors on load
      // Keep success message from redirect briefly

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push("/auth/login");
          return;
        }

        const { data, error: profileError } = await supabase
          .from("profiles")
          // Select only necessary fields
          .select("id, google_refresh_token, email") 
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile for integration status:", profileError);
          setError("Failed to load integration status.");
        }
        setProfile(data as UserProfile | null);

      } catch (err: any) {
        console.error("Unexpected error fetching profile:", err);
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
        // Clear success message after a delay
        if (successMessage) {
          setTimeout(() => setSuccessMessage(null), 5000);
        }
      }
    };

    fetchProfile();
  }, [router, successMessage]); // Depend on successMessage to re-fetch after connect

  // Handle Connect button click
  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      // Call the modified API route (no projectId needed)
      const response = await fetch('/api/google/auth');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get Google authorization URL.");
      }
      const data = await response.json();
      // Redirect user to Google's OAuth consent screen
      window.location.href = data.url;
    } catch (err: any) { K
      console.error("Error initiating Google connection:", err);
      setError(err.message || "Could not start Google connection process.");
      setIsConnecting(false);
    }
    // No finally block needed for setIsConnecting as redirect happens
  };

  // Handle Disconnect button click
  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch('/api/google/disconnect', { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to disconnect Google account.");
      }
      // Update profile state immediately for UI feedback
      setProfile(prev => prev ? { ...prev, google_refresh_token: null } : null);
      toast.success("Successfully disconnected Google Account.");
    } catch (err: any) {
      console.error("Error disconnecting Google account:", err);
      setError(err.message || "Could not disconnect Google account.");
      toast.error(err.message || "Could not disconnect Google account.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const isConnected = !!profile?.google_refresh_token;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
        <CardDescription>
          Connect your third-party accounts to enhance LilySEO's capabilities.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Display loading state */} 
        {loading && (
           <div className="flex items-center justify-center p-4">
             <Loader2 className="h-6 w-6 animate-spin text-primary" />
           </div>
        )}

        {/* Display Success Message */} 
        {successMessage && (
          <Alert variant="default">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Display Error Message */} 
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Google Search Console Integration */} 
        {!loading && (
          <div className="p-4 border rounded-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div className="mb-2 sm:mb-0">
                <Label className="text-base font-medium flex items-center">
                   <img 
                    src="/images/google-search-console-logo.svg" 
                    alt="GSC" 
                    className="mr-2 h-5 w-5" 
                  />
                  Google Search Console
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isConnected
                    ? `Connected as ${profile?.email || 'your Google Account'}.` // Display email if available
                    : "Connect to import site data and keywords."}
                </p>
              </div>
              
              {isConnected ? (
                <Button 
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  size="sm"
                >
                  {isDisconnecting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Disconnect
                </Button>
              ) : (
                <Button 
                  variant="default"
                  onClick={handleConnect}
                  disabled={isConnecting}
                  size="sm"
                 >
                   {isConnecting ? (
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                   ) : null}
                   Connect Google Account
                 </Button>
              )}
            </div>
          </div>
        )}
        
        {/* Placeholder for other integrations */} 
        {/* <div className="p-4 border rounded-md opacity-50">
          <Label className="text-base font-medium">Google Analytics</Label>
          <p className="text-sm text-muted-foreground">Coming soon...</p>
        </div> */} 
      </CardContent>
      {/* No specific footer actions needed for this section currently */}
      {/* <CardFooter>
        <Button className="ml-auto">Save</Button> 
      </CardFooter> */} 
    </Card>
  );
} 