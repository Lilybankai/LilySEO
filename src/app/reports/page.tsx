"use client";

import { useState, useEffect } from 'react';
import { ReportGenerator } from '@/components/report-generator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText, FileBarChart, Briefcase, FileArchive } from 'lucide-react';

// Mock user data - in production, would be fetched from an API
const mockUserData = {
  subscription: {
    tier: 'pro' as 'free' | 'pro' | 'enterprise',
    features: {
      reports: true,
      scheduledReports: false
    }
  },
  projects: [
    { id: 'proj1', name: 'My First Project' },
    { id: 'proj2', name: 'E-commerce Website' },
    { id: 'proj3', name: 'Blog Relaunch' }
  ]
};

export default function ReportsPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'enterprise'>('free');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API call to fetch user data
    setTimeout(() => {
      setUserTier(mockUserData.subscription.tier);
      if (mockUserData.projects.length > 0) {
        setSelectedProjectId(mockUserData.projects[0].id);
      }
      setLoading(false);
    }, 1000);
  }, []);
  
  const reportTypes = [
    {
      id: 'competitor',
      name: 'Competitor Analysis',
      description: 'Generate detailed reports on your competitors',
      icon: Briefcase
    },
    {
      id: 'keyword',
      name: 'Keyword Performance',
      description: 'Track and analyze keyword performance over time',
      icon: FileBarChart,
      comingSoon: true
    },
    {
      id: 'content',
      name: 'Content Audit',
      description: 'Comprehensive analysis of your content strategy',
      icon: FileText,
      comingSoon: true
    },
    {
      id: 'historical',
      name: 'Historical Data',
      description: 'Review historical data and identify trends',
      icon: FileArchive,
      comingSoon: true
    }
  ];
  
  const [selectedReportType, setSelectedReportType] = useState(reportTypes[0].id);
  
  if (loading) {
    return (
      <div className="container mx-auto py-10 space-y-4">
        <div className="h-10 w-1/4 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-32 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Generate detailed reports about your competitors and SEO performance
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {reportTypes.map(reportType => (
          <Card 
            key={reportType.id}
            className={`cursor-pointer hover:shadow-md transition-shadow ${selectedReportType === reportType.id ? 'ring-2 ring-primary' : ''} ${reportType.comingSoon ? 'opacity-60' : ''}`}
            onClick={() => !reportType.comingSoon && setSelectedReportType(reportType.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <reportType.icon className="h-8 w-8 mb-2 text-primary" />
                {reportType.comingSoon && (
                  <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded">Coming Soon</span>
                )}
              </div>
              <CardTitle className="text-lg">{reportType.name}</CardTitle>
              <CardDescription>{reportType.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
      
      {selectedReportType === 'competitor' && selectedProjectId && (
        <Card>
          <CardHeader>
            <CardTitle>Competitor Analysis Reports</CardTitle>
            <CardDescription>
              Generate detailed reports on your competitors' performance and strategies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="project-select" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="project-select">Select Project</TabsTrigger>
                <TabsTrigger value="all-competitors">All Competitors</TabsTrigger>
                <TabsTrigger value="comparison">Comparison</TabsTrigger>
              </TabsList>
              
              <TabsContent value="project-select" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  {mockUserData.projects.map(project => (
                    <Card 
                      key={project.id}
                      className={`cursor-pointer hover:shadow-md transition-shadow ${selectedProjectId === project.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setSelectedProjectId(project.id)}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <CardDescription>
                          {selectedProjectId === project.id ? 'Currently selected' : 'Click to select'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Button 
                          variant={selectedProjectId === project.id ? "default" : "outline"} 
                          className="w-full"
                        >
                          {selectedProjectId === project.id ? 'Selected' : 'Select Project'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {selectedProjectId && (
                  <div className="flex justify-end">
                    <Button>Continue to Reports</Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="all-competitors" className="space-y-4">
                {selectedProjectId && (
                  <ReportGenerator projectId={selectedProjectId} userTier={userTier} />
                )}
              </TabsContent>
              
              <TabsContent value="comparison" className="space-y-4">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Competitor Comparison</h3>
                  <p className="text-muted-foreground mb-4">
                    This feature will allow you to create side-by-side comparisons of multiple competitors.
                    Coming soon in a future update.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 