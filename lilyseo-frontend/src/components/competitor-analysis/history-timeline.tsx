"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Activity,
  Calendar,
  HelpCircle,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { formatDistanceToNow } from "date-fns";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface HistoryTimelineProps {
  projectId: string;
  competitorId: string;
  competitorName: string;
  className?: string;
}

interface MetricDataset {
  metricPath: string;
  label: string;
  data: (number | null)[];
  changes: (number | null)[];
}

interface TimelineData {
  labels: string[];
  datasets: MetricDataset[];
}

interface HistoryResponse {
  competitor: {
    id: string;
    name: string;
    url: string;
    status: string;
  };
  metrics: TimelineData;
  meta: {
    requestedDays: number;
    effectiveDays: number;
    maxDays: number;
    tier: string;
    dataPoints: number;
  };
}

interface PeriodOption {
  value: string;
  label: string;
  days: number;
}

export default function HistoryTimeline({
  projectId,
  competitorId,
  competitorName,
  className = "",
}: HistoryTimelineProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timelineData, setTimelineData] = useState<HistoryResponse | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    "seo_metrics.domainAuthority",
    "technical_metrics.pageSpeed.desktop",
  ]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("30d");

  const periodOptions: PeriodOption[] = [
    { value: "7d", label: "7 Days", days: 7 },
    { value: "30d", label: "30 Days", days: 30 },
    { value: "90d", label: "90 Days", days: 90 },
    { value: "180d", label: "6 Months", days: 180 },
    { value: "365d", label: "12 Months", days: 365 },
  ];

  const metricOptions = [
    {
      group: "SEO Metrics",
      options: [
        { value: "seo_metrics.domainAuthority", label: "Domain Authority" },
        { value: "seo_metrics.pageAuthority", label: "Page Authority" },
        { value: "seo_metrics.backlinks", label: "Backlinks" },
        { value: "seo_metrics.totalLinks", label: "Total Links" },
      ],
    },
    {
      group: "Technical Metrics",
      options: [
        {
          value: "technical_metrics.pageSpeed.desktop",
          label: "Desktop Speed",
        },
        { value: "technical_metrics.pageSpeed.mobile", label: "Mobile Speed" },
        {
          value: "technical_metrics.mobileFriendliness",
          label: "Mobile Friendliness",
        },
        {
          value: "technical_metrics.coreWebVitals.lcp",
          label: "Largest Contentful Paint",
        },
        {
          value: "technical_metrics.coreWebVitals.fid",
          label: "First Input Delay",
        },
        {
          value: "technical_metrics.coreWebVitals.cls",
          label: "Cumulative Layout Shift",
        },
      ],
    },
    {
      group: "Content Metrics",
      options: [
        {
          value: "content_metrics.averageWordCount",
          label: "Average Word Count",
        },
        { value: "content_metrics.totalWords", label: "Total Words" },
        { value: "content_metrics.pageCount", label: "Page Count" },
        {
          value: "content_metrics.schemaMarkupUsage",
          label: "Schema Markup Usage",
        },
      ],
    },
    {
      group: "Keyword Data",
      options: [
        { value: "keyword_data.totalKeywords", label: "Total Keywords" },
        { value: "keyword_data.uniqueKeywords", label: "Unique Keywords" },
      ],
    },
  ];

  // Fetch timeline data
  useEffect(() => {
    const fetchData = async () => {
      if (!projectId || !competitorId) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const days = periodOptions.find(p => p.value === selectedPeriod)?.days || 30;
        const metrics = selectedMetrics.join(",");

        const response = await fetch(
          `/api/projects/${projectId}/competitors/${competitorId}/history/metrics?days=${days}&metrics=${metrics}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch timeline data");
        }

        const data = await response.json();
        setTimelineData(data);
      } catch (err: any) {
        console.error("Error fetching timeline data:", err);
        setError(err.message || "An error occurred while fetching timeline data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId, competitorId, selectedMetrics, selectedPeriod]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!timelineData?.metrics) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const { labels, datasets } = timelineData.metrics;

    // Generate colors for each metric
    const colors = [
      "rgb(59, 130, 246)", // Blue
      "rgb(16, 185, 129)", // Green
      "rgb(249, 115, 22)", // Orange
      "rgb(139, 92, 246)", // Purple
      "rgb(236, 72, 153)", // Pink
    ];

    return {
      labels,
      datasets: datasets.map((dataset, index) => ({
        label: dataset.label,
        data: dataset.data,
        borderColor: colors[index % colors.length],
        backgroundColor: `${colors[index % colors.length]}22`, // Add transparency
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: colors[index % colors.length],
        tension: 0.2,
        fill: false,
      })),
    };
  }, [timelineData]);

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || "";
            const value = context.parsed.y || 0;
            const datasetIndex = context.datasetIndex;
            const dataIndex = context.dataIndex;
            
            if (timelineData?.metrics.datasets[datasetIndex]?.changes[dataIndex] !== null) {
              const change = timelineData?.metrics.datasets[datasetIndex]?.changes[dataIndex];
              const changeText = change !== null ? (change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`) : "";
              return `${label}: ${value}${changeText ? ` (${changeText})` : ""}`;
            }
            
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          precision: 0,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    maintainAspectRatio: false,
  };

  // Calculate most recent changes
  const recentChanges = useMemo(() => {
    if (!timelineData?.metrics || !timelineData.metrics.datasets) {
      return [];
    }

    return timelineData.metrics.datasets.map(dataset => {
      const lastValidIndex = [...dataset.changes]
        .reverse()
        .findIndex(change => change !== null);
      
      const recentChange = lastValidIndex >= 0 
        ? dataset.changes[dataset.changes.length - 1 - lastValidIndex] 
        : null;
      
      return {
        metric: dataset.label,
        metricPath: dataset.metricPath,
        change: recentChange,
        value: lastValidIndex >= 0 
          ? dataset.data[dataset.data.length - 1 - lastValidIndex] 
          : null,
      };
    });
  }, [timelineData]);

  // Check if any data is available
  const hasData = useMemo(() => {
    if (!timelineData?.metrics || !timelineData.metrics.datasets) {
      return false;
    }
    
    // Check if at least one dataset has at least one non-null data point
    return timelineData.metrics.datasets.some(dataset => 
      dataset.data.some(value => value !== null)
    );
  }, [timelineData]);

  // Check if tier limits apply
  const isTierLimited = useMemo(() => {
    if (!timelineData?.meta) {
      return false;
    }
    
    return timelineData.meta.requestedDays > timelineData.meta.effectiveDays;
  }, [timelineData]);

  const selectedPeriodDays = useMemo(() => {
    return periodOptions.find(p => p.value === selectedPeriod)?.days || 30;
  }, [selectedPeriod]);

  // Render loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-primary" />
            Historical Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Render empty state
  if (!hasData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-primary" />
            Historical Performance
          </CardTitle>
          <CardDescription>
            Track how {competitorName}'s metrics change over time
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Historical Data Available</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            {timelineData?.meta?.tier === "free" 
              ? "Upgrade to Pro or Enterprise to access historical tracking." 
              : "Historical data will appear here after multiple analyses have been run."}
          </p>
          {timelineData?.meta?.tier === "free" && (
            <Button variant="outline">
              Upgrade Your Plan
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-2 text-primary" />
          Historical Performance
        </CardTitle>
        <CardDescription>
          Track how {competitorName}'s metrics change over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isTierLimited && (
          <Alert className="mb-4">
            <HelpCircle className="h-4 w-4" />
            <AlertTitle>Tier Limit</AlertTitle>
            <AlertDescription>
              {timelineData?.meta?.tier === "free" 
                ? "Free tier accounts can only access current data. Upgrade to Pro for 30-day history or Enterprise for 12-month history."
                : `Your ${timelineData?.meta?.tier} plan allows access to ${timelineData?.meta?.maxDays} days of history.`}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium block mb-2">
                Select Metrics
              </label>
              <Select
                value={selectedMetrics.length === 1 ? selectedMetrics[0] : undefined}
                onValueChange={(value) => setSelectedMetrics([value])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a metric" />
                </SelectTrigger>
                <SelectContent>
                  {metricOptions.map((group) => (
                    <div key={group.group} className="mb-2">
                      <p className="text-xs text-muted-foreground px-2 py-1">
                        {group.group}
                      </p>
                      {group.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium block mb-2">
                Time Period
              </label>
              <Select
                value={selectedPeriod}
                onValueChange={setSelectedPeriod}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      disabled={option.days > timelineData?.meta?.maxDays}
                    >
                      {option.label}
                      {option.days > timelineData?.meta?.maxDays && " (Upgrade)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="chart">
          <TabsList className="mb-4">
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="changes">Recent Changes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart">
            <div className="h-[300px]">
              <Line data={chartData} options={chartOptions} />
            </div>
            
            <div className="mt-4 text-xs text-muted-foreground text-center">
              Showing data for the past {selectedPeriodDays > timelineData?.meta?.effectiveDays 
                ? timelineData?.meta?.effectiveDays 
                : selectedPeriodDays} days
            </div>
          </TabsContent>
          
          <TabsContent value="changes">
            <div className="space-y-3">
              {recentChanges.map((change, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 rounded-md border"
                >
                  <div>
                    <p className="font-medium">{change.metric}</p>
                    <p className="text-sm text-muted-foreground">
                      Current: {change.value !== null ? change.value : 'N/A'}
                    </p>
                  </div>
                  
                  <div className="flex items-center">
                    {change.change !== null ? (
                      <Badge 
                        variant={change.change > 0 ? "outline" : "outline"} 
                        className={`flex items-center ${
                          change.change > 0 
                            ? "bg-green-100 text-green-800" 
                            : change.change < 0 
                              ? "bg-red-100 text-red-800" 
                              : ""
                        }`}
                      >
                        {change.change > 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {change.change > 0 ? '+' : ''}
                        {change.change.toFixed(1)}%
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">No change</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 