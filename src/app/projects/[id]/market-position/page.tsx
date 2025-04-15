"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MarketPositionAnalysis } from '@/components/market-position-analysis';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function MarketPositionPage() {
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'enterprise'>('enterprise'); // Hardcoded for demo
  const [projectName, setProjectName] = useState('');
  const [competitors, setCompetitors] = useState<any[]>([]);
  
  useEffect(() => {
    // In a real implementation, fetch data from API
    setTimeout(() => {
      setProjectName('My Project');
      // Mock data for the competitors
      setCompetitors([
        {
          id: 'your-site',
          name: 'Your Website',
          url: 'https://yourwebsite.com',
          metrics: {
            authority: 45,
            visibility: 38,
            size: 15
          }
        },
        {
          id: 'competitor-a',
          name: 'Competitor A',
          url: 'https://competitora.com',
          metrics: {
            authority: 65,
            visibility: 72,
            size: 25
          }
        },
        {
          id: 'competitor-b',
          name: 'Competitor B',
          url: 'https://competitorb.com',
          metrics: {
            authority: 78,
            visibility: 58,
            size: 35
          }
        },
        {
          id: 'competitor-c',
          name: 'Competitor C',
          url: 'https://competitorc.com',
          metrics: {
            authority: 35,
            visibility: 25,
            size: 10
          }
        }
      ]);
      setLoading(false);
    }, 1000);
  }, [params.id]);
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-1/3 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/projects/${params.id}`}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Project
            </Link>
          </Button>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold">Market Position Analysis</h1>
          <p className="text-muted-foreground">
            Analyze your position in the market compared to competitors
          </p>
        </div>
        <Separator />
      </div>
      
      {competitors.length > 0 ? (
        <MarketPositionAnalysis 
          projectId={params.id as string} 
          competitors={competitors} 
          userTier={userTier} 
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Competitors Found</CardTitle>
            <CardDescription>
              You need to add competitors to your project before you can analyze market position.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/projects/${params.id}/competitors`}>
                Add Competitors
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 