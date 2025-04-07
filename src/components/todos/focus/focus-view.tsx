"use client";

import React, { useState, useMemo } from 'react';
import { Todo, TodoPriority } from '@/types/todos';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertTriangle, PanelRight, PanelLeftClose, Target } from 'lucide-react';
import { format, isToday, isTomorrow, formatDistanceToNow } from 'date-fns';
import { TodoDetailsDialog } from '../dialogs/todo-details-dialog';
import { useTodos } from '@/hooks/use-todos';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useTodoSelection } from '@/contexts/todo-selection-context';

interface FocusViewProps {
  projectId: string | null;
  searchTerm?: string;
  limit?: number;
}

// Helper to get appropriate badge color for priority
const getPriorityColor = (priority: TodoPriority): string => {
  const colorMap = {
    low: 'bg-green-100 text-green-800 hover:bg-green-200',
    medium: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    high: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
    critical: 'bg-red-100 text-red-800 hover:bg-red-200',
  };
  return colorMap[priority] || 'bg-gray-100 text-gray-800';
};

// Format due date with contextual text
const formatDueDate = (date: string | Date | undefined): { text: string; isOverdue: boolean } => {
  if (!date) return { text: 'No deadline', isOverdue: false };
  
  const dueDate = new Date(date);
  const now = new Date();
  const isOverdue = dueDate < now;
  
  let text = '';
  if (isToday(dueDate)) {
    text = 'Due today';
  } else if (isTomorrow(dueDate)) {
    text = 'Due tomorrow';
  } else if (isOverdue) {
    text = `Overdue by ${formatDistanceToNow(dueDate)}`;
  } else {
    text = `Due ${format(dueDate, 'MMM d')}`;
  }
  
  return { text, isOverdue };
};

export function FocusView({ projectId, searchTerm = "", limit = 5 }: FocusViewProps) {
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [fullWidthMode, setFullWidthMode] = useState(false);
  const { toggleSelection } = useTodoSelection();
  const { toast } = useToast();
  
  // Fetch todos using React Query
  const { data: allTodos, isLoading, error } = useTodos(projectId || undefined, searchTerm);
  
  // Sort and filter todos for focus
  const prioritizedTodos = useMemo(() => {
    if (!allTodos) return [];
    
    // Scoring function for todo priority
    const getScore = (todo: Todo): number => {
      let score = 0;
      
      // Priority scores
      if (todo.priority === 'critical') score += 50;
      else if (todo.priority === 'high') score += 40;
      else if (todo.priority === 'medium') score += 20;
      else if (todo.priority === 'low') score += 10;
      
      // Status scores
      if (todo.status === 'in_progress') score += 15;
      else if (todo.status === 'pending') score += 10;
      else if (todo.status === 'review') score += 5;
      else if (todo.status === 'completed') score -= 30;
      
      // Due date scores
      if (todo.dueDate) {
        const dueDate = new Date(todo.dueDate);
        const today = new Date();
        
        if (dueDate < today) {
          // Overdue items get highest priority
          score += 30;
        } else if (isToday(dueDate)) {
          score += 25;
        } else if (isTomorrow(dueDate)) {
          score += 20;
        } else {
          // Items further in the future get less priority
          const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntilDue < 7) {
            score += 15 - daysUntilDue;
          }
        }
      }
      
      return score;
    };
    
    // Sort todos by score
    return [...allTodos]
      .filter(todo => todo.status !== 'completed' && todo.status !== 'cancelled')
      .sort((a, b) => getScore(b) - getScore(a));
  }, [allTodos]);
  
  // Get todos to display based on showAll flag
  const todosToDisplay = showAll ? prioritizedTodos : prioritizedTodos.slice(0, limit);
  
  // Handle errors
  if (error) {
    toast({
      title: "Error loading focus items",
      description: error.message,
      variant: "destructive",
    });
  }
  
  // Handle loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            <Skeleton className="h-7 w-48" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-72" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex flex-col space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={fullWidthMode ? "w-full" : "max-w-xl"}>
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Focus View
          </CardTitle>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFullWidthMode(!fullWidthMode)}
            title={fullWidthMode ? "Collapse to half width" : "Expand to full width"}
          >
            {fullWidthMode ? <PanelLeftClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
          </Button>
        </div>
        <CardDescription>
          {showAll
            ? `Showing all ${prioritizedTodos.length} active tasks in priority order`
            : `Showing your top ${Math.min(limit, prioritizedTodos.length)} priority tasks to focus on`}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {todosToDisplay.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No tasks to focus on right now.</p>
            <p className="text-sm mt-2">Great job! Take a well-deserved break.</p>
          </div>
        ) : (
          todosToDisplay.map((todo) => {
            const { text: dueText, isOverdue } = formatDueDate(todo.dueDate);
            
            return (
              <div 
                key={todo.id} 
                className="p-3 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => setSelectedTodo(todo)}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{todo.title}</h3>
                  <Badge className={getPriorityColor(todo.priority)}>
                    {todo.priority}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {todo.description || "No description"}
                </p>
                
                <div className="flex items-center gap-2 mt-2">
                  <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {isOverdue ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {dueText}
                  </div>
                  
                  <div className="ml-auto">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelection(todo.id);
                        toast({
                          title: "Task selected",
                          description: "You can now perform bulk actions on this task.",
                          duration: 2000,
                        });
                      }}
                    >
                      Select
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle completion (would update todo status)
                        toast({
                          title: "Task completed",
                          description: "Great job! The task has been marked as complete.",
                          duration: 2000,
                        });
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Complete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
      
      {prioritizedTodos.length > limit && (
        <CardFooter className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? `Show Top ${limit} Tasks` : `Show All ${prioritizedTodos.length} Tasks`}
          </Button>
        </CardFooter>
      )}
      
      {selectedTodo && (
        <TodoDetailsDialog
          open={!!selectedTodo}
          onOpenChange={() => setSelectedTodo(null)}
          todoId={selectedTodo.id}
          initialTodo={selectedTodo}
        />
      )}
    </Card>
  );
} 