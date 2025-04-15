"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { KeywordGapAnalysis } from '@/components/competitors/keyword-gap-analysis';
import { LoadingSkeleton } from '@/components/skeletons/loading-skeleton';
import { ErrorAlert } from '@/components/ui/error-alert';
import { ContentQualityAnalysis } from '@/components/content-quality-analysis';

// Create simple mock components for the missing components
// Replace these with real implementations once they are available
function CompetitorHeader({ projectId, competitor }: { projectId: string; competitor: Competitor }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center">
        <Button 
          variant="outline" 
          size="sm" 
          asChild 
          className="mr-4"
        >
          <Link href={`/projects/${projectId}/competitors`}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Link>
        </Button>
        
        <div>
          <h1 className="text-2xl font-bold flex flex-wrap items-center gap-2">
            {competitor.name}
            {competitor.status === 'completed' && (
              <Badge variant="outline" className="bg-green-100 text-green-800">
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

function CompetitorAnalysisResults({ projectId, competitorId }: { projectId: string; competitorId: string }) {
  return (
    <div className="bg-muted p-8 rounded-lg text-center">
      <h3 className="text-lg font-medium mb-2">Analysis Results</h3>
      <p className="text-muted-foreground mb-4">
        This is a placeholder for competitor analysis results. In the real implementation, 
        this would show SEO metrics, content metrics, and insights about the competitor.
      </p>
      <div className="p-4 bg-background rounded border">
        <pre className="text-xs text-left">{`
{
  "seo_metrics": {
    "domainAuthority": 45,
    "pageAuthority": 38,
    "totalLinks": 12500
  },
  "content_metrics": {
    "averageWordCount": 1250,
    "pageCount": 320
  }
}
        `}</pre>
      </div>
    </div>
  );
}

function CompetitorHistoryTimeline({ projectId, competitorId }: { projectId: string; competitorId: string }) {
  return (
    <div className="bg-muted p-8 rounded-lg text-center">
      <h3 className="text-lg font-medium mb-2">Historical Data</h3>
      <p className="text-muted-foreground mb-4">
        This is a placeholder for historical tracking of competitor metrics. In the real implementation, 
        this would show charts and graphs of how metrics changed over time.
      </p>
    </div>
  );
}

function CompetitorAlertSettings({
  projectId,
  competitorId,
  competitor,
}: {
  projectId: string;
  competitorId: string;
  competitor: Competitor;
}) {
  return (
    <div className="bg-muted p-8 rounded-lg text-center">
      <h3 className="text-lg font-medium mb-2">Alert Settings</h3>
      <p className="text-muted-foreground mb-4">
        This is a placeholder for alert settings. In the real implementation, 
        this would allow users to configure notifications for changes in competitor metrics.
      </p>
    </div>
  );
}

interface Competitor {
  id: string;
  name: string;
  url: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  last_analyzed?: string;
  created_at: string;
}

export default function CompetitorPage() {
  const params = useParams();
  const [competitor, setCompetitor] = useState<Competitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const projectId = params.id as string;
  const competitorId = params.competitorId as string;

  useEffect(() => {
    async function fetchCompetitor() {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}/competitors/${competitorId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch competitor details');
        }
        
        const data = await response.json();
        setCompetitor(data);
        setError(null);
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
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorAlert description={error} />;
  }

  if (!competitor) {
    return <ErrorAlert description="Competitor not found" />;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <CompetitorHeader
        competitor={competitor}
        projectId={projectId}
      />
      
      <Separator className="my-2" />
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start space-x-1 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keywords">Keyword Gap</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <CompetitorAnalysisResults
            projectId={projectId}
            competitorId={competitorId}
          />
        </TabsContent>
        
        <TabsContent value="keywords">
          <KeywordGapAnalysis
            projectId={projectId}
            competitorId={competitorId}
          />
        </TabsContent>
        
        <TabsContent value="content">
          <ContentQualityAnalysis
            projectId={projectId}
            competitorId={competitorId}
          />
        </TabsContent>
        
        <TabsContent value="history">
          <CompetitorHistoryTimeline
            projectId={projectId}
            competitorId={competitorId}
          />
        </TabsContent>
        
        <TabsContent value="alerts">
          <CompetitorAlertSettings
            projectId={projectId}
            competitorId={competitorId}
            competitor={competitor}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 