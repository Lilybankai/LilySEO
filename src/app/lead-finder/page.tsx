"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import LeadSearch from "@/components/lead-finder/lead-search"
import LeadsList from "@/components/lead-finder/leads-list"
import UsageStats from "@/components/lead-finder/usage-stats"
import { MapPin, Search, Zap, Info, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function LeadFinderPage() {
  const { toast } = useToast();
  const [remainingSearches, setRemainingSearches] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRemainingSearches = useCallback(async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/lead-finder/remaining-searches?_=${timestamp}`, { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please sign in.");
        }
        throw new Error(`Failed to fetch remaining searches: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Fetched remaining searches:", data);
      setRemainingSearches(data.remaining_searches || 0);
    } catch (error: any) {
      console.error("Error fetching remaining searches:", error);
      setError(error.message);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRemainingSearches();
  }, [fetchRemainingSearches]);

  const handleSearchCompleted = useCallback(() => {
    console.log("Search completed, refreshing remaining search count");
    fetchRemainingSearches();
  }, [fetchRemainingSearches]);

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Finder</h1>
          <p className="text-muted-foreground">
            Search for businesses to find potential leads
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 text-sm bg-muted/50">
            <MapPin className="w-3 h-3 mr-1" />
            <span>Remaining searches: {isLoading ? "Loading..." : remainingSearches}</span>
          </Badge>
          
          <Button variant="outline" size="sm" asChild>
            <Link href="/api/test-serpapi" target="_blank" rel="noopener noreferrer">
              <Zap className="h-4 w-4 mr-1" /> Test API
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg text-blue-700 dark:text-blue-300">How to Use Lead Finder</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
            <p>
              <strong>1. Search for businesses:</strong> Enter a business type (e.g., "Plumber", "Restaurant") and a specific location. 
              For best results, include the city and country (e.g., "Leeds, UK", "New York, USA").
            </p>
            <p>
              <strong>2. Filter and refine results:</strong> Use the rating filters, search radius, and other options to narrow down your search.
            </p>
            <p>
              <strong>3. Save leads:</strong> Save interesting businesses to your leads list for follow-up and contact management.
            </p>
            <p>
              <strong>4. Export data:</strong> Export your lead data as CSV for use in other marketing tools.
            </p>
            <p className="mt-2 font-medium">
              Note: Each search consumes one search credit from your monthly allocation. Be specific with your location to get the most relevant results.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>
        
        <TabsContent value="search" className="space-y-4">
          <LeadSearch onSearch={handleSearchCompleted} remainingSearches={remainingSearches} />
        </TabsContent>
      </Tabs>
      
      <Button
        variant="link"
        className="flex items-center mx-auto mt-8"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ArrowUp className="w-4 h-4 mr-2" /> Back to top
      </Button>
    </div>
  )
} 