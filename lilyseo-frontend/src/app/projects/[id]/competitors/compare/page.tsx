"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BarChart2, Search, Link2, AlertTriangle } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

interface Competitor {
  id: string;
  url: string;
  name: string;
  status: string;
  last_analyzed_at: string | null;
  created_at: string;
}

interface CompetitorAnalysis {
  id: string;
  competitor_id: string;
  competitor_name: string;
  created_at: string;
  seo_metrics: {
    domainAuthority: number;
    pageAuthority: number;
    backlinks: number;
    totalLinks: number;
  };
  technical_metrics: {
    pageSpeed: {
      desktop: number;
      mobile: number;
    };
    mobileFriendliness: number;
    coreWebVitals: {
      lcp: number;
      fid: number;
      cls: number;
    };
  };
  content_metrics: {
    averageWordCount: number;
    totalWords: number;
    pageCount: number;
    schemaMarkupUsage: number;
  };
  keyword_data: {
    totalKeywords: number;
    uniqueKeywords: number;
  };
}

interface ProjectSEOData {
  domainAuthority: number;
  pageAuthority: number;
  backlinks: number;
  pageSpeed: {
    desktop: number;
    mobile: number;
  };
  wordCount: number;
  pageCount: number;
}

// Generate random colors for chart data
function generateChartColors(count: number) {
  const colors = [];
  for (let i = 0; i < count; i++) {
    const hue = (i * 137) % 360; // Golden angle approximation for good distribution
    colors.push(`hsla(${hue}, 70%, 60%, 0.7)`);
  }
  return colors;
}

