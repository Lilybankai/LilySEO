"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
import { getTodosByAssignee, getTodosAssignedByMe, getTodosAssignedToMe, getUnassignedTeamTasks } from '@/services/todo-assignments';
import { updateTodoStatus, reassignTodo, completeTodo, startTodo, resetTodo } from '@/services/todo-status';
import { TeamMember } from '@/types/todos';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TodoViewModal } from '@/components/todos/modals/TodoViewModal';

interface Todo {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  due_date?: string | Date | null;
  assigned_to?: string | null;
  user_id: string;
  project_id: string;
  created_at: string | Date;
  updated_at: string | Date;
  projects?: {
    id: string;
    name: string;
  } | null;
  assigneeProfile?: {
    id: string;
    full_name?: string | null;
    avatar_url?: string | null;
    email?: string | null;
  } | null;
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
  const [unassignedTasks, setUnassignedTasks] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // State for modals
  const [viewingTodoId, setViewingTodoId] = useState<string | null>(null);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);

  // Function to load team data
  const loadTeamData = async () => {
    try {
      setLoading(true);
      
      // Fetch members, assigned by me, assigned to me (parallel)
      const [members, assignedByMe, assignedToMe, unassigned] = await Promise.all([
        getTeamMembers(),
        getTodosAssignedByMe(),
        getTodosAssignedToMe(),
        getUnassignedTeamTasks()
      ]);
      
      setTeamMembers(members);
      setTasksAssignedByMe(assignedByMe);
      setMyAssignedTasks(assignedToMe);
      setUnassignedTasks(unassigned);
      
      // Fetch tasks for each team member (can still be parallelized further if needed)
      const memberTasksPromises = members
        .filter(member => member.userId)
        .map(member => getTodosByAssignee(member.userId!));
      
      const memberTasksResults = await Promise.all(memberTasksPromises);
      
      const memberTasks: Record<string, Todo[]> = {};
      members.forEach((member, index) => {
        if (member.userId) {
          memberTasks[member.userId] = memberTasksResults[index];
        }
      });
      
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
  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return 'No date';
    try {
      // Ensure it's a Date object before formatting
      const dateToFormat = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return format(dateToFormat, 'MMM d, yyyy');
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

  // Function to handle task reassignment - Ensure signature accepts null
  const handleReassign = async (todoId: string, newAssigneeId: string | null) => {
    try {
      // Ensure reassignTodo service function can handle null
      const result = await reassignTodo(todoId, newAssigneeId);
      
      if (result.success) {
        toast.success(newAssigneeId ? 'Task reassigned successfully' : 'Task unassigned successfully');
        await loadTeamData(); // Refresh data on success
      } else {
        toast.error(result.error || 'Failed to update assignment');
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error('Failed to update assignment');
    }
  };

  // Load team data on component mount
  useEffect(() => {
    loadTeamData();
  }, []);

  // Updated task action menu to trigger modals
  const TaskActionMenu = ({ task, showReassign = false }: TaskActionMenuProps) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Trigger View Modal */}
        <DropdownMenuItem onSelect={() => setViewingTodoId(task.id)}>
          View Details
        </DropdownMenuItem>
        {/* Trigger Edit Modal */}
        <DropdownMenuItem onSelect={() => setEditingTodoId(task.id)}>
          Edit Task
        </DropdownMenuItem>
        {/* Existing Status Updates */}
        <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, 'completed')}>
          Mark as Completed
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, 'in_progress')}>
          Mark as In Progress
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, 'todo')}>
          Reset to To-Do
        </DropdownMenuItem>
        {/* Assign/Reassign Select */}
        {(showReassign || !task.assigned_to) && (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()} >
            <div className="w-full">
              <Label className="text-xs text-muted-foreground mb-1 block">Assign/Reassign</Label>
              <Select 
                 onValueChange={(selectedValue: string) => {
                   const assigneeIdToSend = selectedValue === "UNASSIGNED" ? null : selectedValue;
                   handleReassign(task.id, assigneeIdToSend);
                 }}
                 value={task.assigned_to || "UNASSIGNED"}
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select member..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNASSIGNED">Unassigned</SelectItem> 
                  {teamMembers.map((member) => (
                    member.userId && (
                       <SelectItem key={member.userId} value={member.userId}>
                         {member.name || member.email}
                       </SelectItem>
                    )
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Helper to render a list of tasks
  const renderTaskList = (tasks: Todo[], showAssignee: boolean = false, listTitle?: string) => (
    <Card className="mb-4">
      {listTitle && (
         <CardHeader className="pb-2 pt-4">
           <CardTitle className="text-lg">{listTitle}</CardTitle>
         </CardHeader>
      )}
      <CardContent className={`space-y-3 ${listTitle ? 'pt-2 pb-4' : 'py-4'}`}>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No tasks here.</p>
        ) : (
          tasks.map((task) => {
             // Find assignee details (you might want to pre-process this)
             const assignee = teamMembers.find(m => m.userId === task.assigned_to);
             return (
              <div key={task.id} className="flex items-center justify-between gap-4 p-3 border rounded-md hover:bg-muted/50">
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                     <span className="font-medium truncate text-sm" title={task.title}>{task.title}</span> 
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                     {getStatusBadge(task.status)}
                     {getPriorityBadge(task.priority)}
                     {task.due_date && (
                       <TooltipProvider delayDuration={100}>
                         <Tooltip>
                           <TooltipTrigger>
                             <Badge variant="outline" className="flex items-center gap-1">
                               <Calendar className="h-3 w-3" />
                               {formatDate(task.due_date)}
                             </Badge>
                           </TooltipTrigger>
                           <TooltipContent>Due Date</TooltipContent>
                         </Tooltip>
                       </TooltipProvider>
                     )}
                     {task.projects && (
                       <TooltipProvider delayDuration={100}>
                         <Tooltip>
                           <TooltipTrigger>
                             <Badge variant="secondary" className="flex items-center gap-1">
                               {task.projects.name}
                             </Badge>
                           </TooltipTrigger>
                           <TooltipContent>Project</TooltipContent>
                         </Tooltip>
                       </TooltipProvider>
                     )}
                     {showAssignee && assignee && (
                       <TooltipProvider delayDuration={100}>
                         <Tooltip>
                           <TooltipTrigger>
                             <Badge variant="outline" className="flex items-center gap-1">
                               <Avatar className="h-4 w-4 text-xs">
                                 <AvatarFallback className="text-[8px]">
                                    {getInitials(assignee.name || assignee.email || '??')}
                                  </AvatarFallback>
                               </Avatar>
                               {assignee.name || assignee.email}
                             </Badge>
                           </TooltipTrigger>
                           <TooltipContent>Assigned To</TooltipContent>
                         </Tooltip>
                       </TooltipProvider>
                     )}
                   </div>
                 </div>
                 <div className="flex-shrink-0">
                   <TaskActionMenu task={task} showReassign={true} />
                 </div>
               </div>
             );
           })
        )}
      </CardContent>
    </Card>
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
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {teamMembers
            .filter(member => typeof member.userId === 'string') 
            .map((member) => (
              <TabsTrigger 
                key={member.userId!} 
                value={member.userId!} 
                onClick={() => setSelectedMember(member.userId!)} 
              >
                {member.name || member.email}
              </TabsTrigger>
          ))}
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div>
                 {renderTaskList(unassignedTasks, false, "Unassigned Tasks")}
               </div>
               <div>
                  <Card>
                     <CardHeader>
                        <CardTitle className="text-lg">Tasks Assigned to Team</CardTitle>
                     </CardHeader>
                     <CardContent className="space-y-3 pt-2 pb-4">
                      {teamMembers.length === 0 ? (
                         <p className="text-sm text-muted-foreground text-center py-4">No team members found.</p>
                      ) : (
                         teamMembers.map(member => (
                            assignedTasks[member.userId!] && assignedTasks[member.userId!].length > 0 && (
                              <div key={member.userId} className="mb-4 last:mb-0">
                                <h3 className="font-semibold text-md mb-2 flex items-center gap-2">
                                   <Avatar className="h-6 w-6 text-xs">
                                     <AvatarFallback className="text-[10px]">
                                       {getInitials(member.name || member.email || '??')}
                                     </AvatarFallback>
                                   </Avatar>
                                   {member.name || member.email}
                                </h3>
                                {renderTaskList(assignedTasks[member.userId!])}
                              </div>
                            )
                         ))
                       )}
                       {teamMembers.every(m => !assignedTasks[m.userId!] || assignedTasks[m.userId!].length === 0) && teamMembers.length > 0 && (
                         <p className="text-sm text-muted-foreground text-center py-4">No tasks currently assigned to team members.</p>
                       )}
                     </CardContent>
                  </Card>
               </div>
            </div>
          )}
        </TabsContent>

        {/* Individual Member Tabs (optional, can be removed) */} 
        {teamMembers
          .filter(member => typeof member.userId === 'string')
          .map((member) => (
            <TabsContent key={`${member.userId!}-content`} value={member.userId!}>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                renderTaskList(assignedTasks[member.userId!] || [], false, `Tasks for ${member.name || member.email}`)
              )}
            </TabsContent>
        ))}

      </Tabs>

      {/* Render the unified View/Edit Modal */}
      <TodoViewModal 
        todoId={viewingTodoId || editingTodoId} // Pass either ID
        isOpen={!!viewingTodoId || !!editingTodoId} // Open if either ID is set
        onClose={() => {
          setViewingTodoId(null);
          setEditingTodoId(null);
        }}
        onSave={() => {
          // onSave callback from TodoViewModal might not be strictly needed here
          // since it already refreshes data internally. But we can keep it for consistency
          // or potentially remove it if the parent doesn't need further action.
          loadTeamData(); // Refresh data in the parent component as well
        }}
      />
    </div>
  );
} 