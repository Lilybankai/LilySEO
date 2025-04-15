"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Todo } from '@/types/todos';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TodoDetailsDialog } from '../dialogs/todo-details-dialog';
import { TodoCreationDialog } from '../dialogs/todo-creation-dialog';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, addWeeks, subWeeks, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useToast } from '@/components/ui/use-toast';
import { useTodos, useCalendarTodos } from '@/hooks/use-todos';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  tags: string[];
}

interface TodoCalendarProps {
  projectId: string | null;
  searchTerm?: string;
}

export function TodoCalendar({ projectId, searchTerm = "" }: TodoCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

  // Use React Query hook for fetching todos
  const { 
    data: todos, 
    isLoading, 
    error 
  } = useCalendarTodos(projectId ? projectId : undefined);

  // Process todos for calendar display with memoization
  const todosByDate = useMemo(() => {
    if (!todos) return new Map();
    
    const map = new Map();
    
    todos.forEach(todo => {
      if (!todo.scheduledFor) return;
      
      const dateKey = new Date(todo.scheduledFor).toDateString();
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey).push(todo);
    });
    
    return map;
  }, [todos]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error("Error loading calendar data. Please try again.");
    }
  }, [error]);
  
  const handleDayClick = (day: Date | undefined) => {
    if (!day) return;
    setSelectedDate(day);
  };

  const handleTodoClick = (todo: Todo) => {
    setSelectedTodo(todo);
  };

  const getTodosForSelectedDate = (): Todo[] => {
    if (!selectedDate) return [];
    return todosByDate.get(selectedDate.toDateString()) || [];
  };

  const getDayContent = (day: Date) => {
    const dayTodos = todosByDate.get(day.toDateString()) || [];
    
    if (dayTodos.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {dayTodos.length > 0 && (
          <Badge variant="secondary">
            {dayTodos.length}
          </Badge>
        )}
      </div>
    );
  };

  const handleCloseDetails = () => {
    setSelectedTodo(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="shadow-md">
      <Tabs defaultValue="month" className="w-full" onValueChange={(value) => setView(value as 'month' | 'week' | 'day')}>
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Todo Calendar</h2>
            <TabsList>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="day">Day</TabsTrigger>
            </TabsList>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-7 lg:grid-cols-7 gap-0">
            <div className="md:col-span-5 lg:col-span-5 p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDayClick}
                className="w-full"
                modifiers={{
                  hasTodo: (date) => todosByDate.has(date.toDateString())
                }}
                modifiersClassNames={{
                  hasTodo: "bg-blue-50 font-bold"
                }}
              />
            </div>
            <div className="md:col-span-2 lg:col-span-2 border-l">
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-4">
                  {selectedDate ? (
                    <span>Todos for {format(selectedDate, 'MMM d, yyyy')}</span>
                  ) : (
                    <span>Select a date</span>
                  )}
                </h3>
                <div className="space-y-2">
                  {getTodosForSelectedDate().length === 0 ? (
                    <p className="text-gray-500">No todos for this date</p>
                  ) : (
                    getTodosForSelectedDate().map((todo) => (
                      <Button
                        key={todo.id}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-2 px-3"
                        onClick={() => handleTodoClick(todo)}
                      >
                        <div>
                          <div className="font-medium">{todo.title}</div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`${
                                todo.priority === 'critical'
                                  ? 'bg-red-100 text-red-800'
                                  : todo.priority === 'high'
                                  ? 'bg-amber-100 text-amber-800'
                                  : todo.priority === 'medium'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {todo.priority}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`${
                                todo.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : todo.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : todo.status === 'pending'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {todo.status}
                            </Badge>
                          </div>
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Tabs>
      {selectedTodo && (
        <TodoDetailsDialog
          open={!!selectedTodo}
          onOpenChange={handleCloseDetails}
          todoId={selectedTodo.id}
          initialTodo={selectedTodo}
        />
      )}
    </Card>
  );
} 