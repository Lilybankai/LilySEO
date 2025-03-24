"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { CompetitorBarChart } from "../charts/competitor-bar-chart";

interface Competitor {
  domain: string;
  rankPosition: number;
  rankChange: number;
  traffic: number;
  trafficChange: number;
  keywordsCount: number;
  backlinksCount: number;
  domainAuthority: number;
}

interface AuditCompetitorsProps {
  competitors: Competitor[];
  domainAuthority: number;
  rankPosition: number;
  domainName: string;
}

export function AuditCompetitors({ competitors, domainAuthority, rankPosition, domainName }: AuditCompetitorsProps) {
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  // Sort competitors by domain authority
  const sortedCompetitors = [...competitors].sort((a, b) => b.domainAuthority - a.domainAuthority);
  
  // Format number with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };
  
  // Get change indicator icon
  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    if (change < 0) return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Competitor Analysis</CardTitle>
        <CardDescription>
          Analysis of your top competitors and how your site compares to them
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Comparison</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Domain Authority</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{domainAuthority}/100</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {domainAuthority > 50 
                      ? "Strong authority compared to competitors" 
                      : "Opportunity to improve domain authority"}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Rank Position</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{rankPosition.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {rankPosition < 100000 
                      ? "Good ranking compared to industry" 
                      : "Opportunity to improve ranking"}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Competitors Tracked</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{competitors.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {competitors.length > 0 
                      ? "Top competitors in your industry" 
                      : "No competitors identified yet"}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {competitors.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Domain Authority Comparison</h3>
                <div className="h-80">
                  <CompetitorBarChart 
                    data={[
                      { name: domainName, value: domainAuthority },
                      ...sortedCompetitors.slice(0, 5).map(comp => ({
                        name: comp.domain,
                        value: comp.domainAuthority
                      }))
                    ]} 
                  />
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="detailed" className="mt-4">
            {competitors.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domain</TableHead>
                      <TableHead className="text-right">Rank</TableHead>
                      <TableHead className="text-right">Traffic</TableHead>
                      <TableHead className="text-right">Keywords</TableHead>
                      <TableHead className="text-right">Backlinks</TableHead>
                      <TableHead className="text-right">DA</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedCompetitors.map((competitor, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{competitor.domain}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {competitor.rankPosition.toLocaleString()}
                            {getChangeIcon(competitor.rankChange)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {formatNumber(competitor.traffic)}
                            {getChangeIcon(competitor.trafficChange)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(competitor.keywordsCount)}</TableCell>
                        <TableCell className="text-right">{formatNumber(competitor.backlinksCount)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={competitor.domainAuthority > 50 ? "default" : "secondary"}>
                            {competitor.domainAuthority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`https://${competitor.domain}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Your site */}
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-medium">{domainName} (You)</TableCell>
                      <TableCell className="text-right">{rankPosition.toLocaleString()}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={domainAuthority > 50 ? "default" : "secondary"}>
                          {domainAuthority}
                        </Badge>
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No competitor data available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 