"use client"

import { LucideIcon, ArrowDown, ArrowUp, BarChart3, Search, FileText, Users, CheckCircle2, Clock, TrendingUp, Globe, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

// Define the icons we support
const iconMap = {
  barChart: BarChart3,
  search: Search,
  file: FileText,
  users: Users,
  check: CheckCircle2,
  clock: Clock,
  trending: TrendingUp,
  globe: Globe,
  alert: AlertCircle,
}

// Define the type for icon names
type IconName = keyof typeof iconMap;

interface AuditMetricCardProps {
  title: string
  value: string | number
  description: string
  iconName: IconName
  trend?: {
    value: string
    isPositive: boolean
    label: string
  }
}

export function AuditMetricCard({
  title,
  value,
  description,
  iconName,
  trend,
}: AuditMetricCardProps) {
  // Get the icon component from the map
  const Icon = iconMap[iconName];
  
  // Format the trend value to always show a sign
  const formattedTrendValue = trend?.value 
    ? trend.value.startsWith('+') || trend.value.startsWith('-') 
      ? trend.value 
      : (parseFloat(trend.value) >= 0 ? `+${trend.value}` : trend.value)
    : '';
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          {trend && (
            <div className="flex flex-col items-end">
              <div className="flex items-center text-sm font-medium">
                <span
                  className={
                    trend.isPositive ? "text-green-500" : "text-red-500"
                  }
                >
                  {formattedTrendValue}
                </span>
                {trend.isPositive ? (
                  <ArrowUp className="ml-1 h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDown className="ml-1 h-4 w-4 text-red-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{trend.label}</p>
            </div>
          )}
        </div>
        <div className="mt-4 space-y-1">
          <h3 className="font-medium text-sm text-muted-foreground">{title}</h3>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold">{value}</span>
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
} 