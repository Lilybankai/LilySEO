"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  AlertCircle,
  Edit,
  CheckCircle,
  Trash2,
  Play,
  Pause,
  User,
  BarChart,
  Sparkles,
} from "lucide-react";
import { Todo, TodoPriority } from "@/types/todos";
import { formatDistance, format, formatDistanceToNow, isValid } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AiSuggestionsTab } from "../ai/ai-suggestions-tab";

const priorityColors: Record<TodoPriority, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-amber-100 text-amber-800",
  critical: "bg-red-100 text-red-800",
};

// Convert seconds to hh:mm:ss format
const formatTime = (timeInSeconds: number) => {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = timeInSeconds % 60;

  const pad = (num: number) => num.toString().padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

// Helper function to safely format date with formatDistanceToNow
const safeFormatDistanceToNow = (dateValue: Date | string | undefined) => {
  if (!dateValue) return 'Unknown date';
  
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    
    // Check if the date is valid before formatting
    if (!isValid(date)) {
      console.warn('Invalid date value for formatDistanceToNow:', dateValue);
      return 'Invalid date';
    }
    
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting date with formatDistanceToNow:', error, dateValue);
    return 'Error with date';
  }
};

// Helper function to safely format date with format
const safeFormat = (dateValue: Date | string | undefined, formatString: string) => {
  if (!dateValue) return 'Unknown date';
  
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    
    // Check if the date is valid before formatting
    if (!isValid(date)) {
      console.warn('Invalid date value for format:', dateValue);
      return 'Invalid date';
    }
    
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting date with format:', error, dateValue);
    return 'Error with date';
  }
};

interface TodoDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todoId: string;
  initialTodo?: Todo;
}

