"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { PdfTheme } from '@/context/ThemeContext';

// Interface for template objects
export interface PdfTemplate {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  themeSettings: Partial<PdfTheme>;
}

interface SaveTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: Partial<PdfTheme>;
  onSaveTemplate: (template: {name: string; description: string; themeSettings: Partial<PdfTheme>}) => Promise<void>;
  onLoadTemplate: (template: PdfTemplate) => void;
  onDeleteTemplate: (templateId: string) => Promise<void>;
  templates: PdfTemplate[];
  isLoading: boolean;
}

const SaveTemplateDialog: React.FC<SaveTemplateDialogProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSaveTemplate,
  onLoadTemplate,
  onDeleteTemplate,
  templates,
  isLoading,
}) => {
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const { toast } = useToast();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setTemplateName('');
      setTemplateDescription('');
      setActiveTemplateId(null);
    }
  }, [isOpen]);

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast({
        title: "Template name required",
        description: "Please provide a name for your template",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      await onSaveTemplate({
        name: templateName,
        description: templateDescription,
        themeSettings: currentSettings
      });
      
      toast({
        title: "Template saved",
        description: "Your PDF template has been saved successfully",
      });
      
      setTemplateName('');
      setTemplateDescription('');
    } catch (error) {
      toast({
        title: "Error saving template",
        description: "There was an error saving your template. Please try again.",
        variant: "destructive",
      });
      console.error("Error saving template:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      setIsDeleting(true);
      setActiveTemplateId(templateId);
      await onDeleteTemplate(templateId);
      
      toast({
        title: "Template deleted",
        description: "Your PDF template has been deleted",
      });
    } catch (error) {
      toast({
        title: "Error deleting template",
        description: "There was an error deleting your template. Please try again.",
        variant: "destructive",
      });
      console.error("Error deleting template:", error);
    } finally {
      setIsDeleting(false);
      setActiveTemplateId(null);
    }
  };

  const handleLoadTemplate = (template: PdfTemplate) => {
    onLoadTemplate(template);
    onClose();
    
    toast({
      title: "Template loaded",
      description: `The "${template.name}" template has been loaded`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage PDF Templates</DialogTitle>
          <DialogDescription>
            Save your current settings as a template or load a previously saved template
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto flex gap-6">
          {/* Save new template form */}
          <div className="flex-1">
            <h3 className="text-lg font-medium mb-4">Save Current Settings</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input 
                  id="templateName"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="My PDF Template"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="templateDescription">Description (Optional)</Label>
                <Input 
                  id="templateDescription"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="A brief description of this template"
                />
              </div>
              
              <Button 
                onClick={handleSaveTemplate}
                disabled={isSaving || !templateName.trim()}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Template
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Saved templates list */}
          <div className="flex-1 border-l pl-6">
            <h3 className="text-lg font-medium mb-4">Saved Templates</h3>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : templates.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No saved templates yet. Save your current settings to create one.
              </p>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <Card key={template.id} className="p-4">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        {template.description && (
                          <p className="text-xs text-muted-foreground">{template.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Last updated: {new Date(template.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleLoadTemplate(template)}
                        >
                          Load
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                          disabled={isDeleting && activeTemplateId === template.id}
                        >
                          {isDeleting && activeTemplateId === template.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveTemplateDialog; 