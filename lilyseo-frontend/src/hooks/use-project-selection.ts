"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface UseProjectSelectionOptions {
  defaultProjectId?: string | null;
  onProjectChange?: (projectId: string | null) => void;
  updateUrl?: boolean;
  redirectPath?: string;
  showAllOption?: boolean;
}

export function useProjectSelection({
  defaultProjectId = null,
  onProjectChange,
  updateUrl = true,
  redirectPath,
  showAllOption = false,
}: UseProjectSelectionOptions = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    defaultProjectId || searchParams.get("projectId")
  );

  useEffect(() => {
    // Check URL for project ID when component mounts
    const projectIdFromUrl = searchParams.get("projectId");
    if (projectIdFromUrl) {
      setSelectedProjectId(projectIdFromUrl);
      if (onProjectChange) {
        onProjectChange(projectIdFromUrl);
      }
    } else if (defaultProjectId) {
      setSelectedProjectId(defaultProjectId);
      if (onProjectChange) {
        onProjectChange(defaultProjectId);
      }
    }
  }, []);

  const handleProjectChange = (projectId: string) => {
    const newProjectId = projectId === "all" ? null : projectId;
    setSelectedProjectId(newProjectId);

    // Optionally update URL with project ID
    if (updateUrl) {
      const basePath = redirectPath || window.location.pathname;
      const newUrl = newProjectId
        ? `${basePath}${basePath.includes("?") ? "&" : "?"}projectId=${newProjectId}`
        : basePath;
      
      router.push(newUrl, { scroll: false });
    }

    if (onProjectChange) {
      onProjectChange(newProjectId);
    }
  };

  return {
    selectedProjectId,
    setSelectedProjectId,
    handleProjectChange,
  };
} 