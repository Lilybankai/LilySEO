"use client"

import Link from "next/link"
import { 
  LucideIcon, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Search,
  Users
} from "lucide-react"

interface DashboardActivityItemProps {
  icon: string
  title: string
  description: string
  timestamp: string
  status?: {
    label: string
    icon: string
    color: string
  }
  link?: string
}

export function DashboardActivityItem({
  icon,
  title,
  description,
  timestamp,
  status,
  link,
}: DashboardActivityItemProps) {
  // Map icon strings to actual components
  const getIcon = (iconName: string): LucideIcon => {
    switch (iconName) {
      case "CheckCircle2":
        return CheckCircle2
      case "Clock":
        return Clock
      case "FileText":
        return FileText
      case "Search":
        return Search
      case "Users":
        return Users
      default:
        return Clock
    }
  }

  const IconComponent = getIcon(icon)
  
  // Get status icon if available
  const StatusIcon = status?.icon ? getIcon(status.icon) : null
  
  const Content = (
    <div className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0">
        <IconComponent className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm truncate">{title}</p>
          <span className="text-xs text-muted-foreground shrink-0 ml-2">{timestamp}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
        {status && (
          <div className="flex items-center">
            {StatusIcon && <StatusIcon className={`h-3 w-3 mr-1 ${status.color}`} />}
            <span className={`text-xs ${status.color}`}>{status.label}</span>
          </div>
        )}
      </div>
    </div>
  )

  if (link) {
    return (
      <Link href={link} className="block">
        {Content}
      </Link>
    )
  }

  return Content
} 