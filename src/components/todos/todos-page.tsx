"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KanbanBoard } from './kanban/kanban-board';
import { TodoCalendar } from './calendar/todo-calendar';
import { TodoMetrics } from './metrics/todo-metrics';
import { TodoFilters } from './filters/todo-filters';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { TodoSelectionProvider, useTodoSelection } from '@/contexts/todo-selection-context';
import { BatchActionBar } from './batch-action-bar';
import { useQueryClient } from '@tanstack/react-query';

// Types to be moved to their own file later
export type TodoStatus = 'pending' | 'in_progress' | 'review' | 'completed';

// Inner component that has access to the selection context
function TodosPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedTodos } = useTodoSelection();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('kanban');
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add debug log to track selection changes
  useEffect(() => {
    console.log('Selected todos changed:', selectedTodos);
  }, [selectedTodos]);
  
  // Initialize tab state from URL on mount
  useEffect(() => {
    const tabParam = searchParams.get('view');
    if (tabParam && ['kanban', 'calendar', 'metrics'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    
    const projectParam = searchParams.get('project');
    if (projectParam) {
      setProjectFilter(projectParam);
    }
  }, [searchParams]);
  
  // Update URL when tab changes
  const setActiveTabWithParam = useCallback((tab: string) => {
    setActiveTab(tab);
    
    // Create new URLSearchParams object from current params
    const params = new URLSearchParams(searchParams);
    
    // Update the 'tab' parameter
    params.set('view', tab);
    
    // Update URL without refreshing the page
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);
  
  // Function to refresh data after batch actions
  const refreshData = useCallback(() => {
    console.log('Refreshing todos data after batch action');
    
    // Invalidate all relevant queries
    queryClient.invalidateQueries({ queryKey: ["todos"] });
    queryClient.invalidateQueries({ queryKey: ["todo-metrics"] });
    
    // Force a refetch of the todos data
    queryClient.refetchQueries({ 
      queryKey: ["todos"],
      type: 'active'
    });
    
    // Force a refresh of the UI
    setTimeout(() => {
      const currentTab = activeTab;
      setActiveTab('');
      setTimeout(() => {
        setActiveTab(currentTab);
      }, 10);
    }, 100);
  }, [queryClient, activeTab]);
  
  // Handle search updates
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">Todo Management</h1>
        
        <div className="flex justify-between items-center">
          <TodoFilters 
            projectId={projectFilter} 
            onProjectChange={setProjectFilter}
            onSearch={handleSearch}
          />
        </div>
        
        {selectedTodos.length > 0 && <BatchActionBar onActionsComplete={refreshData} />}
        
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTabWithParam} className="w-full">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 mb-4">
            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="kanban" className="p-0">
            <KanbanBoard projectId={projectFilter} />
          </TabsContent>
          
          <TabsContent value="calendar" className="p-0">
            <TodoCalendar projectId={projectFilter} />
          </TabsContent>
          
          <TabsContent value="metrics" className="p-0">
            <TodoMetrics projectId={projectFilter} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export function TodosPage() {
  return (
    <TodoSelectionProvider>
      <TodosPageContent />
    </TodoSelectionProvider>
  );
} 