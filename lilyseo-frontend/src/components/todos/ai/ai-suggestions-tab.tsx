"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Todo, AiRecommendation } from "@/types/todos";

interface AiSuggestionsTabProps {
  todo: Todo;
}

// Mock AI recommendations
const mockAiRecommendations: AiRecommendation[] = [
  {
    id: "1",
    type: "title",
    originalValue: "Update meta descriptions",
    recommendedValue: "Optimize meta descriptions with target keywords",
    reasonForRecommendation: "Adding target keywords to meta descriptions helps improve search engine ranking for those terms.",
    applied: false,
  },
  {
    id: "2",
    type: "meta",
    originalValue: "Our product offers the best features for your needs.",
    recommendedValue: "Premium WordPress themes with SEO optimization, responsive design, and 24/7 support.",
    reasonForRecommendation: "The new meta description is more specific, includes keywords, and highlights key selling points.",
    applied: false,
  },
  {
    id: "3",
    type: "alt_tag",
    originalValue: "image1.jpg",
    recommendedValue: "High-performance WordPress theme with responsive design",
    reasonForRecommendation: "Descriptive alt tags improve accessibility and provide context for search engines.",
    applied: true,
    appliedAt: new Date().toISOString(),
  },
];

export function AiSuggestionsTab({ todo }: AiSuggestionsTabProps) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>(
    todo.aiRecommendations || []
  );

  const generateSuggestions = async () => {
    setGenerating(true);
    try {
      // In a real implementation, you would call your AI service here
      // For now, use mock data after a delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      setRecommendations(mockAiRecommendations);
      toast.success("AI suggestions generated successfully");
    } catch (error) {
      console.error("Error generating AI suggestions:", error);
      toast.error("Failed to generate AI suggestions");
    } finally {
      setGenerating(false);
    }
  };

  const applySuggestion = async (recommendationId: string) => {
    setLoading(true);
    try {
      // In a real implementation, you would apply the suggestion to your content
      // For now, just update the local state
      setRecommendations(
        recommendations.map((rec) =>
          rec.id === recommendationId
            ? { ...rec, applied: true, appliedAt: new Date().toISOString() }
            : rec
        )
      );
      
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      toast.success("Suggestion applied successfully");
    } catch (error) {
      console.error("Error applying suggestion:", error);
      toast.error("Failed to apply suggestion");
    } finally {
      setLoading(false);
    }
  };

  // Determine if we can generate AI suggestions for this todo
  const canGenerateSuggestions = todo.title.toLowerCase().includes("meta") || 
                                 todo.title.toLowerCase().includes("title") ||
                                 todo.title.toLowerCase().includes("alt") ||
                                 todo.title.toLowerCase().includes("description") ||
                                 (todo.description && (
                                   todo.description.toLowerCase().includes("meta") ||
                                   todo.description.toLowerCase().includes("title") ||
                                   todo.description.toLowerCase().includes("alt") ||
                                   todo.description.toLowerCase().includes("description")
                                 ));

  if (!canGenerateSuggestions) {
    return (
      <div className="p-6 text-center bg-muted/50 rounded-lg">
        <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Not Available for This Task</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          AI suggestions are only available for tasks related to content optimization,
          such as meta descriptions, page titles, alt tags, and headings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {recommendations.length === 0 ? (
        <div className="text-center py-8 bg-muted/50 rounded-lg">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Generate AI Suggestions</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Our AI can analyze your content and suggest improvements for better SEO performance.
          </p>
          <Button onClick={generateSuggestions} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Suggestions
              </>
            )}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">AI Suggestions</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={generateSuggestions}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Regenerate
            </Button>
          </div>
          
          <div className="space-y-4">
            {recommendations.map((recommendation) => (
              <Card key={recommendation.id} className={recommendation.applied ? "border-green-200 bg-green-50/30" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <div>
                      <Badge variant="outline" className="mb-2">
                        {recommendation.type === "title" ? "Page Title" : 
                         recommendation.type === "meta" ? "Meta Description" : 
                         recommendation.type === "alt_tag" ? "Alt Tag" : 
                         recommendation.type}
                      </Badge>
                      <CardTitle className="text-base">
                        {recommendation.applied ? (
                          <span className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Applied
                          </span>
                        ) : (
                          "Suggested Change"
                        )}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Original</h4>
                      <p className="text-sm bg-muted/50 p-2 rounded-md">
                        {recommendation.originalValue}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Suggestion</h4>
                      <p className="text-sm bg-blue-50 p-2 rounded-md border border-blue-100">
                        {recommendation.recommendedValue}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Reasoning</h4>
                      <p className="text-sm text-muted-foreground">
                        {recommendation.reasonForRecommendation}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  {recommendation.applied ? (
                    <p className="text-xs text-muted-foreground">
                      Applied on {new Date(recommendation.appliedAt!).toLocaleDateString()}
                    </p>
                  ) : (
                    <Button
                      onClick={() => applySuggestion(recommendation.id)}
                      disabled={loading}
                      size="sm"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Apply Suggestion
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 