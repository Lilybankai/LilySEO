"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TodoStatus, TodoPriority, Todo } from '@/types/todos';
import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreHorizontal, ListFilter, FolderOpen, Clock, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useTodoSelection } from '@/contexts/todo-selection-context';
import { TodoDetailsDialog } from '../dialogs/todo-details-dialog';
import { useToast } from '@/components/ui/use-toast';
import { useTodos } from '@/hooks/use-todos';
import { Skeleton } from '@/components/ui/skeleton';
import { TodoCategoryGroup } from './todo-category-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TodoListProps {
  projectId: string | null;
  searchTerm?: string;
}

// Helper function to handle priority display
const PriorityBadge = ({ priority }: { priority: TodoPriority }) => {
  const colorMap = {
    low: 'bg-green-100 text-green-800 hover:bg-green-200',
    medium: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    high: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
    critical: 'bg-red-100 text-red-800 hover:bg-red-200',
  };

  return (
    <Badge variant="outline" className={colorMap[priority]}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
};

// Helper function to handle status display
const StatusBadge = ({ status }: { status: TodoStatus }) => {
  const colorMap = {
    pending: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    'in_progress': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    review: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
    completed: 'bg-green-100 text-green-800 hover:bg-green-200',
    cancelled: 'bg-red-100 text-red-800 hover:bg-red-200',
  };

  return (
    <Badge variant="outline" className={colorMap[status]}>
      {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

// Helper to format dates
const formatDate = (date: Date | string | undefined) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'MMM d, yyyy');
};

// Helper to get group background color
const getGroupColor = (key: string, groupType: string): string => {
  const colorMap: Record<string, Record<string, string>> = {
    priority: {
      low: 'bg-green-50',
      medium: 'bg-blue-50',
      high: 'bg-amber-50',
      critical: 'bg-red-50',
    },
    status: {
      pending: 'bg-gray-50',
      in_progress: 'bg-blue-50',
      review: 'bg-purple-50',
      completed: 'bg-green-50',
      cancelled: 'bg-red-50',
    },
  };

  if (groupType in colorMap && key in colorMap[groupType]) {
    return colorMap[groupType][key];
  }
  
  // Default colors for other group types
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };
  
  const intToRGB = (i: number) => {
    const c = (i & 0x00FFFFFF).toString(16).toUpperCase();
    return '00000'.substring(0, 6 - c.length) + c;
  };
  
  const hash = hashCode(key);
  const rgb = intToRGB(hash);
  
  // Generate a light pastel color
  return `bg-[#${rgb}15]`;
};

export function TodoList({ projectId, searchTerm = "" }: TodoListProps) {
  const { toggleSelection, selectedTodos, isSelected } = useTodoSelection();
  const [selectedTodoForDetails, setSelectedTodoForDetails] = useState<Todo | null>(null);
  const [groupBy, setGroupBy] = useState<'none' | 'category' | 'priority' | 'status' | 'assignee'>('none');
  const { toast } = useToast();
  
  // Use React Query to fetch todos
  const { data: todos, isLoading, error } = useTodos(projectId || undefined, searchTerm);
  
  // Handle todos fetch error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading todos",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Define columns for the data table
  const columns = useMemo<ColumnDef<Todo, any>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value);
            
            // Update the global selection context
            const rows = table.getRowModel().rows;
            if (value) {
              rows.forEach(row => {
                if (!isSelected(row.original.id)) {
                  toggleSelection(row.original.id);
                }
              });
            } else {
              rows.forEach(row => {
                if (isSelected(row.original.id)) {
                  toggleSelection(row.original.id);
                }
              });
            }
          }}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={isSelected(row.original.id)}
          onCheckedChange={(value) => {
            toggleSelection(row.original.id);
            row.toggleSelected(!!value);
          }}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.title}</div>
          <div className="text-xs text-gray-500 truncate max-w-[300px]">
            {row.original.description || "No description"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <CalendarIcon className="h-3 w-3 text-gray-500" />
          <span>{formatDate(row.original.dueDate)}</span>
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-gray-500" />
          <span>{formatDate(row.original.createdAt)}</span>
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem 
              onClick={() => setSelectedTodoForDetails(row.original)}
            >
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Move to In Progress</DropdownMenuItem>
            <DropdownMenuItem>Mark as Complete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [toggleSelection, isSelected]);

  // Group todos based on selected grouping
  const groupedTodos = useMemo(() => {
    if (!todos || groupBy === 'none') return null;
    
    const groups: Record<string, Todo[]> = {};
    
    todos.forEach(todo => {
      let groupKey = 'Unknown';
      
      switch (groupBy) {
        case 'priority':
          groupKey = todo.priority;
          break;
        case 'status':
          groupKey = todo.status;
          break;
        case 'assignee':
          groupKey = todo.assignedTo || 'Unassigned';
          break;
        case 'category':
          // Assuming todos have a category field or using auditId as a substitute
          groupKey = todo.auditId || 'General';
          break;
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      
      groups[groupKey].push(todo);
    });
    
    // Sort groups based on priority or status order
    const orderedGroups: Record<string, Todo[]> = {};
    
    if (groupBy === 'priority') {
      const priorityOrder: TodoPriority[] = ['critical', 'high', 'medium', 'low'];
      priorityOrder.forEach(priority => {
        if (groups[priority]) {
          orderedGroups[priority] = groups[priority];
        }
      });
    } else if (groupBy === 'status') {
      const statusOrder: TodoStatus[] = ['pending', 'in_progress', 'review', 'completed', 'cancelled'];
      statusOrder.forEach(status => {
        if (groups[status]) {
          orderedGroups[status] = groups[status];
        }
      });
    } else {
      // For other groupings, sort alphabetically
      Object.keys(groups).sort().forEach(key => {
        orderedGroups[key] = groups[key];
      });
    }
    
    return orderedGroups;
  }, [todos, groupBy]);

  // Format group title for display
  const formatGroupTitle = (key: string, groupType: string): string => {
    if (groupType === 'status' && key === 'in_progress') {
      return 'In Progress';
    }
    
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

  // If loading, show skeleton
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </Card>
    );
  }

  // Error state is handled with the toast effect above
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Todo List</h2>
        
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Group by:</span>
            <Select
              value={groupBy}
              onValueChange={(value: any) => setGroupBy(value)}
            >
              <SelectTrigger className="h-8 w-[120px]">
                <SelectValue placeholder="Grouping" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="assignee">Assignee</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <ListFilter className="h-4 w-4 mr-1" />
            Columns
          </Button>
          
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <FolderOpen className="h-4 w-4 mr-1" />
            Save View
          </Button>
        </div>
      </div>
      
      {groupBy === 'none' ? (
        <DataTable
          columns={columns}
          data={todos || []}
          searchColumn="title"
          defaultPageSize={20}
        />
      ) : (
        <div className="space-y-2">
          {groupedTodos && Object.entries(groupedTodos).map(([key, groupTodos]) => (
            <TodoCategoryGroup
              key={key}
              title={formatGroupTitle(key, groupBy)}
              todos={groupTodos}
              columns={columns}
              color={getGroupColor(key, groupBy)}
              defaultExpanded={
                // Auto-expand high priority and in-progress by default
                (groupBy === 'priority' && (key === 'critical' || key === 'high')) ||
                (groupBy === 'status' && key === 'in_progress')
              }
            />
          ))}
        </div>
      )}
      
      {/* Todo Details Dialog */}
      {selectedTodoForDetails && (
        <TodoDetailsDialog
          open={!!selectedTodoForDetails}
          onOpenChange={() => setSelectedTodoForDetails(null)}
          todoId={selectedTodoForDetails.id}
          initialTodo={selectedTodoForDetails}
        />
      )}
    </div>
  );
} 