"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Todo } from '@/types/todos';
import { BarChart, PieChart, TrendingUp, Layers } from 'lucide-react';
import { useTodos } from '@/hooks/use-todos';
import { Skeleton } from '@/components/ui/skeleton';

// Chart components (optional - using simple styled components for now)
import {
  SimpleAreaChartProps,
  SimpleAreaChart,
  SimpleBarChart,
  BarList as ChartBarList
} from './chart-components';

interface CategoryMetricsProps {
  projectId: string | null;
  searchTerm?: string;
}

// Helper function to get color for progress
function getColorForProgress(progress: number): string {
  if (progress < 25) return 'bg-red-500';
  if (progress < 50) return 'bg-amber-500';
  if (progress < 75) return 'bg-blue-500';
  return 'bg-green-500';
}

export function CategoryMetrics({ projectId, searchTerm = "" }: CategoryMetricsProps) {
  // Fetch todos data using the same query as other components
  const { data: todos, isLoading, error } = useTodos(projectId || undefined, searchTerm);
  
  // Calculate metrics by category
  const categoryMetrics = useMemo(() => {
    if (!todos) return {};
    
    const metrics: Record<string, { total: number; completed: number }> = {};
    
    // Use auditId field as the category (could also use a dedicated category field)
    todos.forEach(todo => {
      const category = todo.auditId || 'General';
      
      if (!metrics[category]) {
        metrics[category] = { total: 0, completed: 0 };
      }
      
      metrics[category].total += 1;
      if (todo.status === 'completed') {
        metrics[category].completed += 1;
      }
    });
    
    return metrics;
  }, [todos]);
  
  // Calculate metrics by priority
  const priorityMetrics = useMemo(() => {
    if (!todos) return {};
    
    const metrics: Record<string, { total: number; completed: number }> = {
      critical: { total: 0, completed: 0 },
      high: { total: 0, completed: 0 },
      medium: { total: 0, completed: 0 },
      low: { total: 0, completed: 0 },
    };
    
    // Count total and completed todos by priority
    todos.forEach(todo => {
      metrics[todo.priority].total += 1;
      if (todo.status === 'completed') {
        metrics[todo.priority].completed += 1;
      }
    });
    
    return metrics;
  }, [todos]);
  
  // Prepare bar chart data
  const chartData = useMemo(() => {
    return Object.entries(categoryMetrics).map(([category, data]) => {
      const completionRate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
      return {
        name: category,
        value: completionRate,
        color: getColorForProgress(completionRate),
      };
    }).sort((a, b) => b.value - a.value);
  }, [categoryMetrics]);
  
  // Prepare priority chart data
  const priorityChartData = useMemo(() => {
    return Object.entries(priorityMetrics).map(([priority, data]) => {
      const completionRate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
      
      // Priority-specific colors
      let color = '';
      switch (priority) {
        case 'critical': color = '#ef4444'; break; // red-500
        case 'high': color = '#f59e0b'; break; // amber-500
        case 'medium': color = '#3b82f6'; break; // blue-500
        case 'low': color = '#22c55e'; break; // green-500
        default: color = '#6b7280'; // gray-500
      }
      
      return {
        name: priority.charAt(0).toUpperCase() + priority.slice(1),
        value: completionRate,
        color,
        total: data.total,
        completed: data.completed,
      };
    }).sort((a, b) => {
      // Sort by priority (critical first, then high, etc.)
      const priorityOrder: Record<string, number> = { 'Critical': 3, 'High': 2, 'Medium': 1, 'Low': 0 };
      return priorityOrder[b.name] - priorityOrder[a.name];
    });
  }, [priorityMetrics]);
  
  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Skeleton className="h-6 w-36" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-64" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Metrics</CardTitle>
          <CardDescription>
            Task completion by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64 text-destructive">
            Error loading metrics data
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" />
            Completion by Category
          </CardTitle>
        </div>
        <CardDescription>
          Task completion rates across different categories and priorities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="category" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="category">By Category</TabsTrigger>
            <TabsTrigger value="priority">By Priority</TabsTrigger>
          </TabsList>
          
          <TabsContent value="category" className="space-y-4">
            {chartData.length > 0 ? (
              <div className="space-y-4">
                <div className="grid gap-4">
                  {chartData.map(item => (
                    <div key={item.name} className="space-y-2">
                      <div className="flex justify-between">
                        <div className="text-sm font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.value}%</div>
                      </div>
                      <Progress 
                        value={item.value} 
                        className="h-2"
                        indicatorClassName={getColorForProgress(item.value)}
                      />
                      <div className="text-xs text-muted-foreground">
                        {categoryMetrics[item.name].completed} of {categoryMetrics[item.name].total} tasks
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Simple bar chart */}
                <div className="mt-6 pt-4 border-t">
                  <h3 className="text-sm font-medium mb-2">Completion Rate (%)</h3>
                  <div className="relative h-32">
                    <ChartBarList data={chartData} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-32 text-muted-foreground">
                No category data available
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="priority" className="space-y-4">
            <div className="space-y-4">
              {priorityChartData.map(item => (
                <div key={item.name} className="space-y-2">
                  <div className="flex justify-between">
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">{item.value}%</div>
                  </div>
                  <Progress 
                    value={item.value} 
                    className="h-2" 
                    indicatorClassName={`bg-[${item.color}]`}
                  />
                  <div className="text-xs text-muted-foreground">
                    {item.completed} of {item.total} tasks
                  </div>
                </div>
              ))}
            </div>
            
            {/* Priority insights */}
            <div className="mt-6 pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Priority Insights</h3>
              <div className="text-sm text-muted-foreground">
                {priorityChartData.some(item => item.name === 'Critical' && item.value < 50) ? (
                  <p className="text-amber-600 mb-2">
                    <strong>❗ Critical tasks need attention.</strong> Only {priorityMetrics.critical.completed} of {priorityMetrics.critical.total} critical tasks are completed.
                  </p>
                ) : null}
                
                {priorityChartData.some(item => item.name === 'High' && item.value < 30) ? (
                  <p className="mb-2">
                    Focus on high priority items to improve overall project health.
                  </p>
                ) : null}
                
                {priorityChartData.some(item => item.name === 'Low' && item.value > 80) ? (
                  <p className="text-green-600 mb-2">
                    Good progress on low priority tasks. Consider reallocating resources to higher priorities.
                  </p>
                ) : null}
                
                {priorityChartData.every(item => item.value > 75) ? (
                  <p className="text-green-600 mb-2">
                    Excellent progress across all priority levels! Your team is performing well.
                  </p>
                ) : null}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 