"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, Mail, Shield, Clock, CheckCircle, XCircle, User, AlertCircle, Loader2, Eye } from 'lucide-react';
import { TeamMember, TeamMemberPermission, TeamMemberStatus } from '@/types/todos';
import { toast } from 'sonner';

// Mock team members data
const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    teamOwnerId: 'owner1',
    userId: 'user1',
    email: 'user1@example.com',
    name: 'Jane Smith',
    permissions: 'admin',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    teamOwnerId: 'owner1',
    userId: 'user2',
    email: 'user2@example.com',
    name: 'John Doe',
    permissions: 'member',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    teamOwnerId: 'owner1',
    userId: '',
    email: 'pending@example.com',
    name: 'Alex Johnson',
    permissions: 'viewer',
    status: 'pending',
    inviteToken: 'token123',
    inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock subscription info
const mockSubscription = {
  tier: 'pro',
  teamMemberLimit: 5,
};

export function TeamManagementPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitePermission, setInvitePermission] = useState<TeamMemberPermission>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the count of active and pending members
  const memberCount = teamMembers.length;
  const pendingCount = teamMembers.filter(member => member.status === 'pending').length;
  const activeCount = teamMembers.filter(member => member.status === 'active').length;

  // Display status badge with appropriate color
  const getStatusBadge = (status: TeamMemberStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Pending</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Inactive</Badge>;
      default:
        return null;
    }
  };

  // Display permission badge with appropriate color
  const getPermissionBadge = (permission: TeamMemberPermission) => {
    switch (permission) {
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Admin</Badge>;
      case 'member':
        return <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">Member</Badge>;
      case 'viewer':
        return <Badge className="bg-violet-100 text-violet-800 hover:bg-violet-200">Viewer</Badge>;
      default:
        return null;
    }
  };

  // Handle invite submission
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // In a real implementation, you would send the invitation via API
      // For now, we'll just add it to our mock data
      const newTeamMember: TeamMember = {
        id: `new-${Date.now()}`,
        teamOwnerId: 'owner1',
        userId: '',
        email: inviteEmail,
        name: inviteName,
        permissions: invitePermission,
        status: 'pending',
        inviteToken: `token-${Date.now()}`,
        inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Update state with new team member
      setTeamMembers([...teamMembers, newTeamMember]);
      
      // Reset form and close dialog
      setInviteEmail('');
      setInviteName('');
      setInvitePermission('member');
      setIsInviteDialogOpen(false);
      
      toast.success(`Invitation sent to ${inviteEmail}`);
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle member removal
  const handleRemoveMember = (memberId: string) => {
    // In a real implementation, you would call the API to remove the member
    setTeamMembers(teamMembers.filter(member => member.id !== memberId));
    toast.success('Team member removed');
  };

  // Handle resending invitation
  const handleResendInvite = (memberId: string) => {
    // In a real implementation, you would call the API to resend the invitation
    toast.success('Invitation resent');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">
            Manage your team members and their permissions
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {memberCount} of {mockSubscription.teamMemberLimit} team members
          </span>
          <Button 
            onClick={() => setIsInviteDialogOpen(true)}
            disabled={memberCount >= mockSubscription.teamMemberLimit}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Team Member
          </Button>
        </div>
      </div>
      
      {/* Team member limit warning */}
      {memberCount >= mockSubscription.teamMemberLimit && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h3 className="font-medium">Team member limit reached</h3>
                <p className="text-sm text-muted-foreground">
                  You've reached the team member limit for your current subscription tier.
                  Upgrade to add more team members.
                </p>
                <Button variant="outline" className="mt-2" size="sm">
                  View Subscription Options
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Team members list */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({memberCount})</CardTitle>
          <CardDescription>
            Manage your team members and their access levels
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div 
                key={member.id} 
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3 mb-3 sm:mb-0">
                  <Avatar>
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {member.email}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(member.status)}
                      {getPermissionBadge(member.permissions)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {member.status === 'pending' ? (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleResendInvite(member.id)}
                      >
                        <Mail className="mr-1 h-3 w-3" />
                        Resend
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <XCircle className="mr-1 h-3 w-3" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Select defaultValue={member.permissions}>
                        <SelectTrigger className="w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <XCircle className="mr-1 h-3 w-3" />
                        Remove
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
            
            {teamMembers.length === 0 && (
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No team members yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Invite team members to collaborate on your SEO projects.
                </p>
                <Button onClick={() => setIsInviteDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Team Member
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Permissions explanation */}
      <Card>
        <CardHeader>
          <CardTitle>Team Permissions</CardTitle>
          <CardDescription>
            Understanding different access levels for team members
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-medium">Admin</h3>
                <p className="text-sm text-muted-foreground">
                  Full access to all projects, can manage team members, and can modify settings.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-indigo-500 mt-0.5" />
              <div>
                <h3 className="font-medium">Member</h3>
                <p className="text-sm text-muted-foreground">
                  Can create and edit projects, run audits, and manage todos.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-violet-500 mt-0.5" />
              <div>
                <h3 className="font-medium">Viewer</h3>
                <p className="text-sm text-muted-foreground">
                  Can view projects and audits but cannot make changes.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Invite dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your team. They'll receive an email with instructions.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleInvite}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="permission">Permission Level</Label>
                <Select
                  value={invitePermission}
                  onValueChange={(value) => setInvitePermission(value as TeamMemberPermission)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 