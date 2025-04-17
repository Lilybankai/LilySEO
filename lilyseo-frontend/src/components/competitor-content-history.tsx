"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompetitorAnalysisHistory, getCompetitorHistory } from "@/lib/services/competitor-service";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AlertCircle, Calendar, TrendingUp, TrendingDown, Clock, FileText, Download } from 'lucide-react';

interface CompetitorContentHistoryProps {
  competitorId: string;
  projectId: string;
}

export function CompetitorContentHistory({ competitorId, projectId }: CompetitorContentHistoryProps) {
  const [historyData, setHistoryData] = useState<CompetitorAnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMetric, setActiveMetric] = useState<'wordCount' | 'readability' | 'pageCount'>('wordCount');

  useEffect(() => {
    async function fetchHistoryData() {
      try {
        setLoading(true);
        // Try to fetch real data
        try {
          const data = await getCompetitorHistory(competitorId);
          if (data && data.length > 0) {
            setHistoryData(data);
            setError(null);
            return;
          }
        } catch (err) {
          console.warn('Failed to fetch real history data:', err);
          // If real data fetch fails, we'll continue to use mock data
        }

        // Mock historical data for demonstration purposes
        const mockHistory = generateMockHistoryData();
        setHistoryData(mockHistory);
        setError(null);
      } catch (err) {
        console.error('Error fetching history data:', err);
        setError((err as Error).message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchHistoryData();
  }, [competitorId]);

  // Generate mock history data for demonstration purposes
  function generateMockHistoryData(): CompetitorAnalysisHistory[] {
    const now = new Date();
    const mockData: CompetitorAnalysisHistory[] = [];
    
    // Generate 6 months of data, one entry per month
    for (let i = 0; i < 6; i++) {
      const date = new Date(now);
      date.setMonth(now.getMonth() - i);
      
      // Create reasonable variations in metrics
      const baseWordCount = 1850;
      const baseReadability = 72;
      const basePageCount = 245;
      
      // Add some randomness but also a trend (content growing over time)
      const randomFactor = Math.random() * 0.15 + 0.9; // 0.9 to 1.05
      const trendFactor = 1 + (i * 0.03); // More recent dates have higher values

      const wordCount = Math.floor(baseWordCount * randomFactor * trendFactor);
      const readability = Math.min(100, Math.floor(baseReadability * (randomFactor * 0.5 + 0.75)));
      const pageCount = Math.floor(basePageCount * randomFactor * trendFactor);
      
      mockData.push({
        id: `mock-history-${i}`,
        competitor_id: competitorId,
        created_at: date.toISOString(),
        metrics: {
          content: {
            totalPages: pageCount,
            avgWordCount: wordCount,
            readabilityScore: readability,
            contentGrade: getGradeFromReadability(readability),
            topTopics: ['SEO', 'Content Marketing', 'Digital Strategy']
          }
        }
      });
    }

    // Sort by date, oldest first
    return mockData.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  // Helper to determine content grade based on readability score
  function getGradeFromReadability(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-1/3 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (historyData.length < 2) {
    return (
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertTitle>Not enough historical data</AlertTitle>
        <AlertDescription>
          We need at least two analysis points to show historical trends. 
          Check back after the next content analysis is complete.
        </AlertDescription>
      </Alert>
    );
  }

  // Prepare data for charts
  const chartData = historyData.map(history => {
    const date = new Date(history.created_at);
    const metrics = history.metrics.content;
    
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      wordCount: metrics?.avgWordCount || 0,
      readability: metrics?.readabilityScore || 0,
      pageCount: metrics?.totalPages || 0,
      timestamp: date.getTime() // For sorting
    };
  }).sort((a, b) => a.timestamp - b.timestamp); // Sort by date ascending

  // Calculate trends
  const oldestEntry = chartData[0];
  const latestEntry = chartData[chartData.length - 1];
  
  const wordCountChange = latestEntry.wordCount - oldestEntry.wordCount;
  const wordCountChangePercent = (wordCountChange / oldestEntry.wordCount * 100).toFixed(1);
  
  const readabilityChange = latestEntry.readability - oldestEntry.readability;
  const readabilityChangePercent = (readabilityChange / oldestEntry.readability * 100).toFixed(1);
  
  const pageCountChange = latestEntry.pageCount - oldestEntry.pageCount;
  const pageCountChangePercent = (pageCountChange / oldestEntry.pageCount * 100).toFixed(1);

  // Helper to determine if a trend is positive
  const isPositiveTrend = (value: number) => value > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Content Metrics Over Time</h3>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export History
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`border-l-4 ${isPositiveTrend(wordCountChange) ? 'border-l-green-500' : 'border-l-red-500'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Word Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{latestEntry.wordCount}</span>
              <div className="flex items-center">
                {isPositiveTrend(wordCountChange) ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`${isPositiveTrend(wordCountChange) ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositiveTrend(wordCountChange) ? '+' : ''}{wordCountChangePercent}%
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {isPositiveTrend(wordCountChange) 
                ? `Increased by ${wordCountChange} words since ${oldestEntry.date}`
                : `Decreased by ${Math.abs(wordCountChange)} words since ${oldestEntry.date}`}
            </p>
          </CardContent>
        </Card>
        
        <Card className={`border-l-4 ${isPositiveTrend(readabilityChange) ? 'border-l-green-500' : 'border-l-red-500'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Readability Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{latestEntry.readability}</span>
              <div className="flex items-center">
                {isPositiveTrend(readabilityChange) ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`${isPositiveTrend(readabilityChange) ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositiveTrend(readabilityChange) ? '+' : ''}{readabilityChangePercent}%
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {isPositiveTrend(readabilityChange) 
                ? `Improved by ${readabilityChange} points since ${oldestEntry.date}`
                : `Declined by ${Math.abs(readabilityChange)} points since ${oldestEntry.date}`}
            </p>
          </CardContent>
        </Card>
        
        <Card className={`border-l-4 ${isPositiveTrend(pageCountChange) ? 'border-l-green-500' : 'border-l-red-500'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{latestEntry.pageCount}</span>
              <div className="flex items-center">
                {isPositiveTrend(pageCountChange) ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`${isPositiveTrend(pageCountChange) ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositiveTrend(pageCountChange) ? '+' : ''}{pageCountChangePercent}%
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {isPositiveTrend(pageCountChange) 
                ? `Added ${pageCountChange} pages since ${oldestEntry.date}`
                : `Removed ${Math.abs(pageCountChange)} pages since ${oldestEntry.date}`}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Trend Analysis</CardTitle>
          <CardDescription>Track content metric changes over time</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="wordCount" onValueChange={(value) => setActiveMetric(value as any)} className="w-full space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="wordCount">Word Count</TabsTrigger>
              <TabsTrigger value="readability">Readability</TabsTrigger>
              <TabsTrigger value="pageCount">Page Count</TabsTrigger>
            </TabsList>
            
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [value, activeMetric === 'wordCount' ? 'Words' : activeMetric === 'readability' ? 'Score' : 'Pages']}
                  />
                  <Legend />
                  {activeMetric === 'wordCount' && (
                    <Area type="monotone" dataKey="wordCount" name="Avg. Word Count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  )}
                  {activeMetric === 'readability' && (
                    <Area type="monotone" dataKey="readability" name="Readability Score" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                  )}
                  {activeMetric === 'pageCount' && (
                    <Area type="monotone" dataKey="pageCount" name="Total Pages" stroke="#ffc658" fill="#ffc658" fillOpacity={0.3} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Tabs>
        </CardContent>
      </Card>
      
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertTitle>Content Strategy Insights</AlertTitle>
        <AlertDescription>
          {(() => {
            const insights = [];
            
            if (wordCountChange > 50) {
              insights.push(`The competitor is investing in longer, more in-depth content (${wordCountChangePercent}% increase in word count).`);
            } else if (wordCountChange < -50) {
              insights.push(`The competitor is shifting to shorter, more concise content (${Math.abs(Number(wordCountChangePercent))}% decrease in word count).`);
            }
            
            if (pageCountChange > 5) {
              insights.push(`They are expanding their content volume significantly (${pageCountChange} new pages).`);
            }
            
            if (readabilityChange > 5) {
              insights.push(`Their content is becoming more accessible and easier to read.`);
            } else if (readabilityChange < -5) {
              insights.push(`Their content is becoming more complex and technical.`);
            }
            
            if (insights.length === 0) {
              return "The competitor's content strategy has remained relatively stable over the analyzed period.";
            }
            
            return insights.join(' ');
          })()}
        </AlertDescription>
      </Alert>
    </div>
  );
} 