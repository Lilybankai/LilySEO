"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, CalendarIcon, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTeamMembers } from "@/hooks/use-team";

interface AddToTodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { dueDate: Date | undefined; assigneeId: string | undefined }) => Promise<void>;
  issueTitle: string;
  recommendation: string;
}

export function AddToTodoDialog({ open, onOpenChange, onConfirm, issueTitle, recommendation }: AddToTodoDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [assigneeId, setAssigneeId] = useState<string | undefined>(undefined);
  
  const { data: teamMembers, isLoading: isLoadingTeam } = useTeamMembers();

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onConfirm({ dueDate, assigneeId });
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding to todo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add to Todo</DialogTitle>
          <DialogDescription>
            Create a new todo item from this audit issue.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Issue</Label>
            <div className="rounded-md border p-3 text-sm">{issueTitle}</div>
          </div>
          
          <div className="space-y-2">
            <Label>Recommendation</Label>
            <div className="rounded-md border p-3 text-sm whitespace-pre-line">{recommendation}</div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="due-date">Due Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
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
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="assignee">Assign To (Optional)</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger id="assignee">
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="me">Myself</SelectItem>
                {!isLoadingTeam && teamMembers?.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name || member.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>Add to Todo</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 