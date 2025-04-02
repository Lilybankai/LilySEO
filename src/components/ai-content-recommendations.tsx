"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { CompetitorWithMetrics } from "@/lib/services/competitor-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Lightbulb, FileText, RefreshCw, Download, ThumbsUp, Copy, AlertCircle, Settings } from 'lucide-react';
import { generateContentRecommendations, RecommendationType } from '@/lib/services/ai-service';
import { isAzureOpenAIConfigured, formatAIError } from '@/lib/utils/azure-ai-check';

interface AIContentRecommendationsProps {
  competitor: CompetitorWithMetrics;
  projectId: string;
}

export function AIContentRecommendations({ competitor, projectId }: AIContentRecommendationsProps) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [recommendationType, setRecommendationType] = useState<RecommendationType>('topics');
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  
  // Use competitor data to generate content recommendations
  const competitorData = competitor.analysis?.metrics.content;
  
  // Get topics based on competitor data
  const recommendedTopics = competitorData?.topTopics || [];
  
  // Check if Azure OpenAI is configured
  useEffect(() => {
    async function checkConfiguration() {
      setLoading(true);
      const configured = await isAzureOpenAIConfigured();
      setIsConfigured(configured);
      setLoading(false);
    }
    
    checkConfiguration();
  }, []);
  
  // Handle topic selection
  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    setGeneratedContent(null);
    setError(null);
  };
  
  // Handle generate content request
  const handleGenerateContent = async () => {
    if (!selectedTopic || !isConfigured) return;
    
    setGenerating(true);
    setError(null);
    
    try {
      const result = await generateContentRecommendations(
        competitor,
        selectedTopic,
        recommendationType
      );
      
      if (result.error) {
        setError(result.error);
        setGeneratedContent(null);
      } else {
        setGeneratedContent(result.content);
      }
    } catch (err) {
      console.error('Error generating content:', err);
      setError(formatAIError(err));
      setGeneratedContent(null);
    } finally {
      setGenerating(false);
    }
  };
  
  const handleCopyToClipboard = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
    }
  };

  // If no competitor content data
  if (!competitorData) {
    return (
      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertTitle>Content data not available</AlertTitle>
        <AlertDescription>
          We need content analysis data to generate AI recommendations. Try running a content analysis on this competitor first.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Display loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="flex flex-col items-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Checking AI service availability...</p>
        </div>
      </div>
    );
  }
  
  // If Azure OpenAI is not configured
  if (!isConfigured) {
    return (
      <Alert variant="destructive">
        <Settings className="h-4 w-4" />
        <AlertTitle>AI Service Not Configured</AlertTitle>
        <AlertDescription>
          The Azure OpenAI integration is not properly configured. Please contact your administrator to set up the AI service.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            AI Content Recommendations
          </h2>
          <p className="text-sm text-muted-foreground">
            Based on competitor content analysis
          </p>
        </div>
        
        <Tabs defaultValue="topics" onValueChange={(value) => setRecommendationType(value as RecommendationType)} className="w-auto">
          <TabsList>
            <TabsTrigger value="topics">Topic Clusters</TabsTrigger>
            <TabsTrigger value="outlines">Article Outlines</TabsTrigger>
            <TabsTrigger value="titles">Article Titles</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Topics</CardTitle>
              <CardDescription>
                Based on competitor content and industry trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recommendedTopics.map((topic, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${selectedTopic === topic ? 'bg-primary/10 border border-primary/30' : 'hover:bg-secondary/50 border border-transparent'}`}
                    onClick={() => handleTopicSelect(topic)}
                  >
                    <div className="flex items-center">
                      <Lightbulb className={`h-4 w-4 mr-2 ${selectedTopic === topic ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={selectedTopic === topic ? 'font-medium text-primary' : ''}>{topic}</span>
                    </div>
                    {selectedTopic === topic && (
                      <Badge variant="default" className="ml-2">Selected</Badge>
                    )}
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              <Button 
                className="w-full" 
                onClick={handleGenerateContent}
                disabled={!selectedTopic || generating}
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Recommendations
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Content Gap Opportunity</AlertTitle>
            <AlertDescription>
              Your competitor is ranking well for {competitorData.topTopics.length} key topics. Select a topic to generate content ideas that can help you outrank them.
            </AlertDescription>
          </Alert>
        </div>
        
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>AI Generated Recommendations</CardTitle>
                  <CardDescription>
                    {selectedTopic 
                      ? `Generated content for "${selectedTopic}"`
                      : 'Select a topic to generate recommendations'
                    }
                  </CardDescription>
                </div>
                
                {generatedContent && (
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {generating ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Generating {recommendationType} for "{selectedTopic}"</p>
                    <p className="text-sm text-muted-foreground mt-2">This might take a moment...</p>
                  </div>
                </div>
              ) : generatedContent ? (
                <div className="relative h-[400px]">
                  <Textarea 
                    className="h-full font-mono text-sm p-4 whitespace-pre-wrap"
                    value={generatedContent}
                    readOnly
                  />
                  <div className="absolute bottom-4 right-4 flex space-x-2">
                    <Button size="sm" variant="secondary">
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Great
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleGenerateContent}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center border rounded-md">
                  <div className="text-center p-6 max-w-md">
                    <Sparkles className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">Generate AI Recommendations</h3>
                    <p className="text-muted-foreground mb-4">
                      Select a topic from the left panel and click "Generate Recommendations" to create AI-powered content suggestions based on your competitor's strategy.
                    </p>
                    {!selectedTopic && (
                      <Badge variant="secondary" className="mx-auto">
                        Select a topic to start
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 