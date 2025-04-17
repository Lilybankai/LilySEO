"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { Todo, TeamMember, TodoStatus, TodoPriority } from '@/types/todos';
import { getTodoById, getTeamMembersForAssignment, updateTodo } from '@/services/todo-assignments';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface TodoDetailModalProps {
  todoId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const statuses: TodoStatus[] = ['todo', 'in_progress', 'review', 'completed'];
const priorities: TodoPriority[] = ['low', 'medium', 'high'];

const formatDateForInput = (date: string | Date | undefined | null): string => {
  if (!date) return '';
  try {
    const dateToFormat = typeof date === 'string' ? new Date(date) : date;
    const offset = dateToFormat.getTimezoneOffset();
    const adjustedDate = new Date(dateToFormat.getTime() - (offset*60*1000));
    return adjustedDate.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

export function TodoViewModal({ todoId, isOpen, onClose, onSave }: TodoDetailModalProps) {
  const [todo, setTodo] = useState<Todo | null>(null);
  const [editState, setEditState] = useState<Partial<Todo>>({});
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("view");

  const fetchTodoData = useCallback(async () => {
    if (!todoId) return;
    setLoading(true);
    setError(null);
    setTodo(null);
    setEditState({});
    try {
      const [todoData, membersData] = await Promise.all([
        getTodoById(todoId),
        getTeamMembersForAssignment()
      ]);

      if (todoData) {
        setTodo(todoData);
        setEditState({
          title: todoData.title,
          description: todoData.description,
          notes: todoData.notes,
          status: todoData.status,
          priority: todoData.priority,
          assignedTo: todoData.assignedTo,
          dueDate: todoData.dueDate,
        });
      } else {
        setError("Failed to load task details.");
        setTodo(null);
      }
      setTeamMembers(membersData || []);

    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.message || "An error occurred while fetching data.");
      setTodo(null);
    } finally {
      setLoading(false);
    }
  }, [todoId]);

  useEffect(() => {
    if (isOpen && todoId) {
      fetchTodoData();
      setActiveTab("view");
    } else if (!isOpen) {
      setTodo(null);
      setEditState({});
      setTeamMembers([]);
      setError(null);
      setLoading(false);
      setSaving(false);
    }
  }, [isOpen, todoId, fetchTodoData]);

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditState(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSelectChange = (name: string, value: string) => {
    setEditState(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSave = async () => {
    if (!todoId || !editState.title) {
        toast.error("Title is required.");
        return;
    };
    setSaving(true);
    setError(null);

    const updates: Partial<Todo> = {
        title: editState.title,
        description: editState.description || null,
        notes: editState.notes || null,
        status: editState.status as TodoStatus,
        priority: editState.priority as TodoPriority,
        assignedTo: editState.assignedTo === "UNASSIGNED" || !editState.assignedTo ? null : editState.assignedTo,
        dueDate: editState.dueDate || null,
    };
    
    Object.keys(updates).forEach(key => updates[key as keyof typeof updates] === undefined && delete updates[key as keyof typeof updates]);

    try {
        const result = await updateTodo(todoId, updates);
        if (result.success) {
            toast.success("Task updated successfully!");
            await fetchTodoData();
            setActiveTab("view");
            if (onSave) onSave();
        } else {
            setError(result.error || "Failed to save changes.");
            toast.error(result.error || "Failed to save changes.");
        }
    } catch (err) {
        console.error("Save error:", err);
        setError("An unexpected error occurred during save.");
        toast.error("An unexpected error occurred.");
    } finally {
        setSaving(false);
    }
};

  const getInitials = (name?: string | null) => {
     if (!name) return '??';
     return name
       .split(' ')
       .map((n) => n[0])
       .join('')
       .toUpperCase();
  };

  const formatDate = (dateString?: Date | string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.error("Date formatting error:", error, "Input:", dateString);
      return 'Invalid Date';
    }
  };

  const handleModalClose = () => {
    if (!saving) {
        onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleModalClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {loading ? "Loading Task..." : error ? "Error" : todo?.title ? `Task: ${todo.title}` : "Task Details"}
          </DialogTitle>
        </DialogHeader>

        {loading && (
           <div className="space-y-4 py-4">
             <Skeleton className="h-8 w-3/4" />
             <Skeleton className="h-4 w-1/2" />
             <Skeleton className="h-16 w-full" />
             <Skeleton className="h-4 w-1/4" />
             <Skeleton className="h-10 w-full" />
           </div>
        )}

        {error && !loading && <p className="text-red-600 py-4 text-center">{error}</p>}

        {!loading && !error && todo && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col min-h-0">
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="view">View Details</TabsTrigger>
              <TabsTrigger value="edit">Edit Task</TabsTrigger>
            </TabsList>

            <TabsContent value="view" className="flex-grow overflow-y-auto space-y-4 pr-2 -mr-2">
              {todo.description && (
                 <div className="prose prose-sm dark:prose-invert max-w-none">
                    <h4 className="font-medium text-sm mb-1">Description</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap break-words">{todo.description}</p>
                 </div>
              )}

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                 <div>
                    <span className="text-muted-foreground block">Status</span>
                    <Badge variant="outline" className="capitalize">{todo.status.replace('_', ' ')}</Badge>
                 </div>
                 <div>
                    <span className="text-muted-foreground block">Priority</span>
                    <Badge variant="outline" className="capitalize">{todo.priority}</Badge>
                 </div>
                 <div>
                    <span className="text-muted-foreground block">Project</span>
                    <span>{todo.projects?.name || 'N/A'}</span>
                 </div>
                 <div>
                    <span className="text-muted-foreground block">Due Date</span>
                    <span>{formatDate(todo.dueDate)}</span>
                 </div>
                 <div>
                    <span className="text-muted-foreground block">Assigned To</span>
                    {todo.assigneeProfile ? (
                       <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                             <AvatarFallback className="text-xs">
                                {getInitials(todo.assigneeProfile?.full_name || todo.assigneeProfile?.email)}
                              </AvatarFallback>
                          </Avatar>
                          <span>{todo.assigneeProfile?.full_name || todo.assigneeProfile?.email}</span>
                       </div>
                    ) : (
                       <span className="text-muted-foreground italic">{todo.assignedTo ? "Assignee not found" : "Unassigned"}</span>
                    )}
                 </div>
                 <div>
                    <span className="text-muted-foreground block">Created</span>
                    <span>{formatDate(todo.createdAt)}</span>
                 </div>
                 <div>
                    <span className="text-muted-foreground block">Last Updated</span>
                    <span>{formatDate(todo.updatedAt)}</span>
                 </div>
              </div>

              {todo.notes && (
                <div className="pt-2">
                  <h4 className="font-medium text-sm mb-1">Notes</h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-muted-foreground whitespace-pre-wrap break-words">{todo.notes}</p>
                  </div>
                </div>
              )}
              <div className="h-4"></div>
            </TabsContent>

            <TabsContent value="edit" className="flex-grow overflow-y-auto space-y-4 pr-2 -mr-2">
              <div className="space-y-1">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" value={editState.title || ''} onChange={handleEditInputChange} required disabled={saving} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" value={editState.description || ''} onChange={handleEditInputChange} rows={4} disabled={saving} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" placeholder="Add internal notes..." value={editState.notes || ''} onChange={handleEditInputChange} rows={3} disabled={saving}/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" value={editState.status} onValueChange={(value) => handleEditSelectChange('status', value)} disabled={saving}>
                        <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                            {statuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-1">
                     <Label htmlFor="priority">Priority</Label>
                     <Select name="priority" value={editState.priority} onValueChange={(value) => handleEditSelectChange('priority', value)} disabled={saving}>
                         <SelectTrigger id="priority"><SelectValue placeholder="Select priority" /></SelectTrigger>
                         <SelectContent>
                             {priorities.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                         </SelectContent>
                     </Select>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                     <Label htmlFor="assignedTo">Assigned To</Label>
                     <Select name="assignedTo" value={editState.assignedTo || "UNASSIGNED"} onValueChange={(value) => handleEditSelectChange('assignedTo', value)} disabled={saving}>
                         <SelectTrigger id="assignedTo"><SelectValue placeholder="Select member..." /></SelectTrigger>
                         <SelectContent>
                             <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                             {teamMembers.map(member => (
                                 <SelectItem key={member.userId || member.id} value={member.userId! || member.id}>
                                     {member.name || member.email}
                                 </SelectItem>
                             ))}
                         </SelectContent>
                     </Select>
                 </div>
                 <div className="space-y-1">
                     <Label htmlFor="dueDate">Due Date</Label>
                     <Input id="dueDate" name="dueDate" type="date" value={formatDateForInput(editState.dueDate)} onChange={handleEditInputChange} disabled={saving} />
                 </div>
              </div>
               <div className="h-4"></div>
            </TabsContent>
          </Tabs>
        )}

        {!loading && (
            <DialogFooter className="mt-auto pt-4 border-t">
                <Button type="button" variant="outline" onClick={handleModalClose} disabled={saving}>
                    Close
                </Button>
                {activeTab === 'edit' && !error && todo && (
                    <Button type="button" onClick={handleSave} disabled={saving || loading}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save Changes
                    </Button>
                )}
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
} 