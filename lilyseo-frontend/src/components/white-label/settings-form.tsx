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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { errorToast, successToast } from "@/lib/toast-utils";
import { Loader2, Save, Upload, Trash2, Eye, EyeOff, FileDown, BookOpen, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PDFViewer } from '@react-pdf/renderer';
import { PdfThemeProvider, PdfTheme } from '@/context/ThemeContext';
import SEOAuditReport from '../pdf/SEOAuditReport';
import CustomizePanel from '../pdf/CustomizePanel';
import SaveTemplateDialog, { PdfTemplate } from '../pdf/SaveTemplateDialog';
import { fetchPdfTemplates, savePdfTemplate, deletePdfTemplate } from '@/services/pdf-templates';

export function WhiteLabelSettingsForm() {
  const router = useRouter();
  const [settings, setSettings] = useState<Partial<WhiteLabelSettings>>({});
  const [originalSettings, setOriginalSettings] = useState<Partial<WhiteLabelSettings>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState("branding");
  const [connectionTested, setConnectionTested] = useState(false);
  
  // Test Supabase connection directly
  useEffect(() => {
    async function testConnection() {
      try {
        console.log("🧪 Testing Supabase connection directly...");
        
        // Create a test object we'll try to save
        const testSettings = {
          test_value: "Test value " + new Date().toISOString(),
          company_name: "Test Company"
        };
        
        console.log("🧪 Test settings:", testSettings);
        
        // Try to save it directly
        const result = await saveWhiteLabelSettings(testSettings);
        
        console.log("🧪 Test save result:", result);
        setConnectionTested(true);
        
        if (result) {
          console.log("✅ Connection test passed!");
        } else {
          console.error("❌ Connection test failed - no result returned");
        }
      } catch (error) {
        console.error("❌ Connection test error:", error);
      }
    }
    
    if (!connectionTested) {
      testConnection();
    }
  }, [connectionTested]);
  
  // PDF Export states
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isLoadingPdfPreview, setIsLoadingPdfPreview] = useState(false);
  const [mockAuditData, setMockAuditData] = useState<any>(null);
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [pdfCustomizations, setPdfCustomizations] = useState<PdfTheme>({
    primaryColor: 'hsl(220 70% 50%)',
    secondaryColor: '#4b5563',
    companyName: 'Your Company',
    fontFamily: 'Poppins, Montserrat, sans-serif',
    logoUrl: undefined,
    contactInfo: 'support@example.com',
    footerText: `© ${new Date().getFullYear()} Your Company. All rights reserved.`,
    pageSize: 'A4',
    colorMode: 'Full',
    outputQuality: 'Standard',
    includeOptions: {
      executiveSummary: true,
      technicalSEO: true,
      onPageSEO: true,
      offPageSEO: true,
      performance: true,
      userExperience: true,
      insights: true,
      recommendations: true,
      charts: true,
      branding: true,
      structuredData: true,
      internalLinks: true
    }
  });
  const [isSavingOptions, setIsSavingOptions] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await fetchWhiteLabelSettings();
        if (data) {
          setSettings(data);
          // Store original settings to track changes
          setOriginalSettings(JSON.parse(JSON.stringify(data)));
          if (data.logo_url) {
            setLogoPreview(data.logo_url);
            
            // Update PDF customizations with white label settings
            setPdfCustomizations(prev => ({
              ...prev,
              primaryColor: data.primary_color || prev.primaryColor,
              secondaryColor: data.secondary_color || prev.secondaryColor,
              companyName: data.company_name || prev.companyName,
              logoUrl: data.logo_url || undefined,
              footerText: data.custom_copyright || prev.footerText
            }));
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
        
        // Load mock audit data for PDF preview
        loadMockAuditData();
        
        // Load PDF templates
        loadPdfTemplates();
      } catch (error) {
        console.error("Error loading white label settings:", error);
        errorToast("Error loading white label settings", {
          description: "Failed to load white label settings"
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);
  
  // Track unsaved changes
  useEffect(() => {
    if (!isLoading && Object.keys(originalSettings).length > 0) {
      // Compare current settings with original settings
      const settingsChanged = JSON.stringify(settings) !== JSON.stringify(originalSettings);
      setHasUnsavedChanges(settingsChanged);
      console.log("Settings changed, unsaved changes:", settingsChanged);
    }
  }, [settings, originalSettings, isLoading]);
  
  // Update PDF customizations when white label settings change
  useEffect(() => {
    if (settings) {
      setPdfCustomizations(prev => ({
        ...prev,
        primaryColor: settings.primary_color || prev.primaryColor,
        secondaryColor: settings.secondary_color || prev.secondaryColor,
        companyName: settings.company_name || prev.companyName,
        logoUrl: settings.logo_url || undefined,
        footerText: settings.custom_copyright || prev.footerText
      }));
    }
  }, [settings]);

  // Monitor changes to PDF branding settings
  useEffect(() => {
    console.log("PDF branding setting changed:", {
      use_custom_pdf_branding: settings.use_custom_pdf_branding,
      pdf_defaults: settings.pdf_defaults
    });
  }, [settings.use_custom_pdf_branding, settings.pdf_defaults]);

  const loadMockAuditData = async () => {
    // Generate mock audit data for preview purposes
    const mockData = {
      id: "mock-audit-id",
      projects: { name: "Example Website" },
      created_at: new Date().toISOString(),
      url: "https://example.com",
      score: 75,
      report: {
        score: {
          overall: 75,
          categories: {
            onPageSeo: 80,
            performance: 65,
            usability: 85,
            links: 70,
            social: 75
          }
        },
        issues: {
          metaDescription: [
            { title: "Missing meta description", severity: "high", url: "/page1" },
            { title: "Duplicate meta description", severity: "medium", url: "/page2" }
          ],
          titleTags: [
            { title: "Title too long", severity: "medium", url: "/page3" }
          ],
          headings: [
            { title: "Missing H1 tag", severity: "high", url: "/page4" }
          ],
          images: [
            { title: "Missing alt text", severity: "medium", url: "/page5" }
          ],
          links: [
            { title: "Broken link", severity: "high", url: "/page6" }
          ],
          performance: [
            { title: "Large JavaScript bundle", severity: "medium", url: "/page7" }
          ],
          mobile: [
            { title: "Not mobile friendly", severity: "high", url: "/page8" }
          ],
          security: [
            { title: "Missing HTTPS", severity: "high", url: "/page9" }
          ]
        },
        pageSpeed: {
          mobile: { performance: 0.65, cls: 0.1, fcp: 1500, lcp: 2500, tbt: 350 },
          desktop: { performance: 0.75, cls: 0.05, fcp: 1000, lcp: 1800, tbt: 250 }
        },
        mozData: {
          domainAuthority: 35,
          pageAuthority: 40,
          linkingDomains: 150,
          totalLinks: 2500
        },
        keywords: {
          found: ["seo", "digital marketing", "web design"],
          suggested: ["seo tools", "seo agency", "seo services"]
        }
      }
    };
    
    setMockAuditData(mockData);
  };
  
  const loadPdfTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      const templatesData = await fetchPdfTemplates();
      setTemplates(templatesData);
    } catch (error) {
      console.error("Error loading PDF templates:", error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

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
          setPdfCustomizations(prev => ({ ...prev, logoUrl }));
          successToast("Logo uploaded successfully", {
            description: "Your logo has been uploaded"
          });
        } else {
          throw new Error("Failed to upload logo");
        }
      } catch (error) {
        console.error("Error uploading logo:", error);
        errorToast("Failed to upload logo", {
          description: "There was an error uploading your logo"
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
    setPdfCustomizations(prev => ({ ...prev, logoUrl: undefined }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    console.log("💾 Save Changes button clicked - saving all white label settings");
    
    try {
      // Simple save to test the functionality
      const simplifiedSettings = {
        ...settings,
        primary_color: settings.primary_color || "hsl(220 70% 50%)",
        secondary_color: settings.secondary_color || "#FFFFFF",
        company_name: settings.company_name || "Your Company",
        remove_powered_by: !!settings.remove_powered_by,
        use_custom_email_branding: !!settings.use_custom_email_branding,
        use_custom_pdf_branding: !!settings.use_custom_pdf_branding,
        // Simplified PDF defaults
        pdf_defaults: settings.use_custom_pdf_branding ? {
          font_family: 'Inter',
          page_size: 'A4',
          color_mode: 'color',
          output_quality: 'high'
        } : null
      };
      
      console.log("💾 Saving simplified white label settings:", JSON.stringify(simplifiedSettings, null, 2));
      
      // Direct call to check if this is working
      const result = await saveWhiteLabelSettings(simplifiedSettings);
      
      console.log("💾 Save result:", result);
      
      if (result) {
        console.log("✅ White label settings saved successfully:", result);
        successToast("White label settings saved successfully", {
          description: "Your settings have been updated"
        });
        
        // Reset original settings to current to clear unsaved changes
        setOriginalSettings(JSON.parse(JSON.stringify(simplifiedSettings)));
        setHasUnsavedChanges(false);
        
        // Refresh the page to apply changes
        router.refresh();
      } else {
        throw new Error("Failed to save settings - no result returned");
      }
    } catch (error) {
      console.error("❌ Error saving white label settings:", error);
      errorToast("Failed to save settings", {
        description: "There was an error saving your white label settings"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const togglePreviewMode = () => {
    setPreviewMode(!previewMode);
  };
  
  // PDF customization handlers
  const handleUpdatePdfTheme = (newSettings: Partial<PdfTheme>) => {
    setPdfCustomizations(prev => ({
      ...prev,
      ...newSettings,
      includeOptions: {
        ...prev.includeOptions,
        ...(newSettings.includeOptions || {})
      }
    }));
    
    // Also update main settings for branding colors
    if (newSettings.primaryColor) {
      setSettings(prev => ({ ...prev, primary_color: newSettings.primaryColor }));
    }
    if (newSettings.secondaryColor) {
      setSettings(prev => ({ ...prev, secondary_color: newSettings.secondaryColor }));
    }
    if (newSettings.companyName) {
      setSettings(prev => ({ ...prev, company_name: newSettings.companyName }));
    }
    if (newSettings.footerText) {
      setSettings(prev => ({ ...prev, custom_copyright: newSettings.footerText }));
    }
  };
  
  const handleSaveTemplate = async (template: {name: string; description: string; themeSettings: Partial<PdfTheme>}) => {
    try {
      await savePdfTemplate(
        template.name,
        template.description,
        template.themeSettings
      );
      await loadPdfTemplates();
      
      successToast("PDF template saved", {
        description: "Your PDF template has been saved successfully"
      });
    } catch (error) {
      console.error("Error saving PDF template:", error);
      errorToast("Failed to save PDF template", {
        description: "There was an error saving your PDF template"
      });
      throw error;
    }
  };
  
  const handleLoadTemplate = (template: PdfTemplate) => {
    setPdfCustomizations(prevTheme => ({
      ...prevTheme,
      ...template.themeSettings,
      includeOptions: {
        ...prevTheme.includeOptions,
        ...(template.themeSettings.includeOptions || {})
      }
    }));
    
    // Update main settings with template values
    setSettings(prev => ({
      ...prev,
      primary_color: template.themeSettings.primaryColor || prev.primary_color,
      secondary_color: template.themeSettings.secondaryColor || prev.secondary_color,
      company_name: template.themeSettings.companyName || prev.company_name,
      custom_copyright: template.themeSettings.footerText || prev.custom_copyright
    }));
    
    setSelectedTemplateId(template.id);
    
    successToast("Template loaded", {
      description: `The "${template.name}" template has been loaded`
    });
  };
  
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deletePdfTemplate(templateId);
      await loadPdfTemplates();
      
      successToast("Template deleted", {
        description: "Your PDF template has been deleted"
      });
    } catch (error) {
      console.error("Error deleting PDF template:", error);
      errorToast("Failed to delete PDF template", {
        description: "There was an error deleting your PDF template"
      });
      throw error;
    }
  };

  const handleSaveOptions = async () => {
    setIsSavingOptions(true);
    console.log("🔄 Save Options button clicked");
    
    try {
      // Simplified options save
      const simplifiedSettings = {
        ...settings,
        remove_powered_by: !!settings.remove_powered_by,
        use_custom_email_branding: !!settings.use_custom_email_branding,
        use_custom_pdf_branding: !!settings.use_custom_pdf_branding
      };
      
      console.log("🔄 Saving simplified options:", JSON.stringify(simplifiedSettings, null, 2));
      
      const result = await saveWhiteLabelSettings(simplifiedSettings);
      
      console.log("🔄 Options save result:", result);
      
      if (result) {
        console.log("✅ Options saved successfully:", result);
        successToast("Options saved successfully", {
          description: "Your white label options have been updated"
        });
        
        // Refresh the page to apply changes
        router.refresh();
      } else {
        throw new Error("Failed to save options - no result returned");
      }
    } catch (error) {
      console.error("❌ Error saving white label options:", error);
      errorToast("Failed to save options", {
        description: "There was an error saving your white label options"
      });
    } finally {
      setIsSavingOptions(false);
    }
  };

  // Ensure PDF context is updated when preview is opened
  useEffect(() => {
    if (isPdfPreviewOpen) {
      console.log("PDF preview opened, applying theme:", pdfCustomizations);
    }
  }, [isPdfPreviewOpen, pdfCustomizations]);

  // Open PDF preview with loading state
  const handleOpenPdfPreview = () => {
    console.log("Opening PDF preview with customizations:", pdfCustomizations);
    console.log("Current white label settings:", settings);
    setIsLoadingPdfPreview(true);
    setIsPdfPreviewOpen(true);
    
    // Load mock audit data if not loaded yet
    if (!mockAuditData) {
      loadMockAuditData();
    }
    
    // Add small delay to ensure loading state is visible
    setTimeout(() => {
      setIsLoadingPdfPreview(false);
    }, 1000);
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

      <Tabs 
        defaultValue="branding" 
        className="w-full"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="pdf-export">PDF Export</TabsTrigger>
          <TabsTrigger value="customization">Customization</TabsTrigger>
          <TabsTrigger value="options">Options</TabsTrigger>
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
        
        <TabsContent value="pdf-export" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>PDF Export Settings</CardTitle>
              <CardDescription>
                Customize how your PDF reports look and what information they include
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <CustomizePanel 
                theme={pdfCustomizations}
                updateTheme={handleUpdatePdfTheme}
                templates={templates}
                isLoadingTemplates={isLoadingTemplates}
                onSaveTemplate={handleSaveTemplate}
                onLoadTemplate={handleLoadTemplate}
                onDeleteTemplate={handleDeleteTemplate}
              />
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">PDF Preview</h3>
                    <p className="text-sm text-muted-foreground">
                      Preview how your PDF exports will look with current settings
                    </p>
                  </div>
                  <Button 
                    onClick={handleOpenPdfPreview} 
                    disabled={isLoadingPdfPreview}
                  >
                    {isLoadingPdfPreview ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading Preview...
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview PDF
                      </>
                    )}
                  </Button>
                </div>
                
                <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
                  <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                      <DialogTitle>PDF Export Preview</DialogTitle>
                      <DialogDescription>
                        This is how your PDF exports will look with current settings
                      </DialogDescription>
                    </DialogHeader>
                    
                    {mockAuditData ? (
                      <div className="flex-1 overflow-hidden border rounded-md h-[70vh]">
                        <PdfThemeProvider initialTheme={pdfCustomizations} key={`pdf-theme-${JSON.stringify(pdfCustomizations)}`}>
                          <PDFViewer width="100%" height="100%" className="rounded-md">
                            <SEOAuditReport 
                              auditData={mockAuditData}
                              clientInfo={{
                                name: "Example Client",
                                email: "client@example.com",
                                phone: "+1 234 567 8900",
                                website: "https://client-example.com"
                              }}
                              customNotes="This is a sample PDF report preview showing how your white label settings will be applied to PDF exports."
                            />
                          </PDFViewer>
                        </PdfThemeProvider>
                      </div>
                    ) : (
                      <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    )}
                    
                    <div className="mt-4 flex justify-end">
                      <Button variant="outline" onClick={() => setIsPdfPreviewOpen(false)}>
                        Close Preview
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">PDF Templates</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    Save your current settings as a template or load a previously saved template
                  </p>
                  
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => setIsTemplateDialogOpen(true)}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Manage PDF Templates
                  </Button>
                  
                  <SaveTemplateDialog
                    isOpen={isTemplateDialogOpen}
                    onClose={() => setIsTemplateDialogOpen(false)}
                    currentSettings={pdfCustomizations}
                    onSaveTemplate={handleSaveTemplate}
                    onLoadTemplate={handleLoadTemplate}
                    onDeleteTemplate={handleDeleteTemplate}
                    templates={templates}
                    isLoading={isLoadingTemplates}
                  />
                </div>
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
        
        <TabsContent value="options" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Additional Options</CardTitle>
              <CardDescription>
                Configure additional white label settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="remove_powered_by" 
                    checked={settings.remove_powered_by || false}
                    onCheckedChange={(checked) => {
                      console.log("Remove powered by changed:", checked);
                      setSettings(prev => {
                        const newSettings = { ...prev, remove_powered_by: checked };
                        // Auto-save on toggle for better UX
                        successToast(`"Powered by LilySEO" branding will be ${checked ? 'removed' : 'shown'}`, {
                          description: "Click Save Changes to apply"
                        });
                        return newSettings;
                      });
                    }}
                  />
                  <Label htmlFor="remove_powered_by">
                    Remove "Powered by LilySEO" branding
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="use_custom_email_branding" 
                    checked={settings.use_custom_email_branding || false}
                    onCheckedChange={(checked) => {
                      console.log("Custom email branding changed:", checked);
                      setSettings(prev => {
                        const newSettings = { ...prev, use_custom_email_branding: checked };
                        // Auto-save on toggle for better UX
                        successToast(`Custom email branding ${checked ? 'enabled' : 'disabled'}`, {
                          description: "Click Save Changes to apply"
                        });
                        return newSettings;
                      });
                    }}
                  />
                  <Label htmlFor="use_custom_email_branding">
                    Use custom branding in email notifications
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="use_custom_pdf_branding" 
                    checked={settings.use_custom_pdf_branding || false}
                    onCheckedChange={(checked) => {
                      console.log("PDF branding switch changed:", checked);
                      setSettings(prev => {
                        const newSettings = { ...prev, use_custom_pdf_branding: checked };
                        console.log("Updated settings state:", newSettings);
                        return newSettings;
                      });
                      
                      // If enabling custom PDF branding, show a toast with instructions
                      if (checked) {
                        successToast("PDF Branding Enabled", {
                          description: "Go to the PDF Export tab to customize your PDF reports"
                        });
                        
                        // Auto-switch to PDF tab after a short delay
                        setTimeout(() => {
                          const pdfTabElement = document.querySelector('[data-value="pdf-export"]');
                          if (pdfTabElement) {
                            (pdfTabElement as HTMLElement).click();
                          }
                        }, 500);
                      }
                    }}
                  />
                  <Label htmlFor="use_custom_pdf_branding">
                    Use custom branding in PDF reports
                  </Label>
                </div>
                
                {settings.use_custom_pdf_branding && (
                  <div className="mt-4 pl-6 border-l-2 border-primary/20 space-y-4">
                    <div>
                      <h3 className="text-sm font-medium">PDF Report Options</h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        Configure additional PDF report settings. For detailed customization, use the PDF Export tab.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="include_executive_summary" 
                          checked={pdfCustomizations.includeOptions.executiveSummary}
                          onCheckedChange={(checked) => 
                            handleUpdatePdfTheme({
                              includeOptions: {
                                ...pdfCustomizations.includeOptions,
                                executiveSummary: checked
                              }
                            })
                          }
                        />
                        <Label htmlFor="include_executive_summary">
                          Include Executive Summary
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="include_charts" 
                          checked={pdfCustomizations.includeOptions.charts}
                          onCheckedChange={(checked) => 
                            handleUpdatePdfTheme({
                              includeOptions: {
                                ...pdfCustomizations.includeOptions,
                                charts: checked
                              }
                            })
                          }
                        />
                        <Label htmlFor="include_charts">
                          Include Charts and Visualizations
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="include_recommendations" 
                          checked={pdfCustomizations.includeOptions.recommendations}
                          onCheckedChange={(checked) => 
                            handleUpdatePdfTheme({
                              includeOptions: {
                                ...pdfCustomizations.includeOptions,
                                recommendations: checked
                              }
                            })
                          }
                        />
                        <Label htmlFor="include_recommendations">
                          Include Recommendations
                        </Label>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleOpenPdfPreview}
                      className="w-full"
                    >
                      {isLoadingPdfPreview ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading Preview...
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview PDF Report
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveOptions} disabled={isSavingOptions}>
                {isSavingOptions ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Options
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end">
        {hasUnsavedChanges && (
          <p className="text-amber-500 mr-4 self-center text-sm">
            You have unsaved changes
          </p>
        )}
        {/* Debug button */}
        <Button 
          variant="outline" 
          onClick={async () => {
            console.log("🐛 DEBUG: Testing direct save...");
            try {
              // Create a minimal test object with just one field
              const testObject = { company_name: "Test Company " + new Date().toISOString().slice(0, 19) };
              console.log("🐛 DEBUG: Saving test object:", testObject);
              
              const result = await saveWhiteLabelSettings(testObject);
              console.log("🐛 DEBUG: Save result:", result);
              
              if (result) {
                successToast("Debug save successful", { description: "Direct save test worked!" });
              } else {
                errorToast("Debug save failed", { description: "No result returned" });
              }
            } catch (error) {
              console.error("🐛 DEBUG: Save error:", error);
              errorToast("Debug save error", { description: String(error) });
            }
          }}
          className="mr-2"
        >
          Debug Save
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 