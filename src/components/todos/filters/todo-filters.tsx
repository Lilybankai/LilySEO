"use client";

import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal, X, ChevronDown, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProjects } from "@/hooks/use-projects";

interface TodoFiltersProps {
  onSearch: (term: string) => void;
  projectId: string | null;
  onProjectChange: Dispatch<SetStateAction<string | null>>;
}

export function TodoFilters({ onSearch, projectId, onProjectChange }: TodoFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [priority, setPriority] = useState<string | null>(null);
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterCount, setFilterCount] = useState(0);
  
  // Fetch real projects data
  const { data: projects, isLoading } = useProjects();

  // Get active filter count
  useEffect(() => {
    let count = 0;
    if (searchTerm) count++;
    if (priority) count++;
    if (assignedTo) count++;
    if (projectId) count++;
    
    setFilterCount(count);
  }, [searchTerm, priority, assignedTo, projectId]);
  
  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    onProjectChange(null);
    setPriority(null);
    setAssignedTo(null);
    onSearch('');
  };

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  // Get current project name
  const currentProject = projectId 
    ? projects?.find(p => p.id === projectId)?.name || "Loading..."
    : "All Projects";

  return (
    <div className="flex flex-col gap-4 bg-background/60 backdrop-blur sticky top-0 z-10 pt-2 pb-3">
      <form onSubmit={handleSearch} className="flex w-full gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search todos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-[150px] justify-between">
              {currentProject}
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Filter by Project</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onProjectChange(null)}>
              All Projects
            </DropdownMenuItem>
            
            {isLoading ? (
              <DropdownMenuItem disabled>Loading projects...</DropdownMenuItem>
            ) : projects && projects.length > 0 ? (
              projects.map((project) => (
                <DropdownMenuItem 
                  key={project.id} 
                  onClick={() => onProjectChange(project.id)}
                >
                  {project.name}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>No projects found</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="icon" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
          <Filter className="h-4 w-4" />
        </Button>
      </form>
      
      <div className="flex gap-2">
        <Popover open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className={cn(filterCount > 0 && "border-primary")}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {filterCount > 0 && (
                <div className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {filterCount}
                </div>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Filters</h4>
                <p className="text-sm text-muted-foreground">
                  Filter todos by different criteria
                </p>
              </div>
              <Separator />
              <div className="grid gap-2">
                <div className="grid gap-1">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={priority || 'all'}
                    onValueChange={(value) => setPriority(value === 'all' ? null : value)}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Any Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-1">
                  <Label htmlFor="assigned">Assigned To</Label>
                  <Select
                    value={assignedTo || 'all'}
                    onValueChange={(value) => setAssignedTo(value === 'all' ? null : value)}
                  >
                    <SelectTrigger id="assigned">
                      <SelectValue placeholder="Anyone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Anyone</SelectItem>
                      <SelectItem value="me">Me</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {/* Here you would list team members */}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-between">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetFilters}
                  disabled={filterCount === 0}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reset All
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setShowAdvancedFilters(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
} 