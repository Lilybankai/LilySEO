"use client"

import { useEffect, useState } from "react"
import { useDebounce } from "use-debounce"
import { Tag, RefreshCw, Sparkles, MapPin, BookmarkIcon, HelpCircle, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface KeywordSuggestionsProps {
  url: string
  industry?: string
  onSelectKeyword: (keyword: string) => void
  isProOrEnterprise?: boolean
}

interface KeywordCategory {
  name: string
  icon: React.ReactNode
  color: string
  keywords: string[]
}

export function KeywordSuggestions({
  url,
  industry,
  onSelectKeyword,
  isProOrEnterprise = false
}: KeywordSuggestionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<KeywordCategory[]>([])
  const [debouncedUrl] = useDebounce(url, 1000)
  
  // Reset suggestions when URL changes completely
  useEffect(() => {
    setCategories([])
  }, [url])
  
  const fetchSuggestions = async () => {
    // Don't fetch if URL is empty or invalid
    if (!debouncedUrl || !debouncedUrl.startsWith('http')) {
      return
    }
    
    try {
      console.log("KeywordSuggestions: Fetching suggestions for URL:", debouncedUrl, "Industry:", industry);
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/ai/keyword-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: debouncedUrl,
          industry
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch keyword suggestions')
      }
      
      const data = await response.json()
      const keywords = data.keywords || []
      
      // Organize keywords into categories
      const categorizedKeywords = organizeSuggestionsByCategory(keywords)
      setCategories(categorizedKeywords)
    } catch (err: any) {
      console.error('Error fetching keyword suggestions:', err)
      setError(err.message || 'Failed to fetch suggestions')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Fetch suggestions when debounced URL changes
  useEffect(() => {
    fetchSuggestions()
  }, [debouncedUrl, industry])
  
  const organizeSuggestionsByCategory = (keywords: string[]): KeywordCategory[] => {
    const domainName = extractDomainName(debouncedUrl)
    
    // Initialize categories
    const categories: KeywordCategory[] = [
      {
        name: "Branded Keywords",
        icon: <Sparkles className="h-4 w-4 text-blue-400" />,
        color: "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/40",
        keywords: []
      },
      {
        name: "Location Based Keywords",
        icon: <MapPin className="h-4 w-4 text-green-400" />,
        color: "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/40",
        keywords: []
      },
      {
        name: "Long Tail Keywords",
        icon: <BookmarkIcon className="h-4 w-4 text-purple-400" />,
        color: "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/40",
        keywords: []
      },
      {
        name: "Question Keywords",
        icon: <HelpCircle className="h-4 w-4 text-amber-400" />,
        color: "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/40",
        keywords: []
      },
      {
        name: "General Keywords",
        icon: <FileText className="h-4 w-4 text-gray-400" />,
        color: "bg-gray-100 dark:bg-gray-600/20 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/40",
        keywords: []
      }
    ]
    
    // Distribute keywords into categories
    keywords.forEach((keyword) => {
      const lowerKeyword = keyword.toLowerCase()
      
      // Branded keywords (contain domain name)
      if (domainName && lowerKeyword.includes(domainName.toLowerCase())) {
        categories[0].keywords.push(keyword)
        return
      }
      
      // Question keywords (start with how, what, why, when, where, which)
      if (/^(how|what|why|when|where|which)\s/.test(lowerKeyword)) {
        categories[3].keywords.push(keyword)
        return
      }
      
      // Location-based keywords (contain location names)
      if (/\b(global|local|regional|national|international|worldwide|country|city|america|europe|asia)\b/.test(lowerKeyword)) {
        categories[1].keywords.push(keyword)
        return
      }
      
      // Long-tail keywords (4+ words)
      if (keyword.split(' ').length >= 4) {
        categories[2].keywords.push(keyword)
        return
      }
      
      // General keywords (everything else)
      categories[4].keywords.push(keyword)
    })
    
    // Only include categories with keywords
    return categories.filter(cat => cat.keywords.length > 0)
  }
  
  const extractDomainName = (url: string): string => {
    try {
      const domain = new URL(url).hostname
      return domain.replace(/^www\./, '').split('.')[0]
    } catch (e) {
      return ""
    }
  }
  
  // If URL is not valid, don't show the component
  if (!url || !url.startsWith('http')) {
    return null
  }
  
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-md font-medium">AI Keyword Suggestions <span className="text-sm text-muted-foreground">(Click to add)</span></h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchSuggestions}
          disabled={isLoading}
          className="h-8 px-2 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <div className="flex flex-wrap gap-2">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-md" />
            ))}
          </div>
          <Skeleton className="h-6 w-40 mt-2" />
          <div className="flex flex-wrap gap-2">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-8 w-32 rounded-md" />
            ))}
          </div>
        </div>
      )}
        
      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}
        
      {!isLoading && !error && categories.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Enter a valid URL to get keyword suggestions
        </p>
      )}
        
      {!isLoading && !error && categories.length > 0 && (
        <div className="space-y-4">
          {categories.map((category, idx) => (
            <div key={idx}>
              <div className="flex items-center gap-2 mb-1.5">
                {category.icon}
                <p className="text-sm font-medium text-muted-foreground">{category.name}:</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {category.keywords.map((keyword, kidx) => (
                  <Button
                    key={kidx}
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectKeyword(keyword)}
                    className={`py-1 px-3 h-auto text-sm ${category.color}`}
                  >
                    {keyword}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 