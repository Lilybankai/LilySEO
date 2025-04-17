"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Database } from "@/lib/supabase/database.types"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"

type AuditWithProject = Database["public"]["Tables"]["audits"]["Row"] & {
  projects: { name: string } | null;
}

interface AuditComparisonChartProps {
  currentMonth: AuditWithProject[]
  previousMonth: AuditWithProject[]
  type: "scores" | "counts"
}

export function AuditComparisonChart({
  currentMonth,
  previousMonth,
  type
}: AuditComparisonChartProps) {
  const [chartData, setChartData] = useState<any[]>([])
  
  useEffect(() => {
    if (type === "scores") {
      prepareScoreData()
    } else {
      prepareCountData()
    }
  }, [currentMonth, previousMonth, type])
  
  // Prepare data for the score comparison chart
  const prepareScoreData = () => {
    // Group audits by project for both current and previous month
    const currentByProject = groupByProject(currentMonth)
    const previousByProject = groupByProject(previousMonth)
    
    // Get all project IDs
    const allProjectIds = [...new Set([
      ...Object.keys(currentByProject),
      ...Object.keys(previousByProject)
    ])].slice(0, 10) // Limit to 10 projects for readability
    
    // Create chart data
    const data = allProjectIds.map(projectId => {
      const currentAudit = currentByProject[projectId] || null
      const previousAudit = previousByProject[projectId] || null
      
      return {
        projectName: currentAudit?.projects?.name || previousAudit?.projects?.name || 'Unknown',
        currentScore: currentAudit?.score || 0,
        previousScore: previousAudit?.score || 0,
        difference: (currentAudit?.score || 0) - (previousAudit?.score || 0)
      }
    })
    
    setChartData(data)
  }
  
  // Prepare data for the count comparison chart
  const prepareCountData = () => {
    // Get status counts for current month
    const currentCounts = getStatusCounts(currentMonth)
    
    // Get status counts for previous month
    const previousCounts = getStatusCounts(previousMonth)
    
    // Create chart data
    const data = [
      {
        status: 'Completed',
        current: currentCounts.completed,
        previous: previousCounts.completed,
        difference: currentCounts.completed - previousCounts.completed
      },
      {
        status: 'Pending',
        current: currentCounts.pending,
        previous: previousCounts.pending,
        difference: currentCounts.pending - previousCounts.pending
      },
      {
        status: 'Processing',
        current: currentCounts.processing,
        previous: previousCounts.processing,
        difference: currentCounts.processing - previousCounts.processing
      },
      {
        status: 'Failed',
        current: currentCounts.failed,
        previous: previousCounts.failed,
        difference: currentCounts.failed - previousCounts.failed
      }
    ]
    
    setChartData(data)
  }
  
  // Helper: Group audits by project and get the latest one for each
  const groupByProject = (audits: AuditWithProject[]) => {
    return audits.reduce((acc, audit) => {
      // Only consider audits with a score
      if (audit.score === null) return acc
      
      // If this is the first audit for this project, or it's newer than the existing one
      if (
        !acc[audit.project_id] ||
        new Date(audit.created_at) > new Date(acc[audit.project_id].created_at)
      ) {
        acc[audit.project_id] = audit
      }
      
      return acc
    }, {} as Record<string, AuditWithProject>)
  }
  
  // Helper: Count audits by status
  const getStatusCounts = (audits: AuditWithProject[]) => {
    return {
      completed: audits.filter(a => a.status === 'completed').length,
      pending: audits.filter(a => a.status === 'pending').length,
      processing: audits.filter(a => a.status === 'processing').length,
      failed: audits.filter(a => a.status === 'failed').length
    }
  }
  
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Not enough data to display comparison</p>
      </div>
    )
  }
  
  if (type === "scores") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="projectName" 
            angle={-45} 
            textAnchor="end" 
            tick={{ fontSize: 12 }}
            height={70}
          />
          <YAxis domain={[0, 100]} />
          <Tooltip 
            formatter={(value) => [`${value}/100`, 'Score']}
            labelFormatter={(label) => `Project: ${label}`}
          />
          <Legend />
          <Bar 
            name="Current Month" 
            dataKey="currentScore" 
            fill="#4f46e5" 
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            name="Previous Month" 
            dataKey="previousScore" 
            fill="#9ca3af" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    )
  }
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="status" />
        <YAxis />
        <Tooltip 
          formatter={(value) => [value, 'Count']}
          labelFormatter={(label) => `Status: ${label}`}
        />
        <Legend />
        <Bar 
          name="Current Month" 
          dataKey="current" 
          fill="#4f46e5" 
          radius={[4, 4, 0, 0]}
        />
        <Bar 
          name="Previous Month" 
          dataKey="previous" 
          fill="#9ca3af" 
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
} 