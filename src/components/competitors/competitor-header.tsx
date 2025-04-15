import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

interface Competitor {
  id: string;
  name: string;
  url: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  last_analyzed?: string;
  created_at: string;
}

interface CompetitorHeaderProps {
  competitor: Competitor;
  projectId: string;
}

export function CompetitorHeader({ competitor, projectId }: CompetitorHeaderProps) {
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  async function runAnalysis() {
    try {
      setIsRunningAnalysis(true);
      setError(null);
      
      const response = await fetch(`/api/projects/${projectId}/competitors/${competitor.id}/analyze`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start analysis');
      }

      toast({
        title: 'Analysis Started',
        description: 'The competitor analysis is now running. This may take a few minutes.',
      });

      // Polling for analysis completion
      const pollingInterval = setInterval(async () => {
        const statusResponse = await fetch(`/api/projects/${projectId}/competitors/${competitor.id}`);
        if (statusResponse.ok) {
          const compData = await statusResponse.json();
          
          if (compData.status === 'completed') {
            clearInterval(pollingInterval);
            setIsRunningAnalysis(false);
            toast({
              title: 'Analysis Complete',
              description: 'The competitor analysis has finished successfully.',
            });
            window.location.reload(); // Refresh to show new data
          } else if (compData.status === 'failed') {
            clearInterval(pollingInterval);
            setIsRunningAnalysis(false);
            setError('Analysis failed. Please try again.');
          }
        }
      }, 5000); // Check every 5 seconds
      
      // Stop polling after 5 minutes if still running
      setTimeout(() => {
        clearInterval(pollingInterval);
        if (isRunningAnalysis) {
          setIsRunningAnalysis(false);
          setError('Analysis is taking longer than expected. Check back later for results.');
        }
      }, 300000);
      
    } catch (err) {
      setIsRunningAnalysis(false);
      setError((err as Error).message || 'Failed to start analysis. Please try again.');
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Analysis Complete
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="secondary">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> In Progress
          </Badge>
        );
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'failed':
      default:
        return <Badge variant="destructive">Failed</Badge>;
    }
  }

  return (
    <>
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
              {competitor?.name}
              {competitor?.status && getStatusBadge(competitor.status)}
            </h1>
            <div className="flex items-center text-muted-foreground">
              <a 
                href={competitor?.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center hover:text-primary text-sm"
              >
                {competitor?.url} <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          </div>
        </div>
        
        <Button
          onClick={runAnalysis}
          disabled={isRunningAnalysis || competitor?.status === 'in_progress' || competitor?.status === 'pending'}
        >
          {isRunningAnalysis ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Running Analysis...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" /> Run Analysis
            </>
          )}
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isRunningAnalysis && (
        <Alert className="mt-4">
          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          <AlertTitle>Analysis in Progress</AlertTitle>
          <AlertDescription>
            We're analyzing this competitor. This may take a few minutes.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
} 