"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, AlertTriangle, Beaker, FileType, Bug } from 'lucide-react';
import { PdfTheme } from '@/context/ThemeContext';
import CustomizePanel from './CustomizePanel';
import WhiteLabelProfileSelector from './WhiteLabelProfileSelector';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { pdfService, PdfGenerationOptions } from '@/services/pdf-service';
import {
  fetchWhiteLabelProfiles,
  getWhiteLabelProfile,
} from '@/services/white-label';
import { WhiteLabelProfile } from '@/components/pdf/WhiteLabelProfileSelector';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Template interface for cover styles
interface Template {
  id: string;
  name: string;
  description: string;
  coverStyle: number;
  previewUrl?: string | null;
}

interface PDFPreviewProps {
  auditData: {
    project_id?: string;
    template?: {
      id: string;
    };
  };
  isOpen: boolean;
  onClose: () => void;
  whiteLabel?: any;
  isProUser?: boolean;
}

const defaultTheme: PdfTheme = {
  primaryColor: '#000000',
  logoUrl: '',
  clientName: '',
  preparedBy: '',
  customNotes: '',
  coverStyle: 1,
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
    internalLinks: true,
  },
};

// Default cover templates
const coverTemplates: Template[] = [
  { 
    id: 'template1', 
    name: 'Minimal White',
    description: 'Clean professional design with your logo and brand color',
    coverStyle: 1,
    previewUrl: null
  },
  { 
    id: 'template2', 
    name: 'Gradient Theme',
    description: 'Modern design with gradient using your brand color',
    coverStyle: 2,
    previewUrl: null
  },
  { 
    id: 'template3', 
    name: 'Dark Theme',
    description: 'Sophisticated dark theme with accent brand color',
    coverStyle: 3,
    previewUrl: null
  },
  { 
    id: 'template4', 
    name: 'Colored Banner',
    description: 'Professional design with colored header banner',
    coverStyle: 4,
    previewUrl: null
  },
  { 
    id: 'template5', 
    name: 'Split Color',
    description: 'Bold split-color design showcasing your brand',
    coverStyle: 5,
    previewUrl: null
  },
];

