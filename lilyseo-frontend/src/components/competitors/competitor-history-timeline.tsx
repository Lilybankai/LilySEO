import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO, subMonths } from 'date-fns';
import { useSubscription } from '@/hooks/use-subscription';
import { ErrorAlert } from '@/components/ui/error-alert';

interface HistoryData {
  id: string;
  competitor_id: string;
  timestamp: string;
  metrics: {
    domain_authority?: number;
    page_authority?: number;
    total_backlinks?: number;
    indexed_pages?: number;
    average_word_count?: number;
    mobile_friendliness?: number;
    pagespeed?: number;
    keyword_count?: number;
  };
}

interface CompetitorHistoryTimelineProps {
  projectId: string;
  competitorId: string;
}

export function CompetitorHistoryTimeline({ projectId, competitorId }: CompetitorHistoryTimelineProps) {
  const [historyData, setHistoryData] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState('domain_authority');
  const [timeRange, setTimeRange] = useState('3months');
  const { subscription } = useSubscription();

  useEffect(() => {
    async function fetchHistoryData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}/competitors/${competitorId}/history`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch history data');
        }
        
        const data = await response.json();
        setHistoryData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching history data:', err);
        setError((err as Error).message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (projectId && competitorId) {
      fetchHistoryData();
    }
  }, [projectId, competitorId]);

  // Prepare chart data based on selected metric and time range
  const prepareChartData = () => {
    if (!historyData.length) return [];

    let filteredData = [...historyData];
    
    // Apply time range filter
    if (timeRange === '1month') {
      const oneMonthAgo = subMonths(new Date(), 1);
      filteredData = filteredData.filter(item => 
        parseISO(item.timestamp) >= oneMonthAgo
      );
    } else if (timeRange === '3months') {
      const threeMonthsAgo = subMonths(new Date(), 3);
      filteredData = filteredData.filter(item => 
        parseISO(item.timestamp) >= threeMonthsAgo
      );
    } else if (timeRange === '6months') {
      const sixMonthsAgo = subMonths(new Date(), 6);
      filteredData = filteredData.filter(item => 
        parseISO(item.timestamp) >= sixMonthsAgo
      );
    }
    
    // Sort by date ascending
    filteredData.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Map data for the chart
    return filteredData.map(item => ({
      date: format(parseISO(item.timestamp), 'MMM d'),
      value: item.metrics[metric as keyof typeof item.metrics] || 0,
      timestamp: item.timestamp
    }));
  };
  
  // Get min and max values for y-axis
  const getYAxisDomain = (data: any[]) => {
    if (!data.length) return [0, 100];
    
    const values = data.map(item => item.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Adjust domain to provide some padding
    return [
      Math.max(0, min - (max - min) * 0.1), 
      max + (max - min) * 0.1
    ];
  };

  // Format tooltip value based on metric
  const formatTooltipValue = (value: number) => {
    switch (metric) {
      case 'total_backlinks':
      case 'indexed_pages':
      case 'keyword_count':
        return value.toLocaleString();
      case 'average_word_count':
        return `${value.toLocaleString()} words`;
      default:
        return value;
    }
  };

  // Get metric display name
  const getMetricDisplayName = (metricKey: string) => {
    switch (metricKey) {
      case 'domain_authority': return 'Domain Authority';
      case 'page_authority': return 'Page Authority';
      case 'total_backlinks': return 'Total Backlinks';
      case 'indexed_pages': return 'Indexed Pages';
      case 'average_word_count': return 'Average Word Count';
      case 'mobile_friendliness': return 'Mobile Friendliness';
      case 'pagespeed': return 'PageSpeed Score';
      case 'keyword_count': return 'Keyword Count';
      default: return metricKey;
    }
  };

  // Get chart color based on metric
  const getMetricColor = (metricKey: string) => {
    switch (metricKey) {
      case 'domain_authority': return '#2563eb'; // blue
      case 'page_authority': return '#6366f1'; // indigo
      case 'total_backlinks': return '#8b5cf6'; // violet
      case 'indexed_pages': return '#ec4899'; // pink
      case 'average_word_count': return '#f43f5e'; // rose
      case 'mobile_friendliness': return '#10b981'; // emerald
      case 'pagespeed': return '#059669'; // green
      case 'keyword_count': return '#f59e0b'; // amber
      default: return '#3b82f6'; // blue
    }
  };

  const chartData = prepareChartData();
  const yAxisDomain = getYAxisDomain(chartData);
  const metricDisplayName = getMetricDisplayName(metric);
  const metricColor = getMetricColor(metric);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-8 w-2/5" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-3/5" /></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return <ErrorAlert description={error} />;
  }

  // Handle no data
  if (!historyData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>History Timeline</CardTitle>
          <CardDescription>
            Track changes in competitor metrics over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No History Data</AlertTitle>
            <AlertDescription>
              There's no historical data available yet. Run more analyses over time to build up history.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Check subscription for historical data
  const isSubscriptionLimited = subscription?.tier === 'free';

  return (
    <Card>
      <CardHeader>
        <CardTitle>History Timeline</CardTitle>
        <CardDescription>
          Track changes in competitor metrics over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSubscriptionLimited && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Limited History</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Free tier accounts can only view 30 days of history data.</span>
              <Button variant="link" className="p-0 h-auto" onClick={() => {}}>
                Upgrade for more <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="w-full md:w-1/3">
            <label className="text-sm font-medium mb-2 block">Metric</label>
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger>
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="domain_authority">Domain Authority</SelectItem>
                <SelectItem value="page_authority">Page Authority</SelectItem>
                <SelectItem value="total_backlinks">Total Backlinks</SelectItem>
                <SelectItem value="indexed_pages">Indexed Pages</SelectItem>
                <SelectItem value="average_word_count">Average Word Count</SelectItem>
                <SelectItem value="mobile_friendliness">Mobile Friendliness</SelectItem>
                <SelectItem value="pagespeed">PageSpeed Score</SelectItem>
                <SelectItem value="keyword_count">Keyword Count</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-1/3">
            <label className="text-sm font-medium mb-2 block">Time Range</label>
            <Select 
              value={timeRange} 
              onValueChange={setTimeRange} 
              disabled={isSubscriptionLimited}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last 30 days</SelectItem>
                <SelectItem value="3months">Last 3 months</SelectItem>
                <SelectItem value="6months">Last 6 months</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickLine={false}
              />
              <YAxis 
                domain={yAxisDomain}
                tickFormatter={(value) => {
                  if (metric === 'total_backlinks' && value > 1000) {
                    return `${(value / 1000).toFixed(1)}k`;
                  }
                  return value;
                }}
              />
              <Tooltip 
                formatter={(value) => [formatTooltipValue(value as number), metricDisplayName]}
                labelFormatter={(label, payload) => {
                  if (payload && payload.length) {
                    return format(parseISO(payload[0].payload.timestamp), 'MMMM d, yyyy');
                  }
                  return label;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={metricColor} 
                strokeWidth={2}
                dot={{ r: 4, fill: metricColor, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 