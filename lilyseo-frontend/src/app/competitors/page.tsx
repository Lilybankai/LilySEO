"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusCircle, RefreshCw, AlertTriangle, CheckCircle, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

interface Competitor {
  id: string;
  competitor_url: string;
  status: string;
  last_analyzed_at: string | null;
  project_id: string;
  created_at: string;
  error_message?: string;
  projects?: {
    name: string;
  };
}

export default function AllCompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    analyzed: 0,
    projects: 0
  });
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchCompetitors();
  }, []);

  const fetchCompetitors = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/competitors');
      if (!response.ok) throw new Error('Failed to fetch competitors');
      
      const { data } = await response.json();
      setCompetitors(data || []);
      
      // Calculate stats
      const uniqueProjects = new Set(data.map((comp: Competitor) => comp.project_id));
      setStats({
        total: data.length,
        analyzed: data.filter((comp: Competitor) => comp.status === 'completed').length,
        projects: uniqueProjects.size
      });
    } catch (error) {
      console.error('Error fetching competitors:', error);
      toast({
        title: "Error",
        description: "Failed to load competitors. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeCompetitor = async (id: string) => {
    try {
      // Construct the correct URL using the environment variable
      const crawlerServiceUrl = process.env.NEXT_PUBLIC_CRAWLER_SERVICE_URL;
      if (!crawlerServiceUrl) {
        throw new Error("Crawler service URL is not configured.");
      }
      const analyzeUrl = `${crawlerServiceUrl}/api/competitors/${id}/analyze`;
      
      console.log(`Attempting to analyze competitor at URL: ${analyzeUrl}`); // Added log

      const response = await fetch(analyzeUrl, {
        method: 'POST',
        // Add headers if needed, e.g., Content-Type
        headers: {
          'Content-Type': 'application/json',
        },
        // Add body if the crawler service expects any specific options
        // body: JSON.stringify({ options: { /* ... */ } }) 
      });
      
      if (!response.ok) {
        const errorData = await response.text(); // Get more details on error
        console.error("Analysis API Error:", response.status, errorData); // Added log
        throw new Error(`Failed to start analysis: ${response.statusText} - ${errorData}`);
      }
      
      const result = await response.json(); // Get the response data
      console.log("Analysis API Success:", result); // Added log

      toast({
        title: "Analysis Started",
        description: "Competitor analysis has been queued.",
      });
      
      // Refresh the list to show updated status
      fetchCompetitors();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start analysis. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteCompetitor = async (id: string) => {
    try {
      const response = await fetch(`/api/competitors/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete competitor');
      
      toast({
        title: "Competitor Deleted",
        description: "The competitor has been removed from your account.",
      });
      
      // Remove from local state
      setCompetitors(competitors.filter(c => c.id !== id));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete competitor. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredCompetitors = competitors.filter(comp => 
    comp.competitor_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (comp.projects?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" /> In Progress</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" /> Error</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Competitors</h1>
          <p className="text-gray-500">
            View and manage competitor analysis across all your projects
          </p>
        </div>
        <Button onClick={() => router.push('/projects')}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add New Competitor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Competitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Analyzed Competitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.analyzed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search competitors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={fetchCompetitors}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Competitor URL</th>
              <th className="text-left p-3 font-medium">Project</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Last Analyzed</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center p-8">Loading competitors...</td>
              </tr>
            ) : filteredCompetitors.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-8">
                  {searchTerm ? 'No competitors found matching your search.' : 'No competitors added yet.'}
                </td>
              </tr>
            ) : (
              filteredCompetitors.map((competitor) => (
                <tr key={competitor.id} className="border-t hover:bg-muted/20">
                  <td className="p-3">
                    <Link 
                      href={`/competitors/compare?id=${competitor.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {competitor.competitor_url}
                    </Link>
                  </td>
                  <td className="p-3">{competitor.projects?.name || '-'}</td>
                  <td className="p-3">{getStatusBadge(competitor.status)}</td>
                  <td className="p-3">{formatDate(competitor.last_analyzed_at)}</td>
                  <td className="p-3 text-right space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => analyzeCompetitor(competitor.id)}
                      disabled={competitor.status === 'in_progress'}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Analyze
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteCompetitor(competitor.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 