// Function to render template preview as SVG
const renderTemplateSvg = (templateId: number, primaryColor = '#3b82f6') => {
  console.log(`Rendering template SVG for template ID: ${templateId} with color: ${primaryColor}`);
  switch(templateId) {
    case 1: // Minimal White
      return (
        <svg viewBox="0 0 85 110" className="w-full h-full">
          <rect width="85" height="110" fill="#ffffff" />
          <rect x="5" y="10" width="75" height="20" fill={primaryColor} opacity="0.1" />
          <text x="42.5" y="7" fontSize="4" textAnchor="middle" fill="#333">SEO AUDIT REPORT</text>
          <text x="42.5" y="40" fontSize="2.5" textAnchor="middle" fill="#555">Minimal White Template</text>
          <rect x="17.5" y="50" width="50" height="0.5" fill={primaryColor} />
          <rect x="17.5" y="52" width="50" height="0.2" fill="#ddd" />
          <text x="42.5" y="58" fontSize="2" textAnchor="middle" fill="#555">Template Preview</text>
          <circle cx="42.5" cy="70" r="10" fill={primaryColor} opacity="0.1" />
        </svg>
      );
    
    case 2: // Gradient Theme
      return (
        <svg viewBox="0 0 85 110" className="w-full h-full">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={primaryColor} stopOpacity="0.8" />
              <stop offset="100%" stopColor={primaryColor} stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <rect width="85" height="110" fill="#ffffff" />
          <rect x="0" y="0" width="85" height="30" fill="url(#gradient)" />
          <text x="42.5" y="15" fontSize="4" textAnchor="middle" fill="white">SEO AUDIT REPORT</text>
          <text x="42.5" y="40" fontSize="2.5" textAnchor="middle" fill="#555">Gradient Theme Template</text>
          <rect x="17.5" y="50" width="50" height="0.5" fill={primaryColor} />
          <text x="42.5" y="58" fontSize="2" textAnchor="middle" fill="#555">Template Preview</text>
        </svg>
      );
    
    case 3: // Dark Theme
      return (
        <svg viewBox="0 0 85 110" className="w-full h-full">
          <rect width="85" height="110" fill="#1f2937" />
          <rect x="5" y="5" width="75" height="100" fill="#111827" />
          <text x="42.5" y="15" fontSize="4" textAnchor="middle" fill="white">SEO AUDIT REPORT</text>
          <rect x="20" y="20" width="45" height="0.5" fill={primaryColor} />
          <text x="42.5" y="40" fontSize="2.5" textAnchor="middle" fill="#ccc">Dark Theme Template</text>
          <rect x="17.5" y="50" width="50" height="0.5" fill={primaryColor} />
          <text x="42.5" y="58" fontSize="2" textAnchor="middle" fill="#ccc">Template Preview</text>
        </svg>
      );
    
    case 4: // Colored Banner
    return (
        <svg viewBox="0 0 85 110" className="w-full h-full">
          <rect width="85" height="110" fill="#ffffff" />
          <rect x="0" y="0" width="85" height="20" fill={primaryColor} />
          <text x="42.5" y="12" fontSize="4" textAnchor="middle" fill="white">SEO AUDIT REPORT</text>
          <text x="42.5" y="40" fontSize="2.5" textAnchor="middle" fill="#555">Colored Banner Template</text>
          <rect x="17.5" y="50" width="50" height="0.5" fill={primaryColor} />
          <rect x="17.5" y="52" width="50" height="0.2" fill="#ddd" />
          <text x="42.5" y="58" fontSize="2" textAnchor="middle" fill="#555">Template Preview</text>
        </svg>
      );
    
    case 5: // Split Color
    return (
        <svg viewBox="0 0 85 110" className="w-full h-full">
          <rect width="42.5" height="110" fill={primaryColor} />
          <rect x="42.5" y="0" width="42.5" height="110" fill="#ffffff" />
          <text x="42.5" y="15" fontSize="4" textAnchor="middle" fill="white">SEO AUDIT</text>
          <text x="42.5" y="20" fontSize="4" textAnchor="middle" fill="#333">REPORT</text>
          <text x="42.5" y="40" fontSize="2.5" textAnchor="middle" fill="#555">Split Color Template</text>
          <rect x="17.5" y="50" width="50" height="0.5" fill={primaryColor} opacity="0.5" />
          <text x="42.5" y="58" fontSize="2" textAnchor="middle" fill="#555">Template Preview</text>
        </svg>
      );
    
    default:
    return (
        <svg viewBox="0 0 85 110" className="w-full h-full">
          <rect width="85" height="110" fill="#f0f0f0" />
          <text x="42.5" y="55" fontSize="5" textAnchor="middle" fill="#999">
            Template {templateId}
          </text>
        </svg>
    );
  }
};

