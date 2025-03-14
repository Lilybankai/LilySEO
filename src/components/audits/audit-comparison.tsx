'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LegacySeoReport } from "@/services/seo-analysis";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface AuditComparisonProps {
  audits: LegacySeoReport[];
}

export function AuditComparison({ audits }: AuditComparisonProps) {
  const [selectedMetric, setSelectedMetric] = useState<'overall' | 'performance' | 'usability' | 'links'>('overall');

  // Prepare data for line chart
  const lineChartData = audits.map(audit => ({
    date: new Date(audit.crawlDate).toLocaleDateString(),
    overall: audit.score.overall,
    onPageSeo: audit.score.categories.onPageSeo,
    performance: audit.score.categories.performance,
    usability: audit.score.categories.usability,
    links: audit.score.categories.links,
    social: audit.score.categories.social,
  }));

  // Prepare data for radar chart
  const latestAudit = audits[audits.length - 1];
  const radarChartData = [
    { category: 'Overall', value: latestAudit.score.overall },
    { category: 'On-Page SEO', value: latestAudit.score.categories.onPageSeo },
    { category: 'Performance', value: latestAudit.score.categories.performance },
    { category: 'Usability', value: latestAudit.score.categories.usability },
    { category: 'Links', value: latestAudit.score.categories.links },
    { category: 'Social', value: latestAudit.score.categories.social },
  ];

  // Calculate score changes
  const previousAudit = audits[audits.length - 2];
  const scoreChanges = previousAudit ? {
    overall: latestAudit.score.overall - previousAudit.score.overall,
    onPageSeo: latestAudit.score.categories.onPageSeo - previousAudit.score.categories.onPageSeo,
    performance: latestAudit.score.categories.performance - previousAudit.score.categories.performance,
    usability: latestAudit.score.categories.usability - previousAudit.score.categories.usability,
    links: latestAudit.score.categories.links - previousAudit.score.categories.links,
    social: latestAudit.score.categories.social - previousAudit.score.categories.social,
  } : null;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Score Trends</CardTitle>
          <CardDescription>Track your SEO score changes over time</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="line" className="space-y-4">
            <TabsList>
              <TabsTrigger value="line">Line Chart</TabsTrigger>
              <TabsTrigger value="radar">Radar Chart</TabsTrigger>
            </TabsList>

            <TabsContent value="line" className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="overall" name="Overall" stroke="#0066cc" />
                  <Line type="monotone" dataKey="onPageSeo" name="On-Page SEO" stroke="#ff6b6b" />
                  <Line type="monotone" dataKey="performance" name="Performance" stroke="#51cf66" />
                  <Line type="monotone" dataKey="usability" name="Usability" stroke="#ffd43b" />
                  <Line type="monotone" dataKey="links" name="Links" stroke="#845ef7" />
                  <Line type="monotone" dataKey="social" name="Social" stroke="#339af0" />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="radar" className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarChartData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="#0066cc"
                    fill="#0066cc"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {scoreChanges && (
        <Card>
          <CardHeader>
            <CardTitle>Score Changes</CardTitle>
            <CardDescription>Changes since last audit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Overall</p>
                <p className={`text-2xl font-bold ${scoreChanges.overall >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {scoreChanges.overall >= 0 ? '+' : ''}{scoreChanges.overall.toFixed(1)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">On-Page SEO</p>
                <p className={`text-2xl font-bold ${scoreChanges.onPageSeo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {scoreChanges.onPageSeo >= 0 ? '+' : ''}{scoreChanges.onPageSeo.toFixed(1)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Performance</p>
                <p className={`text-2xl font-bold ${scoreChanges.performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {scoreChanges.performance >= 0 ? '+' : ''}{scoreChanges.performance.toFixed(1)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Usability</p>
                <p className={`text-2xl font-bold ${scoreChanges.usability >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {scoreChanges.usability >= 0 ? '+' : ''}{scoreChanges.usability.toFixed(1)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Links</p>
                <p className={`text-2xl font-bold ${scoreChanges.links >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {scoreChanges.links >= 0 ? '+' : ''}{scoreChanges.links.toFixed(1)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Social</p>
                <p className={`text-2xl font-bold ${scoreChanges.social >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {scoreChanges.social >= 0 ? '+' : ''}{scoreChanges.social.toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 