import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TeamMember } from '@/types/todos';

// API functions
async function fetchTeamMembers(): Promise<TeamMember[]> {
  const response = await fetch('/api/team/members');
  if (!response.ok) {
    throw new Error('Failed to fetch team members');
  }
  return response.json();
}

async function fetchTeamMemberById(id: string): Promise<TeamMember> {
  const response = await fetch(`/api/team/members/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch team member');
  }
  return response.json();
}

// React Query hooks
export function useTeamMembers() {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: fetchTeamMembers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTeamMemberById(id: string) {
  return useQuery({
    queryKey: ['team-member', id],
    queryFn: () => fetchTeamMemberById(id),
    enabled: !!id,
  });
}

export function useCreateTeamMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (memberData: Partial<TeamMember>) => {
      const response = await fetch('/api/team/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create team member');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      memberId, 
      memberData 
    }: { 
      memberId: string; 
      memberData: Partial<TeamMember>;
    }) => {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update team member');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['team-member', variables.memberId] });
    },
  });
}

export function useDeleteTeamMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (memberId: string) => {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete team member');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}

export function useResendInvitation() {
  return useMutation({
    mutationFn: async (memberId: string) => {
      const response = await fetch('/api/team/invitations/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to resend invitation');
      }
      
      return response.json();
    },
  });
}

// Optimistic updates for immediate UI feedback
export function useOptimisticUpdateTeamMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      memberId, 
      memberData 
    }: { 
      memberId: string; 
      memberData: Partial<TeamMember>;
    }) => {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update team member');
      }
      
      return response.json();
    },
    onMutate: async ({ memberId, memberData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['team-members'] });
      await queryClient.cancelQueries({ queryKey: ['team-member', memberId] });
      
      // Snapshot the previous value
      const previousMembers = queryClient.getQueryData<TeamMember[]>(['team-members']);
      const previousMember = queryClient.getQueryData<TeamMember>(['team-member', memberId]);
      
      // Optimistically update to the new value
      if (previousMembers) {
        queryClient.setQueryData(['team-members'], 
          previousMembers.map(member => 
            member.id === memberId ? { ...member, ...memberData } : member
          )
        );
      }
      
      if (previousMember) {
        queryClient.setQueryData(['team-member', memberId], {
          ...previousMember,
          ...memberData,
        });
      }
      
      return { previousMembers, previousMember };
    },
    onError: (err, { memberId }, context) => {
      // If the mutation fails, revert back to the previous values
      if (context?.previousMembers) {
        queryClient.setQueryData(['team-members'], context.previousMembers);
      }
      if (context?.previousMember) {
        queryClient.setQueryData(['team-member', memberId], context.previousMember);
      }
    },
    onSettled: (data, error, { memberId }) => {
      // Refetch to ensure cache is consistent with server state
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['team-member', memberId] });
    },
  });
} 