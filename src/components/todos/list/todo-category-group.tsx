"use client";

import React, { useState } from 'react';
import { TodoPriority, TodoStatus, Todo } from '@/types/todos';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';

interface TodoCategoryGroupProps {
  title: string;
  todos: Todo[];
  columns: ColumnDef<Todo, any>[];
  defaultExpanded?: boolean;
  color?: string;
  count?: number;
  completedCount?: number;
}

export function TodoCategoryGroup({
  title,
  todos,
  columns,
  defaultExpanded = true,
  color = 'bg-blue-100',
  count,
  completedCount
}: TodoCategoryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  // Calculate counts if not provided
  const totalCount = count ?? todos.length;
  const completedItems = completedCount ?? todos.filter(todo => todo.status === 'completed').length;
  const completionPercentage = totalCount > 0 ? Math.round((completedItems / totalCount) * 100) : 0;
  
  return (
    <div className="mb-6 border rounded-md overflow-hidden">
      <div 
        className={`${color} p-3 flex justify-between items-center cursor-pointer`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
          <h3 className="font-medium text-md">{title}</h3>
          <Badge variant="outline" className="ml-2 bg-white/80">
            {totalCount} {totalCount === 1 ? 'item' : 'items'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="text-sm">
              {completedItems}/{totalCount} completed ({completionPercentage}%)
            </div>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
          
          <Button 
            size="sm" 
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-0">
          <DataTable
            columns={columns}
            data={todos}
            className="border-0 rounded-none"
          />
        </div>
      )}
    </div>
  );
} 