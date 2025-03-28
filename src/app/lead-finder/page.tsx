"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import LeadSearch from "@/components/lead-finder/lead-search"
import LeadsList from "@/components/lead-finder/leads-list"
import UsageStats from "@/components/lead-finder/usage-stats"
import { MapPin, Search, Zap, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

export default function LeadFinderPage() {
  const [remainingSearches, setRemainingSearches] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRemainingSearches = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch("/api/lead-finder/remaining-searches");
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please sign in.");
        }
        throw new Error(`Failed to fetch remaining searches: ${response.status}`);
      }
      
      const data = await response.json();
      setRemainingSearches(data.remaining_searches);
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
  };

  useEffect(() => {
    fetchRemainingSearches();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Finder</h1>
          <p className="text-muted-foreground">
            Discover and manage potential business leads in your area
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="bg-card border rounded-lg px-4 py-2">
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : error ? (
            <Button onClick={fetchRemainingSearches} variant="outline" size="sm">
              Retry
            </Button>
          ) : (
            <div className="bg-card border rounded-lg px-4 py-2 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Remaining searches:</span>
              <span className="text-lg font-semibold">{remainingSearches}</span>
            </div>
          )}
          
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

      <Tabs defaultValue="search" className="space-y-6">
        <TabsList>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search Businesses
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Saved Leads
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            Usage & History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Find Business Leads</CardTitle>
              <CardDescription>
                Search for businesses by industry and location to find potential leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeadSearch
                onSearch={() => {
                  // When a search is performed, we'll update the remaining searches
                  setRemainingSearches((prev) => Math.max(0, prev - 1));
                  
                  // Refresh the count after a short delay (for accuracy)
                  setTimeout(fetchRemainingSearches, 500);
                }}
                remainingSearches={remainingSearches}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Saved Leads</CardTitle>
              <CardDescription>
                Manage your saved business leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeadsList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage & Search History</CardTitle>
              <CardDescription>
                View your search history and purchase additional search packages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsageStats 
                onPackagePurchased={(searches) => {
                  setRemainingSearches((prev) => prev + searches);
                  // Refresh the actual count after a short delay
                  setTimeout(fetchRemainingSearches, 1000);
                }} 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 