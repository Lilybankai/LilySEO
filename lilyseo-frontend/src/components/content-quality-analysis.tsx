"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { AlertCircle, CheckCircle, Info, FileText, List, Image, HelpCircle, Download } from 'lucide-react';

// Types for content analysis
interface ContentQualityMetrics {
  readabilityScore: number;
  avgSentenceLength: number;
  avgParagraphLength: number;
  headingDistribution: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
  };
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
  wordCount: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

interface TopicCluster {
  id: string;
  name: string;
  relevance: number;
  keywords: string[];
  pageCount: number;
}

interface ContentAnalysisProps {
  competitorId: string;
  projectId: string;
}

export function ContentQualityAnalysis({ competitorId, projectId }: ContentAnalysisProps) {
  const [activeTab, setActiveTab] = useState('quality');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentMetrics, setContentMetrics] = useState<ContentQualityMetrics | null>(null);
  const [topicClusters, setTopicClusters] = useState<TopicCluster[]>([]);
  const [comparisonData, setComparisonData] = useState<any>(null);

  // Mock data - in production this would come from API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setContentMetrics({
        readabilityScore: 72,
        avgSentenceLength: 15.3,
        avgParagraphLength: 3.2,
        headingDistribution: {
          h1: 1,
          h2: 5,
          h3: 12,
          h4: 8,
          h5: 2,
          h6: 0
        },
        mediaUsage: {
          images: 12,
          videos: 2,
          infographics: 3
        },
        contentStructure: {
          lists: 8,
          tables: 2,
          blockquotes: 4
        },
        wordCount: 2450,
        grade: 'B'
      });
      
      setTopicClusters([
        {
          id: '1',
          name: 'SEO Fundamentals',
          relevance: 92,
          keywords: ['seo', 'search engine optimization', 'google ranking'],
          pageCount: 28
        },
        {
          id: '2',
          name: 'Content Marketing',
          relevance: 85,
          keywords: ['content strategy', 'blog posts', 'content creation'],
          pageCount: 17
        },
        {
          id: '3',
          name: 'Technical SEO',
          relevance: 78,
          keywords: ['site speed', 'indexing', 'crawlability'],
          pageCount: 12
        }
      ]);
      
      setComparisonData({
        readability: [
          { name: 'Your Site', score: 68 },
          { name: 'Competitor', score: 72 }
        ],
        contentLength: [
          { name: 'Your Site', avgWords: 1850 },
          { name: 'Competitor', avgWords: 2450 }
        ],
        mediaUsage: [
          { name: 'Images', yourSite: 8, competitor: 12 },
          { name: 'Videos', yourSite: 1, competitor: 2 },
          { name: 'Infographics', yourSite: 1, competitor: 3 }
        ],
        radarData: [
          { metric: 'Readability', yourSite: 68, competitor: 72 },
          { metric: 'Content Length', yourSite: 75, competitor: 85 },
          { metric: 'Media Usage', yourSite: 60, competitor: 80 },
          { metric: 'Structure', yourSite: 72, competitor: 75 },
          { metric: 'Keyword Focus', yourSite: 82, competitor: 78 }
        ]
      });
      
      setLoading(false);
    }, 1500);
  }, [competitorId, projectId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-1/3 bg-gray-200 animate-pulse rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      'A': 'bg-green-500',
      'B': 'bg-green-400',
      'C': 'bg-yellow-400',
      'D': 'bg-orange-400',
      'F': 'bg-red-500'
    };
    return colors[grade] || 'bg-gray-400';
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="quality" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quality">Content Quality</TabsTrigger>
          <TabsTrigger value="topics">Topic Clusters</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>
        
        {contentMetrics && (
          <TabsContent value="quality" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Content Quality Assessment</h3>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Overall Grade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center">
                    <div className={`${getGradeColor(contentMetrics.grade)} w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold`}>
                      {contentMetrics.grade}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Readability</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Score</span>
                      <span className="font-medium">{contentMetrics.readabilityScore}/100</span>
                    </div>
                    <Progress value={contentMetrics.readabilityScore} />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Content Length</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col justify-center h-full">
                    <span className="text-2xl font-bold">{contentMetrics.wordCount}</span>
                    <span className="text-sm text-muted-foreground">Avg. Words per Page</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Structure</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      <span>{contentMetrics.avgParagraphLength} ¶/page</span>
                    </div>
                    <div className="flex items-center">
                      <List className="h-4 w-4 mr-1" />
                      <span>{contentMetrics.contentStructure.lists} lists</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Heading Distribution</CardTitle>
                  <CardDescription>How headings are structured across content</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={[
                        { name: 'H1', value: contentMetrics.headingDistribution.h1 },
                        { name: 'H2', value: contentMetrics.headingDistribution.h2 },
                        { name: 'H3', value: contentMetrics.headingDistribution.h3 },
                        { name: 'H4', value: contentMetrics.headingDistribution.h4 },
                        { name: 'H5', value: contentMetrics.headingDistribution.h5 },
                        { name: 'H6', value: contentMetrics.headingDistribution.h6 }
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Media Usage</CardTitle>
                  <CardDescription>Visual content distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={[
                        { name: 'Images', value: contentMetrics.mediaUsage.images },
                        { name: 'Videos', value: contentMetrics.mediaUsage.videos },
                        { name: 'Infographics', value: contentMetrics.mediaUsage.infographics }
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Improvement Opportunities</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Add more H2 headings to improve content structure</li>
                  <li>Consider adding more video content to increase engagement</li>
                  <li>Reduce average sentence length for better readability</li>
                </ul>
              </AlertDescription>
            </Alert>
          </TabsContent>
        )}
        
        <TabsContent value="topics" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Topic Cluster Analysis</h3>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {topicClusters.map(cluster => (
              <Card key={cluster.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{cluster.name}</CardTitle>
                    <Badge variant={cluster.relevance > 85 ? "default" : "secondary"}>
                      {cluster.relevance}% Relevance
                    </Badge>
                  </div>
                  <CardDescription>
                    {cluster.pageCount} pages | {cluster.keywords.length} keywords
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Primary Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {cluster.keywords.map((keyword, i) => (
                          <Badge key={i} variant="outline">{keyword}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Topic coverage compared to your site</span>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">+32%</span>
                        <Badge variant="secondary">Better Coverage</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Alert>
            <HelpCircle className="h-4 w-4" />
            <AlertTitle>Content Gap Opportunity</AlertTitle>
            <AlertDescription>
              We found 2 additional topic clusters that this competitor covers that are missing from your site.
              <Button variant="link" className="p-0 h-auto ml-1">View Details</Button>
            </AlertDescription>
          </Alert>
        </TabsContent>
        
        <TabsContent value="comparison" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Content Comparison</h3>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Readability Comparison</CardTitle>
                <CardDescription>Flesch-Kincaid readability score</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={comparisonData.readability}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="score" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Content Length</CardTitle>
                <CardDescription>Average words per page</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={comparisonData.contentLength}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgWords" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Overall Content Metrics</CardTitle>
                <CardDescription>Comparison across key content metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart outerRadius={90} data={comparisonData.radarData}>
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
          </div>
          
          <Alert className={comparisonData.readability[0].score > comparisonData.readability[1].score ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}>
            {comparisonData.readability[0].score > comparisonData.readability[1].score 
              ? <CheckCircle className="h-4 w-4 text-green-500" />
              : <AlertCircle className="h-4 w-4 text-amber-500" />
            }
            <AlertTitle>
              {comparisonData.readability[0].score > comparisonData.readability[1].score 
                ? "Your content is more readable"
                : "Competitor content is more readable"
              }
            </AlertTitle>
            <AlertDescription>
              {comparisonData.readability[0].score > comparisonData.readability[1].score 
                ? "Your content has better readability scores which can lead to better user engagement."
                : "The competitor's content is easier to read which may lead to better user engagement. Consider reviewing your content for readability improvements."
              }
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
} 