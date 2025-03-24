"use client"

import * as React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BrainCog, Lightbulb, AlertTriangle, CheckCircle, InfoIcon, PlusCircle, FileText, Search, Edit } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface AiRecommendation {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  impact?: string;
  implementation?: string;
  cms?: {
    platform: string;
    specificSteps: string[];
    recommendedPlugins?: string[];
  };
}

interface AiRecommendationsProps {
  recommendations: AiRecommendation[];
  onAddToTodo?: (issueId: string, recommendation: string) => void;
  crawledPages?: any[]; // Add crawled pages for content gap analysis
  projectSettings?: any; // Add project settings for keyword targeting info
}

export function AiRecommendations({ 
  recommendations, 
  onAddToTodo,
  crawledPages = [],
  projectSettings = {}
}: AiRecommendationsProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);
  const [aiInputText, setAiInputText] = useState("");
  const [aiOutputText, setAiOutputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFeature, setActiveFeature] = useState<'recommendations' | 'contentGap' | 'rewrite'>('recommendations');
  
  // Content gap analysis state
  const [contentGapResults, setContentGapResults] = useState<{
    missingTopics: string[];
    suggestedContent: { title: string; description: string; keywords: string[] }[];
  }>({
    missingTopics: [],
    suggestedContent: []
  });

  // Get unique categories from recommendations
  const categories = [...new Set(recommendations.map(rec => rec.category))];

  // Filter recommendations based on active tab
  const filteredRecommendations = 
    activeTab === "all" 
      ? recommendations 
      : recommendations.filter(rec => rec.category === activeTab);

  const toggleExpand = (id: string) => {
    setExpandedRecommendation(prev => prev === id ? null : id);
  };

  const handleAddToTodo = (recommendation: AiRecommendation) => {
    if (onAddToTodo) {
      onAddToTodo(
        recommendation.id, 
        `AI Recommendation: ${recommendation.title} - ${recommendation.description || ''}`
      );
    }
  };

  // Handle AI text rewriting
  const handleRewriteText = async () => {
    if (!aiInputText.trim()) return;
    
    setIsProcessing(true);
    
    try {
      // In a real implementation, this would call an API to the AI service
      // For now, we'll simulate it with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate improved version - in production this would come from the AI service
      setAiOutputText(
        `${aiInputText.trim()}\n\n• Optimized for better SEO structure\n• Added relevant keyword variations\n• Improved readability and flow`
      );
    } catch (error) {
      console.error("Error processing text:", error);
      setAiOutputText("Error processing your text. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle content gap analysis
  const runContentGapAnalysis = async () => {
    setIsProcessing(true);
    
    try {
      // In a real implementation, this would analyze crawled pages against target keywords
      // For now, we'll simulate results
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Get keywords from crawled pages (just for simulation)
      const foundKeywords = new Set<string>();
      crawledPages.forEach(page => {
        const pageContent = [
          page.title,
          page.metaDescription,
          ...(page.h1s || []),
          ...(page.h2s || []),
          ...(page.h3s || [])
        ].join(' ').toLowerCase();
        
        ['seo', 'marketing', 'content', 'strategy', 'website', 'analysis'].forEach(keyword => {
          if (pageContent.includes(keyword)) {
            foundKeywords.add(keyword);
          }
        });
      });
      
      // Example target keywords (would come from project settings)
      const targetKeywords = [
        'seo', 'marketing', 'content strategy', 'website optimization', 
        'keyword research', 'backlink analysis', 'technical seo'
      ];
      
      // Find missing topics
      const missingTopics = targetKeywords.filter(
        keyword => !Array.from(foundKeywords).some(found => keyword.includes(found))
      );
      
      // Generate content suggestions
      const suggestedContent = [
        {
          title: 'Ultimate Guide to Technical SEO',
          description: 'Comprehensive guide covering all aspects of technical SEO including site speed, mobile optimization, and structured data.',
          keywords: ['technical seo', 'site speed', 'structured data']
        },
        {
          title: 'How to Build a Content Strategy That Drives Traffic',
          description: 'Learn how to create a content strategy that aligns with your SEO goals and attracts your target audience.',
          keywords: ['content strategy', 'seo content', 'traffic generation']
        },
        {
          title: 'Backlink Building Strategies for 2025',
          description: 'Discover the latest techniques for building high-quality backlinks that improve your domain authority.',
          keywords: ['backlink analysis', 'link building', 'domain authority']
        }
      ];
      
      setContentGapResults({
        missingTopics,
        suggestedContent
      });
    } catch (error) {
      console.error("Error analyzing content gaps:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getPriorityColor = (priority?: string) => {
    if (!priority) return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    
    const map: Record<string, string> = {
      "critical": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      "high": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      "medium": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      "low": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    };
    
    return map[priority.toLowerCase()] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  };

  const getCategoryColor = (category: string) => {
    const map: Record<string, string> = {
      "technical": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
      "performance": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      "content": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      "backlinks": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      "security": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      "mobile": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      "general": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    };
    
    return map[category.toLowerCase()] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  };

  const getPriorityIcon = (priority?: string) => {
    if (!priority) return <InfoIcon className="h-4 w-4" />;
    
    if (priority.toLowerCase() === "critical" || priority.toLowerCase() === "high") {
      return <AlertTriangle className="h-4 w-4" />;
    }
    
    if (priority.toLowerCase() === "low") {
      return <CheckCircle className="h-4 w-4" />;
    }
    
    return <InfoIcon className="h-4 w-4" />;
  };

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCog className="h-5 w-5 text-primary" />
            AI-Powered Recommendations
          </CardTitle>
          <CardDescription>
            No AI recommendations available for this audit.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <BrainCog className="h-6 w-6 text-primary" />
          AI-Powered Recommendations
        </h2>
        <p className="text-muted-foreground">
          Advanced analysis and recommendations for improving your SEO performance
        </p>
      </div>

      {/* Feature Selection Tabs */}
      <Tabs defaultValue="recommendations" value={activeFeature} onValueChange={(value: string) => setActiveFeature(value as 'recommendations' | 'contentGap' | 'rewrite')}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="recommendations" className="flex items-center gap-1">
            <BrainCog className="h-4 w-4" />
            <span>Recommendations</span>
          </TabsTrigger>
          <TabsTrigger value="contentGap" className="flex items-center gap-1">
            <Search className="h-4 w-4" />
            <span>Content Gap</span>
          </TabsTrigger>
          <TabsTrigger value="rewrite" className="flex items-center gap-1">
            <Edit className="h-4 w-4" />
            <span>Rewriting</span>
          </TabsTrigger>
        </TabsList>

        {/* AI Recommendations Tab Content */}
        <TabsContent value="recommendations">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 md:flex md:flex-wrap mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              {categories.map(category => (
                <TabsTrigger key={category} value={category} className="capitalize">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab}>
              <div className="grid gap-4">
                {filteredRecommendations.map((recommendation) => (
                  <Card key={recommendation.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 mr-4">
                          <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Badge className={getPriorityColor(recommendation.priority)}>
                            {recommendation.priority}
                          </Badge>
                          <Badge className={getCategoryColor(recommendation.category)}>
                            {recommendation.category}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      {/* Recommendation description */}
                      {recommendation.description && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {recommendation.description}
                        </p>
                      )}
                      
                      {/* Expandable implementation details */}
                      {recommendation.implementation && (
                        <div className="mb-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => toggleExpand(recommendation.id)}
                            className="mb-2"
                          >
                            <Lightbulb className="h-4 w-4 mr-1" />
                            {expandedRecommendation === recommendation.id ? "Hide" : "Show"} Implementation Details
                          </Button>
                          
                          {expandedRecommendation === recommendation.id && (
                            <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                              <p className="font-medium mb-1">Implementation:</p>
                              <p className="whitespace-pre-line">{recommendation.implementation}</p>
                              
                              {/* CMS Specific Guide if available */}
                              {recommendation.cms && (
                                <div className="mt-3 border-t pt-3">
                                  <p className="font-medium">
                                    {recommendation.cms.platform} Specific Steps:
                                  </p>
                                  <ul className="list-disc pl-5 mt-1 space-y-1">
                                    {recommendation.cms.specificSteps.map((step, i) => (
                                      <li key={i}>{step}</li>
                                    ))}
                                  </ul>
                                  
                                  {recommendation.cms.recommendedPlugins && recommendation.cms.recommendedPlugins.length > 0 && (
                                    <>
                                      <p className="font-medium mt-2">Recommended Plugins:</p>
                                      <ul className="list-disc pl-5 mt-1 space-y-1">
                                        {recommendation.cms.recommendedPlugins.map((plugin, i) => (
                                          <li key={i}>{plugin}</li>
                                        ))}
                                      </ul>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Add to todo button */}
                      {onAddToTodo && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleAddToTodo(recommendation)}
                        >
                          <PlusCircle className="h-4 w-4 mr-1" />
                          Add to Todo List
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {filteredRecommendations.length === 0 && (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">
                        No recommendations available for this category.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Content Gap Analysis Tab Content */}
        <TabsContent value="contentGap">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Content Gap Analysis
                </CardTitle>
                <CardDescription>
                  Identify missing topics and content opportunities based on your website's current content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <Button 
                    onClick={runContentGapAnalysis} 
                    disabled={isProcessing}
                    className="w-full sm:w-auto"
                  >
                    {isProcessing ? "Analyzing..." : "Run Content Gap Analysis"}
                  </Button>
                </div>

                {contentGapResults.missingTopics.length > 0 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Missing Topics</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        These topics are not adequately covered on your website:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {contentGapResults.missingTopics.map((topic, index) => (
                          <Badge key={index} variant="outline" className="text-sm">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Suggested Content</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Consider creating the following content to improve your coverage:
                      </p>
                      <div className="space-y-3">
                        {contentGapResults.suggestedContent.map((suggestion, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <h4 className="font-medium">{suggestion.title}</h4>
                              <p className="text-sm text-muted-foreground my-2">
                                {suggestion.description}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {suggestion.keywords.map((keyword, kidx) => (
                                  <Badge key={kidx} variant="secondary" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                              {onAddToTodo && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-3"
                                  onClick={() => onAddToTodo(
                                    `content-${index}`,
                                    `Create content: ${suggestion.title} - ${suggestion.description}`
                                  )}
                                >
                                  <PlusCircle className="h-4 w-4 mr-1" />
                                  Add to Todo List
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Rewriting Tab Content */}
        <TabsContent value="rewrite">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-primary" />
                  AI Rewriting & Summaries
                </CardTitle>
                <CardDescription>
                  Optimize your content with AI assistance to improve SEO structure, keyword usage, and readability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Paste your content below:
                    </label>
                    <Textarea 
                      value={aiInputText}
                      onChange={(e) => setAiInputText(e.target.value)}
                      placeholder="Enter your content here..."
                      className="min-h-[150px]"
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      onClick={handleRewriteText}
                      disabled={!aiInputText.trim() || isProcessing}
                    >
                      {isProcessing ? "Processing..." : "Optimize for SEO"}
                    </Button>
                  </div>
                  
                  {aiOutputText && (
                    <div className="mt-6">
                      <label className="block text-sm font-medium mb-1">
                        Optimized content:
                      </label>
                      <div className="p-4 border rounded-md bg-muted/50 min-h-[150px] whitespace-pre-line">
                        {aiOutputText}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 