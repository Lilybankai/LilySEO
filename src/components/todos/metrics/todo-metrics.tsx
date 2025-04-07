"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TodoMetrics as TodoMetricsType } from '@/types/todos';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, BarChart, CheckCircle, Clock, Calendar, BrainCircuit, LayoutDashboard, Layers } from 'lucide-react';
import { addMonths, format } from 'date-fns';
import { CategoryMetrics } from './category-metrics';
import { PerformanceMetrics } from './performance-metrics';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTodoMetrics } from '@/hooks/use-metrics';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  const [activeTab, setActiveTab] = useState('performance');
  
  // Fetch metrics from the API
  const { data: metricsData, isLoading, error } = useTodoMetrics(projectId || undefined);
  
  // Get available months for selection
  const availableMonths = metricsData?.map(metrics => format(new Date(metrics.month), 'yyyy-MM')) || [];
  
  // Select most recent month by default
  const [selectedMonth, setSelectedMonth] = useState<string>(
    availableMonths.length > 0 ? availableMonths[0] : format(new Date(), 'yyyy-MM')
  );
  
  // Update selected month when data loads
  React.useEffect(() => {
    if (availableMonths.length > 0) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-full mb-6" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Metrics</AlertTitle>
        <AlertDescription>
          Failed to load metrics data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Show empty state if no data
  if (!metricsData || metricsData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold">Todo Metrics</h2>
            <p className="text-muted-foreground">
              Track your task progress and performance
            </p>
          </div>
        </div>
        
        <Alert variant="default" className="bg-muted/50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No metrics data available</AlertTitle>
          <AlertDescription>
            Start creating and completing todos to see your metrics here. Your metrics will be updated as you work with todos.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Todo Metrics</h2>
          <p className="text-muted-foreground">
            Track your task progress and performance
          </p>
        </div>
        
        <div className="flex items-center gap-4">
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
                {metricsData.map((metrics, index) => (
                  <SelectItem 
                    key={metrics.id} 
                    value={format(new Date(metrics.month), 'yyyy-MM')}
                  >
                    {format(new Date(metrics.month), 'MMMM yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance" className="flex items-center gap-1">
            <LayoutDashboard className="h-4 w-4" />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-1">
            <Layers className="h-4 w-4" />
            <span>Categories</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <BarChart className="h-4 w-4" />
            <span>Legacy</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance" className="space-y-6">
          <PerformanceMetrics projectId={projectId} searchTerm={searchTerm} />
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-6">
          <CategoryMetrics projectId={projectId} searchTerm={searchTerm} />
        </TabsContent>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Legacy overview content for backward compatibility */}
          <LegacyMetricsView metricsData={metricsData} selectedMonth={selectedMonth} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Component for the legacy overview tab
function LegacyMetricsView({ 
  metricsData, 
  selectedMonth 
}: { 
  metricsData: TodoMetricsType[],
  selectedMonth: string 
}) {
  // Get metrics for the selected month
  const currentMetrics = metricsData.find(
    metrics => format(new Date(metrics.month), 'yyyy-MM') === selectedMonth
  );
  
  if (!currentMetrics) {
    return (
      <Alert>
        <AlertTitle>No data available</AlertTitle>
        <AlertDescription>
          No metrics data available for the selected month.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Get metrics for the previous month for comparison
  const previousMonthDate = addMonths(new Date(selectedMonth), -1);
  const previousMonthKey = format(previousMonthDate, 'yyyy-MM');
  const previousMetrics = metricsData.find(
    metrics => format(new Date(metrics.month), 'yyyy-MM') === previousMonthKey
  );
  
  // Calculate completion rate
  const completionRate = currentMetrics.todosCreated > 0 
    ? Math.round((currentMetrics.todosCompleted / currentMetrics.todosCreated) * 100) 
    : 0;
  
  // Calculate comparison with previous month
  const calculateChange = (current: number, previous: number): { value: number, isPositive: boolean } => {
    if (previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(Math.round(change)),
      isPositive: change >= 0,
    };
  };
  
  const completionRateChange = previousMetrics && previousMetrics.todosCreated > 0
    ? calculateChange(completionRate, Math.round((previousMetrics.todosCompleted / previousMetrics.todosCreated) * 100))
    : { value: 0, isPositive: true };
  
  const completedTasksChange = previousMetrics && previousMetrics.todosCompleted > 0
    ? calculateChange(currentMetrics.todosCompleted, previousMetrics.todosCompleted)
    : { value: 0, isPositive: true };
  
  const avgCompletionTimeChange = previousMetrics && previousMetrics.averageCompletionTime > 0
    ? calculateChange(currentMetrics.averageCompletionTime, previousMetrics.averageCompletionTime)
    : { value: 0, isPositive: false };
  
  const totalTimeSpentChange = previousMetrics && previousMetrics.totalTimeSpent > 0
    ? calculateChange(currentMetrics.totalTimeSpent, previousMetrics.totalTimeSpent)
    : { value: 0, isPositive: true };
  
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Completion Rate Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BrainCircuit className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardDescription>
            Tasks completed vs. created
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-3">
            {completionRate}%
          </div>
          <Progress value={completionRate} className="h-2" />
          <div className="flex justify-between text-xs mt-2">
            <span className="text-muted-foreground">
              {currentMetrics.todosCompleted} of {currentMetrics.todosCreated}
            </span>
            {previousMetrics && (
              <span className={completionRateChange.isPositive ? "text-green-600" : "text-red-600"}>
                {completionRateChange.isPositive ? "+" : "-"}{completionRateChange.value}%
              </span>
            )}
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
            {currentMetrics.todosCompleted}
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              Previous: {previousMetrics?.todosCompleted || 0}
            </span>
            {previousMetrics && previousMetrics.todosCompleted > 0 && (
              <span className={completedTasksChange.isPositive ? "text-green-600" : "text-red-600"}>
                {completedTasksChange.isPositive ? "+" : "-"}{completedTasksChange.value}%
              </span>
            )}
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
            {formatTime(currentMetrics.averageCompletionTime)}
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              Previous: {previousMetrics ? formatTime(previousMetrics.averageCompletionTime) : '0 min'}
            </span>
            {previousMetrics && previousMetrics.averageCompletionTime > 0 && (
              <span className={!avgCompletionTimeChange.isPositive ? "text-green-600" : "text-red-600"}>
                {!avgCompletionTimeChange.isPositive ? "+" : "-"}{avgCompletionTimeChange.value}%
              </span>
            )}
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
            Total time invested in tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-3">
            {formatTime(currentMetrics.totalTimeSpent)}
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              Previous: {previousMetrics ? formatTime(previousMetrics.totalTimeSpent) : '0 min'}
            </span>
            {previousMetrics && previousMetrics.totalTimeSpent > 0 && (
              <span className={totalTimeSpentChange.isPositive ? "text-green-600" : "text-red-600"}>
                {totalTimeSpentChange.isPositive ? "+" : "-"}{totalTimeSpentChange.value}%
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 