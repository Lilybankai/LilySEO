"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { CompetitorWithMetrics } from "@/lib/services/competitor-service";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { AlertCircle, CheckCircle, FileText, InfoIcon, Download, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';

interface ContentComparisonProps {
  competitor: CompetitorWithMetrics;
  projectId: string;
  yourSiteData?: {
    totalPages: number;
    avgWordCount: number;
    readabilityScore: number;
    contentGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    topTopics: string[];
    mediaUsage: {
      images: number;
      videos: number;
      infographics: number;
    };
    contentStructure: {
      lists: number;
      tables: number;
      blockquotes: number;
    };
  };
}

export function ContentComparison({ competitor, projectId, yourSiteData }: ContentComparisonProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use provided data or mock data for demonstration
  const competitorData = competitor.analysis?.metrics.content;
  
  // If no content metrics are available, show an error
  if (!competitorData) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Content metrics not available</AlertTitle>
        <AlertDescription>
          No content metrics are available for this competitor. Try running a new analysis.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Use mock data for your site if not provided
  const yourSite = yourSiteData || {
    totalPages: 185,
    avgWordCount: 1450,
    readabilityScore: 68,
    contentGrade: 'C',
    topTopics: ['SEO', 'Digital Marketing', 'Web Design', 'UX/UI', 'Analytics'],
    mediaUsage: {
      images: 8,
      videos: 1,
      infographics: 1
    },
    contentStructure: {
      lists: 6,
      tables: 1,
      blockquotes: 3
    }
  };
  
  // Prepare comparison data for charts
  const overviewComparisonData = [
    { 
      metric: 'Total Pages', 
      yourSite: yourSite.totalPages, 
      competitor: competitorData.totalPages,
      difference: ((competitorData.totalPages - yourSite.totalPages) / yourSite.totalPages * 100).toFixed(1)
    },
    { 
      metric: 'Avg Word Count', 
      yourSite: yourSite.avgWordCount, 
      competitor: competitorData.avgWordCount,
      difference: ((competitorData.avgWordCount - yourSite.avgWordCount) / yourSite.avgWordCount * 100).toFixed(1)
    },
    { 
      metric: 'Readability', 
      yourSite: yourSite.readabilityScore, 
      competitor: competitorData.readabilityScore,
      difference: ((competitorData.readabilityScore - yourSite.readabilityScore) / yourSite.readabilityScore * 100).toFixed(1)
    }
  ];
  
  // Prepare radar chart data
  const radarData = [
    { metric: 'Content Volume', yourSite: (yourSite.totalPages / Math.max(yourSite.totalPages, competitorData.totalPages)) * 100, competitor: (competitorData.totalPages / Math.max(yourSite.totalPages, competitorData.totalPages)) * 100 },
    { metric: 'Content Depth', yourSite: (yourSite.avgWordCount / Math.max(yourSite.avgWordCount, competitorData.avgWordCount)) * 100, competitor: (competitorData.avgWordCount / Math.max(yourSite.avgWordCount, competitorData.avgWordCount)) * 100 },
    { metric: 'Readability', yourSite: yourSite.readabilityScore, competitor: competitorData.readabilityScore },
    { metric: 'Content Quality', yourSite: convertGradeToNumber(yourSite.contentGrade), competitor: convertGradeToNumber(competitorData.contentGrade) },
    { metric: 'Topic Relevance', yourSite: 75, competitor: 82 },
  ];
  
  // Media usage comparison data
  const mediaComparisonData = [
    { name: 'Images', yourSite: yourSite.mediaUsage.images, competitor: competitorData.avgWordCount > 1500 ? Math.round(competitorData.totalPages * 0.6) : Math.round(competitorData.totalPages * 0.3) },
    { name: 'Videos', yourSite: yourSite.mediaUsage.videos, competitor: competitorData.avgWordCount > 1500 ? Math.round(competitorData.totalPages * 0.1) : Math.round(competitorData.totalPages * 0.05) },
    { name: 'Infographics', yourSite: yourSite.mediaUsage.infographics, competitor: competitorData.avgWordCount > 1500 ? Math.round(competitorData.totalPages * 0.05) : Math.round(competitorData.totalPages * 0.02) },
  ];
  
  // Helper function to convert grade to number
  function convertGradeToNumber(grade: string): number {
    const gradeMap: Record<string, number> = {
      'A': 90,
      'B': 80,
      'C': 70,
      'D': 60,
      'F': 50
    };
    return gradeMap[grade] || 50;
  }
  
  // Get color for difference indicators
  function getDifferenceColor(value: number, higherIsBetter: boolean = true): string {
    if (higherIsBetter) {
      return value > 0 ? 'text-green-500' : 'text-red-500';
    } else {
      return value < 0 ? 'text-green-500' : 'text-red-500';
    }
  }
  
  // Generate content recommendations based on comparison
  function getContentRecommendations(): { title: string; description: string; priority: 'high' | 'medium' | 'low' }[] {
    const recommendations: { title: string; description: string; priority: 'high' | 'medium' | 'low' }[] = [];
    
    // If competitorData is undefined, return empty recommendations
    if (!competitorData) return recommendations;
    
    if (yourSite.avgWordCount < competitorData.avgWordCount) {
      recommendations.push({
        title: 'Increase content length',
        description: `Your average content length (${yourSite.avgWordCount} words) is ${Math.abs(parseInt(overviewComparisonData[1].difference))}% shorter than your competitor's (${competitorData.avgWordCount} words). Consider expanding your content with more in-depth information.`,
        priority: parseInt(overviewComparisonData[1].difference) > 20 ? 'high' : 'medium'
      });
    }
    
    if (yourSite.readabilityScore < competitorData.readabilityScore) {
      recommendations.push({
        title: 'Improve content readability',
        description: `Your content readability score (${yourSite.readabilityScore}) is lower than your competitor's (${competitorData.readabilityScore}). Consider simplifying sentence structure and using more accessible language.`,
        priority: parseInt(overviewComparisonData[2].difference) > 15 ? 'high' : 'medium'
      });
    }
    
    if (yourSite.totalPages < competitorData.totalPages) {
      recommendations.push({
        title: 'Create more content',
        description: `Your competitor has ${competitorData.totalPages - yourSite.totalPages} more pages than your site. Consider creating more content pieces targeting relevant topics in your industry.`,
        priority: parseInt(overviewComparisonData[0].difference) > 30 ? 'high' : 'medium'
      });
    }
    
    if (yourSite.mediaUsage.images < mediaComparisonData[0].competitor) {
      recommendations.push({
        title: 'Add more visual content',
        description: 'Your competitor uses more images, videos, and infographics in their content. Visual content can improve engagement and time on page.',
        priority: 'medium'
      });
    }
    
    // Always recommend topic expansion
    recommendations.push({
      title: 'Expand topic coverage',
      description: `Analyze the competitor's top topics (${competitorData.topTopics.join(', ')}) and identify gaps in your content strategy.`,
      priority: 'high'
    });
    
    return recommendations;
  }
  
  const recommendations = getContentRecommendations();
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Metrics</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {overviewComparisonData.map((item, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{item.metric}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Your Site</span>
                      <span className="font-medium">{item.yourSite}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Competitor</span>
                      <span className="font-medium">{item.competitor}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Difference</span>
                      <div className="flex items-center">
                        {parseFloat(item.difference) > 0 ? (
                          <ArrowUpRight className={`w-4 h-4 mr-1 ${getDifferenceColor(parseFloat(item.difference))}`} />
                        ) : (
                          <ArrowDownRight className={`w-4 h-4 mr-1 ${getDifferenceColor(parseFloat(item.difference))}`} />
                        )}
                        <span className={`font-medium ${getDifferenceColor(parseFloat(item.difference))}`}>
                          {Math.abs(parseFloat(item.difference))}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Content Quality Radar</CardTitle>
              <CardDescription>Comparison of content quality metrics</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={150} data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Your Site" dataKey="yourSite" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Radar name="Competitor" dataKey="competitor" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Content Gap Analysis</AlertTitle>
            <AlertDescription>
              Your competitor's content is {competitorData.avgWordCount > yourSite.avgWordCount ? 'longer' : 'shorter'} and has a {competitorData.readabilityScore > yourSite.readabilityScore ? 'better' : 'worse'} readability score. They also cover {competitorData.topTopics.filter(topic => !yourSite.topTopics.includes(topic)).length} topics that your site doesn't cover.
            </AlertDescription>
          </Alert>
        </TabsContent>
        
        <TabsContent value="detailed" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Media Usage Comparison</CardTitle>
                <CardDescription>Images, videos, and infographics used per page</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={mediaComparisonData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="yourSite" name="Your Site" fill="#8884d8" />
                    <Bar dataKey="competitor" name="Competitor" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Topic Coverage</CardTitle>
                <CardDescription>Top topics covered by each site</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Your Site Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {yourSite.topTopics.map((topic, index) => (
                        <Badge key={index} variant={competitorData.topTopics.includes(topic) ? "default" : "secondary"}>
                          {topic}
                          {competitorData.topTopics.includes(topic) && <CheckCircle className="ml-1 h-3 w-3" />}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Competitor Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {competitorData.topTopics.map((topic, index) => (
                        <Badge key={index} variant={yourSite.topTopics.includes(topic) ? "default" : "secondary"}>
                          {topic}
                          {!yourSite.topTopics.includes(topic) && <Zap className="ml-1 h-3 w-3" />}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Alert className="mt-4">
                    <InfoIcon className="h-4 w-4" />
                    <AlertTitle>Topic Gap Opportunity</AlertTitle>
                    <AlertDescription>
                      {competitorData.topTopics.filter(topic => !yourSite.topTopics.includes(topic)).length > 0 ? (
                        <>Your competitor covers {competitorData.topTopics.filter(topic => !yourSite.topTopics.includes(topic)).length} topics that you don't: <strong>{competitorData.topTopics.filter(topic => !yourSite.topTopics.includes(topic)).join(', ')}</strong></>
                      ) : (
                        'You cover all the same topics as your competitor. Consider exploring new topics to gain a competitive edge.'
                      )}
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Strategy Recommendations</CardTitle>
              <CardDescription>Based on competitor analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {recommendations.map((recommendation, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={recommendation.priority === 'high' ? 'default' : 'secondary'}>
                        {recommendation.priority.toUpperCase()}
                      </Badge>
                      <h4 className="font-medium">{recommendation.title}</h4>
                    </div>
                    <p className="text-muted-foreground text-sm">{recommendation.description}</p>
                    <Separator className="my-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Button className="w-full">
            <FileText className="mr-2 h-4 w-4" />
            Generate Detailed Action Plan
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
} 