"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, FileText, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

interface ContentKeyword {
  keyword: string;
  position: number;
  volume: number;
  difficulty: number;
}

interface ContentAnalysis {
  id: string;
  competitor_url: string;
  analysis_data: {
    metrics: {
      topKeywords: ContentKeyword[];
      contentGaps: ContentKeyword[];
    };
    strengthsWeaknesses: {
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
    };
  };
  project_id: string;
  projects?: {
    name: string;
    url: string;
  };
}

export default function ContentAnalysisPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [competitors, setCompetitors] = useState<ContentAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const competitorId = searchParams.get('id');
  const projectId = searchParams.get('projectId');
  
  useEffect(() => {
    fetchCompetitors();
  }, []);
  
  const fetchCompetitors = async () => {
    setIsLoading(true);
    try {
      // If specific ID is provided, fetch just that competitor
      if (competitorId) {
        const response = await fetch(`/api/competitors/${competitorId}`);
        if (!response.ok) throw new Error('Failed to fetch competitor data');
        
        const { data } = await response.json();
        setCompetitors([data]);
      } 
      // If only project ID is provided, fetch all competitors for that project
      else if (projectId) {
        const response = await fetch(`/api/competitors?projectId=${projectId}`);
        if (!response.ok) throw new Error('Failed to fetch competitors');
        
        const { data } = await response.json();
        setCompetitors(data || []);
      } 
      // Otherwise fetch all competitors
      else {
        const response = await fetch('/api/competitors');
        if (!response.ok) throw new Error('Failed to fetch competitors');
        
        const { data } = await response.json();
        setCompetitors(data || []);
      }
    } catch (error) {
      console.error('Error fetching competitors:', error);
      toast({
        title: "Error",
        description: "Failed to load competitor content data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const filteredCompetitors = competitors.filter(comp => 
    comp.competitor_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (comp.projects?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort keywords by volume
  const sortKeywords = (keywords: ContentKeyword[]) => {
    return [...keywords].sort((a, b) => b.volume - a.volume);
  };
  
  return (
    <div className="py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Analysis</h1>
          <p className="text-gray-500">
            Analyze and compare content strategies across competitors
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              placeholder="Search competitors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={() => router.push('/reports/create?type=content')}>
            Generate Report
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="py-10 text-center text-gray-500">Loading competitor content data...</div>
      ) : filteredCompetitors.length === 0 ? (
        <div className="py-10 text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium">No content analysis available</h3>
          <p className="text-sm text-gray-500 mt-2">
            {searchTerm 
              ? "No competitors match your search criteria." 
              : "You haven't analyzed any competitors yet."}
          </p>
          <Button 
            className="mt-4" 
            onClick={() => router.push('/projects')}
          >
            Add Competitors
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredCompetitors.map((competitor) => (
            <Card key={competitor.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">
                      <Link href={`/competitors/compare?id=${competitor.id}`} className="text-blue-600 hover:underline">
                        {competitor.competitor_url}
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      {competitor.projects?.name && (
                        <span>Project: <Link href={`/projects/${competitor.project_id}`} className="text-blue-600 hover:underline">{competitor.projects.name}</Link></span>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <Tabs defaultValue="keywords" className="w-full">
                  <TabsList className="w-full justify-start px-6 pt-2">
                    <TabsTrigger value="keywords">Top Keywords</TabsTrigger>
                    <TabsTrigger value="gaps">Content Gaps</TabsTrigger>
                    <TabsTrigger value="insights">Content Insights</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="keywords" className="p-6">
                    <div className="text-sm font-medium mb-4">Top ranking keywords for this competitor</div>
                    <div className="grid gap-2">
                      {sortKeywords(competitor.analysis_data.metrics.topKeywords).map((keyword, index) => (
                        <div key={index} className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="bg-blue-50">
                              #{keyword.position}
                            </Badge>
                            <span className="font-medium">{keyword.keyword}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{keyword.volume.toLocaleString()} searches/mo</div>
                            <div className="text-xs text-gray-500">
                              Difficulty: {keyword.difficulty}/100
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="gaps" className="p-6">
                    <div className="text-sm font-medium mb-4">Keywords your competitor ranks for that you don't</div>
                    <div className="grid gap-2">
                      {sortKeywords(competitor.analysis_data.metrics.contentGaps).map((keyword, index) => (
                        <div key={index} className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="bg-green-50">
                              #{keyword.position}
                            </Badge>
                            <span className="font-medium">{keyword.keyword}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{keyword.volume.toLocaleString()} searches/mo</div>
                            <div className="text-xs text-gray-500">
                              Difficulty: {keyword.difficulty}/100
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="insights" className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Content Strengths</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                          <ul className="list-disc pl-4 space-y-1">
                            {competitor.analysis_data.strengthsWeaknesses.strengths.map((strength, index) => (
                              <li key={index}>{strength}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Content Weaknesses</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                          <ul className="list-disc pl-4 space-y-1">
                            {competitor.analysis_data.strengthsWeaknesses.weaknesses.map((weakness, index) => (
                              <li key={index}>{weakness}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Content Opportunities</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                          <ul className="list-disc pl-4 space-y-1">
                            {competitor.analysis_data.strengthsWeaknesses.opportunities.map((opportunity, index) => (
                              <li key={index}>{opportunity}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 