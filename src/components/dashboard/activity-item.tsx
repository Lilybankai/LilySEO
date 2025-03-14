"use client"

import Link from "next/link"
import { LucideIcon } from "lucide-react"

interface DashboardActivityItemProps {
  icon: LucideIcon
  title: string
  description: string
  timestamp: string
  status?: {
    label: string
    icon: LucideIcon
    color: string
  }
  link?: string
}

export function DashboardActivityItem({
  icon: Icon,
  title,
  description,
  timestamp,
  status,
  link,
}: DashboardActivityItemProps) {
  const Content = (
    <div className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm truncate">{title}</p>
          <span className="text-xs text-muted-foreground shrink-0 ml-2">{timestamp}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
        {status && (
          <div className="flex items-center">
            <status.icon className={`h-3 w-3 mr-1 ${status.color}`} />
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