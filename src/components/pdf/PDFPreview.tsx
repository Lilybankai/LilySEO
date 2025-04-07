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
import { Loader2, FileDown, Eye, ChevronLeft, Save, Info, Lock, CheckCircle, Download } from 'lucide-react';
import { PdfThemeProvider, PdfTheme } from '@/context/ThemeContext';
import SEOAuditReport from './SEOAuditReport';
import CustomizePanel from './CustomizePanel';
import WhiteLabelProfileSelector from './WhiteLabelProfileSelector';
import { 
  fetchPdfTemplates, 
  savePdfTemplate, 
  deletePdfTemplate 
} from '@/services/pdf-templates';
import {
  fetchWhiteLabelProfiles,
  getWhiteLabelProfile,
  createWhiteLabelProfile,
  updateWhiteLabelProfile,
  deleteWhiteLabelProfile
} from '@/services/white-label-profiles';
import { PdfTemplate } from './SaveTemplateDialog';
import { WhiteLabelProfile } from './WhiteLabelProfileSelector';
import { Switch } from '@/components/ui/switch';
import { logPdfEvent, safeHslToHex } from '@/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { createPdfGenerationJob, getPdfGenerationJob, PdfGenerationJob, PdfGenerationParameters } from '@/services/pdf-job';
import { Progress } from '@/components/ui/progress';

// Register fonts for preview - using system fonts with fallbacks
/*
Font.register({
  family: 'Poppins',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff', fontWeight: 'normal' }, // Regular
    { src: 'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLCz7Z1xlEw.woff', fontWeight: 'bold' }, // Bold
    { src: 'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLEj6Z1xlEw.woff', fontWeight: 'light' }, // Light
  ],
});

// Register a fallback sans-serif font to ensure PDF generation works
Font.register({
  family: 'sans-serif',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/opensans/v35/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVc.woff', fontWeight: 'normal' }, // Open Sans as backup
  ],
});
*/

interface PDFPreviewProps {
  auditData: any;
  isOpen: boolean;
  onClose: () => void;
  whiteLabel?: any;
  isProUser?: boolean;
}

