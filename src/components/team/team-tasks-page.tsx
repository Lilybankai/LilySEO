"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Clock, MoreHorizontal, Calendar, FileText, CheckCircle, XCircle, AlertTriangle, AlarmClock } from 'lucide-react';
import { format } from 'date-fns';
import { getTeamMembers } from '@/services/team-management';
import { getTodosByAssignee, getTodosAssignedByMe, getTodosAssignedToMe } from '@/services/todo-assignments';
import { updateTodoStatus, reassignTodo, completeTodo, startTodo, resetTodo } from '@/services/todo-status';
import { TeamMember } from '@/types/todos';
import { toast } from 'sonner';

interface Todo {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  assigned_to?: string;
  user_id: string;
  project_id: string;
  created_at: string;
  updated_at: string;
  projects?: {
    id: string;
    name: string;
  };
}

interface TaskActionMenuProps {
  task: Todo;
  showReassign?: boolean;
}

export function TeamTasksPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<Record<string, Todo[]>>({});
  const [myAssignedTasks, setMyAssignedTasks] = useState<Todo[]>([]);
  const [tasksAssignedByMe, setTasksAssignedByMe] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // Function to load team data
  const loadTeamData = async () => {
    try {
      setLoading(true);
      
      // Get team members
      const members = await getTeamMembers();
      setTeamMembers(members);
      
      // Get tasks assigned by the current user
      const assignedByMe = await getTodosAssignedByMe();
      setTasksAssignedByMe(assignedByMe);
      
      // Get tasks assigned to the current user
      const assignedToMe = await getTodosAssignedToMe();
      setMyAssignedTasks(assignedToMe);
      
      // Get tasks for each team member
      const memberTasks: Record<string, Todo[]> = {};
      
      for (const member of members) {
        if (member.userId) {
          const tasks = await getTodosByAssignee(member.userId);
          memberTasks[member.userId] = tasks;
        }
      }
      
      setAssignedTasks(memberTasks);
    } catch (error) {
      console.error('Error loading team data:', error);
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  // Get status badge for a todo
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'todo':
        return <Badge variant="outline" className="bg-slate-100">To Do</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'review':
        return <Badge className="bg-purple-100 text-purple-800">Review</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get priority badge for a todo
  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High</Badge>;
      case 'medium':
        return <Badge className="bg-orange-100 text-orange-800">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  // Get the initials for the avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  // Format a date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Function to handle status updates
  const handleStatusUpdate = async (todoId: string, newStatus: string) => {
    try {
      const result = await updateTodoStatus(todoId, newStatus);
      
      if (result.success) {
        toast.success('Task status updated successfully');
        // Refresh the data
        await loadTeamData();
      } else {
        toast.error(result.error || 'Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  };

  // Function to handle task reassignment
  const handleReassign = async (todoId: string, newAssigneeId: string) => {
    try {
      const result = await reassignTodo(todoId, newAssigneeId);
      
      if (result.success) {
        toast.success('Task reassigned successfully');
        // Refresh the data
        await loadTeamData();
      } else {
        toast.error(result.error || 'Failed to reassign task');
      }
    } catch (error) {
      console.error('Error reassigning task:', error);
      toast.error('Failed to reassign task');
    }
  };

  // Load team data on component mount
  useEffect(() => {
    loadTeamData();
  }, []);

  // Updated task action menu
  const TaskActionMenu = ({ task, showReassign = false }: TaskActionMenuProps) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/todos/${task.id}`}>
            View Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/todos/${task.id}/edit`}>
            Edit Task
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, 'completed')}>
          Mark as Completed
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, 'in_progress')}>
          Mark as In Progress
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, 'todo')}>
          Reset to To-Do
        </DropdownMenuItem>
        {showReassign && (
          <DropdownMenuItem>
            <div className="w-full">
              <select
                className="w-full bg-transparent"
                onChange={(e) => {
                  if (e.target.value) {
                    handleReassign(task.id, e.target.value);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                value=""
              >
                <option value="">Reassign to...</option>
                {teamMembers.map((member) => (
                  member.userId !== task.assigned_to && (
                    <option key={member.userId} value={member.userId}>
                      {member.name || member.email}
                    </option>
                  )
                ))}
              </select>
            </div>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Team Tasks</h1>
          <p className="text-muted-foreground">
            Monitor and manage tasks assigned to your team members
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/todos">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Go to Tasks
            </Button>
          </Link>
          
          <Link href="/team">
            <Button variant="outline">
              Manage Team
            </Button>
          </Link>
        </div>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assigned-to-me">Assigned to Me</TabsTrigger>
          <TabsTrigger value="assigned-by-me">Assigned by Me</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            teamMembers.length > 0 ? (
              <div className="space-y-6">
                {teamMembers.map((member) => {
                  const memberTasks = member.userId ? assignedTasks[member.userId] || [] : [];
                  const completedTasks = memberTasks.filter(task => task.status.toLowerCase() === 'completed');
                  const progressTasks = memberTasks.filter(task => task.status.toLowerCase() === 'in_progress');
                  const todoTasks = memberTasks.filter(task => task.status.toLowerCase() === 'todo');
                  
                  return (
                    <Card key={member.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarFallback>{getInitials(member.name || member.email.split('@')[0])}</AvatarFallback>
                            </Avatar>
                            
                            <div>
                              <CardTitle>{member.name || member.email.split('@')[0]}</CardTitle>
                              <CardDescription>{member.email}</CardDescription>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                      <span>{completedTasks.length}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Completed tasks</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                      <Clock className="h-4 w-4 text-blue-500 mr-1" />
                                      <span>{progressTasks.length}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>In-progress tasks</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                      <AlertTriangle className="h-4 w-4 text-orange-500 mr-1" />
                                      <span>{todoTasks.length}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>To-do tasks</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedMember(selectedMember === member.userId ? null : member.userId || null)}
                            >
                              {selectedMember === member.userId ? 'Hide Tasks' : 'View Tasks'}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {selectedMember === member.userId && (
                        <CardContent>
                          {memberTasks.length > 0 ? (
                            <div className="space-y-3 mt-2">
                              {memberTasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between p-3 border rounded-md">
                                  <div className="space-y-1">
                                    <div className="font-medium">{task.title}</div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                      <span>{task.projects?.name}</span>
                                      •
                                      {task.due_date && (
                                        <>
                                          <Calendar className="h-3 w-3" />
                                          <span>{formatDate(task.due_date)}</span>
                                          •
                                        </>
                                      )}
                                      <span>Updated {formatDate(task.updated_at)}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {getStatusBadge(task.status)}
                                    {getPriorityBadge(task.priority)}
                                    <TaskActionMenu task={task} showReassign={true} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-8 text-center text-muted-foreground">
                              <p>No tasks assigned to this team member</p>
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-10 text-center">
                  <div className="space-y-3">
                    <p className="text-muted-foreground">No team members found.</p>
                    <Button asChild>
                      <Link href="/team">Manage Team Members</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </TabsContent>
        
        {/* Assigned to Me Tab */}
        <TabsContent value="assigned-to-me" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tasks Assigned to Me</CardTitle>
              <CardDescription>
                All tasks that have been assigned to you by team members
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center p-3 border rounded-md">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-60" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16 rounded-md" />
                        <Skeleton className="h-6 w-16 rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : myAssignedTasks.length > 0 ? (
                <div className="space-y-3">
                  {myAssignedTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="space-y-1">
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>{task.projects?.name}</span>
                          •
                          {task.due_date && (
                            <>
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(task.due_date)}</span>
                              •
                            </>
                          )}
                          <span>Updated {formatDate(task.updated_at)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                        <TaskActionMenu task={task} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No tasks have been assigned to you</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Assigned by Me Tab */}
        <TabsContent value="assigned-by-me" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tasks Assigned by Me</CardTitle>
              <CardDescription>
                All tasks that you have assigned to team members
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center p-3 border rounded-md">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-60" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16 rounded-md" />
                        <Skeleton className="h-6 w-16 rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : tasksAssignedByMe.length > 0 ? (
                <div className="space-y-3">
                  {tasksAssignedByMe.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="space-y-1">
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>{task.projects?.name}</span>
                          •
                          {task.due_date && (
                            <>
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(task.due_date)}</span>
                              •
                            </>
                          )}
                          <AlarmClock className="h-3 w-3" />
                          <span>Updated {formatDate(task.updated_at)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                        <TaskActionMenu task={task} showReassign={true} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p>You haven't assigned any tasks to team members</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 