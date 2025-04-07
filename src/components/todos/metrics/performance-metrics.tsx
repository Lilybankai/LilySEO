"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp, CheckCircle, Clock, Brain, Sparkles, Timer } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { TodoMetrics as TodoMetricsType } from '@/types/todos';
import { addMonths, format } from 'date-fns';

// Mock metrics data with values from the specifications
const mockMetricsData: TodoMetricsType[] = [
  {
    id: '1',
    projectId: 'project1',
    userId: 'user1',
    month: new Date().toISOString(),
    todosCreated: 24,
    todosCompleted: 18,
    averageCompletionTime: 7200, // 2 hours in seconds
    totalTimeSpent: 129600, // 36 hours in seconds
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    projectId: 'project1',
    userId: 'user1',
    month: addMonths(new Date(), -1).toISOString(),
    todosCreated: 32,
    todosCompleted: 28,
    averageCompletionTime: 10800, // 3 hours in seconds
    totalTimeSpent: 302400, // 84 hours in seconds
    createdAt: addMonths(new Date(), -1).toISOString(),
    updatedAt: addMonths(new Date(), -1).toISOString(),
  },
];

interface PerformanceMetricsProps {
  projectId: string | null;
  searchTerm?: string;
}

// Helper function to format time in hours
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  
  if (hours === 1) {
    return `${hours} hour`;
  } 
  return `${hours} hours`;
};

export function PerformanceMetrics({ projectId, searchTerm = "" }: PerformanceMetricsProps) {
  // For this implementation, we'll use the mock data directly
  // This would be replaced with the real API fetching in production
  const currentMetrics = mockMetricsData[0];
  const previousMetrics = mockMetricsData[1];
  
  // Calculate key metrics
  const completionRate = Math.round((currentMetrics.todosCompleted / currentMetrics.todosCreated) * 100);
  const previousCompletionRate = Math.round((previousMetrics.todosCompleted / previousMetrics.todosCreated) * 100);
  const completionRateChange = completionRate - previousCompletionRate;
  const isCompletionRatePositive = completionRateChange >= 0;
  
  const completedTasksChange = Math.round(((currentMetrics.todosCompleted - previousMetrics.todosCompleted) / previousMetrics.todosCompleted) * 100);
  const isCompletedTasksPositive = completedTasksChange >= 0;
  
  const avgCompletionTimeChange = Math.round(((currentMetrics.averageCompletionTime - previousMetrics.averageCompletionTime) / previousMetrics.averageCompletionTime) * 100);
  const isAvgTimePositive = avgCompletionTimeChange <= 0; // Decrease in time is positive
  
  const totalTimeSpentChange = Math.round(((currentMetrics.totalTimeSpent - previousMetrics.totalTimeSpent) / previousMetrics.totalTimeSpent) * 100);
  const isTotalTimePositive = totalTimeSpentChange >= 0;
  
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Completion Rate */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                Completion Rate
              </CardTitle>
            </div>
            <CardDescription>
              Tasks completed vs. created
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold mb-3">
                {completionRate}%
              </div>
              <span className={`text-sm font-medium ${isCompletionRatePositive ? 'text-green-500' : 'text-red-500'}`}>
                {isCompletionRatePositive ? (
                  <span className="flex items-center">
                    +{Math.abs(completionRateChange)}% <ArrowUp className="ml-1 h-4 w-4" />
                  </span>
                ) : (
                  <span className="flex items-center">
                    -{Math.abs(completionRateChange)}% <ArrowDown className="ml-1 h-4 w-4" />
                  </span>
                )}
              </span>
            </div>
            <Progress value={completionRate} className="h-2" />
            <div className="mt-2 text-xs text-muted-foreground">
              {currentMetrics.todosCompleted} of {currentMetrics.todosCreated} tasks
            </div>
          </CardContent>
        </Card>
        
        {/* Completed Tasks */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                Completed Tasks
              </CardTitle>
            </div>
            <CardDescription>
              Tasks completed this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold mb-3">
                {currentMetrics.todosCompleted}
              </div>
              <span className={`text-sm font-medium ${isCompletedTasksPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isCompletedTasksPositive ? (
                  <span className="flex items-center">
                    +{Math.abs(completedTasksChange)}% <ArrowUp className="ml-1 h-4 w-4" />
                  </span>
                ) : (
                  <span className="flex items-center">
                    -{Math.abs(completedTasksChange)}% <ArrowDown className="ml-1 h-4 w-4" />
                  </span>
                )}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Previous: {previousMetrics.todosCompleted}
            </div>
          </CardContent>
        </Card>
        
        {/* Average Completion Time */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                Avg. Completion Time
              </CardTitle>
            </div>
            <CardDescription>
              Average time to complete a task
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold mb-3">
                {formatTime(currentMetrics.averageCompletionTime)}
              </div>
              <span className={`text-sm font-medium ${isAvgTimePositive ? 'text-green-500' : 'text-red-500'}`}>
                {isAvgTimePositive ? (
                  <span className="flex items-center">
                    {Math.abs(avgCompletionTimeChange)}% <ArrowDown className="ml-1 h-4 w-4" />
                  </span>
                ) : (
                  <span className="flex items-center">
                    +{Math.abs(avgCompletionTimeChange)}% <ArrowUp className="ml-1 h-4 w-4" />
                  </span>
                )}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Previous: {formatTime(previousMetrics.averageCompletionTime)}
            </div>
          </CardContent>
        </Card>
        
        {/* Total Time Spent */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center">
                <Timer className="mr-2 h-4 w-4 text-muted-foreground" />
                Total Time Spent
              </CardTitle>
            </div>
            <CardDescription>
              Total time tracked this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold mb-3">
                {formatTime(currentMetrics.totalTimeSpent)}
              </div>
              <span className={`text-sm font-medium ${isTotalTimePositive ? 'text-green-500' : 'text-red-500'}`}>
                {isTotalTimePositive ? (
                  <span className="flex items-center">
                    +{Math.abs(totalTimeSpentChange)}% <ArrowUp className="ml-1 h-4 w-4" />
                  </span>
                ) : (
                  <span className="flex items-center">
                    -{Math.abs(totalTimeSpentChange)}% <ArrowDown className="ml-1 h-4 w-4" />
                  </span>
                )}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Previous: {formatTime(previousMetrics.totalTimeSpent)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-primary" />
            Performance Insights
          </CardTitle>
          <CardDescription>
            AI-powered analysis of your task performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-base font-medium">Productivity Analysis</h3>
              <p className="text-sm text-muted-foreground">
                You're making good progress with task completion. Consider scheduling dedicated focus time to improve further.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-base font-medium">Time Management</h3>
              <p className="text-sm text-muted-foreground">
                Your average task completion time has improved compared to last month. Your efficiency is increasing!
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-base font-medium">Recommended Actions</h3>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                <li>Schedule regular time blocks dedicated to high-priority tasks</li>
                <li>Break down complex SEO tasks into smaller, actionable items</li>
                <li>Review completed tasks to identify patterns and optimize workflows</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 