"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, CheckCircle, Clock, RefreshCw, Trash2, UserPlus, X } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useTodoSelection } from '@/contexts/todo-selection-context';
import { useBatchUpdateStatus, useBatchAssignTodos, useBatchDeleteTodos } from '@/hooks/use-todos';
import { useTeamMembers } from '@/hooks/use-team';
import { toast } from 'sonner';
import { BatchEditDueDateDialog } from './dialogs/batch-edit-dialog';

interface BatchActionBarProps {
  onActionsComplete?: () => void;
}

export function BatchActionBar({ onActionsComplete }: BatchActionBarProps) {
  const { selectedTodos, clearSelection } = useTodoSelection();
  const [showTeamMembers, setShowTeamMembers] = useState(false);
  const [showDueDateDialog, setShowDueDateDialog] = useState(false);
  
  // Add debug logging
  useEffect(() => {
    console.log('BatchActionBar rendered with selectedTodos:', selectedTodos);
  }, [selectedTodos]);
  
  // Use React Query hooks for data and mutations
  const { data: teamMembers = [], isLoading: isTeamMembersLoading } = useTeamMembers();
  const batchUpdateStatus = useBatchUpdateStatus();
  const batchAssignTodos = useBatchAssignTodos();
  const batchDeleteTodos = useBatchDeleteTodos();

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
        onSuccess: (result) => {
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
        onError: (error) => {
          console.error(`Error during batch status update:`, error);
          toast.error(`Failed to update tasks: ${error.message}`);
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
        onSuccess: (result) => {
          const assignee = teamMembers.find(member => member.userId === assigneeId);
          const name = assignee?.name || assignee?.email || 'selected team member';
          
          const updatedCount = result.updated || 0;
          
          toast.success(`${updatedCount} ${updatedCount === 1 ? 'task' : 'tasks'} assigned to ${name}`);
          
          if (result.unauthorized && result.unauthorized.length > 0) {
            toast.warning(`${result.unauthorized.length} ${result.unauthorized.length === 1 ? 'task' : 'tasks'} could not be assigned due to permissions`);
          }
          
          handleActionComplete();
        },
        onError: (error) => {
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
        onSuccess: (result) => {
          const deletedCount = result.deleted || 0;
          
          toast.success(`${deletedCount} ${deletedCount === 1 ? 'task' : 'tasks'} deleted`);
          
          if (result.unauthorized && result.unauthorized.length > 0) {
            toast.warning(`${result.unauthorized.length} ${result.unauthorized.length === 1 ? 'task' : 'tasks'} could not be deleted due to permissions`);
          }
          
          handleActionComplete();
        },
        onError: (error) => {
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
    batchDeleteTodos.isPending;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-background border rounded-lg shadow-lg px-4 py-3 flex items-center gap-4 w-auto max-w-3xl">
        <Badge variant="outline" className="bg-primary/10 text-primary font-medium">
          {selectedTodos.length} {selectedTodos.length === 1 ? 'task' : 'tasks'} selected
        </Badge>
        
        <div className="flex items-center gap-2">
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
            onClick={() => handleStatusUpdate('pending')}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenDueDateDialog()}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <CalendarClock className="h-4 w-4" />
            <span>Set Due Date</span>
          </Button>
          
          <DropdownMenu onOpenChange={setShowTeamMembers}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="flex items-center gap-1"
              >
                <UserPlus className="h-4 w-4" />
                <span>Assign</span>
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
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isLoading}
            className="flex items-center gap-1 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </Button>
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
    </>
  );
} 