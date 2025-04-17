"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Check, Sparkles } from 'lucide-react'
import React from 'react'
import { useToast } from "@/components/ui/use-toast"

// Template definitions
const templates = [
  {
    id: 'ecommerce-basic',
    name: 'E-commerce Basic',
    description: 'Optimized for product-focused websites with moderate traffic',
    industry: 'E-commerce',
    settings: {
      crawl_frequency: 'weekly',
      crawl_depth: 3,
      keywords: ['product name', 'buy online', 'best price', 'shop', 'discount'],
      competitors: ['amazon.com', 'ebay.com', 'walmart.com'],
    },
  },
  {
    id: 'ecommerce-advanced',
    name: 'E-commerce Advanced',
    description: 'For large e-commerce sites with extensive product catalogs',
    industry: 'E-commerce',
    settings: {
      crawl_frequency: 'daily',
      crawl_depth: 5,
      keywords: ['product name', 'buy online', 'best price', 'shop', 'discount', 'free shipping', 'reviews', 'comparison'],
      competitors: ['amazon.com', 'ebay.com', 'walmart.com', 'target.com', 'bestbuy.com'],
    },
  },
  {
    id: 'blog-basic',
    name: 'Blog Basic',
    description: 'For content-focused websites with regular updates',
    industry: 'Media & Publishing',
    settings: {
      crawl_frequency: 'weekly',
      crawl_depth: 2,
      keywords: ['blog', 'article', 'how to', 'guide', 'tips'],
      competitors: ['medium.com', 'wordpress.com', 'blogger.com'],
    },
  },
  {
    id: 'saas-startup',
    name: 'SaaS Startup',
    description: 'For software-as-a-service companies focusing on growth',
    industry: 'B2B',
    settings: {
      crawl_frequency: 'weekly',
      crawl_depth: 3,
      keywords: ['software', 'solution', 'platform', 'pricing', 'features', 'demo', 'trial'],
      competitors: ['hubspot.com', 'salesforce.com', 'zoho.com'],
    },
  },
  {
    id: 'local-business',
    name: 'Local Business',
    description: 'For businesses serving specific geographic areas',
    industry: 'Other',
    settings: {
      crawl_frequency: 'monthly',
      crawl_depth: 2,
      keywords: ['near me', 'local', 'hours', 'directions', 'reviews', 'appointment'],
      competitors: ['yelp.com', 'google.com/maps', 'facebook.com'],
    },
  },
  {
    id: 'healthcare-provider',
    name: 'Healthcare Provider',
    description: 'For medical practices and healthcare services',
    industry: 'Healthcare',
    settings: {
      crawl_frequency: 'monthly',
      crawl_depth: 3,
      keywords: ['doctor', 'clinic', 'appointment', 'treatment', 'specialist', 'insurance'],
      competitors: ['zocdoc.com', 'healthgrades.com', 'webmd.com'],
    },
  },
  {
    id: 'education-institution',
    name: 'Education Institution',
    description: 'For schools, universities, and online learning platforms',
    industry: 'Education',
    settings: {
      crawl_frequency: 'monthly',
      crawl_depth: 4,
      keywords: ['courses', 'program', 'degree', 'certificate', 'enrollment', 'tuition', 'online learning'],
      competitors: ['coursera.org', 'udemy.com', 'edx.org'],
    },
  },
]

interface TemplateSelectProps {
  onSelect: (template: typeof templates[0]) => void
  onSave?: () => any
  industry?: string
  disabled?: boolean
}

export function TemplateSelect({ onSelect, onSave, industry, disabled }: TemplateSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  
  console.log("TemplateSelect rendering with props:", { onSelect, onSave, industry, disabled });
  
  // Filter templates by industry if one is selected
  const filteredTemplates = React.useMemo(() => {
    let templates_to_filter = templates;
    
    // First filter by industry if provided
    if (industry) {
      templates_to_filter = templates.filter(template => 
        industry.startsWith(template.industry + ':') || 
        industry === template.industry
      );
    }
    
    // Then filter by search query if provided
    if (searchQuery) {
      return templates_to_filter.filter(template => 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.industry.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return templates_to_filter;
  }, [industry, searchQuery]);
  
  console.log("Filtered templates:", filteredTemplates);
  
  const handleApplyTemplate = (template: typeof templates[0]) => {
    console.log("handleApplyTemplate called with template:", template);
    console.log("onSelect is:", onSelect);
    try {
      onSelect(template);
      console.log("onSelect called successfully");
      
      // Show toast notification
      toast({
        title: "Template Applied",
        description: `${template.name} template has been applied successfully. Crawl frequency set to ${template.settings.crawl_frequency} and depth to ${template.settings.crawl_depth}.`,
        duration: 5000,
      });
    } catch (error) {
      console.error("Error calling onSelect:", error);
      toast({
        title: "Error",
        description: "Failed to apply template. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
    setOpen(false);
    setSearchQuery('');
  }
  
  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        setSearchQuery('');
      }
    }}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          disabled={disabled}
        >
          <Sparkles className="h-4 w-4" />
          Apply Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Project Templates</DialogTitle>
          <DialogDescription>
            Choose a template to quickly set up your project with recommended settings.
          </DialogDescription>
          {industry && (
            <div className="mt-1">
              Showing templates for <Badge variant="outline">{industry.split(':')[0]}</Badge>
            </div>
          )}
        </DialogHeader>
        
        <div className="mb-4 mt-2">
          <input
            type="text"
            placeholder="Search templates..."
            className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus={open}
          />
        </div>
        
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-4">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex flex-col space-y-2 rounded-lg border p-4 hover:border-primary/50 cursor-pointer hover:bg-accent/10 transition-colors"
                  onClick={() => handleApplyTemplate(template)}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{template.name}</h3>
                    <Badge>{template.industry}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <h4 className="text-xs font-medium">Crawl Settings</h4>
                      <ul className="text-xs text-muted-foreground mt-1">
                        <li>Frequency: {template.settings.crawl_frequency}</li>
                        <li>Depth: {template.settings.crawl_depth}</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium">Keywords</h4>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {template.settings.keywords.slice(0, 3).join(', ')}
                        {template.settings.keywords.length > 3 && '...'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">
                  No templates available for the selected criteria.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery ? "Try a different search term or " : ""}
                  {industry ? "select a different industry or " : ""}
                  create a custom configuration.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => {
            setOpen(false);
            setSearchQuery('');
          }}>
            Cancel
          </Button>
          {onSave && (
            <Button 
              variant="default" 
              onClick={() => {
                const data = onSave();
                console.log('Saved template data:', data);
                // Here you would typically save the template to a database
                // For now, just show a success message
                toast({
                  title: "Template Saved",
                  description: "Your current settings have been saved as a template.",
                  duration: 5000,
                });
              }}
            >
              Save Current Settings
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 