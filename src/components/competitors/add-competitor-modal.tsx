"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";

interface AddCompetitorModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddCompetitorModal({ 
  projectId, 
  open, 
  onOpenChange, 
  onSuccess 
}: AddCompetitorModalProps) {
  const { toast } = useToast();
  
  const [newCompetitorUrl, setNewCompetitorUrl] = useState('');
  const [newCompetitorName, setNewCompetitorName] = useState('');
  const [addingCompetitor, setAddingCompetitor] = useState(false);
  
  async function addCompetitor() {
    if (!newCompetitorUrl) {
      toast({
        title: "Error",
        description: "Competitor URL is required",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setAddingCompetitor(true);
      
      const response = await fetch(`/api/projects/${projectId}/competitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newCompetitorUrl,
          name: newCompetitorName || undefined
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add competitor');
      }
      
      toast({
        title: "Success",
        description: "Competitor added successfully"
      });
      
      // Reset form
      setNewCompetitorUrl('');
      setNewCompetitorName('');
      
      // Close modal
      onOpenChange(false);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to add competitor",
        variant: "destructive"
      });
    } finally {
      setAddingCompetitor(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Competitor</DialogTitle>
          <DialogDescription>
            Add a competitor website to analyze and compare against your site.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium">
              Competitor URL <span className="text-destructive">*</span>
            </label>
            <Input
              id="url"
              placeholder="https://example.com"
              value={newCompetitorUrl}
              onChange={(e) => setNewCompetitorUrl(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name (Optional)
            </label>
            <Input
              id="name"
              placeholder="Competitor name"
              value={newCompetitorName}
              onChange={(e) => setNewCompetitorName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              If not provided, we'll use the domain name
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={addingCompetitor}
          >
            Cancel
          </Button>
          <Button 
            onClick={addCompetitor}
            disabled={!newCompetitorUrl || addingCompetitor}
          >
            {addingCompetitor ? "Adding..." : "Add Competitor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddCompetitorButton({ 
  projectId, 
  variant = "default", 
  disabled = false,
  onSuccess
}: { 
  projectId: string; 
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Button 
        variant={variant} 
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Competitor
      </Button>
      
      <AddCompetitorModal
        projectId={projectId}
        open={open}
        onOpenChange={setOpen}
        onSuccess={onSuccess}
      />
    </>
  );
} 