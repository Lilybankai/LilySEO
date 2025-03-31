"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Loader2, Tag, Lightbulb, RefreshCw } from "lucide-react"
import { KeywordSuggestion, KeywordSuggestionRequest, getKeywordSuggestions } from "@/services/ai-recommendations"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface KeywordSuggestionsProps {
  url: string
  industry?: string
  description?: string
  location?: string
  onSelectKeyword: (keyword: string) => void
}

// Simple debounce implementation
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function KeywordSuggestions({
  url,
  industry,
  description,
  location,
  onSelectKeyword
}: KeywordSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<KeywordSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Use our custom debounce hook
  const debouncedUrl = useDebounce(url, 1000)
  const debouncedIndustry = useDebounce(industry, 1000)
  const debouncedDescription = useDebounce(description, 1000)
  const debouncedLocation = useDebounce(location, 1000)

  useEffect(() => {
    // Only attempt to get suggestions if we have a URL
    if (debouncedUrl && debouncedUrl.startsWith('http')) {
      fetchSuggestions()
      setHasAttemptedFetch(true)
    }
  }, [debouncedUrl, debouncedIndustry, debouncedDescription, debouncedLocation])

  const fetchSuggestions = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const request: KeywordSuggestionRequest = {
        url,
        industry,
        description,
        location
      }
      
      const data = await getKeywordSuggestions(request)
      setSuggestions(data)
    } catch (err) {
      setError('Failed to generate keyword suggestions')
      console.error('Error generating keyword suggestions:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectKeyword = (suggestion: KeywordSuggestion) => {
    if (!selectedKeywords.includes(suggestion.keyword)) {
      setSelectedKeywords([...selectedKeywords, suggestion.keyword])
      onSelectKeyword(suggestion.keyword)
      toast.success(`Added "${suggestion.keyword}" to keywords`)
    }
  }

  const handleRefresh = () => {
    fetchSuggestions()
    toast.info("Refreshing keyword suggestions...")
  }

  // Get category information
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'branded':
        return 'bg-blue-100 text-blue-600 hover:bg-blue-200'
      case 'long-tail':
        return 'bg-purple-100 text-purple-600 hover:bg-purple-200'
      case 'question':
        return 'bg-amber-100 text-amber-600 hover:bg-amber-200'
      case 'location-based':
        return 'bg-green-100 text-green-600 hover:bg-green-200'
      default:
        return 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }
  }

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'branded':
        return '🏢'
      case 'long-tail':
        return '🔍'
      case 'question':
        return '❓'
      case 'location-based':
        return '📍'
      default:
        return '🔤'
    }
  }

  // Group suggestions by category
  const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.category]) {
      acc[suggestion.category] = []
    }
    acc[suggestion.category].push(suggestion)
    return acc
  }, {} as Record<string, KeywordSuggestion[]>)

  // Categories in preferred order
  const categoryOrder = ['branded', 'location-based', 'long-tail', 'question', 'general']

  if (isLoading) {
    return (
      <div className="space-y-4 my-4 border border-border rounded-md p-4 bg-muted/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating keyword suggestions...
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return null // Hide the component on error
  }

  if (suggestions.length === 0) {
    if (hasAttemptedFetch) {
      return (
        <div className="space-y-4 my-4 border border-border rounded-md p-4 bg-muted/30">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="font-medium">AI Keyword Suggestions</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">No keyword suggestions available. Try refining your project information.</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4 my-4 border border-border rounded-md p-4 bg-muted/30">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm">
          <Lightbulb className="h-4 w-4 text-primary" />
          <span className="font-medium">AI Keyword Suggestions</span>
          <span className="text-muted-foreground text-xs">(Click to add)</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>
      
      <div className="space-y-3">
        {categoryOrder.map(category => {
          if (!groupedSuggestions[category]) return null;
          
          return (
            <div key={category} className="space-y-2">
              <h4 className="text-xs text-muted-foreground capitalize flex items-center">
                <span className="mr-1">{getCategoryIcon(category)}</span>
                {category.replace('-', ' ')} Keywords:
              </h4>
              <div className="flex flex-wrap gap-2">
                {groupedSuggestions[category].map((suggestion, index) => (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          className={`cursor-pointer transition-colors p-2 ${selectedKeywords.includes(suggestion.keyword) ? 'opacity-50' : ''} ${getCategoryColor(suggestion.category)}`}
                          variant="outline"
                          onClick={() => handleSelectKeyword(suggestion)}
                        >
                          {suggestion.keyword}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{suggestion.category} keyword</p>
                        <p className="text-xs capitalize">{suggestion.relevance} relevance</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
} 