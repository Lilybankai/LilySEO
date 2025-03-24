"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { PDFViewer, PDFDownloadLink, Font } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileDown, Eye, ChevronLeft, Save } from 'lucide-react';
import { PdfThemeProvider, PdfTheme } from '@/context/ThemeContext';
import SEOAuditReport from './SEOAuditReport';
import CustomizePanel from './CustomizePanel';
import { fetchPdfTemplates, savePdfTemplate, deletePdfTemplate } from '@/services/pdf-templates';
import { PdfTemplate } from './SaveTemplateDialog';

// Register fonts for preview
Font.register({
  family: 'Poppins',
  fonts: [
    { src: '/fonts/Poppins-Regular.ttf' },
    { src: '/fonts/Poppins-Bold.ttf', fontWeight: 'bold' },
    { src: '/fonts/Poppins-Light.ttf', fontWeight: 'light' },
  ],
});

Font.register({
  family: 'Montserrat',
  fonts: [
    { src: '/fonts/Montserrat-Regular.ttf' },
    { src: '/fonts/Montserrat-Bold.ttf', fontWeight: 'bold' },
    { src: '/fonts/Montserrat-Light.ttf', fontWeight: 'light' },
  ],
});

interface PDFPreviewProps {
  auditData: any;
  isOpen: boolean;
  onClose: () => void;
  whiteLabel?: any;
  isProUser?: boolean;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({
  auditData,
  isOpen,
  onClose,
  whiteLabel,
  isProUser = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('customize');
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
  });
  const [customNotes, setCustomNotes] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  
  // Set up theme from white label settings and initialize with default settings
  const [themeSettings, setThemeSettings] = useState<PdfTheme>({
    primaryColor: whiteLabel?.primary_color || 'hsl(220 70% 50%)',
    secondaryColor: whiteLabel?.secondary_color || '#4b5563',
    companyName: whiteLabel?.company_name || 'LilySEO',
    fontFamily: 'Poppins, Montserrat, sans-serif',
    logoUrl: whiteLabel?.logo_url,
    contactInfo: whiteLabel?.custom_domain || 'support@lilyseo.com',
    footerText: whiteLabel?.custom_copyright || `© ${new Date().getFullYear()} ${whiteLabel?.company_name || 'LilySEO'}. All rights reserved.`,
    // Default customization options
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
      branding: true
    }
  });
  
  // Fetch templates when dialog opens
  useEffect(() => {
    if (isOpen && isProUser) {
      loadTemplates();
    }
    
    if (isOpen) {
      setIsLoading(true);
      setShowPreview(false);
      
      // Load with short delay to allow dialog animation to complete
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, isProUser]);
  
  const loadTemplates = useCallback(async () => {
    if (!isProUser) return;
    
    try {
      setIsLoadingTemplates(true);
      const templatesData = await fetchPdfTemplates();
      setTemplates(templatesData);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [isProUser]);
  
  const handleUpdateTheme = (newSettings: Partial<PdfTheme>) => {
    setThemeSettings(prev => ({
      ...prev,
      ...newSettings,
      // Handle nested includeOptions correctly
      includeOptions: {
        ...prev.includeOptions,
        ...(newSettings.includeOptions || {})
      }
    }));
  };
  
  const handleClientInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClientInfo(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomNotes(e.target.value);
  };
  
  const handleSaveTemplate = async (template: {name: string; description: string; themeSettings: Partial<PdfTheme>}) => {
    try {
      await savePdfTemplate(
        template.name,
        template.description,
        template.themeSettings
      );
      await loadTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      throw error;
    }
  };
  
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deletePdfTemplate(templateId);
      await loadTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      throw error;
    }
  };
  
  const handleLoadTemplate = (template: PdfTemplate) => {
    setThemeSettings(prevTheme => ({
      ...prevTheme,
      ...template.themeSettings,
      // Handle nested includeOptions correctly
      includeOptions: {
        ...prevTheme.includeOptions,
        ...(template.themeSettings.includeOptions || {})
      }
    }));
    
    setSelectedTemplateId(template.id);
  };
  
  const fileName = `${auditData.projects?.name || 'SEO'}-Audit-Report-${new Date().toISOString().split('T')[0]}.pdf`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {showPreview && (
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)} className="h-8 w-8 p-0 mr-2">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {showPreview ? 'PDF Preview' : 'Export to PDF'}
          </DialogTitle>
          <DialogDescription>
            {showPreview 
              ? 'Preview your PDF report before downloading'
              : isProUser 
                ? 'Customize your PDF report with branding, layout, and content options'
                : 'Create a PDF report of your SEO audit'
            }
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : showPreview ? (
          <div className="flex-1 overflow-hidden border rounded-md">
            <PdfThemeProvider initialTheme={themeSettings}>
              <PDFViewer width="100%" height="100%" className="rounded-md">
                <SEOAuditReport 
                  auditData={auditData}
                  clientInfo={isProUser ? clientInfo : undefined}
                  customNotes={isProUser ? customNotes : undefined}
                  templateId={selectedTemplateId || undefined}
                />
              </PDFViewer>
            </PdfThemeProvider>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="customize">Customize PDF</TabsTrigger>
                {isProUser && <TabsTrigger value="client-info">Client Information</TabsTrigger>}
              </TabsList>
              
              <TabsContent value="customize" className="mt-0">
                <Card className="p-4">
                  <CustomizePanel 
                    theme={themeSettings}
                    updateTheme={handleUpdateTheme}
                    templates={templates}
                    isLoadingTemplates={isLoadingTemplates}
                    onSaveTemplate={handleSaveTemplate}
                    onLoadTemplate={handleLoadTemplate}
                    onDeleteTemplate={handleDeleteTemplate}
                  />
                </Card>
              </TabsContent>
              
              {isProUser && (
                <TabsContent value="client-info" className="mt-0">
                  <Card className="p-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Client Information</h3>
                      <p className="text-sm text-muted-foreground">
                        Add client details to personalize the PDF report
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="clientName">Client/Company Name</Label>
                          <Input 
                            id="clientName" 
                            name="name"
                            value={clientInfo.name}
                            onChange={handleClientInfoChange} 
                            placeholder="Client Name" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clientEmail">Contact Email</Label>
                          <Input 
                            id="clientEmail" 
                            name="email"
                            value={clientInfo.email}
                            onChange={handleClientInfoChange} 
                            placeholder="client@example.com" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clientPhone">Contact Phone</Label>
                          <Input 
                            id="clientPhone" 
                            name="phone"
                            value={clientInfo.phone}
                            onChange={handleClientInfoChange} 
                            placeholder="+1 234 567 8900" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clientWebsite">Website</Label>
                          <Input 
                            id="clientWebsite" 
                            name="website"
                            value={clientInfo.website}
                            onChange={handleClientInfoChange} 
                            placeholder="https://example.com" 
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="customNotes">Additional Notes</Label>
                        <Textarea 
                          id="customNotes" 
                          value={customNotes}
                          onChange={handleNotesChange} 
                          placeholder="Add any additional notes you would like to include in the report..." 
                          className="h-24"
                        />
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
            
            <div className="flex justify-center mt-6 space-x-3">
              <Button 
                onClick={() => setShowPreview(true)}
                variant="outline"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview PDF
              </Button>
              
              <PdfThemeProvider initialTheme={themeSettings}>
                <PDFDownloadLink
                  document={
                    <SEOAuditReport 
                      auditData={auditData}
                      clientInfo={isProUser ? clientInfo : undefined}
                      customNotes={isProUser ? customNotes : undefined}
                      templateId={selectedTemplateId || undefined}
                    />
                  }
                  fileName={fileName}
                  className="inline-block"
                >
                  {({ loading, error }) => (
                    <Button disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileDown className="h-4 w-4 mr-2" />
                          Download PDF
                        </>
                      )}
                    </Button>
                  )}
                </PDFDownloadLink>
              </PdfThemeProvider>
            </div>
            
            {!isProUser && (
              <Card className="p-4 mt-6">
                <h3 className="text-lg font-semibold mb-2">PDF Report Features</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upgrade to Pro for even more customization options:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Custom branding with your company logo and colors</li>
                  <li>Client information section for professional delivery</li>
                  <li>Advanced layout customization options</li>
                  <li>Save and reuse PDF templates</li>
                  <li>Additional output formats and quality settings</li>
                </ul>
              </Card>
            )}
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {showPreview ? 'Close' : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreview; 