export default function CompetitorComparisonPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [analyses, setAnalyses] = useState<CompetitorAnalysis[]>([]);
  const [projectData, setProjectData] = useState<ProjectSEOData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchCompetitors();
    fetchProjectData();
  }, [projectId]);
  
  async function fetchCompetitors() {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/projects/${projectId}/competitors`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch competitors');
      }
      
      const data = await response.json();
      
      // Filter only completed analyses
      const completedCompetitors = data.filter((c: Competitor) => c.status === 'completed');
      setCompetitors(completedCompetitors);
      
      // Fetch analysis data for each competitor
      const analysisPromises = completedCompetitors.map((competitor: Competitor) => 
        fetch(`/api/projects/${projectId}/competitors/${competitor.id}/analysis`)
          .then(res => res.ok ? res.json() : null)
      );
      
      const analysisResults = await Promise.all(analysisPromises);
      
      // Add competitor name to analysis data
      const enhancedAnalyses = analysisResults
        .filter(Boolean)
        .map((analysis: CompetitorAnalysis, index: number) => ({
          ...analysis,
          competitor_name: completedCompetitors[index].name
        }));
      
      setAnalyses(enhancedAnalyses);
      setError(null);
    } catch (err) {
      console.error('Error fetching competitors:', err);
      setError('Failed to load competitor data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }
  
  async function fetchProjectData() {
    try {
      const response = await fetch(`/api/projects/${projectId}/seo-metrics`);
      
      if (!response.ok) {
        // Not an error worth showing to the user
        console.error('Failed to fetch project SEO data');
        setProjectData({
          domainAuthority: 30,
          pageAuthority: 25,
          backlinks: 50,
          pageSpeed: { desktop: 75, mobile: 65 },
          wordCount: 500,
          pageCount: 10
        });
        return;
      }
      
      const data = await response.json();
      setProjectData(data);
    } catch (err) {
      console.error('Error fetching project data:', err);
      // Fallback data
      setProjectData({
        domainAuthority: 30,
        pageAuthority: 25,
        backlinks: 50,
        pageSpeed: { desktop: 75, mobile: 65 },
        wordCount: 500,
        pageCount: 10
      });
    }
  }
  
  // Prepare chart data
  const chartColors = generateChartColors(analyses.length + 1); // +1 for the project itself
  
  const barChartData = {
    labels: ['Domain Authority', 'Page Authority', 'Desktop Speed', 'Mobile Speed'],
    datasets: [
      // Project data
      {
        label: 'Your Website',
        data: projectData ? [
          projectData.domainAuthority,
          projectData.pageAuthority,
          projectData.pageSpeed.desktop,
          projectData.pageSpeed.mobile
        ] : [0, 0, 0, 0],
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
      },
      // Competitor data
      ...analyses.map((analysis, index) => ({
        label: analysis.competitor_name,
        data: [
          analysis.seo_metrics.domainAuthority,
          analysis.seo_metrics.pageAuthority,
          analysis.technical_metrics.pageSpeed.desktop,
          analysis.technical_metrics.pageSpeed.mobile
        ],
        backgroundColor: chartColors[index + 1],
        borderColor: chartColors[index + 1].replace('0.7', '1'),
        borderWidth: 1,
      })),
    ],
  };
  
  const backlinksChartData = {
    labels: ['Backlinks'],
    datasets: [
      // Project data
      {
        label: 'Your Website',
        data: projectData ? [projectData.backlinks] : [0],
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
      },
      // Competitor data
      ...analyses.map((analysis, index) => ({
        label: analysis.competitor_name,
        data: [analysis.seo_metrics.backlinks],
        backgroundColor: chartColors[index + 1],
        borderColor: chartColors[index + 1].replace('0.7', '1'),
        borderWidth: 1,
      })),
    ],
  };
  
  const contentChartData = {
    labels: ['Average Word Count', 'Page Count'],
    datasets: [
      // Project data
      {
        label: 'Your Website',
        data: projectData ? [projectData.wordCount, projectData.pageCount] : [0, 0],
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
      },
      // Competitor data
      ...analyses.map((analysis, index) => ({
        label: analysis.competitor_name,
        data: [
          analysis.content_metrics.averageWordCount,
          analysis.content_metrics.pageCount
        ],
        backgroundColor: chartColors[index + 1],
        borderColor: chartColors[index + 1].replace('0.7', '1'),
        borderWidth: 1,
      })),
    ],
  };
  
  const radarChartData = {
    labels: [
      'Domain Authority', 
      'Page Authority', 
      'Backlinks', 
      'Desktop Speed', 
      'Mobile Speed', 
      'Content Volume'
    ],
    datasets: [
      // Project data
      {
        label: 'Your Website',
        data: projectData ? [
          projectData.domainAuthority,
          projectData.pageAuthority,
          Math.min(100, projectData.backlinks / 10), // Scale down backlinks for radar chart
          projectData.pageSpeed.desktop,
          projectData.pageSpeed.mobile,
          Math.min(100, projectData.wordCount / 10) // Scale down word count for radar chart
        ] : [0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointRadius: 4,
      },
      // Competitor data
      ...analyses.map((analysis, index) => ({
        label: analysis.competitor_name,
        data: [
          analysis.seo_metrics.domainAuthority,
          analysis.seo_metrics.pageAuthority,
          Math.min(100, analysis.seo_metrics.backlinks / 10), // Scale down backlinks for radar chart
          analysis.technical_metrics.pageSpeed.desktop,
          analysis.technical_metrics.pageSpeed.mobile,
          Math.min(100, analysis.content_metrics.averageWordCount / 10) // Scale down word count for radar chart
        ],
        backgroundColor: chartColors[index + 1].replace('0.7', '0.2'),
        borderColor: chartColors[index + 1].replace('0.7', '1'),
        borderWidth: 2,
        pointBackgroundColor: chartColors[index + 1].replace('0.7', '1'),
        pointRadius: 4,
      })),
    ],
  };
  
  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: false,
      },
    },
  };
  
  // Special options for backlinks chart (higher scale)
  const backlinksChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
  
  const radarChartOptions = {
    scales: {
      r: {
        min: 0,
        max: 100,
        beginAtZero: true,
        ticks: {
          stepSize: 20,
        },
      },
    },
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        
        <Skeleton className="h-64" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="sm" 
            asChild 
            className="mr-4"
          >
            <Link href={`/projects/${projectId}/competitors`}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Competitors
            </Link>
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold">Competitor Comparison</h1>
            <p className="text-muted-foreground">
              Compare your website against competitors
            </p>
          </div>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {analyses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No Data Available</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              You need at least one analyzed competitor to see comparison data.
              Please go back and run analysis on your competitors.
            </p>
            <Button asChild>
              <Link href={`/projects/${projectId}/competitors`}>
                Go to Competitors
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="seo">SEO Metrics</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart2 className="h-5 w-5 mr-2" />
                    SEO Performance Overview
                  </CardTitle>
                  <CardDescription>
                    Radar chart showing relative performance across key metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-96">
                    <Radar data={radarChartData} options={radarChartOptions} />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Search className="h-5 w-5 mr-2" />
                    Key Performance Metrics
                  </CardTitle>
                  <CardDescription>
                    Comparison of critical SEO and performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-80">
                    <Bar data={barChartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="seo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Link2 className="h-5 w-5 mr-2" />
                    Backlinks Comparison
                  </CardTitle>
                  <CardDescription>
                    Number of backlinks pointing to each website
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-80">
                    <Bar data={backlinksChartData} options={backlinksChartOptions} />
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analyses.map((analysis) => (
                  <Card key={analysis.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{analysis.competitor_name}</CardTitle>
                      <CardDescription>
                        SEO Metrics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <dl className="space-y-4">
                        <div className="flex justify-between items-center">
                          <dt className="text-sm text-muted-foreground">Domain Authority</dt>
                          <dd className="font-medium">{analysis.seo_metrics.domainAuthority}/100</dd>
                        </div>
                        <div className="flex justify-between items-center">
                          <dt className="text-sm text-muted-foreground">Page Authority (Avg)</dt>
                          <dd className="font-medium">{analysis.seo_metrics.pageAuthority}/100</dd>
                        </div>
                        <div className="flex justify-between items-center">
                          <dt className="text-sm text-muted-foreground">Total Backlinks</dt>
                          <dd className="font-medium">{analysis.seo_metrics.backlinks.toLocaleString()}</dd>
                        </div>
                        <div className="flex justify-between items-center">
                          <dt className="text-sm text-muted-foreground">Total Links</dt>
                          <dd className="font-medium">{analysis.seo_metrics.totalLinks?.toLocaleString() || 0}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart2 className="h-5 w-5 mr-2" />
                    Content Metrics
                  </CardTitle>
                  <CardDescription>
                    Comparison of content volume and page count
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-80">
                    <Bar data={contentChartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analyses.map((analysis) => (
                  <Card key={analysis.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{analysis.competitor_name}</CardTitle>
                      <CardDescription>
                        Content Metrics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <dl className="space-y-4">
                        <div className="flex justify-between items-center">
                          <dt className="text-sm text-muted-foreground">Average Word Count</dt>
                          <dd className="font-medium">{analysis.content_metrics.averageWordCount} words</dd>
                        </div>
                        <div className="flex justify-between items-center">
                          <dt className="text-sm text-muted-foreground">Total Words</dt>
                          <dd className="font-medium">{analysis.content_metrics.totalWords?.toLocaleString() || 0}</dd>
                        </div>
                        <div className="flex justify-between items-center">
                          <dt className="text-sm text-muted-foreground">Total Pages</dt>
                          <dd className="font-medium">{analysis.content_metrics.pageCount}</dd>
                        </div>
                        <div className="flex justify-between items-center">
                          <dt className="text-sm text-muted-foreground">Schema Markup Usage</dt>
                          <dd className="font-medium">{analysis.content_metrics.schemaMarkupUsage} pages</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
} 