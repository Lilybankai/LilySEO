"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';

interface TodoSelectionContextType {
  selectedTodos: string[];
  toggleSelection: (todoId: string) => void;
  selectAll: (todoIds: string[]) => void;
  clearSelection: () => void;
  isSelected: (todoId: string) => boolean;
  selectionMode: boolean;
}

const TodoSelectionContext = createContext<TodoSelectionContextType>({
  selectedTodos: [],
  toggleSelection: () => {},
  selectAll: () => {},
  clearSelection: () => {},
  isSelected: () => false,
  selectionMode: false
});

interface TodoSelectionProviderProps {
  children: ReactNode;
}

export function TodoSelectionProvider({ children }: TodoSelectionProviderProps) {
  const [selectedTodos, setSelectedTodos] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  // Add debug logging
  useEffect(() => {
    console.log('TodoSelectionProvider state update:', { 
      selectedTodos, 
      selectedCount: selectedTodos.length,
      selectionMode 
    });
  }, [selectedTodos, selectionMode]);

  const toggleSelection = useCallback((todoId: string) => {
    console.log('toggleSelection called with todoId:', todoId);
    setSelectedTodos(prev => {
      // If the todo is already selected, remove it
      if (prev.includes(todoId)) {
        const newSelected = prev.filter(id => id !== todoId);
        // Turn off selection mode if no items left selected
        if (newSelected.length === 0) {
          setSelectionMode(false);
        }
        console.log('Removing todo from selection, new selection:', newSelected);
        return newSelected;
      } 
      // Otherwise, add it to the selection
      else {
        // Turn on selection mode when first item is selected
        if (prev.length === 0) {
          setSelectionMode(true);
        }
        const newSelected = [...prev, todoId];
        console.log('Adding todo to selection, new selection:', newSelected);
        return newSelected;
      }
    });
  }, []);

  const selectAll = useCallback((todoIds: string[]) => {
    // If all todos are already selected, deselect them
    if (todoIds.length > 0 && todoIds.every(id => selectedTodos.includes(id))) {
      clearSelection();
    } 
    // Otherwise, select all
    else {
      setSelectedTodos(todoIds);
      setSelectionMode(todoIds.length > 0);
    }
  }, [selectedTodos]);

  const clearSelection = useCallback(() => {
    setSelectedTodos([]);
    setSelectionMode(false);
  }, []);

  const isSelected = useCallback((todoId: string) => {
    return selectedTodos.includes(todoId);
  }, [selectedTodos]);

  const value = {
    selectedTodos,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    selectionMode
  };

  return (
    <TodoSelectionContext.Provider value={value}>
      {children}
    </TodoSelectionContext.Provider>
  );
}

export const useTodoSelection = () => useContext(TodoSelectionContext);

export default TodoSelectionContext; 