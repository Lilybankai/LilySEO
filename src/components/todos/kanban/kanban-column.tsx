"use client";

import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { KanbanColumn as KanbanColumnType } from '@/types/todos';
import { TodoCard } from './todo-card';
import { PlusCircle, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TodoCreationDialog } from '../dialogs/todo-creation-dialog';
import { useTodoSelection } from '@/contexts/todo-selection-context';

interface KanbanColumnProps {
  column: KanbanColumnType;
  projectId: string | null;
}

export function KanbanColumn({ column, projectId }: KanbanColumnProps) {
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const { selectAll, selectionMode } = useTodoSelection();

  const handleSelectAllInColumn = () => {
    const todoIds = column.items.map(todo => todo.id);
    selectAll(todoIds);
  };

  return (
    <div className="bg-muted/40 rounded-lg p-4 min-h-[50vh] flex flex-col">
      <div 
        className="flex items-center justify-between mb-3 pb-2 border-b"
        style={{ borderColor: column.color }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: column.color }}
          ></div>
          <h3 className="font-medium text-sm">{column.title}</h3>
          <span className="text-muted-foreground text-xs ml-1">
            ({column.items.length})
          </span>
        </div>
        <div className="flex gap-1">
          {column.items.length > 0 && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={handleSelectAllInColumn}
              title="Select all items in this column"
            >
              <CheckSquare className="h-4 w-4" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={() => setCreateDialogOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            className={cn(
              "flex-grow overflow-y-auto space-y-2",
              snapshot.isDraggingOver && "bg-muted/80"
            )}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {column.items.map((todo, index) => (
              <Draggable key={todo.id} draggableId={todo.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      ...provided.draggableProps.style,
                      opacity: snapshot.isDragging ? 0.8 : 1,
                    }}
                  >
                    <TodoCard todo={todo} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            
            {column.items.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm italic">
                No tasks in this column
              </div>
            )}
          </div>
        )}
      </Droppable>
      
      <div className="mt-2 pt-2 border-t border-border">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-muted-foreground text-xs"
          onClick={() => setCreateDialogOpen(true)}
        >
          <PlusCircle className="h-3.5 w-3.5 mr-1" />
          Add Task
        </Button>
      </div>
      
      <TodoCreationDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
        initialStatus={column.status}
        projectId={projectId || undefined}
      />
    </div>
  );
} 