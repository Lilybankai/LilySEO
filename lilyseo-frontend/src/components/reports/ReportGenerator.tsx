'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from 'sonner'
import { Download, Loader2, AlertCircle } from 'lucide-react'

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  requiredTier: string;
  exportTier: string;
}

interface Project {
  id: string;
  name: string;
}

interface ReportGeneratorProps {
  initialProjects: Project[];
}

export default function ReportGenerator({ initialProjects }: ReportGeneratorProps) {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjects[0]?.id ?? null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    setError(null);
    try {
      const response = await fetch('/api/reports/templates');
      if (!response.ok) {
        throw new Error('Failed to fetch report templates');
      }
      const data: ReportTemplate[] = await response.json();
      setTemplates(data);
      if (data.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(data[0].id); // Select first template by default
      }
    } catch (err) {
      console.error(err);
      setError('Could not load report templates. Please try again later.');
      toast.error('Failed to load report templates.');
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [selectedTemplateId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleGenerateReport = async (format: 'json' | 'csv') => {
    if (!selectedProjectId || !selectedTemplateId) {
      toast.error('Please select a project and a report template.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    const toastId = toast.loading(`Generating ${format.toUpperCase()} report...`);

    try {
      const response = await fetch('/api/reports/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          templateId: selectedTemplateId,
          format: format,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to generate report (${response.status})`);
      }

      if (format === 'csv') {
        // Handle CSV download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
        const fileName = `${selectedTemplate?.id || 'report'}_${selectedProjectId}.csv`;
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast.success('CSV report downloaded successfully!', { id: toastId });
      } else {
        // Handle JSON data (e.g., display it)
        const jsonData = await response.json();
        console.log('Generated JSON Report Data:', jsonData);
        toast.success('JSON report data generated! (Check console)', { id: toastId });
        // TODO: Implement display logic for JSON data
      }

    } catch (err: any) {
      console.error(err);
      setError(`Error generating report: ${err.message}`);
      toast.error(`Error generating report: ${err.message}`, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Selector */}
      <div className="max-w-xs">
        <label htmlFor="project-select" className="block text-sm font-medium text-gray-700 mb-1">Select Project</label>
        <Select
          value={selectedProjectId ?? undefined}
          onValueChange={(value) => setSelectedProjectId(value)}
          disabled={initialProjects.length === 0 || isGenerating}
        >
          <SelectTrigger id="project-select">
            <SelectValue placeholder="Select a project..." />
          </SelectTrigger>
          <SelectContent>
            {initialProjects.length > 0 ? (
              initialProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-projects" disabled>
                No projects found
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {initialProjects.length === 0 && <p className="text-xs text-red-600 mt-1">Create a project first to generate reports.</p>}
      </div>

      {/* Loading/Error State */}
      {isLoadingTemplates && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Loading report templates...</p>
        </div>
      )}
      {error && !isLoadingTemplates && (
        <div className="border-l-4 border-red-400 bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Report Templates List */}
      {!isLoadingTemplates && templates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer hover:shadow-lg transition-shadow ${selectedTemplateId === template.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedTemplateId(template.id)}
            >
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end space-x-2">
                {/* <Button
                    variant="outline"
                    size="sm"
                    disabled={isGenerating || !selectedProjectId}
                    onClick={(e) => { e.stopPropagation(); handleGenerateReport('json'); }}
                >
                    {isGenerating && selectedTemplateId === template.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    View (JSON)
                </Button> */}
                <Button
                    variant="default"
                    size="sm"
                    disabled={isGenerating || !selectedProjectId}
                    onClick={(e) => { e.stopPropagation(); handleGenerateReport('csv'); }}
                    title={ `Requires ${template.exportTier} plan`}
                >
                    {isGenerating && selectedTemplateId === template.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Export CSV
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoadingTemplates && templates.length === 0 && !error && (
          <p className="text-center text-muted-foreground py-10">No report templates available for your account.</p>
      )}
    </div>
  );
} 