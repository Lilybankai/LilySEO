"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from '@/components/ui/skeleton';
import { InfoIcon, Search, ExternalLink, LucideFileText, BarChart2, TrendingUp, AlertCircle, Lock } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useToast } from '@/components/ui/use-toast';

// Define interfaces for actual data
interface Project {
  id: string;
  name: string;
}

interface CompetitorMarketData {
  id: string;
  name: string; // Will use competitor_url
  projectId: string;
  metrics: {
    authority: number;
    visibility: number; // Mapped from trafficEstimate
    size: number; // Mapped from keywordCount
  };
  isYourSite: boolean; // Need logic to determine this
}

interface PositioningMapProps {
  competitors: CompetitorMarketData[];
  projectUrl?: string; // Pass the project URL to identify 'Your Website'
}

const PositioningMap = ({ competitors, projectUrl }: PositioningMapProps) => {
  const positioningData = competitors.map(competitor => ({
    ...competitor,
    // Identify 'Your Website' based on the main project URL if possible
    // This might need adjustment based on how competitor data is stored/identified
    isYourSite: projectUrl && competitor.name === new URL(projectUrl).hostname
  }));
  
  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          }}
        >
          <CartesianGrid />
          <XAxis 
            type="number" 
            dataKey="visibility" 
            name="Visibility (Traffic Est.)" 
            domain={['auto', 'auto']}
            label={{ value: 'Estimated Visibility', position: 'bottom' }}
          />
          <YAxis 
            type="number" 
            dataKey="authority" 
            name="Authority (DA)" 
            domain={[0, 100]}
            label={{ value: 'Domain Authority', angle: -90, position: 'left' }}
          />
          <ZAxis 
            type="number" 
            dataKey="size" 
            range={[100, 1000]} 
            name="Size (Keywords)" 
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            formatter={(value, name) => [`${value}`, name]}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-popover p-2 rounded shadow-lg border text-popover-foreground text-sm">
                    <p className="font-bold">{data.name}</p>
                    <p>Authority: {data.metrics.authority}</p>
                    <p>Visibility: {data.metrics.visibility}</p>
                    <p>Size: {data.metrics.size}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
          <Scatter 
            name="Competitors" 
            data={positioningData.filter(item => !item.isYourSite)} 
            fill="#82ca9d" 
          />
          <Scatter 
            name="Your Website" 
            data={positioningData.filter(item => item.isYourSite)} 
            fill="#8884d8" 
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function MarketPositionPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorMarketData[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingCompetitors, setLoadingCompetitors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'enterprise'>('free'); // Add logic to fetch actual tier
  const { toast } = useToast();

  // Fetch projects on initial load
  useEffect(() => {
    async function fetchInitialData() {
      setLoadingProjects(true);
      setError(null);
      try {
        // TODO: Fetch user tier properly
        setUserTier('enterprise'); // Assuming enterprise for now

        const projectResponse = await fetch('/api/projects');
        if (!projectResponse.ok) {
          throw new Error('Failed to fetch projects');
        }
        const { data: fetchedProjects } = await projectResponse.json();

        if (fetchedProjects && fetchedProjects.length > 0) {
          setProjects(fetchedProjects);
          // Select the first project by default
          handleProjectChange(fetchedProjects[0].id);
        } else {
          setProjects([]);
          setSelectedProject(null);
          setCompetitors([]);
        }
      } catch (err: any) {
        console.error("Error fetching initial data:", err);
        setError(`Failed to load project data: ${err.message}`);
        toast({
          title: "Error Loading Data",
          description: `Could not fetch project data: ${err.message}`,
          variant: "destructive"
        });
      } finally {
        setLoadingProjects(false);
      }
    }
    fetchInitialData();
  }, [toast]); // Added toast dependency

  // Fetch competitors when selected project changes
  async function fetchCompetitorsForProject(projectId: string) {
    setLoadingCompetitors(true);
    setError(null);
    setCompetitors([]); // Clear previous competitors
    try {
      const competitorsResponse = await fetch(`/api/competitors?projectId=${projectId}`);
      if (!competitorsResponse.ok) {
        throw new Error('Failed to fetch competitors for the project');
      }
      const { data: fetchedCompetitors } = await competitorsResponse.json();

      if (fetchedCompetitors && fetchedCompetitors.length > 0) {
        const marketData = fetchedCompetitors
          .filter((comp: any) => comp.status === 'completed' && comp.analysis_data?.metrics)
          .map((comp: any): CompetitorMarketData => ({
            id: comp.id,
            name: new URL(comp.competitor_url).hostname, // Use hostname as name
            projectId: comp.project_id,
            metrics: {
              authority: comp.analysis_data.metrics.domainAuthority || 0,
              visibility: comp.analysis_data.metrics.trafficEstimate || 0, // Map trafficEstimate
              size: comp.analysis_data.metrics.keywordCount || 0, // Map keywordCount
            },
            // Basic isYourSite logic - needs refinement based on how project URL is handled
            isYourSite: selectedProject?.name === new URL(comp.competitor_url).hostname
          }));
        setCompetitors(marketData);
      } else {
        setCompetitors([]);
      }
    } catch (err: any) {
      console.error("Error fetching competitors:", err);
      setError(`Failed to load competitor data: ${err.message}`);
      toast({
        title: "Error Loading Competitors",
        description: `Could not fetch competitor data: ${err.message}`,
        variant: "destructive"
      });
    } finally {
      setLoadingCompetitors(false);
    }
  }

  // Handle project selection change
  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId) || null;
    setSelectedProject(project);
    if (projectId) {
      fetchCompetitorsForProject(projectId);
    } else {
      setCompetitors([]); // Clear competitors if no project is selected
      setLoadingCompetitors(false);
    }
  };
  
  // Combined loading state
  const isLoading = loadingProjects || loadingCompetitors;

  if (userTier !== 'enterprise') {
    // Keep the enterprise tier lock screen
    return (
      <div className="py-6 space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Market Position Analysis</h1>
          <p className="text-muted-foreground">
            Analyze your position in the market compared to competitors
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Enterprise Feature</CardTitle>
            <CardDescription>Market Position Analysis is available for Enterprise tier users only</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Lock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Unlock Market Position Analysis</h3>
              <p className="text-muted-foreground mb-4">
                Upgrade to our Enterprise plan to access advanced market position analysis, SWOT analysis,
                and competitive landscape visualization.
              </p>
              <Button asChild>
                <Link href="/settings/subscription">
                  Upgrade Subscription
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Market Position Analysis</h1>
        <p className="text-muted-foreground">
          Analyze your position in the market compared to competitors for a selected project.
        </p>
      </div>

      {loadingProjects ? (
        <Skeleton className="h-10 w-1/4" />
      ) : projects.length > 0 ? (
        <Select 
          value={selectedProject?.id || ''}
          onValueChange={handleProjectChange}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project: Project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Projects Found</AlertTitle>
          <AlertDescription>
            You need to add a project before analyzing market position. 
            <Link href="/projects" className="font-medium text-primary underline ml-1">Add Project</Link>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Competitive Landscape Map</CardTitle>
          <CardDescription>
            Visualize competitor positions based on Domain Authority and Estimated Visibility. 
            Bubble size represents relative Keyword Count.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : competitors.length > 0 ? (
            <PositioningMap competitors={competitors} projectUrl={undefined} />
          ) : selectedProject ? (
            <div className="text-center py-10 text-muted-foreground">
              No analyzed competitors found for the selected project.
              <br />
              <Link href={`/projects/${selectedProject.id}`} className="text-primary underline">Manage competitors for {selectedProject.name}</Link>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              Please select a project to view the market position.
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Placeholder for other potential market analysis components (SWOT, Trends, etc.) */}
      {/* ... */}
      
    </div>
  );
} 