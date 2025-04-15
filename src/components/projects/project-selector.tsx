"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
}

export interface ProjectSelectorProps {
  onProjectChange?: (projectId: string) => void;
  defaultProjectId?: string;
  className?: string;
  showAllOption?: boolean;
  redirectToProject?: boolean;
  redirectPath?: string;
}

export function ProjectSelector({
  onProjectChange,
  defaultProjectId,
  className = "w-[280px]",
  showAllOption = false,
  redirectToProject = false,
  redirectPath
}: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Check if project ID is in search params, use it as the initial selection
    const projectIdFromUrl = searchParams.get("projectId");
    if (projectIdFromUrl) {
      setSelectedProject(projectIdFromUrl);
    } else if (defaultProjectId) {
      setSelectedProject(defaultProjectId);
    }
  }, [searchParams, defaultProjectId]);
  
  useEffect(() => {
    fetchProjects();
  }, []);
  
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/projects");
      
      if (!response.ok) {
        throw new Error("Failed to load projects");
      }
      
      const { data } = await response.json();
      setProjects(data || []);
      
      // If no project is selected yet but we have projects, select the first one
      if (!selectedProject && data?.length > 0 && !defaultProjectId && !searchParams.get("projectId")) {
        setSelectedProject(data[0].id);
        if (onProjectChange) {
          onProjectChange(data[0].id);
        }
      }
      
    } catch (err: any) {
      console.error("Error fetching projects:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    
    if (redirectToProject && redirectPath) {
      // Build the redirect URL with the project ID
      const baseUrl = redirectPath.includes("?") 
        ? `${redirectPath}&projectId=${projectId}` 
        : `${redirectPath}?projectId=${projectId}`;
      router.push(baseUrl);
      return;
    }
    
    if (onProjectChange) {
      onProjectChange(projectId);
    }
  };
  
  if (loading) {
    return <Skeleton className={`h-10 ${className}`} />;
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (projects.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Projects Found</AlertTitle>
        <AlertDescription>
          You need to add a project first.
          <Link href="/projects" className="font-medium text-primary underline ml-1">
            Add Project
          </Link>
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Select
      value={selectedProject || ""}
      onValueChange={handleProjectChange}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select a project" />
      </SelectTrigger>
      <SelectContent>
        {showAllOption && (
          <SelectItem value="all">All Projects</SelectItem>
        )}
        {projects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            {project.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 