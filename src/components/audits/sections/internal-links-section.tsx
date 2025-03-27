"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableCell, TableRow, TableHead } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Network, FileWarning, Link2, ExternalLink, ArrowRight } from "lucide-react";

// Import for visualization if we need it later
// import dynamic from 'next/dynamic';
// const ForceGraph = dynamic(() => import('../charts/force-graph'), { ssr: false });

interface InternalLinksSectionProps {
  internalLinkData: {
    orphanedPages: string[];
    lowInboundPages: { url: string; count: number }[];
    topPages: { url: string; inboundCount: number }[];
    suggestions: { target: string; sources: string[]; reason: string }[];
    graph: {
      nodes: Array<{ id: string; inboundCount: number; outboundCount: number }>;
      links: Array<{ source: string; target: string; text: string }>;
    };
  };
  baseUrl: string;
}

export function InternalLinksSection({ internalLinkData, baseUrl }: InternalLinksSectionProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Helper to convert full URLs to relative paths for display
  const getRelativePath = (url: string) => {
    try {
      // If the URL is already relative, just return it
      if (url.startsWith('/')) return url;
      
      // Try to extract the path from the URL
      const urlObj = new URL(url);
      return urlObj.pathname || '/';
    } catch (e) {
      // If URL parsing fails, return the original URL
      return url;
    }
  };
  
  // Function to open a URL in a new tab
  const openUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  const totalOrphanedPages = internalLinkData.orphanedPages.length;
  const totalLowInboundPages = internalLinkData.lowInboundPages.length;
  const totalPages = internalLinkData.graph.nodes.length;
  const totalLinks = internalLinkData.graph.links.length;
  
  // Calculate link distribution statistics
  const calculateLinkStats = () => {
    if (totalPages === 0) return { min: 0, max: 0, avg: 0 };
    
    const inboundCounts = internalLinkData.graph.nodes.map(node => node.inboundCount);
    const min = Math.min(...inboundCounts);
    const max = Math.max(...inboundCounts);
    const avg = inboundCounts.reduce((acc, val) => acc + val, 0) / totalPages;
    
    return { min, max, avg: Math.round(avg * 10) / 10 };
  };
  
  const linkStats = calculateLinkStats();
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Network className="h-6 w-6 text-primary" />
          Internal Link Optimization
        </h2>
        <p className="text-muted-foreground mt-1">
          Analysis of your site's internal linking structure and opportunities for improvement.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orphaned">Orphaned Pages</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPages}</div>
                <p className="text-xs text-muted-foreground">
                  Pages crawled and analyzed
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Internal Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLinks}</div>
                <p className="text-xs text-muted-foreground">
                  Total internal links found
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Orphaned Pages</CardTitle>
                {totalOrphanedPages > 0 && (
                  <Badge variant="destructive">{totalOrphanedPages}</Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOrphanedPages}</div>
                <p className="text-xs text-muted-foreground">
                  Pages with no incoming links
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Underlinked Pages</CardTitle>
                {totalLowInboundPages > 0 && (
                  <Badge variant="secondary">{totalLowInboundPages}</Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLowInboundPages}</div>
                <p className="text-xs text-muted-foreground">
                  Pages with only 1-2 incoming links
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Link Distribution</CardTitle>
              <CardDescription>Statistics on internal link distribution across your site</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8 justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Average Links per Page</div>
                  <div className="text-2xl font-bold">{linkStats.avg}</div>
                  <div className="text-xs text-muted-foreground">Average number of incoming links per page</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Minimum Links</div>
                  <div className="text-2xl font-bold">{linkStats.min}</div>
                  <div className="text-xs text-muted-foreground">Lowest number of incoming links to any page</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Maximum Links</div>
                  <div className="text-2xl font-bold">{linkStats.max}</div>
                  <div className="text-xs text-muted-foreground">Highest number of incoming links to any page</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Top Linked Pages</CardTitle>
              <CardDescription>Pages with the most incoming internal links</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[280px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page</TableHead>
                      <TableHead className="text-right">Incoming Links</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {internalLinkData.topPages.map((page) => (
                      <TableRow key={page.url}>
                        <TableCell>
                          <Button
                            variant="link"
                            className="p-0 h-auto font-normal text-primary text-left justify-start"
                            onClick={() => openUrl(page.url)}
                          >
                            {getRelativePath(page.url)}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">{page.inboundCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="orphaned" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-destructive" />
                Orphaned Pages
              </CardTitle>
              <CardDescription>
                Pages that are not linked to from any other page on your site
              </CardDescription>
            </CardHeader>
            <CardContent>
              {totalOrphanedPages === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  No orphaned pages found. Good job!
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Page</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {internalLinkData.orphanedPages.map((url) => (
                        <TableRow key={url}>
                          <TableCell>
                            <Button
                              variant="link"
                              className="p-0 h-auto font-normal text-primary text-left justify-start"
                              onClick={() => openUrl(url)}
                            >
                              {getRelativePath(url)}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">No incoming links</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-amber-500" />
                Underlinked Pages
              </CardTitle>
              <CardDescription>
                Pages with very few (1-2) incoming links
              </CardDescription>
            </CardHeader>
            <CardContent>
              {totalLowInboundPages === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  No underlinked pages found. Good job!
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Page</TableHead>
                        <TableHead className="text-right">Incoming Links</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {internalLinkData.lowInboundPages.map((page) => (
                        <TableRow key={page.url}>
                          <TableCell>
                            <Button
                              variant="link"
                              className="p-0 h-auto font-normal text-primary text-left justify-start"
                              onClick={() => openUrl(page.url)}
                            >
                              {getRelativePath(page.url)}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{page.count}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="suggestions" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Link Improvement Suggestions</CardTitle>
              <CardDescription>
                Recommendations to improve your internal linking structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              {internalLinkData.suggestions.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  No suggestions available. Your internal linking structure looks good!
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-8">
                    {internalLinkData.suggestions.map((suggestion, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                          <div>
                            <h3 className="font-medium">
                              Add links to: <span className="text-primary">{getRelativePath(suggestion.target)}</span>
                            </h3>
                            <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUrl(suggestion.target)}
                          >
                            View Page <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                        
                        <h4 className="text-sm font-medium mb-2">Suggested source pages:</h4>
                        <div className="space-y-2">
                          {suggestion.sources.map((sourceUrl, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <Button
                                variant="link"
                                className="p-0 h-auto font-normal text-primary text-left justify-start"
                                onClick={() => openUrl(sourceUrl)}
                              >
                                {getRelativePath(sourceUrl)}
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Best Practices for Internal Linking</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Use descriptive anchor text that includes relevant keywords</li>
                <li>• Create a logical site structure with navigation that follows a hierarchy</li>
                <li>• Link from high-authority pages to important content</li>
                <li>• Ensure every page is reachable within 3-4 clicks from the homepage</li>
                <li>• Regularly audit your site for orphaned and underlinked pages</li>
                <li>• Add contextual links within your content where relevant</li>
                <li>• Consider using breadcrumbs for better navigation</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 