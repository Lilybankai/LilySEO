import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowUpRight, Download, FileSpreadsheet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useToast } from '@/components/ui/use-toast';
import { useSubscription } from '@/hooks/use-subscription';

// Define types for keyword data
interface KeywordData {
  keyword: string;
  competitorPosition?: number;
  projectPosition?: number;
  positionDifference?: number;
  volume?: number;
  difficulty?: number;
}

interface CompetitorKeyword {
  id: string;
  competitor_id: string;
  keyword: string;
  position?: number;
  volume?: number;
  difficulty?: number;
  created_at: string;
}

interface ProjectKeyword {
  id: string;
  project_id: string;
  keyword: string;
  position?: number;
  volume?: number;
  difficulty?: number;
  created_at: string;
}

interface KeywordOpportunity {
  id: string;
  project_id: string;
  competitor_id: string;
  keyword: string;
  opportunity_score: number;
  volume?: number;
  difficulty?: number;
  competitor_position?: number;
  recommendation: string;
  created_at: string;
}

interface KeywordGapAnalysisProps {
  projectId: string;
  competitorId: string;
}

export function KeywordGapAnalysis({ projectId, competitorId }: KeywordGapAnalysisProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);
  const { toast } = useToast();
  const { subscription } = useSubscription();
  const [activeTab, setActiveTab] = useState('opportunities');

  // Define columns for the data tables
  const opportunitiesColumns = [
    {
      header: 'Keyword',
      accessorKey: 'keyword',
      cell: ({ row }: any) => (
        <div className="font-medium">{row.original.keyword}</div>
      ),
    },
    {
      header: 'Opportunity Score',
      accessorKey: 'opportunity_score',
      cell: ({ row }: any) => (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
          {row.original.opportunity_score.toFixed(1)}
        </Badge>
      ),
    },
    {
      header: 'Volume',
      accessorKey: 'volume',
      cell: ({ row }: any) => (
        <div>{row.original.volume || 'N/A'}</div>
      ),
    },
    {
      header: 'Difficulty',
      accessorKey: 'difficulty',
      cell: ({ row }: any) => (
        <div>{row.original.difficulty ? row.original.difficulty.toFixed(1) : 'N/A'}</div>
      ),
    },
    {
      header: 'Competitor Position',
      accessorKey: 'competitor_position',
      cell: ({ row }: any) => (
        <div>{row.original.competitor_position || 'N/A'}</div>
      ),
    },
    {
      header: 'Recommendation',
      accessorKey: 'recommendation',
      cell: ({ row }: any) => (
        <div className="max-w-md text-sm">{row.original.recommendation}</div>
      ),
    },
  ];

  const gapColumns = [
    {
      header: 'Keyword',
      accessorKey: 'keyword',
      cell: ({ row }: any) => (
        <div className="font-medium">{row.original.keyword}</div>
      ),
    },
    {
      header: 'Volume',
      accessorKey: 'volume',
      cell: ({ row }: any) => (
        <div>{row.original.volume || 'N/A'}</div>
      ),
    },
    {
      header: 'Difficulty',
      accessorKey: 'difficulty',
      cell: ({ row }: any) => (
        <div>{row.original.difficulty ? row.original.difficulty.toFixed(1) : 'N/A'}</div>
      ),
    },
    {
      header: 'Position',
      accessorKey: 'position',
      cell: ({ row }: any) => (
        <div>{row.original.position || 'N/A'}</div>
      ),
    },
  ];

  const sharedColumns = [
    {
      header: 'Keyword',
      accessorKey: 'keyword',
      cell: ({ row }: any) => (
        <div className="font-medium">{row.original.keyword}</div>
      ),
    },
    {
      header: 'Your Position',
      accessorKey: 'projectPosition',
      cell: ({ row }: any) => (
        <div>{row.original.projectPosition || 'N/A'}</div>
      ),
    },
    {
      header: 'Competitor Position',
      accessorKey: 'competitorPosition',
      cell: ({ row }: any) => (
        <div>{row.original.competitorPosition || 'N/A'}</div>
      ),
    },
    {
      header: 'Position Difference',
      accessorKey: 'positionDifference',
      cell: ({ row }: any) => {
        const diff = row.original.positionDifference;
        return (
          <Badge className={`${diff < 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'} hover:bg-opacity-90`}>
            {diff < 0 ? diff : `+${diff}`}
          </Badge>
        );
      },
    },
    {
      header: 'Volume',
      accessorKey: 'volume',
      cell: ({ row }: any) => (
        <div>{row.original.volume || 'N/A'}</div>
      ),
    },
  ];

  // Fetch keyword gap analysis data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}/competitors/${competitorId}/keywords/gap`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch keyword gap analysis');
        }
        
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        console.error('Error fetching keyword gap analysis:', err);
        setError((err as Error).message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (projectId && competitorId) {
      fetchData();
    }
  }, [projectId, competitorId]);

  // Prepare chart data
  const prepareChartData = () => {
    if (!data) return [];

    return [
      {
        name: 'Unique to Competitor',
        count: data.keywordCounts.uniqueToCompetitor,
        fill: '#f97316', // orange
      },
      {
        name: 'Shared Keywords',
        count: data.keywordCounts.shared,
        fill: '#16a34a', // green
      },
      {
        name: 'Unique to Your Site',
        count: data.keywordCounts.uniqueToProject,
        fill: '#2563eb', // blue
      },
    ];
  };

  // Handle export to CSV
  const handleExport = () => {
    if (!data) return;

    // Subscription check
    if (subscription?.tier === 'free') {
      toast({
        title: 'Subscription Required',
        description: 'Exporting keyword data requires a Pro or Enterprise subscription.',
        variant: 'destructive',
      });
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Add headers based on active tab
    if (activeTab === 'opportunities') {
      csvContent += 'Keyword,Opportunity Score,Volume,Difficulty,Competitor Position,Recommendation\n';
      
      // Add data rows
      data.opportunities.forEach((item: KeywordOpportunity) => {
        csvContent += `"${item.keyword}",${item.opportunity_score},${item.volume || ''},${item.difficulty || ''},${item.competitor_position || ''},"${item.recommendation}"\n`;
      });
    } else if (activeTab === 'uniqueToCompetitor') {
      csvContent += 'Keyword,Position,Volume,Difficulty\n';
      
      // Add data rows
      data.keywordGaps.uniqueToCompetitor.forEach((item: CompetitorKeyword) => {
        csvContent += `"${item.keyword}",${item.position || ''},${item.volume || ''},${item.difficulty || ''}\n`;
      });
    } else if (activeTab === 'uniqueToYou') {
      csvContent += 'Keyword,Position,Volume,Difficulty\n';
      
      // Add data rows
      data.keywordGaps.uniqueToProject.forEach((item: ProjectKeyword) => {
        csvContent += `"${item.keyword}",${item.position || ''},${item.volume || ''},${item.difficulty || ''}\n`;
      });
    } else if (activeTab === 'shared') {
      csvContent += 'Keyword,Your Position,Competitor Position,Position Difference,Volume,Difficulty\n';
      
      // Add data rows
      data.keywordGaps.shared.forEach((item: KeywordData) => {
        csvContent += `"${item.keyword}",${item.projectPosition || ''},${item.competitorPosition || ''},${item.positionDifference || ''},${item.volume || ''},${item.difficulty || ''}\n`;
      });
    }

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `keyword-gap-analysis-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle><Skeleton className="h-8 w-1/3" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-2/3" /></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading keyword analysis</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Keyword Gap Analysis</CardTitle>
            <CardDescription>
              Compare your keywords with {data?.competitor.name}'s keywords to identify opportunities
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            className="flex items-center gap-1"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {data?.meta?.limitApplied && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Limited Analysis</AlertTitle>
            <AlertDescription>
              You're viewing limited results based on your subscription tier. 
              <Button variant="link" className="p-0 h-auto text-sm" onClick={() => {}}>
                Upgrade for full access <ArrowUpRight className="h-3 w-3 inline ml-1" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Keyword Overview</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={prepareChartData()}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [`${value} keywords`, '']}
                  labelFormatter={() => ''}
                />
                <Legend />
                <Bar dataKey="count" name="Keywords" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <Tabs 
          defaultValue="opportunities" 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="w-full justify-start space-x-1">
            <TabsTrigger value="opportunities">
              Opportunities 
              <Badge className="ml-1 bg-green-100 text-green-800">{data?.opportunities?.length || 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="uniqueToCompetitor">
              Competitor-Only Keywords
              <Badge className="ml-1 bg-orange-100 text-orange-800">{data?.keywordGaps?.uniqueToCompetitor?.length || 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="uniqueToYou">
              Your Unique Keywords
              <Badge className="ml-1 bg-blue-100 text-blue-800">{data?.keywordGaps?.uniqueToProject?.length || 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="shared">
              Shared Keywords
              <Badge className="ml-1 bg-purple-100 text-purple-800">{data?.keywordGaps?.shared?.length || 0}</Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="opportunities" className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              These are keywords your competitor ranks for that present opportunities for your site.
              Sorted by opportunity score (higher is better).
            </p>
            {data?.opportunities?.length > 0 ? (
              <DataTable 
                columns={opportunitiesColumns}
                data={data.opportunities}
                defaultPageSize={10}
              />
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No keyword opportunities found. This could be due to limited data.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="uniqueToCompetitor" className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Keywords your competitor ranks for but your site doesn't. Consider targeting these keywords to expand your reach.
            </p>
            {data?.keywordGaps?.uniqueToCompetitor?.length > 0 ? (
              <DataTable 
                columns={gapColumns}
                data={data.keywordGaps.uniqueToCompetitor}
                defaultPageSize={10}
              />
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No unique competitor keywords found.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="uniqueToYou" className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Keywords your site ranks for but your competitor doesn't. These are your competitive advantage.
            </p>
            {data?.keywordGaps?.uniqueToProject?.length > 0 ? (
              <DataTable 
                columns={gapColumns}
                data={data.keywordGaps.uniqueToProject}
                defaultPageSize={10}
              />
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No unique keywords for your site found.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="shared" className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Keywords both your site and your competitor rank for. Negative position difference means your competitor ranks better.
            </p>
            {data?.keywordGaps?.shared?.length > 0 ? (
              <DataTable 
                columns={sharedColumns}
                data={data.keywordGaps.shared}
                defaultPageSize={10}
              />
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No shared keywords found.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 