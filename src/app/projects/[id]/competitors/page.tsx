"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExternalLink, Plus, RefreshCw, Trash2, AlertTriangle, CheckCircle, Clock, BarChart2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Competitor types
interface Competitor {
  id: string;
  url: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  last_analyzed_at: string | null;
  created_at: string;
  error_message?: string;
}

interface CompetitorSummary {
  totalCompetitors: number;
  analyzedCompetitors: number;
  inProgressCompetitors: number;
  competitorLimit: number;
  hasReachedLimit: boolean;
}

export default function CompetitorsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { toast } = useToast();
  
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [summary, setSummary] = useState<CompetitorSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCompetitorUrl, setNewCompetitorUrl] = useState('');
  const [newCompetitorName, setNewCompetitorName] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addingCompetitor, setAddingCompetitor] = useState(false);
  
  // Fetch competitors
  useEffect(() => {
    fetchCompetitors();
    fetchSummary();
    
    // Refresh data every 30 seconds for in-progress analyses
    const interval = setInterval(() => {
      const hasInProgress = competitors.some(c => c.status === 'pending' || c.status === 'in_progress');
      if (hasInProgress) {
        fetchCompetitors();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [projectId]);
  
  async function fetchCompetitors() {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/competitors`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch competitors');
      }
      
      const data = await response.json();
      setCompetitors(data);
      setError(null);
    } catch (err) {
      setError('Failed to load competitors. Please try again.');
      console.error('Error fetching competitors:', err);
    } finally {
      setLoading(false);
    }
  }
  
  async function fetchSummary() {
    try {
      const response = await fetch(`/api/projects/${projectId}/competitors/summary`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch competitor summary');
      }
      
      const data = await response.json();
      setSummary(data);
    } catch (err) {
      console.error('Error fetching competitor summary:', err);
    }
  }
  
  async function addCompetitor() {
    if (!newCompetitorUrl) {
      toast({
        title: "Error",
        description: "Competitor URL is required",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setAddingCompetitor(true);
      
      const response = await fetch(`/api/projects/${projectId}/competitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newCompetitorUrl,
          name: newCompetitorName || undefined
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add competitor');
      }
      
      toast({
        title: "Success",
        description: "Competitor added successfully"
      });
      
      // Refresh data
      fetchCompetitors();
      fetchSummary();
      
      // Reset form
      setNewCompetitorUrl('');
      setNewCompetitorName('');
      setAddDialogOpen(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to add competitor",
        variant: "destructive"
      });
    } finally {
      setAddingCompetitor(false);
    }
  }
  
  async function deleteCompetitor(id: string) {
    try {
      const response = await fetch(`/api/projects/${projectId}/competitors/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete competitor');
      }
      
      toast({
        title: "Success",
        description: "Competitor deleted successfully"
      });
      
      // Refresh data
      fetchCompetitors();
      fetchSummary();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete competitor",
        variant: "destructive"
      });
      console.error('Error deleting competitor:', err);
    }
  }
  
  async function runAnalysis(id: string) {
    try {
      const response = await fetch(`/api/projects/${projectId}/competitors/${id}/analyze`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to start analysis');
      }
      
      toast({
        title: "Success",
        description: "Analysis started successfully"
      });
      
      // Update competitor status locally to avoid waiting for refresh
      setCompetitors(prev => 
        prev.map(c => 
          c.id === id ? { ...c, status: 'pending' as const } : c
        )
      );
      
      // Refresh data after a short delay
      setTimeout(fetchCompetitors, 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to start analysis",
        variant: "destructive"
      });
      console.error('Error starting analysis:', err);
    }
  }
  
  function getStatusBadge(status: string) {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      case 'in_progress':
        return <Badge variant="secondary"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> In Progress</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Competitor Analysis</h1>
          <p className="text-muted-foreground">
            Track and analyze your competitors to gain strategic insights
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {competitors.filter(c => c.status === 'completed').length > 0 && (
            <Button 
              variant="outline"
              asChild
            >
              <Link href={`/projects/${params.id}/competitors/compare`}>
                <BarChart2 className="mr-2 h-4 w-4" /> Compare Competitors
              </Link>
            </Button>
          )}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>  {/* Wrapper div needed for disabled button tooltip */}
                  <Button 
                    onClick={() => setAddDialogOpen(true)}
                    disabled={summary?.hasReachedLimit}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Competitor
                  </Button>
                </div>
              </TooltipTrigger>
              {summary?.hasReachedLimit && (
                <TooltipContent>
                  <p>You've reached your plan's competitor limit ({summary.competitorLimit})</p>
                  <p>Upgrade your plan to add more competitors</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Competitors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.totalCompetitors} / {summary.competitorLimit}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.hasReachedLimit 
                  ? "You've reached your plan's limit" 
                  : `You can add ${summary.competitorLimit - summary.totalCompetitors} more`}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Analyzed Competitors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.analyzedCompetitors}
              </div>
              <p className="text-xs text-muted-foreground">
                Completed analysis
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.inProgressCompetitors}
              </div>
              <p className="text-xs text-muted-foreground">
                Analyses currently running
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Your Competitors</CardTitle>
          <CardDescription>
            Track and analyze competitor websites to gain insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : competitors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No competitors added yet</p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Your First Competitor
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Analyzed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitors.map((competitor) => (
                  <TableRow key={competitor.id}>
                    <TableCell className="font-medium">{competitor.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="truncate max-w-[200px]">{competitor.url}</span>
                        <a 
                          href={competitor.url.startsWith('http') ? competitor.url : `https://${competitor.url}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-muted-foreground hover:text-primary"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(competitor.status)}
                    </TableCell>
                    <TableCell>
                      {competitor.last_analyzed_at ? (
                        <span title={new Date(competitor.last_analyzed_at).toLocaleString()}>
                          {formatDistanceToNow(new Date(competitor.last_analyzed_at), { addSuffix: true })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {competitor.status === 'completed' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          asChild
                        >
                          <Link href={`/projects/${params.id}/competitors/${competitor.id}`}>
                            View Details
                          </Link>
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runAnalysis(competitor.id)}
                        disabled={competitor.status === 'in_progress' || competitor.status === 'pending'}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Analyze
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteCompetitor(competitor.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Competitor</DialogTitle>
            <DialogDescription>
              Add a competitor website to analyze and compare against your site.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="url" className="text-sm font-medium">
                Competitor URL <span className="text-destructive">*</span>
              </label>
              <Input
                id="url"
                placeholder="https://example.com"
                value={newCompetitorUrl}
                onChange={(e) => setNewCompetitorUrl(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name (Optional)
              </label>
              <Input
                id="name"
                placeholder="Competitor name"
                value={newCompetitorName}
                onChange={(e) => setNewCompetitorName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                If not provided, we'll use the domain name
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setAddDialogOpen(false)}
              disabled={addingCompetitor}
            >
              Cancel
            </Button>
            <Button 
              onClick={addCompetitor}
              disabled={!newCompetitorUrl || addingCompetitor}
            >
              {addingCompetitor ? "Adding..." : "Add Competitor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 