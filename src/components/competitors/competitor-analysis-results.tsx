import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, BarChart2, ChevronRight, Lightbulb, Search } from 'lucide-react';
import { ErrorAlert } from '@/components/ui/error-alert';

// Types for competitor analysis data
interface CompetitorAnalysis {
  id: string;
  competitor_id: string;
  created_at: string;
  updated_at: string;
  seo_metrics: {
    domainAuthority?: number;
    pageAuthority?: number;
    totalLinks?: number;
    indexedPages?: number;
  };
  content_metrics: {
    averageWordCount?: number;
    totalWords?: number;
    pageCount?: number;
    schemaMarkupUsage?: number;
  };
  technical_metrics: {
    mobileFriendliness?: number;
    coreWebVitals?: {
      lcp?: number; // Largest Contentful Paint
      fid?: number; // First Input Delay
      cls?: number; // Cumulative Layout Shift
    };
    pagespeed?: number;
  };
  insights: {
    strengths?: string[];
    weaknesses?: string[];
    opportunities?: string[];
  };
  keyword_data?: {
    topKeywordGaps?: {
      keyword: string;
      competitorPosition: number;
      volume: number;
      difficulty: number;
    }[];
  };
}

interface CompetitorAnalysisResultsProps {
  projectId: string;
  competitorId: string;
}

export function CompetitorAnalysisResults({ projectId, competitorId }: CompetitorAnalysisResultsProps) {
  const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}/competitors/${competitorId}/analysis`);

        if (!response.ok) {
          if (response.status === 404) {
            // No analysis found, not an error
            setAnalysis(null);
            return;
          }
          throw new Error('Failed to fetch analysis');
        }

        const data = await response.json();
        setAnalysis(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching analysis:', err);
        // Don't set error to avoid error message when analysis doesn't exist yet
      } finally {
        setLoading(false);
      }
    }

    if (projectId && competitorId) {
      fetchAnalysis();
    }
  }, [projectId, competitorId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return <ErrorAlert description={error} />;
  }

  if (!analysis) {
    return (
      <Alert className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No Analysis Available</AlertTitle>
        <AlertDescription>
          This competitor hasn't been analyzed yet. Click "Run Analysis" to start.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
            Insights
          </CardTitle>
          <CardDescription>
            Key observations from competitor analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium mb-2 text-green-600">Strengths</h3>
              <ul className="space-y-2">
                {analysis.insights?.strengths?.map((strength, i) => (
                  <li key={i} className="flex items-start text-sm">
                    <ChevronRight className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0 text-green-600" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-2 text-red-600">Weaknesses</h3>
              <ul className="space-y-2">
                {analysis.insights?.weaknesses?.map((weakness, i) => (
                  <li key={i} className="flex items-start text-sm">
                    <ChevronRight className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0 text-red-600" />
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-2 text-blue-600">Opportunities</h3>
              <ul className="space-y-2">
                {analysis.insights?.opportunities?.map((opportunity, i) => (
                  <li key={i} className="flex items-start text-sm">
                    <ChevronRight className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0 text-blue-600" />
                    <span>{opportunity}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart2 className="h-5 w-5 mr-2" />
              Content Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex justify-between items-center">
                <dt className="text-sm text-muted-foreground">Average Word Count</dt>
                <dd className="font-medium">{analysis.content_metrics?.averageWordCount || 0} words</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-sm text-muted-foreground">Total Pages</dt>
                <dd className="font-medium">{analysis.content_metrics?.pageCount || 0}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-sm text-muted-foreground">Schema Markup Usage</dt>
                <dd className="font-medium">{analysis.content_metrics?.schemaMarkupUsage || 0} pages</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              SEO Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex justify-between items-center">
                <dt className="text-sm text-muted-foreground">Domain Authority</dt>
                <dd className="font-medium">{analysis.seo_metrics?.domainAuthority || 0}/100</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-sm text-muted-foreground">Page Authority (Avg)</dt>
                <dd className="font-medium">{analysis.seo_metrics?.pageAuthority || 0}/100</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-sm text-muted-foreground">Total Backlinks</dt>
                <dd className="font-medium">{analysis.seo_metrics?.totalLinks?.toLocaleString() || 0}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Technical Metrics</CardTitle>
          <CardDescription>
            Key metrics related to this competitor's website performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Mobile Friendliness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {analysis.technical_metrics?.mobileFriendliness || 0}/100
                </div>
                <Progress 
                  value={analysis.technical_metrics?.mobileFriendliness || 0} 
                  className="h-2 mt-2" 
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Higher scores indicate better mobile friendliness
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Core Web Vitals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  <div>
                    <div className="text-sm font-medium">LCP</div>
                    <div className="text-2xl font-bold">
                      {analysis.technical_metrics?.coreWebVitals?.lcp || 0}/100
                    </div>
                    <Progress 
                      value={analysis.technical_metrics?.coreWebVitals?.lcp || 0} 
                      className="h-1 mt-1 w-24" 
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium">FID</div>
                    <div className="text-2xl font-bold">
                      {analysis.technical_metrics?.coreWebVitals?.fid || 0}/100
                    </div>
                    <Progress 
                      value={analysis.technical_metrics?.coreWebVitals?.fid || 0} 
                      className="h-1 mt-1 w-24" 
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium">CLS</div>
                    <div className="text-2xl font-bold">
                      {analysis.technical_metrics?.coreWebVitals?.cls || 0}/100
                    </div>
                    <Progress 
                      value={analysis.technical_metrics?.coreWebVitals?.cls || 0} 
                      className="h-1 mt-1 w-24" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 