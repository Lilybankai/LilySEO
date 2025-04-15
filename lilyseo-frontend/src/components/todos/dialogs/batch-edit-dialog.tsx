"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { updateTodosDueDate } from "@/services/todo-batch";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface BatchEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTodoIds: string[];
  onSuccess?: () => void;
}

export function BatchEditDueDateDialog({ open, onOpenChange, selectedTodoIds, onSuccess }: BatchEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [action, setAction] = useState<"set" | "clear">("set");
  
  const resetState = () => {
    setDueDate(undefined);
    setAction("set");
  };
  
  const handleConfirm = async () => {
    if (selectedTodoIds.length === 0) {
      toast.error("No todos selected");
      return;
    }
    
    console.log("Confirming batch due date update:", {
      selectedTodoIds,
      action,
      dueDate,
      dateToSet: action === "set" ? dueDate : null
    });
    
    try {
      setIsLoading(true);
      
      // If action is "clear", set dueDate to null
      const dateToSet = action === "set" ? dueDate : null;
      
      const result = await updateTodosDueDate(selectedTodoIds, dateToSet);
      console.log("Batch due date update result:", result);
      
      if (result.success) {
        // Use the updated count or fallback to the number of todos
        const updatedCount = result.updated || selectedTodoIds.length;
        const actionText = action === "set" ? "set" : "cleared";
        
        toast.success(`Successfully ${actionText} due date for ${updatedCount} todo items`);
        onOpenChange(false);
        resetState();
        
        // Force a cache refresh to update the UI
        window.setTimeout(() => {
          if (onSuccess) {
            console.log("Calling onSuccess callback to refresh data");
            onSuccess();
          }
        }, 100);
      } else {
        toast.error(result.error || "Failed to update due dates");
      }
    } catch (error) {
      console.error("Error updating todo due dates:", error);
      toast.error("An error occurred while updating due dates");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      console.log("Dialog open state changed:", value);
      onOpenChange(value);
      if (!value) resetState();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Batch Edit Due Dates</DialogTitle>
          <DialogDescription>
            Update due dates for multiple todo items at once.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Selected Todos</Label>
            <Badge variant="outline">{selectedTodoIds.length} todos selected</Badge>
          </div>
          
          <div className="space-y-2">
            <Label>Action</Label>
            <div className="flex space-x-2">
              <Button 
                type="button" 
                variant={action === "set" ? "default" : "outline"}
                onClick={() => setAction("set")}
              >
                Set Due Date
              </Button>
              <Button 
                type="button" 
                variant={action === "clear" ? "default" : "outline"}
                onClick={() => setAction("clear")}
              >
                Clear Due Date
              </Button>
            </div>
          </div>
          
          {action === "set" && (
            <div className="space-y-2">
              <Label htmlFor="due-date">Select Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="due-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Select a due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || (action === "set" && !dueDate)}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Due Dates"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 