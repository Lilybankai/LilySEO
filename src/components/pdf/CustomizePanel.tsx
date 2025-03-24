"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  BookOpen, Save, Layout, FileText, 
  PaintBucket, Type, FileDigit, Settings2
} from "lucide-react";
import { PdfTheme } from '@/context/ThemeContext';
import SaveTemplateDialog, { PdfTemplate } from './SaveTemplateDialog';

interface CustomizePanelProps {
  theme: PdfTheme;
  updateTheme: (settings: Partial<PdfTheme>) => void;
  templates: PdfTemplate[];
  isLoadingTemplates: boolean;
  onSaveTemplate: (template: {name: string; description: string; themeSettings: Partial<PdfTheme>}) => Promise<void>; 
  onLoadTemplate: (template: PdfTemplate) => void;
  onDeleteTemplate: (templateId: string) => Promise<void>;
}

const CustomizePanel: React.FC<CustomizePanelProps> = ({
  theme,
  updateTheme,
  templates,
  isLoadingTemplates,
  onSaveTemplate,
  onLoadTemplate,
  onDeleteTemplate
}) => {
  const [activeTab, setActiveTab] = useState("content");
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  const handleIncludeChange = (section: keyof PdfTheme['includeOptions'], checked: boolean) => {
    updateTheme({
      includeOptions: {
        ...theme.includeOptions,
        [section]: checked
      }
    });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="format">Format</TabsTrigger>
        </TabsList>
        
        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4 pt-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Sections to Include</h3>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="executiveSummary">Executive Summary</Label>
                </div>
                <Switch 
                  id="executiveSummary" 
                  checked={theme.includeOptions.executiveSummary}
                  onCheckedChange={(checked) => handleIncludeChange('executiveSummary', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileDigit className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="technicalSEO">Technical SEO</Label>
                </div>
                <Switch 
                  id="technicalSEO" 
                  checked={theme.includeOptions.technicalSEO}
                  onCheckedChange={(checked) => handleIncludeChange('technicalSEO', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="onPageSEO">On-Page SEO</Label>
                </div>
                <Switch 
                  id="onPageSEO" 
                  checked={theme.includeOptions.onPageSEO}
                  onCheckedChange={(checked) => handleIncludeChange('onPageSEO', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Layout className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="offPageSEO">Off-Page SEO</Label>
                </div>
                <Switch 
                  id="offPageSEO" 
                  checked={theme.includeOptions.offPageSEO}
                  onCheckedChange={(checked) => handleIncludeChange('offPageSEO', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="performance">Performance</Label>
                </div>
                <Switch 
                  id="performance" 
                  checked={theme.includeOptions.performance}
                  onCheckedChange={(checked) => handleIncludeChange('performance', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <PaintBucket className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="userExperience">User Experience</Label>
                </div>
                <Switch 
                  id="userExperience" 
                  checked={theme.includeOptions.userExperience}
                  onCheckedChange={(checked) => handleIncludeChange('userExperience', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="insights">AI Insights</Label>
                </div>
                <Switch 
                  id="insights" 
                  checked={theme.includeOptions.insights}
                  onCheckedChange={(checked) => handleIncludeChange('insights', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="recommendations">Recommendations</Label>
                </div>
                <Switch 
                  id="recommendations" 
                  checked={theme.includeOptions.recommendations}
                  onCheckedChange={(checked) => handleIncludeChange('recommendations', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <PaintBucket className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="branding">Branding</Label>
                </div>
                <Switch 
                  id="branding" 
                  checked={theme.includeOptions.branding}
                  onCheckedChange={(checked) => handleIncludeChange('branding', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="charts">Charts & Graphs</Label>
                </div>
                <Switch 
                  id="charts" 
                  checked={theme.includeOptions.charts}
                  onCheckedChange={(checked) => handleIncludeChange('charts', checked)}
                />
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-4 pt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Quality & Color</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Output Quality</Label>
                  <RadioGroup 
                    value={theme.outputQuality} 
                    onValueChange={(value) => updateTheme({ outputQuality: value as PdfTheme['outputQuality'] })}
                    className="flex space-x-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Draft" id="quality-draft" />
                      <Label htmlFor="quality-draft">Draft</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Standard" id="quality-standard" />
                      <Label htmlFor="quality-standard">Standard</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="High" id="quality-high" />
                      <Label htmlFor="quality-high">High</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label>Color Mode</Label>
                  <RadioGroup 
                    value={theme.colorMode} 
                    onValueChange={(value) => updateTheme({ colorMode: value as PdfTheme['colorMode'] })}
                    className="flex space-x-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Full" id="color-full" />
                      <Label htmlFor="color-full">Full Color</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Grayscale" id="color-grayscale" />
                      <Label htmlFor="color-grayscale">Grayscale</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Brand Colors</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <div 
                      className="w-10 h-10 rounded border" 
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <Input 
                      id="primaryColor"
                      value={theme.primaryColor}
                      onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                      placeholder="#0066cc"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <div 
                      className="w-10 h-10 rounded border" 
                      style={{ backgroundColor: theme.secondaryColor }}
                    />
                    <Input 
                      id="secondaryColor"
                      value={theme.secondaryColor}
                      onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
                      placeholder="#4b5563"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Typography</h3>
              
              <div className="space-y-2">
                <Label htmlFor="fontFamily">Font Family</Label>
                <RadioGroup 
                  value={theme.fontFamily}
                  onValueChange={(value) => updateTheme({ fontFamily: value })}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Poppins, Montserrat, sans-serif" id="font-poppins" />
                    <Label htmlFor="font-poppins" className="font-['Poppins']">Poppins</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Montserrat, Poppins, sans-serif" id="font-montserrat" />
                    <Label htmlFor="font-montserrat" className="font-['Montserrat']">Montserrat</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Helvetica, Arial, sans-serif" id="font-helvetica" />
                    <Label htmlFor="font-helvetica" className="font-['Helvetica']">Helvetica</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Format Tab */}
        <TabsContent value="format" className="space-y-4 pt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Paper Size</h3>
              
              <RadioGroup 
                value={theme.pageSize} 
                onValueChange={(value) => updateTheme({ pageSize: value as PdfTheme['pageSize'] })}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="A4" id="size-a4" />
                  <Label htmlFor="size-a4">A4 (210 × 297 mm)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="LETTER" id="size-letter" />
                  <Label htmlFor="size-letter">US Letter (8.5 × 11 in)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="LEGAL" id="size-legal" />
                  <Label htmlFor="size-legal">US Legal (8.5 × 14 in)</Label>
                </div>
              </RadioGroup>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Templates</h3>
              <p className="text-xs text-muted-foreground mb-2">
                Save your current settings as a template or load a previously saved template
              </p>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setIsTemplateDialogOpen(true)}
              >
                <Save className="h-4 w-4 mr-2" />
                Manage Templates
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Template Management Dialog */}
      <SaveTemplateDialog
        isOpen={isTemplateDialogOpen}
        onClose={() => setIsTemplateDialogOpen(false)}
        currentSettings={theme}
        onSaveTemplate={onSaveTemplate}
        onLoadTemplate={onLoadTemplate}
        onDeleteTemplate={onDeleteTemplate}
        templates={templates}
        isLoading={isLoadingTemplates}
      />
    </div>
  );
};

export default CustomizePanel; 