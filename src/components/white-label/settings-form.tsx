"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  fetchWhiteLabelSettings, 
  saveWhiteLabelSettings, 
  toggleWhiteLabelActive,
  uploadLogo,
  getDefaultNavigation,
  getDefaultFooterNavigation,
  getDefaultSocialLinks,
  type WhiteLabelSettings
} from "@/services/white-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Save, Upload, Trash2, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function WhiteLabelSettingsForm() {
  const router = useRouter();
  const [settings, setSettings] = useState<Partial<WhiteLabelSettings>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await fetchWhiteLabelSettings();
        if (data) {
          setSettings(data);
          if (data.logo_url) {
            setLogoPreview(data.logo_url);
          }
        } else {
          // Initialize with defaults if no settings exist
          setSettings({
            primary_color: "hsl(220 70% 50%)",
            secondary_color: "#FFFFFF",
            company_name: "Your Company",
            logo_alt: "Company Logo",
            custom_copyright: `© ${new Date().getFullYear()} Your Company. All rights reserved.`,
            social_links: getDefaultSocialLinks(),
            navigation: getDefaultNavigation(),
            footer_navigation: getDefaultFooterNavigation(),
            is_active: false
          });
        }
      } catch (error) {
        console.error("Error loading white label settings:", error);
        toast({
          title: "Error",
          description: "Failed to load white label settings",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setSettings(prev => ({ ...prev, is_active: checked }));
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      
      // Create a local preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload the logo immediately
      setIsUploading(true);
      try {
        const logoUrl = await uploadLogo(file);
        if (logoUrl) {
          setSettings(prev => ({ ...prev, logo_url: logoUrl }));
          toast({
            title: "Success",
            description: "Logo uploaded successfully",
          });
        } else {
          throw new Error("Failed to upload logo");
        }
      } catch (error) {
        console.error("Error uploading logo:", error);
        toast({
          title: "Error",
          description: "Failed to upload logo",
          variant: "destructive"
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setSettings(prev => ({ ...prev, logo_url: null }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveWhiteLabelSettings(settings);
      
      if (result) {
        // If is_active changed, toggle it
        if (settings.is_active !== undefined && result.is_active !== settings.is_active) {
          await toggleWhiteLabelActive(settings.is_active);
        }
        
        toast({
          title: "Success",
          description: "White label settings saved successfully",
        });
        
        // Refresh the page to apply changes
        router.refresh();
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving white label settings:", error);
      toast({
        title: "Error",
        description: "Failed to save white label settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const togglePreviewMode = () => {
    setPreviewMode(!previewMode);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>White Label Status</CardTitle>
            <CardDescription>
              Enable or disable white label features for your account
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={togglePreviewMode}
            className="ml-auto"
          >
            {previewMode ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Close Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Preview Changes
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch 
              id="white-label-active" 
              checked={settings.is_active || false}
              onCheckedChange={handleSwitchChange}
            />
            <Label htmlFor="white-label-active">
              {settings.is_active ? "White label features are enabled" : "White label features are disabled"}
            </Label>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="customization">Customization</TabsTrigger>
        </TabsList>
        
        <TabsContent value="branding" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Logo & Company Name</CardTitle>
              <CardDescription>
                Upload your logo and set your company name
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  value={settings.company_name || ""}
                  onChange={handleChange}
                  placeholder="Your Company Name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="logo">Logo</Label>
                <div className="flex items-center gap-4">
                  {logoPreview && (
                    <div className="relative h-16 w-32 border rounded overflow-hidden">
                      <Image
                        src={logoPreview}
                        alt="Logo Preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild disabled={isUploading}>
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {isUploading ? "Uploading..." : "Upload Logo"}
                      </label>
                    </Button>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      disabled={isUploading}
                    />
                    {logoPreview && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRemoveLogo}
                        disabled={isUploading}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="logo_alt">Logo Alt Text</Label>
                <Input
                  id="logo_alt"
                  name="logo_alt"
                  value={settings.logo_alt || ""}
                  onChange={handleChange}
                  placeholder="Company Logo"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Colors</CardTitle>
              <CardDescription>
                Customize the colors of your white label interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex gap-2">
                    <div 
                      className="h-10 w-10 rounded border" 
                      style={{ backgroundColor: settings.primary_color || "hsl(220 70% 50%)" }}
                    />
                    <Input
                      id="primary_color"
                      name="primary_color"
                      value={settings.primary_color || ""}
                      onChange={handleChange}
                      placeholder="hsl(220 70% 50%)"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondary_color">Secondary Color</Label>
                  <div className="flex gap-2">
                    <div 
                      className="h-10 w-10 rounded border" 
                      style={{ backgroundColor: settings.secondary_color || "#FFFFFF" }}
                    />
                    <Input
                      id="secondary_color"
                      name="secondary_color"
                      value={settings.secondary_color || ""}
                      onChange={handleChange}
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Custom Domain</CardTitle>
              <CardDescription>
                Set up a custom domain for your white label interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="custom_domain">Custom Domain</Label>
                <Input
                  id="custom_domain"
                  name="custom_domain"
                  value={settings.custom_domain || ""}
                  onChange={handleChange}
                  placeholder="seo.yourcompany.com"
                />
                <p className="text-sm text-muted-foreground">
                  You'll need to set up DNS records to point this domain to our servers.
                  Contact support for detailed instructions.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="customization" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Footer</CardTitle>
              <CardDescription>
                Customize the footer text and copyright information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="custom_copyright">Copyright Text</Label>
                <Input
                  id="custom_copyright"
                  name="custom_copyright"
                  value={settings.custom_copyright || ""}
                  onChange={handleChange}
                  placeholder={`© ${new Date().getFullYear()} Your Company. All rights reserved.`}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Custom CSS & JavaScript</CardTitle>
              <CardDescription>
                Add custom CSS and JavaScript to further customize your white label interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom_css">Custom CSS</Label>
                <Textarea
                  id="custom_css"
                  name="custom_css"
                  value={settings.custom_css || ""}
                  onChange={handleChange}
                  placeholder="/* Your custom CSS here */"
                  className="font-mono h-32"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="custom_js">Custom JavaScript</Label>
                <Textarea
                  id="custom_js"
                  name="custom_js"
                  value={settings.custom_js || ""}
                  onChange={handleChange}
                  placeholder="// Your custom JavaScript here"
                  className="font-mono h-32"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || isUploading}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewMode} onOpenChange={setPreviewMode}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>White Label Preview</DialogTitle>
            <DialogDescription>
              Preview how your white label settings will look
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-6">
            {/* Header Preview */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-card p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {settings.logo_url ? (
                      <div className="relative h-10 w-20">
                        <Image
                          src={settings.logo_url}
                          alt={settings.logo_alt || "Company Logo"}
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div 
                        className="h-10 px-3 flex items-center justify-center font-bold text-white rounded"
                        style={{ backgroundColor: settings.primary_color || "hsl(220 70% 50%)" }}
                      >
                        {settings.company_name?.substring(0, 2) || "YC"}
                      </div>
                    )}
                    <span className="font-bold">{settings.company_name || "Your Company"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs">JD</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Navigation Preview */}
              <div className="p-4 bg-background">
                <div className="flex gap-4 text-sm">
                  {["Dashboard", "Projects", "Reports", "Settings"].map((item, index) => (
                    <div 
                      key={item} 
                      className={`px-3 py-1 rounded ${index === 0 ? 'text-white' : 'text-foreground hover:bg-muted'}`}
                      style={index === 0 ? { backgroundColor: settings.primary_color || "hsl(220 70% 50%)" } : {}}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Content Preview */}
            <div className="border rounded-lg p-4 bg-background">
              <h2 className="text-xl font-bold mb-4">Dashboard</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border rounded-lg p-4 bg-card">
                    <h3 className="font-medium mb-2">Card Title {i}</h3>
                    <div className="h-20 bg-muted rounded"></div>
                    <div className="mt-2 flex justify-end">
                      <button 
                        className="px-3 py-1 text-sm text-white rounded"
                        style={{ backgroundColor: settings.primary_color || "hsl(220 70% 50%)" }}
                      >
                        Action
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Footer Preview */}
            <div className="border rounded-lg p-4 bg-card">
              <div className="text-center text-sm text-muted-foreground">
                {settings.custom_copyright || `© ${new Date().getFullYear()} Your Company. All rights reserved.`}
              </div>
            </div>
            
            {/* Custom CSS Preview */}
            {settings.custom_css && (
              <div className="border rounded-lg p-4 bg-card">
                <h3 className="font-medium mb-2">Custom CSS Preview</h3>
                <div className="bg-muted p-2 rounded font-mono text-xs overflow-x-auto">
                  <pre>{settings.custom_css}</pre>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 