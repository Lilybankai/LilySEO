"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DateRange } from "react-day-picker"
import { CalendarIcon, Search, X } from "lucide-react"

import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format, parseISO } from "date-fns"

// Define the filter schema
const filterSchema = z.object({
  project: z.string(),
  status: z.string(),
  scoreMin: z.string().optional(),
  scoreMax: z.string().optional(),
})

type FilterValues = z.infer<typeof filterSchema>

interface AuditFiltersProps {
  projects: {
    id: string
    name: string
  }[]
}

export function AuditFilters({ projects }: AuditFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Initialize date state from URL params
  const [date, setDate] = useState<DateRange | undefined>(() => {
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    
    if (dateFrom || dateTo) {
      return {
        from: dateFrom ? parseISO(dateFrom) : undefined,
        to: dateTo ? parseISO(dateTo) : undefined
      }
    }
    
    return undefined
  })
  
  // Create form with default values from URL params
  const form = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      project: searchParams.get('project') || 'all',
      status: searchParams.get('status') || 'all',
      scoreMin: searchParams.get('scoreMin') || '',
      scoreMax: searchParams.get('scoreMax') || '',
    },
  })
  
  // Handle form submission
  const onSubmit = (values: FilterValues) => {
    const params = new URLSearchParams(searchParams)
    
    // Handle project filter
    if (values.project && values.project !== 'all') {
      params.set('project', values.project)
    } else {
      params.delete('project')
    }
    
    // Handle status filter
    if (values.status && values.status !== 'all') {
      params.set('status', values.status)
    } else {
      params.delete('status')
    }
    
    // Handle score range filters
    if (values.scoreMin) {
      params.set('scoreMin', values.scoreMin)
    } else {
      params.delete('scoreMin')
    }
    
    if (values.scoreMax) {
      params.set('scoreMax', values.scoreMax)
    } else {
      params.delete('scoreMax')
    }
    
    // Handle date range filters
    if (date?.from) {
      params.set('dateFrom', format(date.from, 'yyyy-MM-dd'))
    } else {
      params.delete('dateFrom')
    }
    
    if (date?.to) {
      params.set('dateTo', format(date.to, 'yyyy-MM-dd'))
    } else {
      params.delete('dateTo')
    }
    
    // Reset to first page when applying filters
    params.set('page', '1')
    
    router.push(`/audits?${params.toString()}`)
  }
  
  // Handle reset filters
  const resetFilters = () => {
    form.reset({
      project: 'all',
      status: 'all',
      scoreMin: '',
      scoreMax: '',
    })
    setDate(undefined)
    router.push('/audits')
  }
  
  // Check if any filters are applied
  const hasFilters = 
    !!searchParams.get('project') || 
    !!searchParams.get('status') || 
    !!searchParams.get('scoreMin') || 
    !!searchParams.get('scoreMax') || 
    !!searchParams.get('dateFrom') || 
    !!searchParams.get('dateTo')
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Project Filter */}
          <FormField
            control={form.control}
            name="project"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          
          {/* Status Filter */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Any status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">Any Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          
          {/* Score Range Filters */}
          <div className="space-y-2">
            <FormLabel>Score Range</FormLabel>
            <div className="flex space-x-2">
              <FormField
                control={form.control}
                name="scoreMin"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Min"
                        type="number"
                        min="0"
                        max="100"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="scoreMax"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Max"
                        type="number"
                        min="0"
                        max="100"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {/* Date Range Filter */}
          <div className="space-y-2">
            <FormLabel>Date Range</FormLabel>
            <DatePickerWithRange
              date={date}
              onDateChange={setDate}
              className="w-full"
            />
          </div>
        </div>
        
        {/* Filter Action Buttons */}
        <div className="flex justify-end space-x-2">
          {hasFilters && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={resetFilters}
            >
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}
          <Button type="submit">
            <Search className="mr-2 h-4 w-4" />
            Apply Filters
          </Button>
        </div>
      </form>
    </Form>
  )
} 