const PDFPreview: React.FC<PDFPreviewProps> = ({
  auditData,
  isOpen,
  onClose,
  whiteLabel,
  isProUser = false,
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(coverTemplates[0]);

  // Theme state
  const [theme, setTheme] = useState<PdfTheme>(defaultTheme);

  // White label profile state
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<WhiteLabelProfile[]>([]);

  // Load white label profiles
  useEffect(() => {
    if (isProUser) {
      loadWhiteLabelProfiles();
    }
  }, [isProUser]);
  
  const loadWhiteLabelProfiles = async () => {
    try {
      const fetchedProfiles = await fetchWhiteLabelProfiles();
      console.log("Loaded profiles:", fetchedProfiles);
      setProfiles(fetchedProfiles);
    } catch (error) {
      console.error('Failed to load white label profiles:', error);
    }
  };
  
  // Handle theme updates
  const handleUpdateTheme = (newSettings: Partial<PdfTheme>) => {
    console.log('Updating theme with:', newSettings);
    setTheme(prev => {
      const updatedTheme = { ...prev, ...newSettings };
      console.log("Updated theme:", updatedTheme);
      return updatedTheme;
    });
  };

  // Handle template selection
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    handleUpdateTheme({ coverStyle: template.coverStyle });
    console.log("Selected template:", template);
  };
  
  // Handle white label profile selection
  const handleSelectProfile = async (profileId: string) => {
    try {
      const profile = await getWhiteLabelProfile(profileId);
      if (!profile) return;

      console.log("Selected profile:", profile);
      setSelectedProfileId(profileId);
      
      // Create a merged theme with profile data and current template
      const mergedTheme = {
        ...defaultTheme,
        ...(profile.theme || {}),
        primaryColor: profile.primaryColor || defaultTheme.primaryColor,
        logoUrl: profile.logoUrl || '',
        coverStyle: selectedTemplate.coverStyle, // Always prioritize selected template's coverStyle
      };
      
      console.log("Merged theme:", mergedTheme);
      handleUpdateTheme(mergedTheme);
    } catch (error) {
      console.error('Failed to load white label profile:', error);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (profile: WhiteLabelProfile) => {
    console.log("Profile updated:", profile);
    handleUpdateTheme(profile.theme);
  };

  // Handle profile create
  const handleProfileCreate = async (profile: Partial<WhiteLabelProfile>) => {
    console.log("Profile created:", profile);
    if (profile.theme) {
      handleUpdateTheme(profile.theme);
    }
  };

  // Handle profile delete
  const handleProfileDelete = async (profileId: string) => {
    if (selectedProfileId === profileId) {
      setSelectedProfileId(null);
      setTheme(defaultTheme);
    }
  };

  // Start PDF generation
  const generatePdf = async () => {
    try {
      console.log('Starting PDF generation process');
      setIsGenerating(true);
      setError(null);
      setProgress(0);
      
      if (!selectedTemplate) {
        console.error('No template selected');
        throw new Error('Please select a template before generating PDF');
      }
      
      console.log('Generating PDF with theme:', theme);
      console.log('Selected template:', selectedTemplate);
      console.log('Current profile ID:', selectedProfileId);
      
      // Initialize options with default theme first
      let pdfTheme: PdfTheme = { ...defaultTheme };
      console.log('Initial pdfTheme from defaultTheme:', pdfTheme);
      
      if (selectedProfileId) {
        const profile = await getWhiteLabelProfile(selectedProfileId);
        if (profile) {
          console.log('Loaded profile:', profile);
          pdfTheme = {
            ...pdfTheme,
            ...(profile.theme || {}),
            primaryColor: profile.primaryColor || defaultTheme.primaryColor,
            logoUrl: profile.logoUrl || defaultTheme.logoUrl,
          };
        }
      }

      // Always ensure coverStyle from selected template is used
      if (selectedTemplate && selectedTemplate.coverStyle !== undefined) {
        pdfTheme.coverStyle = selectedTemplate.coverStyle;
      } else {
        // Fallback to default coverStyle if not present
        pdfTheme.coverStyle = 1;
      }
      
      console.log('Final PDF theme:', pdfTheme);

      // --- Construct options according to PdfGenerationOptions interface ---
      if (!auditData?.project_id) {
        console.error('Error: auditData or auditData.project_id is missing.', auditData);
        throw new Error('Missing project ID in audit data. Cannot generate PDF.');
      }
      if (!selectedTemplate?.id) {
        console.error('Error: selectedTemplate or selectedTemplate.id is missing.', selectedTemplate);
        throw new Error('No template selected. Cannot generate PDF.');
      }

      const options: PdfGenerationOptions = {
        theme: pdfTheme, // Pass the whole theme object from state
        templateId: selectedTemplate.id, // Pass the selected template ID
        projectId: auditData.project_id, // Pass the project ID from auditData
        // includeOptions can be omitted or constructed if needed later
      };
      // --- End options construction ---

      // Log the data being sent (adjusted for new structure)
      console.log('[PDFPreview] Sending options to pdfService.startGeneration:', {
        projectId: options.projectId,
        templateId: options.templateId,
        themeIsObject: typeof options.theme === 'object' && options.theme !== null,
        themeKeys: options.theme ? Object.keys(options.theme) : 'N/A'
        // Removed detailed logging for fields now inside options.theme
      });

      try {
        const result = await pdfService.startGeneration(options);
        setJobId(result.jobId);
        setProgressMessage('PDF generation started. Please wait...');

        // Start polling for status
        const checkJobStatus = async () => {
          try {
            console.log('Checking job status for:', result.jobId);
            const status = await pdfService.checkStatus(result.jobId);
            console.log('Job status:', status);

            if (status.status === 'completed') {
              setProgress(100);
              setProgressMessage('PDF generation complete!');

              if (status.pdfUrl) {
                console.log('PDF URL received:', status.pdfUrl); // Log the received URL
                setPdfUrl(status.pdfUrl); // Directly use the URL from status
                setIsGenerating(false);
                setProgressMessage('PDF generation complete!');
              } else {
                console.error('PDF generation complete but no URL received.');
                setError('PDF generation complete but the download URL is missing.');
                setIsGenerating(false);
              }

            } else if (status.status === 'failed') {
              setError(status.error || 'PDF generation failed');
              setIsGenerating(false);
              setProgressMessage('');
            } else {
              // Update progress and message based on status
              setProgress(status.progress || 0);
              
              let statusMessage = 'Processing...';
              if (status.progress < 25) {
                statusMessage = 'Preparing data for PDF generation...';
              } else if (status.progress < 50) {
                statusMessage = 'Generating content...';
              } else if (status.progress < 75) {
                statusMessage = 'Rendering PDF...';
              } else {
                statusMessage = 'Finalizing PDF...';
              }
              
              setProgressMessage(statusMessage);
              setTimeout(checkJobStatus, 2000);
            }
          } catch (err) {
            console.error('Error checking job status:', err);
            setError(err instanceof Error ? `Error checking job status: ${err.message}` : 'Failed to check job status');
            setIsGenerating(false);
            setProgressMessage('');
          }
        };

        checkJobStatus();
      } catch (err) {
        console.error('Error generating PDF:', err);
        setError(err instanceof Error ? `Error generating PDF: ${err.message}` : 'Failed to generate PDF');
        setIsGenerating(false);
        setProgressMessage('');
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError(err instanceof Error ? `Error generating PDF: ${err.message}` : 'Failed to generate PDF');
      setIsGenerating(false);
      setProgressMessage('');
    }
  };

  // Handle download
  const handleDownload = async () => {
    if (!pdfUrl) { // Check pdfUrl state instead of jobId
      console.error('Download attempt failed: pdfUrl is not set');
      toast({
        title: 'Error',
        description: 'PDF URL is not available yet.',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log(`Attempting to download PDF from: ${pdfUrl}`);
      // Create a temporary link and click it to trigger download
      const link = document.createElement('a');
      link.href = pdfUrl;
      // Suggest a filename (browser might override)
      // Extract filename from URL or use a default
      const filename = pdfUrl.substring(pdfUrl.lastIndexOf('/') + 1) || 'seo-audit.pdf';
      link.setAttribute('download', filename); 
      // Use target='_blank' as fallback if download attribute is not fully supported
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer'); 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) { // Catch errors during link creation/click
      console.error('Error triggering PDF download:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate PDF download',
        variant: 'destructive',
      });
    }
  };

  // Add debug function to log current state
  const debugCurrentState = () => {
    console.log('=== DEBUG: PDF Preview State ===');
    console.log('Current theme:', theme);
    console.log('Selected template:', selectedTemplate);
    console.log('coverStyle in theme:', theme.coverStyle);
    console.log('coverStyle in template:', selectedTemplate?.coverStyle);
    console.log('Selected profile ID:', selectedProfileId);
    console.log('White label profiles:', profiles);
    
    // Add validation checks
    const validationIssues = [];
    if (theme.coverStyle === undefined) validationIssues.push('coverStyle is undefined in theme');
    if (!theme.primaryColor) validationIssues.push('primaryColor is missing in theme');
    
    if (validationIssues.length > 0) {
      console.error('Validation issues found:', validationIssues);
    } else {
      console.log('No validation issues found');
    }
    
    console.log('=== END DEBUG ===');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] max-h-[900px] flex flex-col overflow-hidden sm:w-[95vw] w-[90vw]">
        <DialogHeader className="px-2 sm:px-6">
          <DialogTitle>Generate PDF Report</DialogTitle>
          <DialogDescription>
            Customize and generate a PDF report for your SEO audit.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto px-2 sm:px-6">
          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="w-full grid grid-cols-2 sm:grid-cols-3">
              <TabsTrigger value="templates" className="text-xs sm:text-sm">Templates</TabsTrigger>
              <TabsTrigger value="customize" className="text-xs sm:text-sm">Customize</TabsTrigger>
              {isProUser && <TabsTrigger value="white-label" className="text-xs sm:text-sm">White Label</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="templates" className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coverTemplates.map(template => (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-all ${
                      selectedTemplate.id === template.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="p-4">
                      <div className="aspect-[8.5/11] bg-gray-50 rounded-md mb-3 relative overflow-hidden">
                        {renderTemplateSvg(template.coverStyle, theme.primaryColor)}
                      </div>
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="customize" className="space-y-4 py-4">
              <CustomizePanel 
                theme={theme} 
                onThemeChange={handleUpdateTheme}
              />
            </TabsContent>
            
            {isProUser && (
              <TabsContent value="white-label" className="space-y-4 py-4">
                <WhiteLabelProfileSelector
                  profiles={profiles}
                  selectedProfileId={selectedProfileId}
                  onProfileSelect={handleSelectProfile}
                  onProfileUpdate={handleProfileUpdate}
                  onProfileCreate={handleProfileCreate}
                  onProfileDelete={handleProfileDelete}
                  theme={theme}
                />
              </TabsContent>
            )}
          </Tabs>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
              <div className="flex items-start">
                <AlertTriangle className="mr-2 h-5 w-5" />
                <div>
                  <p className="font-medium mb-1">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {isGenerating && (
            <div className="mt-4 p-4 border rounded-md bg-gray-50">
              <div className="mb-2 flex justify-between items-center">
                <span className="text-sm font-medium">{progressMessage}</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          {pdfUrl && (
            <div className="mt-4 p-4 border rounded-md bg-green-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium mb-1">PDF Generated Successfully</h3>
                  <p className="text-sm text-muted-foreground">Your PDF is ready to download.</p>
                </div>
                <Button onClick={handleDownload} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-2 sm:px-6 flex-col sm:flex-row gap-2 items-center">
          <div className="flex-1 w-full sm:w-auto">
            {process.env.NODE_ENV !== 'production' && (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    debugCurrentState();
                    toast({
                      description: "Debug info logged to console",
                    });
                  }}
                >
                  <Bug className="mr-2 h-4 w-4" />
                  Debug
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const isEnabled = pdfService.isDebugModeEnabled();
                    if (isEnabled) {
                      pdfService.disableDebugMode();
                      toast({
                        description: "Debug mode disabled",
                      });
                    } else {
                      pdfService.enableDebugMode();
                      toast({
                        description: "Debug mode enabled",
                      });
                    }
                  }}
                >
                  <Beaker className="mr-2 h-4 w-4" />
                  {pdfService.isDebugModeEnabled() ? "Disable Debug Mode" : "Enable Debug Mode"}
                </Button>
              </div>
            )}
          </div>
          
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            {pdfUrl ? 'Close' : 'Cancel'}
          </Button>
          
          <Button 
            onClick={generatePdf} 
            disabled={isGenerating || !selectedTemplate}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileType className="mr-2 h-4 w-4" />
                Generate PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreview; 