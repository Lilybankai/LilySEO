"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarClock, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  Trash2, 
  UserPlus, 
  X, 
  Tag,
  AlertTriangle,
  ArrowUp,
  Filter
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useTodoSelection } from '@/contexts/todo-selection-context';
import { 
  useBatchUpdateStatus, 
  useBatchAssignTodos, 
  useBatchDeleteTodos, 
  useBatchUpdatePriority,
  useBatchAddTags
} from '@/hooks/use-todos';
import { useTeamMembers } from '@/hooks/use-team';
import { toast } from 'sonner';
import { BatchEditDueDateDialog } from './dialogs/batch-edit-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface BatchActionBarProps {
  onActionsComplete?: () => void;
}

// Define result type interfaces
interface BatchUpdateResult {
  updated?: number;
  unauthorized?: string[];
}

interface BatchDeleteResult {
  deleted?: number;
  unauthorized?: string[];
}

export function BatchActionBar({ onActionsComplete }: BatchActionBarProps) {
  const { selectedTodos, clearSelection } = useTodoSelection();
  const [showTeamMembers, setShowTeamMembers] = useState(false);
  const [showDueDateDialog, setShowDueDateDialog] = useState(false);
  const [showTagsDialog, setShowTagsDialog] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  
  // Add debug logging
  useEffect(() => {
    console.log('BatchActionBar rendered with selectedTodos:', selectedTodos);
  }, [selectedTodos]);
  
  // Use React Query hooks for data and mutations
  const { data: teamMembers = [], isLoading: isTeamMembersLoading } = useTeamMembers();
  const batchUpdateStatus = useBatchUpdateStatus();
  const batchAssignTodos = useBatchAssignTodos();
  const batchDeleteTodos = useBatchDeleteTodos();
  const batchUpdatePriority = useBatchUpdatePriority();
  const batchAddTags = useBatchAddTags();

  // Function to handle completion of any batch action
  const handleActionComplete = useCallback(() => {
    console.log('Batch action completed, clearing selection and refreshing data');
    clearSelection();
    if (onActionsComplete) {
      onActionsComplete();
    }
  }, [clearSelection, onActionsComplete]);

  // Handle batch status updates
  const handleStatusUpdate = async (status: 'completed' | 'in_progress' | 'pending') => {
    if (selectedTodos.length === 0) return;
    
    batchUpdateStatus.mutate(
      { todoIds: selectedTodos, status },
      {
        onSuccess: (result: BatchUpdateResult) => {
          const statusName = status === 'completed' ? 'completed' : 
                            status === 'in_progress' ? 'in progress' : 
                            'to-do';
          
          const updatedCount = result.updated || 0;
          
          toast.success(`${updatedCount} ${updatedCount === 1 ? 'task' : 'tasks'} marked as ${statusName}`);
          
          if (result.unauthorized && result.unauthorized.length > 0) {
            toast.warning(`${result.unauthorized.length} ${result.unauthorized.length === 1 ? 'task' : 'tasks'} could not be updated due to permissions`);
          }
          
          handleActionComplete();
        },
        onError: (error: Error) => {
          console.error(`Error during batch status update:`, error);
          toast.error(`Failed to update tasks: ${error.message}`);
        }
      }
    );
  };

  // Handle batch priority update
  const handlePriorityUpdate = async (priority: 'low' | 'medium' | 'high' | 'critical') => {
    if (selectedTodos.length === 0) return;
    
    batchUpdatePriority.mutate(
      { todoIds: selectedTodos, priority },
      {
        onSuccess: (result: BatchUpdateResult) => {
          const updatedCount = result.updated || 0;
          
          toast.success(`Priority set to ${priority} for ${updatedCount} ${updatedCount === 1 ? 'task' : 'tasks'}`);
          
          if (result.unauthorized && result.unauthorized.length > 0) {
            toast.warning(`${result.unauthorized.length} ${result.unauthorized.length === 1 ? 'task' : 'tasks'} could not be updated due to permissions`);
          }
          
          handleActionComplete();
        },
        onError: (error: Error) => {
          console.error(`Error during batch priority update:`, error);
          toast.error(`Failed to update priority: ${error.message}`);
        }
      }
    );
  };

  // Handle batch tag addition
  const handleAddTags = async () => {
    if (selectedTodos.length === 0 || !tagsInput.trim()) return;
    
    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    if (tags.length === 0) {
      toast.error('Please enter at least one valid tag');
      return;
    }
    
    batchAddTags.mutate(
      { todoIds: selectedTodos, tags },
      {
        onSuccess: (result: BatchUpdateResult) => {
          const updatedCount = result.updated || 0;
          
          toast.success(`Tags added to ${updatedCount} ${updatedCount === 1 ? 'task' : 'tasks'}`);
          
          if (result.unauthorized && result.unauthorized.length > 0) {
            toast.warning(`${result.unauthorized.length} ${result.unauthorized.length === 1 ? 'task' : 'tasks'} could not be updated due to permissions`);
          }
          
          setTagsInput('');
          setShowTagsDialog(false);
          handleActionComplete();
        },
        onError: (error: Error) => {
          console.error(`Error during batch tag addition:`, error);
          toast.error(`Failed to add tags: ${error.message}`);
        }
      }
    );
  };

  // Handle batch assignment
  const handleAssign = async (assigneeId: string) => {
    if (selectedTodos.length === 0) return;
    
    batchAssignTodos.mutate(
      { todoIds: selectedTodos, assigneeId },
      {
        onSuccess: (result: BatchUpdateResult) => {
          const assignee = teamMembers.find(member => member.userId === assigneeId);
          const name = assignee?.name || assignee?.email || 'selected team member';
          
          const updatedCount = result.updated || 0;
          
          toast.success(`${updatedCount} ${updatedCount === 1 ? 'task' : 'tasks'} assigned to ${name}`);
          
          if (result.unauthorized && result.unauthorized.length > 0) {
            toast.warning(`${result.unauthorized.length} ${result.unauthorized.length === 1 ? 'task' : 'tasks'} could not be assigned due to permissions`);
          }
          
          handleActionComplete();
        },
        onError: (error: Error) => {
          console.error('Error during batch assign:', error);
          toast.error(`Failed to assign tasks: ${error.message}`);
        },
        onSettled: () => {
          setShowTeamMembers(false);
        }
      }
    );
  };

  // Handle batch delete
  const handleDelete = async () => {
    if (selectedTodos.length === 0) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedTodos.length} tasks? This action cannot be undone.`);
    if (!confirmed) return;
    
    batchDeleteTodos.mutate(
      selectedTodos,
      {
        onSuccess: (result: BatchDeleteResult) => {
          const deletedCount = result.deleted || 0;
          
          toast.success(`${deletedCount} ${deletedCount === 1 ? 'task' : 'tasks'} deleted`);
          
          if (result.unauthorized && result.unauthorized.length > 0) {
            toast.warning(`${result.unauthorized.length} ${result.unauthorized.length === 1 ? 'task' : 'tasks'} could not be deleted due to permissions`);
          }
          
          handleActionComplete();
        },
        onError: (error: Error) => {
          console.error('Error during batch delete:', error);
          toast.error(`Failed to delete tasks: ${error.message}`);
        }
      }
    );
  };

  // Handle opening the due date dialog
  const handleOpenDueDateDialog = () => {
    console.log('Opening due date dialog with selectedTodos:', selectedTodos);
    setShowDueDateDialog(true);
  };

  // Hide if no items are selected
  if (selectedTodos.length === 0) {
    return null;
  }

  // Get loading state for UI feedback
  const isLoading = 
    batchUpdateStatus.isPending || 
    batchAssignTodos.isPending || 
    batchDeleteTodos.isPending ||
    batchUpdatePriority.isPending ||
    batchAddTags.isPending;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-background border rounded-lg shadow-lg px-4 py-3 flex flex-col sm:flex-row items-center gap-4 w-auto max-w-3xl">
        <Badge variant="outline" className="bg-primary/10 text-primary font-medium">
          {selectedTodos.length} {selectedTodos.length === 1 ? 'task' : 'tasks'} selected
        </Badge>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* First row of actions - most common */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusUpdate('completed')}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Complete</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusUpdate('in_progress')}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <Clock className="h-4 w-4" />
            <span>Start</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenDueDateDialog()}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <CalendarClock className="h-4 w-4" />
            <span>Due Date</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="flex items-center gap-1"
              >
                <ArrowUp className="h-4 w-4" />
                <span>Priority</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => handlePriorityUpdate('critical')}
                className="text-red-500 font-medium"
              >
                Critical
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handlePriorityUpdate('high')}
                className="text-amber-500 font-medium"
              >
                High
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handlePriorityUpdate('medium')}
                className="text-blue-500 font-medium"
              >
                Medium
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handlePriorityUpdate('low')}
                className="text-green-500 font-medium"
              >
                Low
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* More actions in expand/collapse section */}
          <Popover open={isFilterExpanded} onOpenChange={setIsFilterExpanded}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <Filter className="h-4 w-4" />
                <span>More Actions</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56">
              <div className="grid gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate('pending')}
                  disabled={isLoading}
                  className="flex items-center gap-1 w-full justify-start"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Reset Status</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTagsDialog(true)}
                  disabled={isLoading}
                  className="flex items-center gap-1 w-full justify-start"
                >
                  <Tag className="h-4 w-4" />
                  <span>Add Tags</span>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isLoading || isTeamMembersLoading}
                      className="flex items-center gap-1 w-full justify-start"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Assign To</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {isTeamMembersLoading ? (
                      <DropdownMenuItem disabled>Loading team members...</DropdownMenuItem>
                    ) : teamMembers.length > 0 ? (
                      teamMembers.map((member) => (
                        <DropdownMenuItem
                          key={member.userId}
                          onClick={() => handleAssign(member.userId!)}
                        >
                          {member.name || member.email}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>No team members found</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="flex items-center gap-1 w-full justify-start text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Tasks</span>
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={clearSelection}
          className="ml-auto"
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <BatchEditDueDateDialog
        open={showDueDateDialog}
        onOpenChange={setShowDueDateDialog}
        selectedTodoIds={selectedTodos}
        onSuccess={handleActionComplete}
      />
      
      {/* Tags Dialog */}
      <Dialog open={showTagsDialog} onOpenChange={setShowTagsDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Tags</DialogTitle>
            <DialogDescription>
              Add tags to {selectedTodos.length} selected {selectedTodos.length === 1 ? 'task' : 'tasks'}. Separate multiple tags with commas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags</Label>
              <Input 
                id="tags" 
                placeholder="SEO, content, technical..."
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Example: "SEO, content, technical"
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTagsDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddTags}
              disabled={!tagsInput.trim()}
            >
              Add Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 