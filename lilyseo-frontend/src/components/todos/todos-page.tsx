"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KanbanBoard } from './kanban/kanban-board';
import { TodoCalendar } from './calendar/todo-calendar';
import { TodoList } from './list/todo-list';
import { TodoMetrics } from './metrics/todo-metrics';
import { TodoFilters } from './filters/todo-filters';
import { FocusView } from './focus/focus-view';
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
  const [showFocus, setShowFocus] = useState(true);
  
  // Add debug log to track selection changes
  useEffect(() => {
    console.log('Selected todos changed:', selectedTodos);
  }, [selectedTodos]);
  
  // Initialize tab state from URL on mount
  useEffect(() => {
    const tabParam = searchParams.get('view');
    if (tabParam && ['kanban', 'list', 'calendar', 'metrics'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    
    const projectParam = searchParams.get('project');
    if (projectParam) {
      setProjectFilter(projectParam);
    }
    
    const focusParam = searchParams.get('focus');
    if (focusParam === 'false') {
      setShowFocus(false);
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
  
  // Function to toggle focus view
  const toggleFocusView = useCallback(() => {
    const newShowFocus = !showFocus;
    setShowFocus(newShowFocus);
    
    // Create new URLSearchParams object from current params
    const params = new URLSearchParams(searchParams);
    
    // Update the 'focus' parameter
    if (!newShowFocus) {
      params.set('focus', 'false');
    } else {
      params.delete('focus');
    }
    
    // Update URL without refreshing the page
    router.push(`?${params.toString()}`);
  }, [showFocus, router, searchParams]);
  
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
        
        {/* Focus View */}
        {showFocus && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Focus Mode</h2>
              <button 
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={toggleFocusView}
              >
                Hide Focus View
              </button>
            </div>
            <FocusView projectId={projectFilter} searchTerm={searchTerm} limit={5} />
          </div>
        )}
        
        {/* View Tabs */}
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTabWithParam} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-4">
              <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
            </TabsList>
            
            {!showFocus && (
              <button 
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={toggleFocusView}
              >
                Show Focus View
              </button>
            )}
          </div>
          
          <TabsContent value="kanban" className="p-0">
            <KanbanBoard projectId={projectFilter} />
          </TabsContent>
          
          <TabsContent value="list" className="p-0">
            <TodoList projectId={projectFilter} searchTerm={searchTerm} />
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