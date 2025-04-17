"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertCircle, Lock, Edit, Download, FileText, Save, X } from 'lucide-react';

interface MarketPositionProps {
  projectId: string;
  competitors: Array<{
    id: string;
    name: string;
    url: string;
    metrics: {
      authority: number;
      visibility: number;
      size: number; // Relative market size
    }
  }>;
  userTier: 'free' | 'pro' | 'enterprise';
}

// Default implementation for SWOT item component
const SWOTItem = ({ 
  title, 
  items, 
  editable, 
  onUpdate 
}: { 
  title: string; 
  items: string[]; 
  editable: boolean; 
  onUpdate: (items: string[]) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItems, setEditedItems] = useState<string[]>(items);
  
  const handleSave = () => {
    onUpdate(editedItems);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditedItems(items);
    setIsEditing(false);
  };
  
  const handleChange = (text: string) => {
    // Split text by new lines and filter out empty lines
    const newItems = text.split('\n').filter(item => item.trim() !== '');
    setEditedItems(newItems);
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{title}</CardTitle>
          {editable && !isEditing && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {isEditing && (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={handleSave}>
                <Save className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Textarea
            value={editedItems.join('\n')}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`Enter ${title.toLowerCase()} items, one per line`}
            className="min-h-[120px]"
          />
        ) : (
          <ul className="list-disc pl-5 space-y-1">
            {items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
            {items.length === 0 && (
              <li className="text-muted-foreground">No items added yet</li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export function MarketPositionAnalysis({ projectId, competitors, userTier }: MarketPositionProps) {
  const [activeTab, setActiveTab] = useState('positioning');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swotData, setSWOTData] = useState({
    strengths: [
      'Strong backlink profile from authority sites',
      'Comprehensive product documentation',
      'Fast page loading times across the site'
    ],
    weaknesses: [
      'Limited social media presence',
      'Fewer indexed pages than competitors',
      'Lower domain authority than market leaders'
    ],
    opportunities: [
      'Growing market interest in related keywords',
      'Competitor content gaps in tutorial content',
      'Potential for featured snippets optimization'
    ],
    threats: [
      'Increasing competition in primary keywords',
      'Search algorithm updates affecting rankings',
      'Competitors investing heavily in content marketing'
    ]
  });
  
  // Placeholder data for market share
  const marketShareData = [
    { name: 'Your Website', value: 15, color: '#8884d8' },
    { name: 'Competitor A', value: 25, color: '#82ca9d' },
    { name: 'Competitor B', value: 35, color: '#ffc658' },
    { name: 'Competitor C', value: 10, color: '#ff8042' },
    { name: 'Others', value: 15, color: '#cccccc' },
  ];
  
  // Prepare data for positioning map
  const positioningData = competitors.map(competitor => ({
    name: competitor.name,
    authority: competitor.metrics.authority,
    visibility: competitor.metrics.visibility,
    size: competitor.metrics.size,
    isYourSite: competitor.name === 'Your Website'
  }));
  
  // Handle SWOT updates
  const handleSWOTUpdate = (type: 'strengths' | 'weaknesses' | 'opportunities' | 'threats', items: string[]) => {
    setSWOTData(prev => ({
      ...prev,
      [type]: items
    }));
  };
  
  const isEnterpriseUser = userTier === 'enterprise';
  
  if (!isEnterpriseUser) {
    return (
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
              and competitive positioning maps.
            </p>
            <Button>Upgrade Now</Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-1/3 bg-gray-200 animate-pulse rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
        </div>
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Market Position Analysis</h2>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Analysis
        </Button>
      </div>
      
      <Tabs defaultValue="positioning" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="positioning">Positioning Map</TabsTrigger>
          <TabsTrigger value="swot">SWOT Analysis</TabsTrigger>
          <TabsTrigger value="trends">Market Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="positioning" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Positioning Map</CardTitle>
              <CardDescription>
                Visualize your position in the market based on domain authority and search visibility
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                      name="Visibility" 
                      domain={[0, 100]}
                      label={{ value: 'Search Visibility', position: 'bottom' }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="authority" 
                      name="Authority" 
                      domain={[0, 100]}
                      label={{ value: 'Domain Authority', angle: -90, position: 'left' }}
                    />
                    <ZAxis 
                      type="number" 
                      dataKey="size" 
                      range={[100, 1000]} 
                      name="Market Size" 
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      formatter={(value, name) => [`${value}`, name]}
                      labelFormatter={(value) => ''}
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
              
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-medium">Positioning Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground">Market Leaders</div>
                    <div className="mt-2 space-y-2">
                      {positioningData
                        .sort((a, b) => (b.authority + b.visibility) - (a.authority + a.visibility))
                        .slice(0, 3)
                        .map((item, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span>{item.name}</span>
                            <Badge variant={item.isYourSite ? "default" : "secondary"}>
                              {Math.round((item.authority + item.visibility) / 2)}
                            </Badge>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground">Your Position</div>
                    <div className="mt-2">
                      {positioningData
                        .filter(item => item.isYourSite)
                        .map((item, i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span>Authority</span>
                              <Badge>{item.authority}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Visibility</span>
                              <Badge>{item.visibility}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Market Share</span>
                              <Badge>{marketShareData.find(d => d.name === 'Your Website')?.value}%</Badge>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground">Market Gaps</div>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span>High Authority, Low Visibility</span>
                        <Badge variant="outline">Opportunity</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Content Coverage</span>
                        <Badge variant="outline">Gap</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Technical SEO</span>
                        <Badge variant="default">Strength</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="swot" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SWOTItem 
              title="Strengths" 
              items={swotData.strengths} 
              editable={true}
              onUpdate={(items) => handleSWOTUpdate('strengths', items)}
            />
            
            <SWOTItem 
              title="Weaknesses" 
              items={swotData.weaknesses} 
              editable={true}
              onUpdate={(items) => handleSWOTUpdate('weaknesses', items)}
            />
            
            <SWOTItem 
              title="Opportunities" 
              items={swotData.opportunities} 
              editable={true}
              onUpdate={(items) => handleSWOTUpdate('opportunities', items)}
            />
            
            <SWOTItem 
              title="Threats" 
              items={swotData.threats} 
              editable={true}
              onUpdate={(items) => handleSWOTUpdate('threats', items)}
            />
          </div>
          
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertTitle>SWOT Analysis</AlertTitle>
            <AlertDescription>
              Your SWOT analysis is automatically generated based on competitive data and can be customized to reflect your strategic understanding of the market.
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline">
              Reset to Auto-Generated
            </Button>
            <Button>
              Save Analysis
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Market Trends</CardTitle>
              <CardDescription>
                Analyze market trends and identify emerging opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Market Trends Analysis</h3>
                <p className="text-muted-foreground mb-4">
                  This feature is under development and will be available soon.
                  It will include trend analysis for keyword growth, content strategies, and market share shifts.
                </p>
                <Badge>Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Alert className="mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Pro Tip</AlertTitle>
        <AlertDescription>
          Use the Market Position Analysis to identify gaps in the market and opportunities for growth. Focus on areas where competitors are weak and your strengths can be leveraged.
        </AlertDescription>
      </Alert>
    </div>
  );
} 