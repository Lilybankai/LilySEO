"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, Lightbulb, Check, X, ChevronDown, ChevronUp, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { AiRecommendation, AiRecommendationRequest, generateAiRecommendations } from "@/services/ai-recommendations"
import { toast } from "sonner"

interface RecommendationsDisplayProps {
  projectData: AiRecommendationRequest
  onApply?: (recommendation: AiRecommendation) => void
  onDismiss?: (recommendation: AiRecommendation) => void
}

export function RecommendationsDisplay({
  projectData,
  onApply,
  onDismiss
}: RecommendationsDisplayProps) {
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(true)
  const [hasLoadedRecommendations, setHasLoadedRecommendations] = useState(false)
  const projectDataRef = useRef(projectData)

  // Fetch recommendations when the component mounts or when significant project data changes
  useEffect(() => {
    // Only fetch recommendations if:
    // 1. We haven't loaded them yet, or
    // 2. The URL or industry has changed significantly
    const shouldRefreshRecommendations = 
      !hasLoadedRecommendations || 
      projectData.url !== projectDataRef.current.url ||
      projectData.industry !== projectDataRef.current.industry;
    
    if (shouldRefreshRecommendations) {
      fetchRecommendations();
      // Update the ref to the current project data
      projectDataRef.current = projectData;
    }
  }, [projectData.url, projectData.industry]);

  const fetchRecommendations = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await generateAiRecommendations(projectData)
      setRecommendations(data)
      setHasLoadedRecommendations(true)
    } catch (err) {
      setError('Failed to generate recommendations. Please try again later.')
      console.error('Error generating recommendations:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle manual refresh
  const handleRefresh = () => {
    fetchRecommendations();
    toast.info("Refreshing recommendations...");
  }

  // Handle applying a recommendation
  const handleApply = (recommendation: AiRecommendation) => {
    if (onApply) {
      onApply(recommendation)
    }
    
    // Remove the recommendation from the list
    setRecommendations(recommendations.filter(r => r !== recommendation))
  }

  // Handle dismissing a recommendation
  const handleDismiss = (recommendation: AiRecommendation) => {
    if (onDismiss) {
      onDismiss(recommendation)
    }
    
    // Remove the recommendation from the list
    setRecommendations(recommendations.filter(r => r !== recommendation))
  }

  // Get the badge variant based on confidence
  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return 'default'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
    }
  }

  // Get the badge text based on type
  const getTypeBadge = (type: 'keyword' | 'crawl_setting' | 'competitor' | 'general') => {
    switch (type) {
      case 'keyword':
        return 'Keywords'
      case 'crawl_setting':
        return 'Crawl Settings'
      case 'competitor':
        return 'Competitors'
      case 'general':
        return 'General'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-primary" />
            <CardTitle>AI Recommendations</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh recommendations"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <CardDescription>
          Smart suggestions to improve your SEO performance
        </CardDescription>
      </CardHeader>
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Generating recommendations...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-destructive mb-2">{error}</p>
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                >
                  Try Again
                </Button>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground">No recommendations available.</p>
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  className="mt-2"
                >
                  Refresh Recommendations
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((recommendation, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{recommendation.title}</CardTitle>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">
                              {getTypeBadge(recommendation.type)}
                            </Badge>
                            <Badge variant={getConfidenceBadge(recommendation.confidence)}>
                              {recommendation.confidence.charAt(0).toUpperCase() + recommendation.confidence.slice(1)} Confidence
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {onApply && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-green-500"
                              onClick={() => handleApply(recommendation)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {onDismiss && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-destructive"
                              onClick={() => handleDismiss(recommendation)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">
                        {recommendation.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
      
      <CardFooter className="pt-0">
        <div className="w-full flex justify-between items-center text-xs text-muted-foreground">
          <span>Powered by AI</span>
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </CardFooter>
    </Card>
  )
} 