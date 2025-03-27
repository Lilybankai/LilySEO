"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TodoMetrics as TodoMetricsType } from '@/types/todos';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, CheckCircle, Clock, Calendar, BrainCircuit } from 'lucide-react';
import { addMonths, format } from 'date-fns';

// Mock metrics data
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

interface TodoMetricsProps {
  projectId: string | null;
  searchTerm?: string;
}

// Helper function to format time in hours and minutes
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours === 0) {
    return `${minutes} min`;
  } else if (minutes === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  } else {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${minutes} min`;
  }
};

export function TodoMetrics({ projectId, searchTerm = "" }: TodoMetricsProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  
  // Get metrics for the selected month
  const currentMetrics = mockMetricsData.find(
    metrics => format(new Date(metrics.month), 'yyyy-MM') === selectedMonth
  );
  
  // Get metrics for the previous month for comparison
  const previousMonthDate = addMonths(new Date(selectedMonth), -1);
  const previousMonthKey = format(previousMonthDate, 'yyyy-MM');
  const previousMetrics = mockMetricsData.find(
    metrics => format(new Date(metrics.month), 'yyyy-MM') === previousMonthKey
  );
  
  // Calculate completion rate
  const completionRate = currentMetrics ? 
    Math.round((currentMetrics.todosCompleted / currentMetrics.todosCreated) * 100) : 0;
  
  // Calculate comparison with previous month
  const calculateChange = (current: number, previous?: number): { value: number, isPositive: boolean } => {
    if (!previous) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(Math.round(change)),
      isPositive: change >= 0,
    };
  };
  
  const completionRateChange = previousMetrics ? 
    calculateChange(completionRate, Math.round((previousMetrics.todosCompleted / previousMetrics.todosCreated) * 100)) : 
    { value: 0, isPositive: true };
  
  const completedTasksChange = previousMetrics ? 
    calculateChange(currentMetrics?.todosCompleted || 0, previousMetrics.todosCompleted) :
    { value: 0, isPositive: true };
  
  const avgCompletionTimeChange = previousMetrics && currentMetrics ? 
    calculateChange(currentMetrics.averageCompletionTime, previousMetrics.averageCompletionTime) :
    { value: 0, isPositive: false }; // For completion time, lower is better
  
  const totalTimeSpentChange = previousMetrics && currentMetrics ? 
    calculateChange(currentMetrics.totalTimeSpent, previousMetrics.totalTimeSpent) :
    { value: 0, isPositive: true };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Todo Metrics</h2>
          <p className="text-muted-foreground">
            Track your task progress and performance
          </p>
        </div>
        
        <div className="w-full sm:w-48">
          <Label htmlFor="month-select">Month</Label>
          <Select 
            value={selectedMonth} 
            onValueChange={setSelectedMonth}
          >
            <SelectTrigger id="month-select">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {mockMetricsData.map((metrics, index) => (
                <SelectItem 
                  key={index} 
                  value={format(new Date(metrics.month), 'yyyy-MM')}
                >
                  {format(new Date(metrics.month), 'MMMM yyyy')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Completion Rate Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>
              Tasks completed vs. created
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{completionRate}%</div>
            <Progress value={completionRate} className="h-2" />
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-muted-foreground">
                {currentMetrics?.todosCompleted || 0} of {currentMetrics?.todosCreated || 0} tasks
              </span>
              <span className={completionRateChange.isPositive ? "text-green-600" : "text-red-600"}>
                {completionRateChange.isPositive ? "+" : "-"}{completionRateChange.value}%
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* Completed Tasks Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>
              Tasks completed this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-3">
              {currentMetrics?.todosCompleted || 0}
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                Previous: {previousMetrics?.todosCompleted || 0}
              </span>
              <span className={completedTasksChange.isPositive ? "text-green-600" : "text-red-600"}>
                {completedTasksChange.isPositive ? "+" : "-"}{completedTasksChange.value}%
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* Average Completion Time Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>
              Average time to complete a task
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-3">
              {formatTime(currentMetrics?.averageCompletionTime || 0)}
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                Previous: {formatTime(previousMetrics?.averageCompletionTime || 0)}
              </span>
              <span className={!avgCompletionTimeChange.isPositive ? "text-green-600" : "text-red-600"}>
                {avgCompletionTimeChange.isPositive ? "+" : "-"}{avgCompletionTimeChange.value}%
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* Total Time Spent Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Time Spent</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>
              Total time tracked this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-3">
              {formatTime(currentMetrics?.totalTimeSpent || 0)}
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                Previous: {formatTime(previousMetrics?.totalTimeSpent || 0)}
              </span>
              <span className={totalTimeSpentChange.isPositive ? "text-green-600" : "text-red-600"}>
                {totalTimeSpentChange.isPositive ? "+" : "-"}{totalTimeSpentChange.value}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Additional metrics insights */}
      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary" />
            <CardTitle>Performance Insights</CardTitle>
          </div>
          <CardDescription>
            AI-powered analysis of your task performance
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-4">
            <div className="bg-muted/40 p-4 rounded-md">
              <h3 className="font-medium mb-2">Productivity Analysis</h3>
              <p className="text-sm text-muted-foreground">
                {completionRate > 75 
                  ? "Great job! Your task completion rate is excellent this month. Keep up the good work!"
                  : completionRate > 50
                  ? "You're making good progress with task completion. Consider scheduling dedicated focus time to improve further."
                  : "Your task completion rate could use improvement. Try breaking down large tasks into smaller, manageable pieces."}
              </p>
            </div>
            
            <div className="bg-muted/40 p-4 rounded-md">
              <h3 className="font-medium mb-2">Time Management</h3>
              <p className="text-sm text-muted-foreground">
                {currentMetrics && previousMetrics && currentMetrics.averageCompletionTime < previousMetrics.averageCompletionTime
                  ? "Your average task completion time has improved compared to last month. Your efficiency is increasing!"
                  : "Your average completion time has increased. Consider reviewing your workflow for potential bottlenecks."}
              </p>
            </div>
            
            <div className="bg-muted/40 p-4 rounded-md">
              <h3 className="font-medium mb-2">Recommended Actions</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Schedule regular time blocks dedicated to high-priority tasks</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Break down complex SEO tasks into smaller, actionable items</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Review completed tasks to identify patterns and optimize workflows</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 