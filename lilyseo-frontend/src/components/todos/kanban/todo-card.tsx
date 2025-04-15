"use client";

import React from 'react';
import { Todo, TodoPriority } from '@/types/todos';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Pencil, Clock, BarChart, LucideIcon, CheckCircle2, Calendar } from 'lucide-react';
import { TodoDetailsDialog } from '../dialogs/todo-details-dialog';
import { formatDistanceToNow, isValid, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTodoSelection } from '@/contexts/todo-selection-context';

interface TodoCardProps {
  todo: Todo;
}

const priorityColors: Record<TodoPriority, string> = {
  low: 'bg-green-100 text-green-800 hover:bg-green-200',
  medium: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  high: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  critical: 'bg-red-100 text-red-800 hover:bg-red-200',
};

const priorityIcons: Record<TodoPriority, LucideIcon> = {
  low: BarChart,
  medium: BarChart,
  high: BarChart,
  critical: BarChart,
};

// Function to format time spent in a human-readable way
const formatTimeSpent = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
};

// Helper function to safely format date with fallback
const safeFormatDate = (dateValue: Date | string | undefined) => {
  if (!dateValue) return 'Unknown date';
  
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    
    // Check if the date is valid before formatting
    if (!isValid(date)) {
      console.warn('Invalid date value:', dateValue);
      return 'Invalid date';
    }
    
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting date:', error, dateValue);
    return 'Error with date';
  }
};

// Helper function to format due date
const formatDueDate = (dueDate: Date | string | undefined | any) => {
  if (!dueDate) return null;
  
  try {
    // Log details about the incoming due date for debugging
    console.log('formatDueDate called with:', {
      dueDate,
      type: typeof dueDate,
      valueAsString: String(dueDate)
    });
    
    // Handle database snakecase conversion
    if (typeof dueDate === 'object' && dueDate !== null && 'due_date' in dueDate) {
      dueDate = dueDate.due_date as string | Date;
    }
    
    // For safety, add explicit null check
    if (dueDate === null) return null;
    
    const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
    
    // Check if the date is valid before formatting
    if (!isValid(date)) {
      console.warn('Invalid due date value:', dueDate);
      return null;
    }
    
    // Format as "MMM d" (e.g., "Jan 1")
    return format(date, 'MMM d');
  } catch (error) {
    console.error('Error formatting due date:', error, dueDate);
    return null;
  }
};

export function TodoCard({ todo }: TodoCardProps) {
  const { toggleSelection, isSelected, selectionMode } = useTodoSelection();
  const [showDetails, setShowDetails] = React.useState(false);
  
  // Add debug effect for tracking selection state changes
  React.useEffect(() => {
    const selected = isSelected(todo.id);
    console.log(`TodoCard ${todo.id} selection state:`, { selected, selectionMode });
    
    // Debug due date
    console.log(`TodoCard ${todo.id} due date:`, {
      dueDate: todo.dueDate,
      type: todo.dueDate ? typeof todo.dueDate : 'undefined/null',
      formattedDueDate: formatDueDate(todo.dueDate)
    });
  }, [todo.id, isSelected, selectionMode, todo.dueDate]);
  
  // Normalize todo object to handle potential snake_case fields
  React.useEffect(() => {
    // Check if we need to convert due_date to dueDate
    if (todo.dueDate === undefined && (todo as any).due_date !== undefined) {
      (todo as any).dueDate = (todo as any).due_date;
    }
    
    // Debug due date
    console.log(`TodoCard ${todo.id} due date normalized:`, {
      original_dueDate: todo.dueDate,
      due_date: (todo as any).due_date,
      normalized: todo.dueDate || (todo as any).due_date,
      formattedDueDate: formatDueDate(todo.dueDate || (todo as any).due_date)
    });
  }, [todo]);
  
  const PriorityIcon = priorityIcons[todo.priority];
  
  // Extract initial for avatar
  const getInitial = (userId: string): string => {
    // In a real implementation, you would look up the user's name
    // For now, just return the first character of the userId
    return userId.charAt(0).toUpperCase();
  };

  const handleCardClick = (e: React.MouseEvent) => {
    console.log('TodoCard clicked, selectionMode:', selectionMode, 'ctrl/meta key:', e.ctrlKey || e.metaKey);
    if (selectionMode || e.ctrlKey || e.metaKey) {
      e.stopPropagation();
      console.log('Toggling selection for todo ID:', todo.id);
      toggleSelection(todo.id);
      
      // Debug check selection state immediately after toggle
      setTimeout(() => {
        const selected = isSelected(todo.id);
        console.log(`Selection state after toggle for ${todo.id}:`, selected);
      }, 0);
    } else {
      setShowDetails(true);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Checkbox clicked for todo ID:', todo.id);
    toggleSelection(todo.id);
  };
  
  const selected = isSelected(todo.id);
  const formattedDueDate = formatDueDate(todo.dueDate || (todo as any).due_date);
  
  return (
    <>
      <Card 
        className={cn(
          "cursor-pointer hover:shadow-md transition-shadow duration-200",
          selectionMode && "border-2 border-opacity-50",
          selected && "border-primary border-2"
        )}
        onClick={handleCardClick}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between">
            <div className="font-medium text-sm truncate flex-1">
              {(selectionMode || selected) && (
                <span 
                  className={cn(
                    "inline-flex items-center justify-center mr-2 w-4 h-4 border rounded cursor-pointer",
                    selected ? "bg-primary border-primary text-primary-foreground" : "border-input"
                  )}
                  onClick={handleCheckboxClick}
                >
                  {selected && <CheckCircle2 className="h-3 w-3" />}
                </span>
              )}
              {todo.title}
            </div>
          </div>
          
          {todo.description && (
            <div className="text-xs text-muted-foreground line-clamp-2">
              {todo.description}
            </div>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <Badge variant="outline" className={cn("text-xs px-2 py-0", priorityColors[todo.priority])}>
                <PriorityIcon className="h-3 w-3 mr-1" />
                {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
              </Badge>
              
              {todo.timeSpent > 0 && (
                <Badge variant="outline" className="text-xs px-2 py-0 bg-slate-100">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTimeSpent(todo.timeSpent)}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {todo.assignedTo ? (
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {getInitial(todo.assignedTo)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground mt-1 flex justify-between">
            <div className="flex items-center">
              <span>Created: {safeFormatDate(todo.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              {formattedDueDate && (
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Due: {formattedDueDate}
                </span>
              )}
              {todo.auditId && <span className="italic ml-1">From audit</span>}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <TodoDetailsDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        todoId={todo.id}
        initialTodo={todo}
      />
    </>
  );
} 