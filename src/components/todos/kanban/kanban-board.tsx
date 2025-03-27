"use client";

import React, { useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { TodoStatus } from '@/types/todos';
import { KanbanColumn as KanbanColumnComponent } from './kanban-column';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, CheckSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddCustomStatusForm } from './add-custom-status-form';
import { toast } from 'sonner';
import { useTodoSelection } from '@/contexts/todo-selection-context';
import { useKanbanColumns, useUpdateTodoStatus } from '@/hooks/use-todos';

interface KanbanBoardProps {
  projectId: string | null;
  searchTerm?: string;
}

export function KanbanBoard({ projectId, searchTerm = "" }: KanbanBoardProps) {
  const [addColumnDialogOpen, setAddColumnDialogOpen] = useState<boolean>(false);
  const { selectAll, clearSelection } = useTodoSelection();
  
  // Use React Query hooks
  const { columns, isLoading, error } = useKanbanColumns(projectId || undefined, searchTerm);
  const updateTodoStatus = useUpdateTodoStatus();

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // No destination or dropped in the same place
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Find source and destination columns
    const sourceColIndex = columns.findIndex(col => col.id === source.droppableId);
    const destColIndex = columns.findIndex(col => col.id === destination.droppableId);
    
    if (sourceColIndex === -1 || destColIndex === -1) return;
    
    // If the status is changing, update the todo status
    if (sourceColIndex !== destColIndex) {
      const newStatus = columns[destColIndex].status as TodoStatus;
      
      // Update the todo status using the mutation hook
      updateTodoStatus.mutate({ 
        todoId: draggableId, 
        newStatus 
      }, {
        onSuccess: () => {
          toast.success(`Task moved to ${columns[destColIndex].title}`);
        },
        onError: () => {
          toast.error("Failed to update task status");
        }
      });
    }
  };

  const handleAddCustomColumn = (name: string, color: string) => {
    // Here you would save the custom column to the database
    // This would trigger a refetch of the columns data
    
    toast.success(`Added new column: ${name}`);
    setAddColumnDialogOpen(false);
  };

  const handleSelectAllTodos = () => {
    if (!columns) return;
    
    // Get all todo IDs from all columns
    const allTodoIds = columns.flatMap(column => column.items.map(todo => todo.id));
    selectAll(allTodoIds);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <p className="text-destructive">Error loading tasks: {error.message}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Kanban Board</h2>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAllTodos}
            className="flex items-center gap-1"
          >
            <CheckSquare className="h-4 w-4 mr-1" />
            Select All
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddColumnDialogOpen(true)}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Custom Column
          </Button>
        </div>
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map(column => (
            <KanbanColumnComponent 
              key={column.id}
              column={column}
              projectId={projectId}
            />
          ))}
        </div>
      </DragDropContext>
      
      <Dialog open={addColumnDialogOpen} onOpenChange={setAddColumnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Column</DialogTitle>
            <DialogDescription>
              Create a custom column for your kanban board.
            </DialogDescription>
          </DialogHeader>
          
          <AddCustomStatusForm onSubmit={handleAddCustomColumn} />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddColumnDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 