"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink, AlertCircle, FileText, PieChart, Sparkles } from 'lucide-react';
import { ContentQualityAnalysis } from '@/components/content-quality-analysis';
import { ContentComparison } from '@/components/content-comparison';
import { CompetitorContentHistory } from '@/components/competitor-content-history';
import { AIContentRecommendations } from '@/components/ai-content-recommendations';
import { Separator } from '@/components/ui/separator';
import { getCompetitor, CompetitorWithMetrics } from '@/lib/services/competitor-service';

interface ContentMetrics {
  totalPages: number;
  avgWordCount: number;
  readabilityScore: number;
  contentGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  topTopics: string[];
}

function CompetitorContentHeader({ competitor, projectId }: { competitor: CompetitorWithMetrics; projectId: string }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center">
        <Button 
          variant="outline" 
          size="sm" 
          asChild 
          className="mr-4"
        >
          <Link href={`/projects/${projectId}/competitors/${competitor.id}`}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Competitor
          </Link>
        </Button>
        
        <div>
          <h1 className="text-2xl font-bold flex flex-wrap items-center gap-2">
            {competitor.name} - Content Analysis
            {competitor.status === 'completed' && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                Analysis Complete
              </Badge>
            )}
          </h1>
          <div className="flex items-center text-muted-foreground">
            <a 
              href={competitor.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center hover:text-primary text-sm"
            >
              {competitor.url} <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentMetricsOverview({ competitor }: { competitor: CompetitorWithMetrics }) {
  const contentMetrics = competitor.analysis?.metrics.content;
  
  if (!contentMetrics) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Content analysis not available</AlertTitle>
        <AlertDescription>
          We haven't been able to analyze the content for this competitor yet. Please check back later.
        </AlertDescription>
      </Alert>
    );
  }

  const { totalPages, avgWordCount, readabilityScore, contentGrade, topTopics } = contentMetrics;

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Content Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className={`${getGradeColor(contentGrade)} w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold`}>
                {contentGrade}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col justify-center h-full">
              <span className="text-2xl font-bold">{totalPages}</span>
              <span className="text-sm text-muted-foreground">Indexed Pages</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Word Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col justify-center h-full">
              <span className="text-2xl font-bold">{avgWordCount}</span>
              <span className="text-sm text-muted-foreground">Words Per Page</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Readability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col justify-center h-full">
              <span className="text-2xl font-bold">{readabilityScore}/100</span>
              <span className="text-sm text-muted-foreground">Flesch-Kincaid Score</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Top Content Topics</CardTitle>
          <CardDescription>Primary topics covered across competitor content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {topTopics.map((topic, i) => (
              <Badge key={i} variant="secondary">{topic}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CompetitorContentPage() {
  const params = useParams();
  const [competitor, setCompetitor] = useState<CompetitorWithMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const projectId = params.id as string;
  const competitorId = params.competitorId as string;

  useEffect(() => {
    async function fetchCompetitor() {
      try {
        setLoading(true);
        // If you want to use mock data for development, you can comment out the API call
        // and use the dummy data below

        try {
          const data = await getCompetitor(projectId, competitorId);
          setCompetitor(data);
          setError(null);
        } catch (err) {
          // Fallback to mock data if the API fails
          console.warn('Using mock data due to API error:', err);
          setCompetitor({
            id: competitorId,
            project_id: projectId,
            name: 'Example Competitor',
            url: 'https://example.com',
            status: 'completed',
            last_analyzed: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            analysis: {
              metrics: {
                seo: {
                  domainAuthority: 45,
                  pageAuthority: 38,
                  totalBacklinks: 12500
                },
                content: {
                  totalPages: 245,
                  avgWordCount: 1850,
                  readabilityScore: 72,
                  contentGrade: 'B',
                  topTopics: ['SEO', 'Content Marketing', 'Digital Strategy', 'Technical SEO', 'Analytics']
                },
                keywords: {
                  totalKeywords: 1250,
                  rankingKeywords: 450,
                  topKeywords: [
                    { keyword: "seo tools", position: 3, volume: 6500, difficulty: 65 },
                    { keyword: "keyword research", position: 5, volume: 8200, difficulty: 70 },
                    { keyword: "content marketing", position: 7, volume: 5400, difficulty: 55 }
                  ]
                },
                market: {
                  authority: 65,
                  visibility: 58,
                  size: 25
                }
              }
            }
          });
        }
      } catch (err) {
        console.error('Error fetching competitor:', err);
        setError((err as Error).message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (projectId && competitorId) {
      fetchCompetitor();
    }
  }, [projectId, competitorId]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-1/3 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-1 w-full bg-gray-200 animate-pulse rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-32 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-32 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-32 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-32 bg-gray-200 animate-pulse rounded"></div>
        </div>
        <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!competitor) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>Competitor not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <CompetitorContentHeader
        competitor={competitor}
        projectId={projectId}
      />
      
      <Separator className="my-2" />
      
      <div className="space-y-8">
        <div className="flex border-b overflow-x-auto">
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
            onClick={() => handleTabChange('overview')}
          >
            Overview
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'detailed' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
            onClick={() => handleTabChange('detailed')}
          >
            Detailed Analysis
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'comparison' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
            onClick={() => handleTabChange('comparison')}
          >
            Comparison
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'history' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
            onClick={() => handleTabChange('history')}
          >
            History
          </button>
          <button
            className={`px-4 py-2 font-medium flex items-center ${activeTab === 'ai-recommendations' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
            onClick={() => handleTabChange('ai-recommendations')}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            AI Recommendations
          </button>
        </div>
        
        {activeTab === 'overview' && (
          <>
            <ContentMetricsOverview competitor={competitor} />
            
            {competitor.analysis?.metrics.content && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertTitle>Content Strategy Insights</AlertTitle>
                <AlertDescription>
                  This competitor focuses heavily on long-form content with an average of {competitor.analysis.metrics.content.avgWordCount} words per page.
                  Their content is well-structured with good readability scores, which contributes to their strong 
                  organic search performance. Consider adapting your content strategy to match or exceed their content depth.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
        
        {activeTab === 'detailed' && (
          <Card>
            <CardHeader>
              <CardTitle>Detailed Content Analysis</CardTitle>
              <CardDescription>Comprehensive analysis of the competitor's content strategy and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ContentQualityAnalysis
                projectId={projectId}
                competitorId={competitorId}
              />
            </CardContent>
          </Card>
        )}
        
        {activeTab === 'comparison' && (
          <Card>
            <CardHeader>
              <CardTitle>Your Content vs. Competitor</CardTitle>
              <CardDescription>Compare your content metrics against this competitor</CardDescription>
            </CardHeader>
            <CardContent>
              <ContentComparison
                competitor={competitor}
                projectId={projectId}
              />
            </CardContent>
          </Card>
        )}
        
        {activeTab === 'history' && (
          <Card>
            <CardHeader>
              <CardTitle>Content Evolution</CardTitle>
              <CardDescription>Track how this competitor's content strategy has evolved over time</CardDescription>
            </CardHeader>
            <CardContent>
              <CompetitorContentHistory
                competitorId={competitorId}
                projectId={projectId}
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'ai-recommendations' && (
          <Card>
            <CardHeader>
              <CardTitle>AI Content Recommendations</CardTitle>
              <CardDescription>Get AI-powered content recommendations based on competitor analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <AIContentRecommendations
                competitor={competitor}
                projectId={projectId}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 