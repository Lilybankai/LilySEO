"use client"

import { useState } from "react"
import { X, Plus, Globe } from "lucide-react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

// URL validation schema
const urlSchema = z.string()
  .min(1, { message: "URL is required" })
  .refine(
    (url) => /^(https?:\/\/)?(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+(:\d+)?(\/\S*)?$/.test(url),
    { message: "Please enter a valid URL" }
  )
  .refine(
    (url) => url.startsWith('http://') || url.startsWith('https://'),
    { message: "URL must start with http:// or https://" }
  );

export interface Competitor {
  id: string;
  name: string;
  url: string;
}

interface CompetitorInputProps {
  competitors: Competitor[];
  onChange: (competitors: Competitor[]) => void;
  disabled?: boolean;
}

export function CompetitorInput({ competitors, onChange, disabled = false }: CompetitorInputProps) {
  const [error, setError] = useState<string | null>(null);
  const [newCompetitor, setNewCompetitor] = useState<{
    name: string;
    url: string;
  }>({
    name: "",
    url: "https://",
  });

  const addCompetitor = () => {
    setError(null);
    
    // Validate URL
    try {
      urlSchema.parse(newCompetitor.url);
    } catch (error: any) {
      setError(error.message || "Invalid URL format");
      return;
    }
    
    // Validate name
    if (!newCompetitor.name.trim()) {
      setError("Competitor name is required");
      return;
    }
    
    // Check for duplicate URLs
    const normalizedUrl = newCompetitor.url.toLowerCase().replace(/\/$/, "");
    const duplicate = competitors.find(
      (c) => c.url.toLowerCase().replace(/\/$/, "") === normalizedUrl
    );
    
    if (duplicate) {
      setError("This competitor URL has already been added");
      return;
    }
    
    // Add new competitor
    onChange([
      ...competitors,
      {
        id: crypto.randomUUID(),
        name: newCompetitor.name.trim(),
        url: newCompetitor.url.trim(),
      },
    ]);
    
    // Reset form
    setNewCompetitor({
      name: "",
      url: "https://",
    });
  };

  const removeCompetitor = (id: string) => {
    onChange(competitors.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {competitors.length > 0 && (
        <div className="space-y-2">
          {competitors.map((competitor) => (
            <div
              key={competitor.id}
              className="flex items-center justify-between p-3 border border-border rounded-md bg-card"
            >
              <div className="flex-1 truncate">
                <p className="font-medium">{competitor.name}</p>
                <p className="text-sm text-muted-foreground truncate">{competitor.url}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeCompetitor(competitor.id)}
                disabled={disabled}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
            </div>
          ))}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="competitor-name">Competitor Name</Label>
          <Input
            id="competitor-name"
            placeholder="Competitor Inc."
            value={newCompetitor.name}
            onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
            disabled={disabled}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="competitor-url">Competitor URL</Label>
          <div className="flex items-center mt-1">
            <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
            <Input
              id="competitor-url"
              placeholder="https://competitor.com"
              value={newCompetitor.url}
              onChange={(e) => setNewCompetitor({ ...newCompetitor, url: e.target.value })}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCompetitor}
          disabled={disabled || !newCompetitor.name || !newCompetitor.url}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Competitor
        </Button>
      </div>
      
      {competitors.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <p>No competitors added yet. Add your main competitors to compare your SEO performance.</p>
        </div>
      )}
    </div>
  );
} 