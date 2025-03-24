"use client"

import { Search, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react"
import { DashboardActivityItem } from "@/components/dashboard/activity-item"

interface AuditListItemProps {
  audit: any;
  projectId: string;
}

export function AuditListItem({ audit, projectId }: AuditListItemProps) {
  // Determine the status configuration based on the audit status
  const getStatusConfig = () => {
    switch (audit.status) {
      case "completed":
        return {
          label: "Completed",
          icon: CheckCircle2,
          color: "text-green-500"
        };
      case "processing":
        return {
          label: "Processing",
          icon: Loader2,
          color: "text-blue-500"
        };
      case "pending":
        return {
          label: "Pending",
          icon: Clock,
          color: "text-yellow-500"
        };
      case "failed":
        return {
          label: "Failed",
          icon: AlertCircle,
          color: "text-red-500"
        };
      default:
        return {
          label: audit.status || "Unknown",
          icon: Clock,
          color: "text-gray-500"
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <DashboardActivityItem
      icon={Search}
      title={`Audit for ${audit.url || 'Unknown URL'}`}
      description={`Score: ${(audit.report_data as any)?.score || "N/A"}`}
      timestamp={new Date(audit.created_at).toLocaleDateString()}
      status={statusConfig}
      link={`/projects/${projectId}/audits/${audit.id}`}
    />
  );
} 