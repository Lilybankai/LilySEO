"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Lightbulb, ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// Types for recommendations
export type RecommendationType = 
  | 'keyword' 
  | 'competitor' 
  | 'crawl_setting' 
  | 'general'

export interface Recommendation {
  id: string
  type: RecommendationType
  title: string
  description: string
  value: any // The value to apply if accepted
  confidence: 'high' | 'medium' | 'low'
}

// Mock function to simulate fetching recommendations
// In a real implementation, this would be an API call
export const getRecommendations = async (url: string, industry?: string): Promise<Recommendation[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // Return mock recommendations based on URL and industry
  return [
    {
      id: 'rec-1',
      type: 'keyword',
      title: 'Add industry-specific keywords',
      description: 'Based on your website content, we recommend adding these keywords to track.',
      value: ['seo tools', 'keyword research', 'rank tracking', 'backlink analysis'],
      confidence: 'high'
    },
    {
      id: 'rec-2',
      type: 'competitor',
      title: 'Track these competitors',
      description: 'These websites offer similar services and rank for similar keywords.',
      value: ['ahrefs.com', 'semrush.com', 'moz.com'],
      confidence: 'medium'
    },
    {
      id: 'rec-3',
      type: 'crawl_setting',
      title: 'Optimize crawl frequency',
      description: 'Your site appears to update frequently. We recommend weekly crawls.',
      value: { crawl_frequency: 'weekly', crawl_depth: 3 },
      confidence: 'high'
    },
    {
      id: 'rec-4',
      type: 'general',
      title: 'Set up Google Search Console',
      description: 'Connect Google Search Console to import real search data.',
      value: null,
      confidence: 'high'
    }
  ]
}

interface RecommendationsDisplayProps {
  url: string
  industry?: string
  onApply: (recommendation: Recommendation) => void
  isLoading?: boolean
}

export function RecommendationsDisplay({ 
  url, 
  industry, 
  onApply,
  isLoading = false
}: RecommendationsDisplayProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(true)
  const [appliedRecommendations, setAppliedRecommendations] = useState<string[]>([])
  const [dismissedRecommendations, setDismissedRecommendations] = useState<string[]>([])
  
  // Load recommendations when URL changes
  useEffect(() => {
    const loadRecommendations = async () => {
      if (!url) return
      
      setLoading(true)
      try {
        const data = await getRecommendations(url, industry)
        setRecommendations(data)
      } catch (error) {
        console.error('Error loading recommendations:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadRecommendations()
  }, [url, industry])
  
  const handleApply = (recommendation: Recommendation) => {
    onApply(recommendation)
    setAppliedRecommendations(prev => [...prev, recommendation.id])
  }
  
  const handleDismiss = (id: string) => {
    setDismissedRecommendations(prev => [...prev, id])
  }
  
  // Filter out applied and dismissed recommendations
  const activeRecommendations = recommendations.filter(
    rec => !appliedRecommendations.includes(rec.id) && !dismissedRecommendations.includes(rec.id)
  )
  
  if (loading || isLoading) {
    return (
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Lightbulb className="h-4 w-4 text-primary" />
          <span>Analyzing your website...</span>
        </div>
        <div className="mt-2 space-y-2">
          <div className="h-12 animate-pulse rounded-md bg-muted"></div>
          <div className="h-12 animate-pulse rounded-md bg-muted"></div>
        </div>
      </div>
    )
  }
  
  if (activeRecommendations.length === 0) {
    return null
  }
  
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h3 className="font-medium">AI Recommendations</h3>
          <Badge variant="outline" className="ml-2">
            {activeRecommendations.length}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setOpen(!open)}>
          {open ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle</span>
        </Button>
      </div>
      <CollapsibleContent>
        <div className="space-y-2 p-4 pt-0">
          {activeRecommendations.map((recommendation) => (
            <div
              key={recommendation.id}
              className="flex flex-col space-y-2 rounded-md border p-3"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{recommendation.title}</h4>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        recommendation.confidence === 'high' && "bg-green-50 text-green-700 border-green-200",
                        recommendation.confidence === 'medium' && "bg-yellow-50 text-yellow-700 border-yellow-200",
                        recommendation.confidence === 'low' && "bg-red-50 text-red-700 border-red-200"
                      )}
                    >
                      {recommendation.confidence}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {recommendation.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismiss(recommendation.id)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Dismiss
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleApply(recommendation)}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Apply
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
} 