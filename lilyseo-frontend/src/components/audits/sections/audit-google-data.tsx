"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface GoogleSearchConsoleData {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  clicksChange: number;
  impressionsChange: number;
  ctrChange: number;
  positionChange: number;
  topQueries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  topPages: Array<{
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  performance: Array<{
    date: string;
    clicks: number;
    impressions: number;
  }>;
}

interface AuditGoogleDataProps {
  googleData: GoogleSearchConsoleData;
}

export function AuditGoogleData({ googleData }: AuditGoogleDataProps) {
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  // Format percentage
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };
  
  // Get change indicator icon
  const getChangeIcon = (change: number, inverse: boolean = false) => {
    // For position, lower is better, so we invert the logic
    const adjustedChange = inverse ? -change : change;
    
    if (adjustedChange > 0) return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    if (adjustedChange < 0) return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };
  
  // Format number with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };
  
  // Format date for chart
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Google Search Data</CardTitle>
        <CardDescription>
          Performance metrics from Google Search Console
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="queries">Top Queries</TabsTrigger>
            <TabsTrigger value="pages">Top Pages</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Clicks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(googleData.clicks)}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {getChangeIcon(googleData.clicksChange)}
                    <span className="ml-1">
                      {Math.abs(googleData.clicksChange)}% from previous period
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Impressions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(googleData.impressions)}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {getChangeIcon(googleData.impressionsChange)}
                    <span className="ml-1">
                      {Math.abs(googleData.impressionsChange)}% from previous period
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">CTR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPercentage(googleData.ctr)}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {getChangeIcon(googleData.ctrChange)}
                    <span className="ml-1">
                      {Math.abs(googleData.ctrChange)}% from previous period
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Position</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{googleData.position.toFixed(1)}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {getChangeIcon(googleData.positionChange, true)}
                    <span className="ml-1">
                      {Math.abs(googleData.positionChange)}% from previous period
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {googleData.performance.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Performance Trend</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={googleData.performance}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        yAxisId="left"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value) => formatNumber(Number(value))}
                        labelFormatter={(label) => formatDate(String(label))}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="clicks"
                        name="Clicks"
                        stroke="#3b82f6"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="impressions"
                        name="Impressions"
                        stroke="#10b981"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="queries" className="mt-4">
            {googleData.topQueries.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Query</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Impressions</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                      <TableHead className="text-right">Position</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {googleData.topQueries.map((query, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{query.query}</TableCell>
                        <TableCell className="text-right">{formatNumber(query.clicks)}</TableCell>
                        <TableCell className="text-right">{formatNumber(query.impressions)}</TableCell>
                        <TableCell className="text-right">{formatPercentage(query.ctr)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={query.position < 10 ? "default" : "secondary"}>
                            {query.position.toFixed(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No query data available</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="pages" className="mt-4">
            {googleData.topPages.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Impressions</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                      <TableHead className="text-right">Position</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {googleData.topPages.map((page, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium max-w-[300px] truncate">{page.page}</TableCell>
                        <TableCell className="text-right">{formatNumber(page.clicks)}</TableCell>
                        <TableCell className="text-right">{formatNumber(page.impressions)}</TableCell>
                        <TableCell className="text-right">{formatPercentage(page.ctr)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={page.position < 10 ? "default" : "secondary"}>
                            {page.position.toFixed(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No page data available</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="performance" className="mt-4">
            {googleData.performance.length > 0 ? (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={googleData.performance}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value) => formatNumber(Number(value))}
                      labelFormatter={(label) => formatDate(String(label))}
                    />
                    <Line
                      type="monotone"
                      dataKey="clicks"
                      name="Clicks"
                      stroke="#3b82f6"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="impressions"
                      name="Impressions"
                      stroke="#10b981"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No performance data available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 