export function TodoDetailsDialog({
  open,
  onOpenChange,
  todoId,
  initialTodo,
}: TodoDetailsDialogProps) {
  const [todo, setTodo] = useState<Todo | null>(initialTodo || null);
  const [loading, setLoading] = useState(!initialTodo);
  const [editing, setEditing] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [timeTracking, setTimeTracking] = useState({
    isRunning: false,
    startTime: 0,
    timeSpent: initialTodo?.timeSpent || 0,
  });
  
  useEffect(() => {
    if (open && todoId && !initialTodo) {
      const fetchTodoDetails = async () => {
        setLoading(true);
        try {
          // In a real implementation, you would fetch the todo from the database
          // For now, just use the initialTodo or a mock
          
          // Mock API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          if (initialTodo) {
            setTodo(initialTodo);
          } else {
            // This would be replaced with an actual API call
            setTodo(null);
            toast.error("Todo not found");
            onOpenChange(false);
          }
        } catch (error) {
          console.error("Error fetching todo details:", error);
          toast.error("Failed to load task details");
        } finally {
          setLoading(false);
        }
      };
      
      fetchTodoDetails();
    }
    
    // Reset editing state when dialog is closed
    if (!open) {
      setEditing(false);
    }
    
    // Reset state when initialTodo changes
    if (initialTodo && initialTodo !== todo) {
      setTodo(initialTodo);
      setTimeTracking(prev => ({
        ...prev,
        timeSpent: initialTodo.timeSpent,
      }));
    }
    
    // Clean up time tracking when component unmounts
    return () => {
      if (timeTracking.isRunning) {
        stopTimeTracking();
      }
    };
  }, [open, todoId, initialTodo, onOpenChange]);
  
  // Set up time tracking effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timeTracking.isRunning) {
      interval = setInterval(() => {
        setTimeTracking(prev => ({
          ...prev,
          timeSpent: prev.timeSpent + 1,
        }));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeTracking.isRunning]);
  
  const startTimeTracking = () => {
    setTimeTracking(prev => ({
      ...prev,
      isRunning: true,
      startTime: Date.now(),
    }));
    
    toast.success("Time tracking started");
  };
  
  const stopTimeTracking = async () => {
    setTimeTracking(prev => ({
      ...prev,
      isRunning: false,
    }));
    
    // In a real implementation, you would update the todo in the database
    if (todo) {
      setTodo(prev => prev ? {
        ...prev,
        timeSpent: timeTracking.timeSpent,
        timeTrackedAt: new Date().toISOString(),
      } : null);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      toast.success("Time tracking stopped and saved");
    }
  };
  
  const handleStatusChange = async (newStatus: string) => {
    if (!todo) return;
    
    try {
      // In a real implementation, you would update the todo in the database
      setTodo(prev => prev ? { ...prev, status: newStatus as any } : null);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };
  
  const handlePriorityChange = async (newPriority: string) => {
    if (!todo) return;
    
    try {
      // In a real implementation, you would update the todo in the database
      setTodo(prev => prev ? { ...prev, priority: newPriority as any } : null);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      toast.success(`Priority updated to ${newPriority}`);
    } catch (error) {
      console.error("Error updating priority:", error);
      toast.error("Failed to update priority");
    }
  };
  
  const handleDescriptionSave = async () => {
    if (!todo) return;
    
    try {
      // In a real implementation, you would update the todo in the database
      setTodo(prev => prev ? { ...prev, description: editDescription } : null);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setEditing(false);
      toast.success("Description updated");
    } catch (error) {
      console.error("Error updating description:", error);
      toast.error("Failed to update description");
    }
  };
  
  const handleComplete = async () => {
    if (!todo) return;
    
    try {
      // In a real implementation, you would update the todo in the database
      setTodo(prev => prev ? { 
        ...prev, 
        status: 'completed',
        updatedAt: new Date().toISOString(),
      } : null);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      toast.success("Task marked as completed");
    } catch (error) {
      console.error("Error completing task:", error);
      toast.error("Failed to complete task");
    }
  };
  
  const startEditing = () => {
    if (!todo) return;
    setEditDescription(todo.description || "");
    setEditing(true);
  };
  
  if (!todo && !loading) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : todo ? (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl">{todo.title}</DialogTitle>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={cn(priorityColors[todo.priority])}
                  >
                    <BarChart className="h-3.5 w-3.5 mr-1" />
                    {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      todo.status === 'completed' ? "bg-green-100 text-green-800" :
                      todo.status === 'in_progress' ? "bg-blue-100 text-blue-800" :
                      todo.status === 'review' ? "bg-purple-100 text-purple-800" :
                      "bg-gray-100 text-gray-800"
                    )}
                  >
                    {todo.status === 'completed' ? <CheckCircle className="h-3.5 w-3.5 mr-1" /> :
                     todo.status === 'in_progress' ? <Play className="h-3.5 w-3.5 mr-1" /> :
                     todo.status === 'review' ? <AlertCircle className="h-3.5 w-3.5 mr-1" /> :
                     <Clock className="h-3.5 w-3.5 mr-1" />}
                    {todo.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-x-2 text-sm text-muted-foreground mt-1">
                <span className="flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  Created {safeFormatDistanceToNow(todo.createdAt)}
                </span>
                {todo.dueDate && (
                  <span className="flex items-center ml-4">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    Due {safeFormat(todo.dueDate, "PP")}
                  </span>
                )}
              </div>
            </DialogHeader>
            
            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="time-tracking">Time Tracking</TabsTrigger>
                <TabsTrigger value="ai-suggestions">AI Suggestions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium">Description</h3>
                      {!editing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={startEditing}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                    
                    {editing ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="min-h-[120px]"
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditing(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm"
                            onClick={handleDescriptionSave}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm leading-6 bg-muted/50 p-3 rounded-md min-h-[120px]">
                        {todo.description || (
                          <span className="text-muted-foreground italic">No description provided</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Status</h3>
                      <Select
                        value={todo.status}
                        onValueChange={handleStatusChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Priority</h3>
                      <Select
                        value={todo.priority}
                        onValueChange={handlePriorityChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Assigned To</h3>
                    <div className="flex items-center gap-2 bg-muted/50 p-3 rounded-md">
                      {todo.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarFallback>
                              {todo.assignedTo.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">John Doe</p>
                            <p className="text-xs text-muted-foreground">john@example.com</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span className="text-sm">Not assigned</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {todo.auditId && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Audit Reference</h3>
                      <div className="bg-muted/50 p-3 rounded-md">
                        <p className="text-sm">
                          This task was created from an audit report.
                        </p>
                        <Button
                          variant="link"
                          className="h-8 px-0 text-sm"
                          // Would link to the audit details page
                          onClick={() => {}}
                        >
                          View Audit Details
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between pt-4 border-t">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => {
                      toast.success("Task deleted");
                      onOpenChange(false);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                  
                  <Button 
                    size="sm"
                    onClick={handleComplete}
                    disabled={todo.status === 'completed'}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Complete
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="time-tracking" className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-md">
                  <h3 className="text-sm font-medium mb-4">Time Tracking</h3>
                  
                  <div className="flex items-center justify-center text-4xl font-mono mb-6">
                    {formatTime(timeTracking.timeSpent)}
                  </div>
                  
                  <div className="flex items-center justify-center gap-2">
                    {timeTracking.isRunning ? (
                      <Button 
                        onClick={stopTimeTracking}
                        variant="outline"
                        className="w-32"
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    ) : (
                      <Button 
                        onClick={startTimeTracking}
                        className="w-32"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </Button>
                    )}
                  </div>
                  
                  {timeTracking.timeSpent > 0 && (
                    <div className="mt-6 text-sm text-center text-muted-foreground">
                      {timeTracking.isRunning ? (
                        <p>Tracking time for this task...</p>
                      ) : (
                        <p>Total time spent on this task so far.</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>Note: Time tracked is automatically saved when you pause or close this dialog.</p>
                </div>
              </TabsContent>
              
              <TabsContent value="ai-suggestions" className="space-y-4">
                <AiSuggestionsTab todo={todo} />
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-40">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p>Todo not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 