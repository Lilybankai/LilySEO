"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UploadCloud, Palette as PaletteIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

// Define the structure of white label settings
interface WhiteLabelSettingsData {
  id: string; // Assuming UUID from Supabase
  user_id: string;
  company_name: string | null;
  primary_color: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export function WhiteLabelSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // User and Subscription State
  const [userId, setUserId] = useState("");
  const [isProUser, setIsProUser] = useState(false); // Track if user has Pro/Enterprise access

  // White Label State
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#000000"); // Default to black
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null); // To display current logo

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const supabase = createClient();

        // 1. Get User and Profile (for subscription check)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }
        setUserId(user.id);

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("subscription_tier")
          .eq("id", user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching profile for subscription check:", profileError);
          toast.error("Failed to verify user plan");
          // Decide if we should block access entirely or allow view-only
          // For now, let's proceed but disable editing later if not Pro
        }

        const userTier = profile?.subscription_tier?.toLowerCase() || 'free';
        const hasAccess = userTier === 'pro' || userTier === 'enterprise';
        setIsProUser(hasAccess);

        // 2. Get White Label Settings
        const { data: settings, error: settingsError } = await supabase
          .from("white_label_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(); // Use maybeSingle as settings might not exist

        if (settingsError) {
          console.error("Error fetching white label settings:", settingsError);
          toast.error("Failed to load white label settings");
          // Don't block loading, allow user to create settings if none exist
        }

        if (settings) {
          setSettingsId(settings.id);
          setCompanyName(settings.company_name || "");
          setPrimaryColor(settings.primary_color || "#000000");
          setLogoUrl(settings.logo_url || null); // Store original URL
          setCurrentLogoUrl(settings.logo_url || null); // Store URL for display
        }
        
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load settings data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Handle Logo Upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!isProUser) {
          toast.error("White label features require a Pro or Enterprise plan.");
          return;
      }
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
          toast.error("Please upload an image file (PNG, JPG, GIF)");
          return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB Limit
          toast.error("Image size should be less than 2MB");
          return;
      }

      setUploadingLogo(true);
      try {
          const supabase = createClient();
          const fileExt = file.name.split('.').pop();
          const fileName = `logo-${Date.now()}.${fileExt}`;
          const filePath = `${userId}/white-label/${fileName}`;

          // Upload new logo
          const { error: uploadError } = await supabase.storage
              .from("useruploads") // Ensure this bucket exists and has policies set
              .upload(filePath, file, { upsert: true });

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: urlData } = supabase.storage.from("useruploads").getPublicUrl(filePath);
          const newLogoUrl = urlData.publicUrl;

          // Update state immediately for UI feedback
          setCurrentLogoUrl(newLogoUrl);
          setLogoUrl(newLogoUrl); // Store the new URL to be saved
          toast.success("Logo uploaded. Save changes to apply.");

          // Optionally: Clean up old logo from storage if a previous one existed
          // This requires storing the old file path, which we aren't doing currently.

      } catch (error) {
          console.error("Error uploading logo:", error);
          toast.error("Failed to upload logo.");
          // Revert UI if needed (optional)
          // setCurrentLogoUrl(settings?.logo_url || null); 
      } finally {
          setUploadingLogo(false);
      }
  };

  // Handle Save White Label Settings
  const handleSaveChanges = async () => {
    if (!isProUser) {
        toast.error("Updating white label settings requires a Pro or Enterprise plan.");
        return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const settingsData = {
        user_id: userId,
        company_name: companyName,
        primary_color: primaryColor,
        logo_url: logoUrl, // Use the potentially updated logoUrl
        updated_at: new Date().toISOString(),
      };

      let error;
      if (settingsId) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from("white_label_settings")
          .update(settingsData)
          .eq("id", settingsId);
        error = updateError;
      } else {
        // Create new settings record
        const { error: insertError, data: insertedData } = await supabase
          .from("white_label_settings")
          .insert(settingsData)
          .select('id')
          .single();
        error = insertError;
        if (insertedData) {
            setSettingsId(insertedData.id); // Store the new ID
        }
      }

      if (error) throw error;

      toast.success("White label settings saved successfully!");
      // Refresh displayed logo URL just in case it differs from the saved one
      setCurrentLogoUrl(logoUrl); 

    } catch (error) {
      console.error("Error saving white label settings:", error);
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>White Label Settings</CardTitle>
        <CardDescription>
          Customize the appearance of PDF reports with your branding. 
          {!isProUser && <span className="text-orange-500 font-medium">Requires Pro or Enterprise plan.</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Company Name */}
        <div className="space-y-2">
          <Label htmlFor="company-name">Company Name</Label>
          <Input 
            id="company-name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Your Company Name"
            disabled={!isProUser || saving}
          />
          <p className="text-xs text-muted-foreground">
            Displayed on generated PDF reports.
          </p>
        </div>

        {/* Primary Color */}
        <div className="space-y-2">
          <Label htmlFor="primary-color">Primary Color</Label>
          <div className="flex items-center gap-2">
            <Input 
              id="primary-color" 
              type="color" 
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-16 h-10 p-1"
              disabled={!isProUser || saving}
            />
            <Input 
              type="text" 
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)} // Basic hex validation could be added
              placeholder="#000000"
              className="max-w-[150px]"
              disabled={!isProUser || saving}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Used for accents and headings in PDF reports.
          </p>
        </div>

        {/* Logo Upload */}
        <div className="space-y-2">
          <Label>Company Logo</Label>
          <div className="flex items-center space-x-6">
            <Avatar className="h-16 w-16 rounded-md border">
              {currentLogoUrl ? (
                <AvatarImage src={currentLogoUrl} alt="Company Logo" className="object-contain"/>
              ) : (
                <AvatarFallback className="rounded-md"><PaletteIcon className="h-6 w-6 text-muted-foreground"/></AvatarFallback>
              )}
            </Avatar>
            
            <div>
              <Label htmlFor="logo-upload" className="mb-2 block">
                 <Button 
                    variant="outline" 
                    size="sm"
                    disabled={!isProUser || uploadingLogo || saving}
                    className="cursor-pointer"
                    type="button"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="mr-2 h-4 w-4" />
                        {currentLogoUrl ? "Change Logo" : "Upload Logo"}
                      </>
                    )}
                  </Button>
              </Label>
              <Input 
                id="logo-upload" 
                type="file" 
                accept="image/png, image/jpeg, image/gif" 
                className="hidden" 
                onChange={handleLogoUpload}
                disabled={!isProUser || uploadingLogo || saving}
              />
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG or GIF. Max 2MB. Recommended: Square or landscape.
              </p>
            </div>
          </div>
        </div>

      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSaveChanges} 
          disabled={!isProUser || saving || uploadingLogo}
          className="ml-auto"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save White Label Settings"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 