"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, AlertTriangle, HelpCircle } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
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

interface CompetitorWithProject {
  id: string;
  name: string;
  url: string;
  status: string;
  project_id: string;
  project_name: string;
  analysis: {
    competitorUrl: string;
    analysisDate: string;
    metrics: {
      domain: string;
      trafficEstimate: number;
      keywordCount: number;
      backlinks: number;
      domainAuthority: number;
      topKeywords: Array<{ keyword: string; position: number; volume: number; difficulty: number; }>;
      contentGaps: Array<{ keyword: string; competitorPosition: number; volume: number; difficulty: number; }>;
      backlinksOverlap: number;
      socialMetrics: { /* Define if needed */ };
      // Add other potential metrics like pageSpeed if they exist in the service
      pageSpeed?: {
        desktop: number;
        mobile: number;
      };
      averageWordCount?: number; // Assuming these might be added later
      pageCount?: number;
    };
    strengthsWeaknesses: {
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
    };
    // Add seoReport if it can exist
    seoReport?: any; // Use a proper type if defined
  } | null;
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

export default function CrossProjectComparisonPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [competitors, setCompetitors] = useState<CompetitorWithProject[]>([]);
  const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>([]);
  const [selectedMetric, setSelectedMetric] = useState('domainAuthority');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchCompetitors();
  }, []);
  
  async function fetchCompetitors() {
    try {
      setLoading(true);
      
      // NOTE: Removed redundant client-side session check. 
      // Authentication is handled by the server-side layout.
      // Data fetching might need adjustment if APIs aren't secured.
      
      // TODO: Fetch projects and competitors via secure API routes instead of direct Supabase calls if needed.
      
      // For now, let's try fetching all competitors using the API endpoint
      const response = await fetch('/api/competitors');
      if (!response.ok) {
        throw new Error('Failed to fetch competitors');
      }
      const { data: competitorsData } = await response.json();
      
      if (!competitorsData || competitorsData.length === 0) {
        setLoading(false);
        return;
      }
      
      // Transform data (assuming API returns similar structure with project name)
      const transformedCompetitors = competitorsData.map((comp: any) => ({
        id: comp.id,
        name: comp.competitor_url, // Use competitor_url as name for now
        url: comp.competitor_url,
        status: comp.status,
        project_id: comp.project_id,
        project_name: comp.projects?.name || 'Unknown Project', // Use nested project name
        analysis: comp.analysis_data // Assuming analysis data is nested
      }));
      
      // Filter out competitors without analysis data or not completed
      const competitorsWithAnalysis = transformedCompetitors.filter(
        (c: CompetitorWithProject) => c.analysis !== null && c.status === 'completed'
      );
      
      setCompetitors(competitorsWithAnalysis);
      
      // Select first 5 competitors by default (or fewer if less are available)
      setSelectedCompetitors(competitorsWithAnalysis.slice(0, 5).map((c: CompetitorWithProject) => c.id));
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching competitors:', err);
      setError(`An error occurred: ${err.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  }
  
  // Get competitor data by ID
  function getCompetitorById(id: string) {
    return competitors.find(c => c.id === id);
  }
  
  // Handle competitor selection
  function toggleCompetitor(id: string) {
    if (selectedCompetitors.includes(id)) {
      setSelectedCompetitors(selectedCompetitors.filter(c => c !== id));
    } else {
      if (selectedCompetitors.length < 10) {
        setSelectedCompetitors([...selectedCompetitors, id]);
      }
    }
  }
  
  // Prepare chart data for the selected metric
  function prepareChartData() {
    const filteredCompetitors = selectedCompetitors
      .map(id => getCompetitorById(id))
      .filter(Boolean) as CompetitorWithProject[];
    
    const chartColors = generateChartColors(filteredCompetitors.length);
    
    const labels = filteredCompetitors.map(c => `${c.name} (${c.project_name})`);
    
    const values = filteredCompetitors.map(c => {
      // Adjust metric access based on the actual structure of analysis_data
      const metrics = c.analysis?.metrics; // Use analysis.metrics

      switch (selectedMetric) {
        case 'domainAuthority':
          return metrics?.domainAuthority || 0;
        case 'pageAuthority':
          // Assuming pageAuthority might not exist in CompetitorMetrics, default to 0
          // If it should exist, add it to CompetitorMetrics type in the service
          return 0; // Placeholder
        case 'backlinks':
          return metrics?.backlinks || 0;
        case 'desktopSpeed':
          // Assuming pageSpeed might not exist, default to 0
          // If it should exist, add it to CompetitorMetrics type
          return 0; // Placeholder
        case 'mobileSpeed':
          // Assuming pageSpeed might not exist, default to 0
          return 0; // Placeholder
        case 'wordCount':
          // Assuming averageWordCount might not exist, default to 0
          return 0; // Placeholder
        case 'pageCount':
          // Assuming pageCount might not exist, default to 0
          return 0; // Placeholder
        default:
          return 0;
      }
    });
    
    return {
      labels,
      datasets: [
        {
          label: getMetricLabel(selectedMetric),
          data: values,
          backgroundColor: chartColors,
          borderColor: chartColors.map(color => color.replace('0.7', '1')), // Make border opaque
          borderWidth: 1,
        },
      ],
    };
  }
  
  // Prepare radar chart data
  function prepareRadarData() {
    const filteredCompetitors = selectedCompetitors
      .map(id => getCompetitorById(id))
      .filter(Boolean) as CompetitorWithProject[];
    
    const chartColors = generateChartColors(filteredCompetitors.length);
    
    const labels = [
      'Domain Authority',
      'Backlinks',
      'Desktop Speed',
      'Mobile Speed',
      'Avg. Word Count'
    ];
    
    const datasets = filteredCompetitors.map((c, index) => {
      const metrics = c.analysis?.metrics; // Use analysis.metrics
      
      // Normalize data (example: scale to 0-100)
      const data = [
        metrics?.domainAuthority || 0,
        (metrics?.backlinks || 0) / 100, // Example normalization
        0, // Placeholder for Desktop Speed
        0, // Placeholder for Mobile Speed
        0, // Placeholder for Avg Word Count
      ].map(val => Math.max(0, Math.min(100, val))); // Clamp values between 0 and 100
      
      return {
        label: `${c.name} (${c.project_name})`,
        data,
        backgroundColor: chartColors[index].replace('0.7', '0.2'), // Lighter fill
        borderColor: chartColors[index],
        pointBackgroundColor: chartColors[index],
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: chartColors[index],
      };
    });
    
    return { labels, datasets };
  }
  
  // Get label for selected metric
  function getMetricLabel(metric: string): string {
    switch (metric) {
      case 'domainAuthority': return 'Domain Authority';
      case 'pageAuthority': return 'Page Authority';
      case 'backlinks': return 'Backlinks Count';
      case 'desktopSpeed': return 'Desktop Page Speed (0-100)';
      case 'mobileSpeed': return 'Mobile Page Speed (0-100)';
      case 'wordCount': return 'Average Word Count';
      case 'pageCount': return 'Indexed Page Count';
      default: return 'Unknown Metric';
    }
  }
  
  // Bar chart options
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Competitor Comparison: ${getMetricLabel(selectedMetric)}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
  
  // Radar chart options
  const radarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Overall Competitor Profile Comparison',
      },
    },
    scales: {
      r: {
        angleLines: { display: false },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="py-6 space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Render no competitors state
  if (competitors.length === 0) {
    return (
      <div className="py-6 text-center">
        <BarChart2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium">No competitor data available</h3>
        <p className="text-sm text-gray-500 mt-2">
          No completed competitor analyses found across your projects.
        </p>
        <Button className="mt-4" asChild>
          <Link href="/competitors">Manage Competitors</Link>
        </Button>
      </div>
    );
  }
  
  // Prepare data for charts
  const chartData = prepareChartData();
  const radarData = prepareRadarData();
  
  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cross-Project Comparison</h1>
        <p className="text-muted-foreground">
          Compare key metrics across selected competitors from different projects.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Competitor Selection Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Select Competitors</CardTitle>
            <CardDescription>Choose up to 10 competitors to compare.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto">
            <div className="space-y-4">
              {competitors.map((competitor) => (
                <div key={competitor.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`competitor-${competitor.id}`}
                    checked={selectedCompetitors.includes(competitor.id)}
                    onCheckedChange={() => toggleCompetitor(competitor.id)}
                    disabled={!selectedCompetitors.includes(competitor.id) && selectedCompetitors.length >= 10}
                  />
                  <Label 
                    htmlFor={`competitor-${competitor.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {competitor.name} <span className="text-xs text-muted-foreground">({competitor.project_name})</span>
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Comparison Charts Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Comparison Charts</CardTitle>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="domainAuthority">Domain Authority</SelectItem>
                  <SelectItem value="pageAuthority">Page Authority</SelectItem>
                  <SelectItem value="backlinks">Backlinks</SelectItem>
                  <SelectItem value="desktopSpeed">Desktop Speed</SelectItem>
                  <SelectItem value="mobileSpeed">Mobile Speed</SelectItem>
                  <SelectItem value="wordCount">Avg. Word Count</SelectItem>
                  <SelectItem value="pageCount">Page Count</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="barChart">
              <TabsList>
                <TabsTrigger value="barChart">Bar Chart</TabsTrigger>
                <TabsTrigger value="radarChart">Radar Chart</TabsTrigger>
              </TabsList>
              <TabsContent value="barChart">
                <div className="h-[400px]">
                  {chartData.labels.length > 0 ? (
                    <Bar options={barChartOptions} data={chartData} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Select competitors to view chart.
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="radarChart">
                <div className="h-[400px]">
                  {radarData.datasets.length > 0 ? (
                    <Radar options={radarChartOptions} data={radarData} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Select competitors to view chart.
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Explanation Card */}
      <Card>
        <CardHeader className="flex flex-row items-center space-x-2">
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Understanding the Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>The **Bar Chart** shows a direct comparison of the selected metric across chosen competitors.</li>
            <li>The **Radar Chart** provides an overall profile comparison across several key metrics (normalized for comparison).</li>
            <li>Select competitors from the list on the left. You can choose competitors from different projects.</li>
            <li>Use the dropdown to change the metric displayed in the Bar Chart.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}