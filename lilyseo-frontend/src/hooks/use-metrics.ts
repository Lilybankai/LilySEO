import { useQuery } from '@tanstack/react-query';
import { TodoMetrics } from '@/types/todos';

// API functions
async function fetchTodoMetrics(projectId?: string): Promise<TodoMetrics[]> {
  const url = projectId 
    ? `/api/todos/metrics?projectId=${projectId}` 
    : '/api/todos/metrics';
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch todo metrics');
  }
  return response.json();
}

async function fetchMonthlyCompletionRate(projectId?: string): Promise<{ month: string; rate: number }[]> {
  const url = projectId 
    ? `/api/todos/metrics/completion-rate?projectId=${projectId}` 
    : '/api/todos/metrics/completion-rate';
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch completion rate');
  }
  return response.json();
}

async function fetchAverageCompletionTime(projectId?: string): Promise<{ month: string; time: number }[]> {
  const url = projectId 
    ? `/api/todos/metrics/completion-time?projectId=${projectId}` 
    : '/api/todos/metrics/completion-time';
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch completion time');
  }
  return response.json();
}

async function fetchTimeSpentStats(projectId?: string): Promise<{ month: string; time: number }[]> {
  const url = projectId 
    ? `/api/todos/metrics/time-spent?projectId=${projectId}` 
    : '/api/todos/metrics/time-spent';
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch time spent stats');
  }
  return response.json();
}

// React Query hooks with request debouncing
export function useTodoMetrics(projectId?: string) {
  return useQuery({
    queryKey: ['todo-metrics', { projectId }],
    queryFn: () => fetchTodoMetrics(projectId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useMonthlyCompletionRate(projectId?: string) {
  return useQuery({
    queryKey: ['completion-rate', { projectId }],
    queryFn: () => fetchMonthlyCompletionRate(projectId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useAverageCompletionTime(projectId?: string) {
  return useQuery({
    queryKey: ['completion-time', { projectId }],
    queryFn: () => fetchAverageCompletionTime(projectId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useTimeSpentStats(projectId?: string) {
  return useQuery({
    queryKey: ['time-spent', { projectId }],
    queryFn: () => fetchTimeSpentStats(projectId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Combined metrics hook for dashboard
export function useDashboardMetrics(projectId?: string) {
  const metrics = useTodoMetrics(projectId);
  const completionRate = useMonthlyCompletionRate(projectId);
  const completionTime = useAverageCompletionTime(projectId);
  const timeSpent = useTimeSpentStats(projectId);
  
  const isLoading = 
    metrics.isLoading || 
    completionRate.isLoading || 
    completionTime.isLoading || 
    timeSpent.isLoading;
    
  const error = 
    metrics.error || 
    completionRate.error || 
    completionTime.error || 
    timeSpent.error;
  
  return {
    metrics: metrics.data,
    completionRate: completionRate.data,
    completionTime: completionTime.data,
    timeSpent: timeSpent.data,
    isLoading,
    error,
  };
} 