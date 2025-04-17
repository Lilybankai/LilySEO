"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar'; // Removed AvatarImage as not used here
import { UserPlus, Mail, Shield, Clock, CheckCircle, XCircle, User, AlertCircle, Loader2, Eye, Trash2, Send, Edit } from 'lucide-react';
import { TeamMember, TeamMemberPermission, TeamMemberStatus } from '@/types/todos'; // Assuming types are correctly defined here
import { toast } from 'sonner';
import { 
  getTeamMembers, 
  inviteTeamMember, 
  resendInvitation, 
  removeTeamMember, 
  updateTeamMemberPermissions, 
  getTeamMemberLimit 
} from '@/services/team-management';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define permissions array for dropdown
const permissions: TeamMemberPermission[] = ['admin', 'member', 'viewer'];

// Define props interface
interface TeamManagementSettingsProps {
  setActiveSection: (key: string) => void;
}

export function TeamManagementSettings({ setActiveSection }: TeamManagementSettingsProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [subscriptionLimit, setSubscriptionLimit] = useState<{ tier: string; teamMemberLimit: number }>({ tier: 'free', teamMemberLimit: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite Dialog State
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitePermission, setInvitePermission] = useState<TeamMemberPermission>('member');
  const [isInviting, setIsInviting] = useState(false);

  // Edit Dialog State
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editPermission, setEditPermission] = useState<TeamMemberPermission>('member');
  const [isUpdatingPermission, setIsUpdatingPermission] = useState(false);

  // General Action State
  const [isRemoving, setIsRemoving] = useState<string | null>(null); // Store ID of member being removed
  const [isResending, setIsResending] = useState<string | null>(null); // Store ID of invite being resent

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [members, limitInfo] = await Promise.all([
        getTeamMembers(),
        getTeamMemberLimit()
      ]);
      setTeamMembers(members);
      setSubscriptionLimit(limitInfo);
    } catch (err) {
      console.error("Failed to fetch team data:", err);
      setError("Could not load team members or subscription limits. Please try again.");
      toast.error("Could not load team data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived counts
  const memberCount = teamMembers.length;
  const canInviteMore = subscriptionLimit.teamMemberLimit === -1 || memberCount < subscriptionLimit.teamMemberLimit;

  // UI Helpers
  const getStatusBadge = (status: TeamMemberStatus) => {
    switch (status) {
      case 'active': return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Active</Badge>; 
      case 'pending': return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">Pending</Badge>;
      case 'inactive': return <Badge variant="outline">Inactive</Badge>;
      default: return null;
    }
  };

  const getPermissionBadge = (permission: TeamMemberPermission) => {
    switch (permission) {
      case 'admin': return <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">Admin</Badge>; 
      case 'member': return <Badge variant="secondary">Member</Badge>;
      case 'viewer': return <Badge variant="outline">Viewer</Badge>;
      default: return null;
    }
  };

  // Handlers
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canInviteMore) {
      toast.error("Team member limit reached. Please upgrade your plan.");
      return;
    }
    setIsInviting(true);
    const result = await inviteTeamMember(inviteEmail, inviteName, invitePermission);
    setIsInviting(false);

    if (result.success && result.teamMember) {
      setTeamMembers([...teamMembers, result.teamMember]);
      setInviteEmail('');
      setInviteName('');
      setInvitePermission('member');
      setIsInviteDialogOpen(false);
      toast.success(`Invitation sent to ${inviteEmail}`);
    } else {
      toast.error(result.error || 'Failed to send invitation.');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the team? This action cannot be undone.`)) {
      return;
    }
    setIsRemoving(memberId);
    const result = await removeTeamMember(memberId);
    setIsRemoving(null);

    if (result.success) {
      setTeamMembers(teamMembers.filter(member => member.id !== memberId));
      toast.success(`${memberName} removed from the team.`);
    } else {
      toast.error(result.error || 'Failed to remove team member.');
    }
  };

  const handleResendInvite = async (memberId: string, email: string) => {
    setIsResending(memberId);
    const result = await resendInvitation(memberId);
    setIsResending(null);

    if (result.success) {
      toast.success(`Invitation resent to ${email}`);
    } else {
      toast.error(result.error || 'Failed to resend invitation.');
    }
  };

  const openEditDialog = (member: TeamMember) => {
    setEditingMember(member);
    setEditPermission(member.permissions);
  };

  const handleUpdatePermission = async () => {
    if (!editingMember) return;
    
    setIsUpdatingPermission(true);
    const result = await updateTeamMemberPermissions(editingMember.id, editPermission);
    setIsUpdatingPermission(false);

    if (result.success && result.teamMember) {
      setTeamMembers(teamMembers.map(m => m.id === result.teamMember!.id ? result.teamMember! : m));
      setEditingMember(null); // Close dialog on success
      toast.success(`Permissions updated for ${result.teamMember.name}`);
    } else {
      toast.error(result.error || 'Failed to update permissions.');
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
           <Skeleton className="h-10 w-1/3" />
           <Skeleton className="h-10 w-48" />
        </div>
         <Skeleton className="h-16 w-full" /> 
        <Card>
          <CardHeader>
             <Skeleton className="h-6 w-1/4 mb-2" />
             <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
                 <div className="flex items-center gap-3">
                   <Skeleton className="h-10 w-10 rounded-full" />
                   <div className="space-y-1">
                     <Skeleton className="h-4 w-24" />
                     <Skeleton className="h-3 w-32" />
                   </div>
                 </div>
                 <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
       <Alert variant="destructive">
         <AlertCircle className="h-4 w-4" />
         <AlertTitle>Error Loading Team</AlertTitle>
         <AlertDescription>{error}</AlertDescription>
       </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Invite Button */} 
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <CardDescription>
           You have {memberCount} team member{memberCount !== 1 ? 's' : ''}.
           {subscriptionLimit.teamMemberLimit !== -1 && 
            ` Your plan allows up to ${subscriptionLimit.teamMemberLimit}.`
           }
        </CardDescription>
        
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
             <Button 
               onClick={() => setIsInviteDialogOpen(true)}
               disabled={!canInviteMore}
             >
               <UserPlus className="mr-2 h-4 w-4" />
               Invite Team Member
             </Button>
          </DialogTrigger>
          {/* Invite Dialog Content */} 
          <DialogContent>
            <form onSubmit={handleInvite}>
              <DialogHeader>
                <DialogTitle>Invite New Team Member</DialogTitle>
                <DialogDescription>
                  Enter the details of the person you want to invite.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-name">Name</Label>
                  <Input 
                    id="invite-name" 
                    value={inviteName} 
                    onChange={(e) => setInviteName(e.target.value)} 
                    placeholder="Jane Doe"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email address</Label>
                  <Input 
                    id="invite-email" 
                    type="email" 
                    value={inviteEmail} 
                    onChange={(e) => setInviteEmail(e.target.value)} 
                    placeholder="name@example.com" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-permission">Permission Level</Label>
                   <Select value={invitePermission} onValueChange={(value) => setInvitePermission(value as TeamMemberPermission)} required>
                     <SelectTrigger id="invite-permission">
                       <SelectValue placeholder="Select permission" />
                     </SelectTrigger>
                     <SelectContent>
                       {permissions.map(p => (
                         <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)} disabled={isInviting}>Cancel</Button>
                <Button type="submit" disabled={isInviting || !inviteEmail || !inviteName}>
                  {isInviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Send Invitation
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Limit Warning */} 
      {!canInviteMore && (
        <Alert variant="default" className="border-yellow-500/50 text-yellow-700 dark:border-yellow-500 [&>svg]:text-yellow-700">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Team Member Limit Reached</AlertTitle>
          <AlertDescription>
            You have reached the member limit for your '{subscriptionLimit.tier}' plan.
            Please upgrade your plan to invite more members.
            <Button variant="link" className="p-0 h-auto ml-1 text-yellow-700 hover:text-yellow-800" onClick={() => setActiveSection('subscription')}>Upgrade Plan</Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Team Members List */} 
      <Card>
        <CardHeader>
          <CardTitle>Manage Members</CardTitle>
          <CardDescription>View and manage your team members and their permissions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No team members yet. Invite your first member!</p>
            )}
            {teamMembers.map((member) => (
              <div 
                key={member.id} 
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg gap-4"
              >
                <div className="flex items-center gap-3 flex-grow min-w-0">
                  <Avatar className="flex-shrink-0">
                    {/* Assuming no avatar URL for now */} 
                    <AvatarFallback>{member.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-medium truncate" title={member.name}>{member.name || 'Invited User'}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1 truncate" title={member.email}>
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span>{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {getStatusBadge(member.status)}
                      {getPermissionBadge(member.permissions)}
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */} 
                <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
                  {member.status === 'pending' ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleResendInvite(member.id, member.email)}
                      disabled={isResending === member.id}
                    >
                      {isResending === member.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Mail className="mr-1 h-3 w-3" />}
                      Resend
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(member)}
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                  )}
                  
                  {/* TODO: Prevent owner from removing themselves? Needs check against current userId */} 
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleRemoveMember(member.id, member.name || member.email)}
                    disabled={isRemoving === member.id}
                  >
                    {isRemoving === member.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Trash2 className="mr-1 h-3 w-3" />}
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

       {/* Edit Member Dialog */} 
       <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Edit Permissions for {editingMember?.name || editingMember?.email}</DialogTitle>
             <DialogDescription>
               Change the permission level for this team member.
             </DialogDescription>
           </DialogHeader>
           <div className="py-4">
             <Label htmlFor="edit-permission">Permission Level</Label>
             <Select value={editPermission} onValueChange={(value) => setEditPermission(value as TeamMemberPermission)} required>
               <SelectTrigger id="edit-permission">
                 <SelectValue placeholder="Select permission" />
               </SelectTrigger>
               <SelectContent>
                 {permissions.map(p => (
                   <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
           <DialogFooter>
             <Button type="button" variant="outline" onClick={() => setEditingMember(null)} disabled={isUpdatingPermission}>Cancel</Button>
             <Button onClick={handleUpdatePermission} disabled={isUpdatingPermission || editPermission === editingMember?.permissions}>
               {isUpdatingPermission ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
               Update Permissions
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

    </div>
  );
} 