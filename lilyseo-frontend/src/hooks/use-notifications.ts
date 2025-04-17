import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Notification {
  id: string;
  userId: string;
  type: string;
  content: string;
  metadata?: any;
  read: boolean;
  createdAt: string;
}

// API functions
async function fetchNotifications(): Promise<Notification[]> {
  const response = await fetch('/api/notifications');
  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }
  return response.json();
}

async function fetchUnreadCount(): Promise<{ count: number }> {
  const response = await fetch('/api/notifications/unread-count');
  if (!response.ok) {
    throw new Error('Failed to fetch unread count');
  }
  return response.json();
}

// React Query hooks
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  });
}

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: fetchUnreadCount,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
    onMutate: async (notificationId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      await queryClient.cancelQueries({ queryKey: ['notifications-unread-count'] });
      
      // Snapshot the previous values
      const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications']);
      const previousCount = queryClient.getQueryData<{ count: number }>(['notifications-unread-count']);
      
      // Optimistically update
      if (previousNotifications) {
        queryClient.setQueryData(['notifications'], 
          previousNotifications.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true } 
              : notification
          )
        );
      }
      
      if (previousCount && previousCount.count > 0) {
        queryClient.setQueryData(['notifications-unread-count'], { 
          count: previousCount.count - 1 
        });
      }
      
      return { previousNotifications, previousCount };
    },
    onError: (err, notificationId, context) => {
      // Revert on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(['notifications-unread-count'], context.previousCount);
      }
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      await queryClient.cancelQueries({ queryKey: ['notifications-unread-count'] });
      
      // Snapshot the previous values
      const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications']);
      
      // Optimistically update
      if (previousNotifications) {
        queryClient.setQueryData(['notifications'], 
          previousNotifications.map(notification => ({ ...notification, read: true }))
        );
      }
      
      queryClient.setQueryData(['notifications-unread-count'], { count: 0 });
      
      return { previousNotifications };
    },
    onError: (err, variables, context) => {
      // Revert on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
        
        // Recalculate unread count
        const unreadCount = context.previousNotifications.filter(n => !n.read).length;
        queryClient.setQueryData(['notifications-unread-count'], { count: unreadCount });
      }
    },
  });
} 