interface EnhancedAuditData {
  id?: string;
  project_id?: string;
  created_at?: string;
  status?: string;
  score?: number;
  url?: string;
  projects?: {
    name?: string;
    url?: string;
  };
  report?: {
    score?: {
      overall?: number;
      categories?: Record<string, number>;
    };
    issues?: Record<string, any[]>;
    pageSpeed?: {
      mobile?: { performance: number; cls?: number; fcp?: number; lcp?: number; tbt?: number };
      desktop?: { performance: number; cls?: number; fcp?: number; lcp?: number; tbt?: number };
    };
    mozData?: {
      domainAuthority?: number;
      pageAuthority?: number;
      linkingDomains?: number;
      totalLinks?: number;
    };
  };
  ai_content?: {
    executive_summary?: string;
    recommendations?: string;
    technical_explanations?: string;
    generated_at?: string;
  };
  ai_executive_summary?: string;
  ai_recommendations?: string;
  ai_explanations?: string;
  job_content?: any;
  ai_content_enabled?: boolean;
  // These fields are needed for the ExecutiveSummary component
  issuesSummary?: {
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  internalLinkData?: any;
  [key: string]: any; // Allow for any other properties
}

// Type for auditData
type AuditData = EnhancedAuditData;

const SafePDFViewer = ({ children, ...props }: { children: React.ReactNode } & any) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Check if the error is from the PDF Viewer
      if (event.message.includes('pdf') || event.message.includes('react-pdf') || 
          event.message.includes('Cannot read properties of null')) {
        console.error("PDF Viewer Error:", event);
        logPdfEvent('error', { 
          component: 'PDFViewer', 
          message: event.message,
          stack: event.error?.stack,
          filename: event.filename,
          lineno: event.lineno
        });
        setHasError(true);
      }
    };
    
    // Add a timeout to detect if PDF loaded properly
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
      clearTimeout(timeout);
    };
  }, []);
  
  if (hasError) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-50 p-6 text-center">
        <div>
          <h3 className="text-lg font-medium text-red-600 mb-2">Error Rendering PDF</h3>
          <p className="text-sm text-gray-600 mb-4">
            There was an error rendering the PDF preview. This might be due to unsupported content or browser limitations.
          </p>
          <p className="text-sm text-gray-500">
            You can try downloading the PDF directly instead.
          </p>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-50 p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Loading PDF viewer...</span>
      </div>
    );
  }
  
  try {
    // Make sure we have valid props to avoid "Cannot read properties of null" error
    const safeProps = { ...props };
    // Ensure width and height are set if missing
    if (!safeProps.width) safeProps.width = "100%";
    if (!safeProps.height) safeProps.height = "100%";
    
    return <PDFViewer {...safeProps}>{children}</PDFViewer>;
  } catch (error) {
    console.error("Error in PDFViewer:", error);
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-50 p-6 text-center">
        <div>
          <h3 className="text-lg font-medium text-red-600 mb-2">PDF Viewer Error</h3>
          <p className="text-sm text-gray-600 mb-4">
            The PDF viewer encountered an error.
          </p>
        </div>
      </div>
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
  const [selectedCoverTemplateId, setSelectedCoverTemplateId] = useState<string>("default");
  
  // White label profile states
  const [whiteLabelProfiles, setWhiteLabelProfiles] = useState<WhiteLabelProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  
  // Set up theme from white label settings and initialize with default settings
  const [themeSettings, setThemeSettings] = useState<PdfTheme>(() => {
    // Log the initial theme setup
    logPdfEvent('theme-update', {
      hasWhiteLabel: !!whiteLabel,
      primaryColor: whiteLabel?.primary_color,
      isPrimaryHsl: whiteLabel?.primary_color?.startsWith('hsl'),
    });
    
    // Process the primary color
    let primary = whiteLabel?.primary_color 
      ? safeHslToHex(whiteLabel.primary_color, '#3b82f6') 
      : '#3b82f6';
      
    // Process the secondary color
    let secondary = whiteLabel?.secondary_color 
      ? safeHslToHex(whiteLabel.secondary_color, '#64748b') 
      : '#4b5563';
    
    logPdfEvent('theme-update', {
      originalPrimary: whiteLabel?.primary_color,
      processedPrimary: primary,
      originalSecondary: whiteLabel?.secondary_color,
      processedSecondary: secondary
    });
    
    return {
      primaryColor: primary,
      secondaryColor: secondary,
      companyName: whiteLabel?.company_name || 'LilySEO',
      fontFamily: 'Helvetica', // Single font name
      logoUrl: whiteLabel?.logo_url || '/Logos/LilySEO_logo_mark.png',
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
        branding: true,
        structuredData: true,
        internalLinks: true
      }
    };
  });
  
  // Add a state for AI content toggle
  const [useAiContent, setUseAiContent] = useState<boolean>(false);
  
  // Add a new state for AI content loading
  const [isAiContentLoading, setIsAiContentLoading] = useState<boolean>(false);
  
  // Add job-related states
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [isPollingJob, setIsPollingJob] = useState(false);
  
  // After the job-related states, add a new state for enhanced audit data
  const [enhancedAuditData, setEnhancedAuditData] = useState<EnhancedAuditData | null>(null);
  
  // Debug isProUser value
  useEffect(() => {
    if (isOpen) {
      console.log('PDFPreview - Premium User Check:', { isProUser });
    }
  }, [isOpen, isProUser]);
  
  // Fetch templates and white label profiles when dialog opens
  useEffect(() => {
    if (isOpen && isProUser) {
      loadTemplates();
      loadWhiteLabelProfiles();
    }
    
    if (isOpen) {
      setIsLoading(true);
      setShowPreview(false);
      
      // Log the audit data for debugging
      console.log('PDFPreview - auditData received:', {
        hasProjects: !!auditData?.projects,
        hasReport: !!auditData?.report,
        status: auditData?.status,
        url: auditData?.url || 'No URL'
      });
      
      // Load with short delay to allow dialog animation to complete
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, isProUser, auditData]);
  
  // Load templates
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
  
  // Load white label profiles
  const loadWhiteLabelProfiles = useCallback(async () => {
    if (!isProUser) return;
    
    try {
      setIsLoadingProfiles(true);
      const profiles = await fetchWhiteLabelProfiles();
      setWhiteLabelProfiles(profiles);
      
      // Set default profile if available and none selected
      if (profiles.length > 0 && !selectedProfileId) {
        setSelectedProfileId(profiles[0].id);
      }
    } catch (error) {
      console.error("Error loading white label profiles:", error);
    } finally {
      setIsLoadingProfiles(false);
    }
  }, [isProUser, selectedProfileId]);
  
  // Handle theme updates
  const handleUpdateTheme = (newSettings: Partial<PdfTheme>) => {
    // Log the theme update attempt
    logPdfEvent('theme-update', {
      hasPrimaryColor: !!newSettings.primaryColor,
      primaryColor: newSettings.primaryColor,
      isPrimaryHsl: newSettings.primaryColor?.startsWith('hsl'),
      hasSecondaryColor: !!newSettings.secondaryColor,
      secondaryColor: newSettings.secondaryColor,
      isSecondaryHsl: newSettings.secondaryColor?.startsWith('hsl')
    });
    
    // Create a safe copy of the new settings
    const safeSettings = { ...newSettings };
    
    // Safely convert HSL colors to hex
    if (safeSettings.primaryColor && safeSettings.primaryColor.startsWith('hsl')) {
      safeSettings.primaryColor = safeHslToHex(safeSettings.primaryColor, '#3b82f6');
    }
    
    if (safeSettings.secondaryColor && safeSettings.secondaryColor.startsWith('hsl')) {
      safeSettings.secondaryColor = safeHslToHex(safeSettings.secondaryColor, '#4b5563');
    }
    
    // Log the processed safe colors
    logPdfEvent('theme-update', {
      originalPrimary: newSettings.primaryColor,
      processedPrimary: safeSettings.primaryColor,
      originalSecondary: newSettings.secondaryColor,
      processedSecondary: safeSettings.secondaryColor
    });
    
    setThemeSettings(prev => ({
      ...prev,
      ...safeSettings,
      // Handle nested includeOptions correctly
      includeOptions: {
        ...prev.includeOptions,
        ...(safeSettings.includeOptions || {})
      }
    }));
  };
  
  // Handle client info changes
  const handleClientInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClientInfo(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle notes changes
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomNotes(e.target.value);
  };
  
  // Handle saving templates
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
  
  // Handle deleting templates
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deletePdfTemplate(templateId);
      await loadTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      throw error;
    }
  };
  
  // Handle loading templates
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
  
  // Handle cover template changes
  const handleCoverTemplateChange = (templateId: string) => {
    setSelectedCoverTemplateId(templateId);
  };
  
  // Handle white label profile selection
  const handleSelectProfile = async (profileId: string) => {
    try {
      setSelectedProfileId(profileId);
      const profile = await getWhiteLabelProfile(profileId);
      
      if (profile) {
        // Ensure we have a logo URL, using default if needed
        const logoUrl = profile.logoUrl?.trim() 
          ? profile.logoUrl 
          : '/Logos/LilySEO_logo_mark.png';
        
        // Update theme settings based on the selected profile
        handleUpdateTheme({
          primaryColor: profile.primaryColor,
          secondaryColor: profile.secondaryColor,
          companyName: profile.companyName,
          logoUrl: logoUrl,
          contactInfo: profile.contactInfo,
          footerText: profile.footerText
        });
      }
    } catch (error) {
      console.error("Error selecting white label profile:", error);
    }
  };
  
  // Handle creating white label profiles
  const handleCreateProfile = async (profile: Omit<WhiteLabelProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    try {
      // Use default LilySEO logo if logoUrl is empty
      const safeProfile = {
        ...profile,
        logoUrl: profile.logoUrl?.trim() ? profile.logoUrl : '/Logos/LilySEO_logo_mark.png'
      };
      
      const newProfile = await createWhiteLabelProfile(safeProfile);
      await loadWhiteLabelProfiles();
      setSelectedProfileId(newProfile.id);
    } catch (error) {
      console.error("Error creating white label profile:", error);
      throw error;
    }
  };
  
  // Handle updating white label profiles
  const handleUpdateProfile = async (profile: WhiteLabelProfile) => {
    try {
      // Use default LilySEO logo if logoUrl is empty
      const safeProfile = {
        ...profile,
        logoUrl: profile.logoUrl?.trim() ? profile.logoUrl : '/Logos/LilySEO_logo_mark.png'
      };
      
      await updateWhiteLabelProfile(safeProfile);
      await loadWhiteLabelProfiles();
      
      // Update theme settings if the updated profile is the selected one
      if (profile.id === selectedProfileId) {
        handleUpdateTheme({
          primaryColor: safeProfile.primaryColor,
          secondaryColor: safeProfile.secondaryColor,
          companyName: safeProfile.companyName,
          logoUrl: safeProfile.logoUrl,
          contactInfo: safeProfile.contactInfo,
          footerText: safeProfile.footerText
        });
      }
    } catch (error) {
      console.error("Error updating white label profile:", error);
      throw error;
    }
  };
  
  // Handle deleting white label profiles
  const handleDeleteProfile = async (profileId: string) => {
    try {
      await deleteWhiteLabelProfile(profileId);
      await loadWhiteLabelProfiles();
    } catch (error) {
      console.error("Error deleting white label profile:", error);
      throw error;
    }
  };
  
  // Handle previewing white label profiles
  const handlePreviewProfile = (profile: WhiteLabelProfile) => {
    // Ensure we have a logo URL, using default if needed
    const logoUrl = profile.logoUrl?.trim() 
      ? profile.logoUrl 
      : '/Logos/LilySEO_logo_mark.png';
    
    // Update theme settings for preview
    handleUpdateTheme({
      primaryColor: profile.primaryColor,
      secondaryColor: profile.secondaryColor,
      companyName: profile.companyName,
      logoUrl: logoUrl,
      contactInfo: profile.contactInfo,
      footerText: profile.footerText
    });
    
    // Show preview immediately
    setShowPreview(true);
  };
  
  // Update the AI content toggle handler to show a loading state
  const handleAiContentToggle = (checked: boolean) => {
    // Check if we have a pro user or an override
    const canToggleAi = isProUser || (window as any).__override_isPro;
    if (canToggleAi) {
      console.log('Toggling AI content:', checked);
      
      // First update the useAiContent state immediately
      setUseAiContent(checked);
      
      // If enabling AI content
      if (checked) {
        // Don't start a new job if one is already in progress
        if (isPollingJob || isAiContentLoading) {
          console.log('AI content job already in progress, skipping new job creation');
          return;
        }
        
        setIsAiContentLoading(true);
        
        // If we already have enhanced data with AI content, use that
        if (enhancedAuditData?.ai_content || enhancedAuditData?.job_content) {
          console.log('Using existing AI content in enhanced data');
          setIsAiContentLoading(false);
          return;
        }
        
        // Otherwise start a new job
        setTimeout(() => {
          startPdfGenerationJob()
            .then(() => {
              console.log('AI content generation job started');
            })
            .catch(error => {
              console.error('Failed to start AI content generation:', error);
              setUseAiContent(false);
              setIsAiContentLoading(false);
              toast({
                title: 'Error',
                description: 'Failed to start AI content generation',
                variant: 'destructive',
              });
            });
        }, 100);
      } else {
        // If disabling AI content, update the ai_content_enabled flag
        setEnhancedAuditData((currentData: EnhancedAuditData | null) => {
          if (!currentData) return null;
          return {
            ...currentData,
            ai_content_enabled: false
          };
        });
      }
    } else {
      console.log('Cannot toggle AI content - not a premium user');
    }
  };
  
  const fileName = `${auditData.projects?.name || 'SEO'}-Audit-Report-${new Date().toISOString().split('T')[0]}.pdf`;

  // Add a function to safely process theme colors
  const getSafeTheme = (theme: Partial<PdfTheme>): PdfTheme => {
    const baseTheme = { ...themeSettings };
    const updatedTheme = { ...baseTheme, ...theme };
    
    // Ensure colors are safe
    if (updatedTheme.primaryColor) {
      updatedTheme.primaryColor = safeHslToHex(updatedTheme.primaryColor, '#3b82f6');
    }
    
    if (updatedTheme.secondaryColor) {
      updatedTheme.secondaryColor = safeHslToHex(updatedTheme.secondaryColor, '#4b5563');
    }
    
    // Ensure logoUrl exists and is valid
    if (!updatedTheme.logoUrl || updatedTheme.logoUrl.trim() === '') {
      updatedTheme.logoUrl = '/Logos/LilySEO_logo_mark.png';
    }
    
    // Ensure other required fields exist
    updatedTheme.companyName = updatedTheme.companyName || 'LilySEO';
    updatedTheme.fontFamily = updatedTheme.fontFamily || 'Helvetica';
    updatedTheme.contactInfo = updatedTheme.contactInfo || 'support@lilyseo.com';
    updatedTheme.footerText = updatedTheme.footerText || `© ${new Date().getFullYear()} ${updatedTheme.companyName}. All rights reserved.`;
    
    return updatedTheme as PdfTheme;
  };

  // Start a PDF generation job
  const startPdfGenerationJob = async () => {
    try {
      console.log('Starting PDF generation job');
      
      // Reset any previous job state
      setJobStatus(null);
      setJobProgress(0);
      
      // Prepare parameters from the current settings
      const parameters: PdfGenerationParameters = {
        template: selectedCoverTemplateId,
        useAiContent: (isProUser || (window as any).__override_isPro) && useAiContent,
        clientInfo: {
          name: clientInfo.name,
          company: clientInfo.name, // Reuse name as company for now
          email: clientInfo.email,
          phone: clientInfo.phone,
          website: clientInfo.website,
        },
        whiteLabelProfileId: selectedProfileId || undefined,
        customColors: {
          primary: themeSettings.primaryColor,
          secondary: themeSettings.secondaryColor,
          accent: themeSettings.primaryColor, // Reuse primary as accent for now
        },
        customLogo: themeSettings.logoUrl,
        customNotes: customNotes,
        sections: Object.entries(themeSettings.includeOptions)
          .filter(([_, value]) => value)
          .map(([key]) => key),
      };
      
      console.log('PDF generation parameters:', parameters);
      console.log('Audit ID for PDF generation:', auditData.id);
      
      // Create the job
      const response = await fetch('/api/pdf/job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auditId: auditData.id,
          parameters,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from job creation API:', errorText);
        throw new Error(errorText || 'Failed to create PDF generation job');
      }
      
      const data = await response.json();
      console.log('Job created successfully:', data);
      
      if (!data.jobId) {
        console.error('No jobId returned in response:', data);
        throw new Error('No jobId returned in response');
      }
      
      setJobId(data.jobId);
      setJobStatus('pending');
      setJobProgress(0);
      
      // Start polling for job status
      setIsPollingJob(true);
    } catch (error) {
      console.error('Error starting PDF generation job:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start PDF generation',
        variant: 'destructive',
      });
      
      // Reset states on error
      setIsAiContentLoading(false);
      setIsPollingJob(false);
    }
  };
  
  // Function to download the PDF once generated
  const downloadGeneratedPdf = useCallback(async () => {
    if (!jobId) {
      console.error('No job ID available for download');
      toast({
        title: 'Error',
        description: 'No PDF job ID available',
        variant: 'destructive',
      });
      return;
    }
    
    if (jobStatus !== 'completed') {
      console.warn('Attempted to download PDF before job completion', { jobStatus });
      toast({
        title: 'Error',
        description: 'PDF is not ready for download yet',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if we have valid AI content, which is needed for a successful download
    if (useAiContent && !enhancedAuditData?.ai_content && !enhancedAuditData?.job_content) {
      console.error('Missing required AI content for PDF with AI enabled');
      toast({
        title: 'Error',
        description: 'AI content is not available. Please try generating the PDF again.',
        variant: 'destructive',
      });
      setJobStatus(null); // Reset to allow regeneration
      return;
    }

    try {
      console.log('Attempting to download PDF for job ID:', jobId);
      
      // Request the PDF download using the job ID
      const downloadUrl = `/api/pdf/job/${jobId}/download`;
      console.log('Download URL:', downloadUrl);
      
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        console.error('Download response status:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response from download API:', errorText);
        throw new Error('Failed to download PDF');
      }
      
      // Create a blob from the PDF data
      const blob = await response.blob();
      console.log('PDF blob created, size:', blob.size);
      
      // If blob is too small, it's probably not a valid PDF
      if (blob.size < 1000) {
        console.error('Downloaded file is too small to be a valid PDF:', blob.size);
        throw new Error('Generated PDF appears to be invalid');
      }
      
      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('PDF download triggered successfully');
      toast({
        title: 'Success',
        description: 'PDF downloaded successfully',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to download the PDF. Try generating it again.',
        variant: 'destructive',
      });
      
      // Reset job status to allow regeneration
      setJobStatus(null);
      setJobId(null);
    }
  }, [jobId, jobStatus, fileName, toast, enhancedAuditData, useAiContent]);
  
  // Update the enhanced audit data when AI content is available from job
  const updateEnhancedDataWithAiContent = useCallback((jobContent: any) => {
    if (!jobContent) return;
    
    console.log('PDF Generation - Updating enhanced data with job content');
    console.log('Job content keys:', Object.keys(jobContent));
    
    // Create a copy of the audit data with AI content incorporated
    setEnhancedAuditData((prevData: EnhancedAuditData | null) => {
      // If the content is already set with the same job content, avoid re-render
      if (prevData?.job_content?.generatedAt === jobContent.generatedAt) {
        console.log('Enhanced data already contains this job content, skipping update');
        return prevData;
      }
      
      const updatedData: EnhancedAuditData = {
        ...auditData, // Use original data as base
        // Make sure issuesSummary is properly defined with all needed properties
        issuesSummary: auditData?.issuesSummary || {
          high: 0,
          medium: 0, 
          low: 0,
          total: 0
        },
        // Map fields from the job content to the structure expected by SEOAuditReport
        ai_content: {
          executive_summary: jobContent.executiveSummary,
          recommendations: jobContent.recommendations,
          technical_explanations: jobContent.technicalExplanations,
          generated_at: jobContent.generatedAt
        },
        // Include both formats for backward compatibility
        ai_executive_summary: jobContent.executiveSummary,
        ai_recommendations: jobContent.recommendations,
        ai_explanations: jobContent.technicalExplanations,
        // If there are any updated scores or metrics, add those too
        ...(jobContent.scores && { scores: jobContent.scores }),
        ...(jobContent.metrics && { metrics: jobContent.metrics }),
        // Store the raw job content as well for reference
        job_content: jobContent,
        // Add a flag to indicate AI content is enabled
        ai_content_enabled: true
      };
      
      console.log('Enhanced audit data created with AI content');
      return updatedData;
    });
  }, [auditData]);

  // Modify the poll job status function to use the new updater function
  const pollJobStatus = useCallback(async () => {
    if (!jobId || !isPollingJob) return;
    
    try {
      console.log('Polling job status for job ID:', jobId);
      const response = await fetch(`/api/pdf/job/${jobId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from job status API:', errorText);
        throw new Error(errorText || 'Failed to get job status');
      }
      
      const data = await response.json();
      console.log('Job status response:', data);
      
      // Make sure we have a job object
      if (!data || !data.job) {
        console.error('Invalid job status response format:', data);
        throw new Error('Invalid job status response format');
      }
      
      const { job } = data;
      
      // Avoid unnecessary state updates if the status and progress haven't changed
      if (job.status === jobStatus && job.progress === jobProgress) {
        return; // Skip update to prevent unnecessary re-renders
      }
      
      setJobStatus(job.status);
      setJobProgress(job.progress);
      
      // If job is completed or failed, stop polling
      if (job.status === 'completed' || job.status === 'failed') {
        setIsPollingJob(false);
        setIsAiContentLoading(false); // Turn off AI loading state
        
        if (job.status === 'completed' && job.content) {
          // Use our updater function to handle the content correctly
          updateEnhancedDataWithAiContent(job.content);
          
          // Log success
          console.log('PDF generation completed successfully with content');
        } else if (job.status === 'completed') {
          console.warn('Job completed but no content was returned');
        }
        
        if (job.status === 'failed') {
          toast({
            title: 'Error',
            description: job.error_message || 'AI content generation failed',
            variant: 'destructive',
          });
          console.error('PDF generation job failed:', job.error_message);
          setUseAiContent(false); // Disable AI content if job failed
        }
      }
    } catch (error) {
      console.error('Error polling job status:', error);
      setIsPollingJob(false);
      setIsAiContentLoading(false);
      setUseAiContent(false);
      toast({
        title: 'Error',
        description: 'Failed to get job status',
        variant: 'destructive',
      });
    }
  }, [jobId, isPollingJob, toast, updateEnhancedDataWithAiContent, jobStatus, jobProgress]);
  
  // Effect for polling job status
  useEffect(() => {
    if (isPollingJob && jobId) {
      const pollInterval = setInterval(pollJobStatus, 2000);
      
      return () => {
        clearInterval(pollInterval);
      };
    }
  }, [isPollingJob, jobId, pollJobStatus]);

  // If we need to preview the PDF, use a less disruptive approach
  const handlePreviewClick = () => {
    // If we're already showing the preview, just update it without toggling
    if (showPreview) {
      // This forces a re-render of the PDF preview without fully unmounting/remounting
      const container = document.getElementById('pdf-preview-container');
      if (container) {
        // Applying a small change to force React to re-render the component
        container.style.opacity = '0.99';
        setTimeout(() => {
          container.style.opacity = '1';
        }, 10);
      }
      return;
    }
    
    // Otherwise, show the preview
    setShowPreview(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {showPreview && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPreview(false)}
                className="mr-2"
              >
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
          <div 
            className="flex flex-col h-[calc(100vh-200px)] overflow-hidden rounded border"
            id="pdf-preview-container"
          >
            {isAiContentLoading && (
              <div className="absolute inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 rounded">
                <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-sm font-medium">Generating AI content ({jobProgress}%)</p>
                  <p className="text-xs text-gray-500 mt-1">Please wait, this may take a few moments...</p>
                </div>
              </div>
            )}
            <PdfThemeProvider initialTheme={getSafeTheme(themeSettings)}>
              <SafePDFViewer 
                width="100%" 
                height="100%" 
                className="rounded-md"
                key={`pdf-viewer-${enhancedAuditData?.job_content?.generatedAt || 'default'}`}
              >
                <SEOAuditReport 
                  auditData={enhancedAuditData || auditData}
                  clientInfo={isProUser ? clientInfo : undefined}
                  customNotes={isProUser ? customNotes : undefined}
                  templateId={selectedCoverTemplateId}
                  useAiContent={(isProUser || (window as any).__override_isPro) && useAiContent}
                />
              </SafePDFViewer>
            </PdfThemeProvider>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="customize">Customize PDF</TabsTrigger>
                {isProUser && <TabsTrigger value="client-info">Client Information</TabsTrigger>}
                {isProUser && <TabsTrigger value="white-label">White Label</TabsTrigger>}
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
              
              {isProUser && (
                <TabsContent value="white-label" className="mt-0">
                  <Card className="p-4">
                    <WhiteLabelProfileSelector 
                      profiles={whiteLabelProfiles}
                      selectedProfileId={selectedProfileId}
                      onSelectProfile={handleSelectProfile}
                      onUpdateProfile={handleUpdateProfile}
                      onCreateProfile={handleCreateProfile}
                      onDeleteProfile={handleDeleteProfile}
                      onPreviewProfile={handlePreviewProfile}
                      isLoading={isLoadingProfiles}
                      theme={themeSettings}
                    />
                  </Card>
                </TabsContent>
              )}
            </Tabs>
            
            {/* AI Content Settings - Show to all users but enable only for Pro/Enterprise */}
            <div className="mt-6 border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">AI-Generated Content</h3>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="ai-content"
                  checked={(isProUser || (window as any).__override_isPro) && useAiContent}
                  onCheckedChange={(isProUser || (window as any).__override_isPro) ? handleAiContentToggle : undefined}
                  disabled={!(isProUser || (window as any).__override_isPro) || isAiContentLoading || jobStatus === 'completed'}
                />
                <Label htmlFor="ai-content" className={isAiContentLoading ? "text-gray-400" : ""}>
                  {isAiContentLoading ? (
                    <span className="flex items-center">
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Generating AI content...
                    </span>
                  ) : (
                    "Use GPT-4o AI to enhance content"
                  )}
                </Label>
                
                {!isProUser && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      console.log("Override isProUser temporarily for testing");
                      (window as any).__override_isPro = true;
                      setUseAiContent(true);
                      // Force refresh preview if visible
                      if (showPreview) {
                        setShowPreview(false);
                        setTimeout(() => setShowPreview(true), 100);
                      }
                      // Display confirmation to user
                      toast({
                        title: "AI Content Enabled",
                        description: "Pro override activated. AI content generation is now available for testing.",
                        duration: 3000,
                      });
                    }}
                    className="ml-2 text-xs text-yellow-600"
                    disabled={isAiContentLoading}
                  >
                    Test Override
                  </Button>
                )}
              </div>
              {isProUser ? (
                <p className="text-sm text-muted-foreground mt-2">
                  Leverage Azure GPT-4o to generate professional executive summaries, detailed recommendations and technical explanations tailored to your audit results.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-2 flex items-center">
                  <Lock className="h-4 w-4 mr-1 text-yellow-500" />
                  <span>This is a premium feature available to Pro and Enterprise users.</span>
                  <Badge variant="outline" className="ml-2 bg-primary/10 hover:bg-primary/20 cursor-pointer">
                    <Link href="/pricing" className="text-xs">Upgrade</Link>
                  </Badge>
                </p>
              )}
              {isProUser && useAiContent && !isAiContentLoading && (
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-700">Using GPT-4o (2024-11-20)</p>
                      <p className="text-xs text-blue-600 mt-1">
                        This advanced model analyzes your SEO data to produce high-quality, contextually relevant content for your reports.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {isAiContentLoading && (
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <div className="flex items-start">
                    <Loader2 className="h-5 w-5 text-blue-500 mr-2 mt-0.5 animate-spin" />
                    <div>
                      <p className="text-sm font-medium text-blue-700">Generating AI Content</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Our AI is analyzing your SEO data and creating specialized content for your report. This may take 10-15 seconds.
                      </p>
                      <Progress 
                        value={jobProgress || 10} 
                        className="h-2 mt-2" 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Main action buttons - Updated to show conditional buttons based on job status */}
            <div className="flex justify-center mt-6 space-x-3">
              {/* Show Preview button regardless of job status */}
              <Button 
                onClick={handlePreviewClick}
                variant="outline"
                disabled={isPollingJob && jobStatus === 'processing'}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Refresh Preview' : 'Preview PDF'}
              </Button>
              
              {/* Convert Generate PDF button to Download PDF button when job is completed */}
              {jobStatus === 'completed' ? (
                <Button
                  onClick={downloadGeneratedPdf}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              ) : (
                <Button
                  onClick={startPdfGenerationJob}
                  disabled={isPollingJob || jobStatus === 'processing'}
                >
                  {isPollingJob || jobStatus === 'processing' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {jobProgress > 0 ? `Generating (${jobProgress}%)` : 'Starting...'}
                    </>
                  ) : (
                    <>
                      <FileDown className="h-4 w-4 mr-2" />
                      Generate PDF
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {/* Show job status if a job is in progress */}
            {(isPollingJob || jobStatus === 'processing') && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      {jobStatus === 'processing' ? 'Processing PDF Generation' : 'Starting PDF Generation'}
                    </p>
                    <Progress 
                      value={jobProgress} 
                      className="h-2 mt-2" 
                    />
                    <p className="text-xs text-blue-600 mt-1">
                      {jobProgress === 0 
                        ? 'Initializing job...' 
                        : jobProgress < 50 
                          ? 'Gathering data and preparing content...'
                          : jobProgress < 90
                            ? 'Generating AI content...'
                            : 'Finalizing PDF report...'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
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
                  <li>White label PDFs with your company branding</li>
                  <li>Additional output formats and quality settings</li>
                </ul>
              </Card>
            )}
          </div>
        )}
        
        <DialogFooter>
          {/* Add a Download button to the footer when in preview mode and job is completed */}
          {showPreview && jobStatus === 'completed' ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button 
                onClick={downloadGeneratedPdf}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={onClose}>
              {showPreview ? 'Close' : 'Cancel'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreview; 