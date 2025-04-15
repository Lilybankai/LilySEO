import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LegacySeoReport } from "@/services/seo-analysis";
import { Progress } from "@/components/ui/progress";

interface AuditPageSpeedMetricsProps {
  report: LegacySeoReport;
}

export function AuditPageSpeedMetrics({ report }: AuditPageSpeedMetricsProps) {
  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    if (score >= 50) return "text-orange-500";
    return "text-red-500";
  };
  
  // Get progress color based on score
  const getProgressColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 70) return "bg-yellow-500";
    if (score >= 50) return "bg-orange-500";
    return "bg-red-500";
  };
  
  // Format milliseconds to a readable format
  const formatTime = (ms: number) => {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>PageSpeed Metrics</CardTitle>
        <CardDescription>
          Performance metrics from Google PageSpeed Insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="mobile">Mobile</TabsTrigger>
            <TabsTrigger value="desktop">Desktop</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Mobile</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Performance</span>
                      <span className={`text-sm font-medium ${getScoreColor(report.pageSpeed.mobile.performance)}`}>
                        {report.pageSpeed.mobile.performance}
                      </span>
                    </div>
                    <Progress 
                      value={report.pageSpeed.mobile.performance} 
                      className={getProgressColor(report.pageSpeed.mobile.performance)}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">SEO</span>
                      <span className={`text-sm font-medium ${getScoreColor(report.pageSpeed.mobile.seo)}`}>
                        {report.pageSpeed.mobile.seo}
                      </span>
                    </div>
                    <Progress 
                      value={report.pageSpeed.mobile.seo} 
                      className={getProgressColor(report.pageSpeed.mobile.seo)}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Accessibility</span>
                      <span className={`text-sm font-medium ${getScoreColor(report.pageSpeed.mobile.accessibility)}`}>
                        {report.pageSpeed.mobile.accessibility}
                      </span>
                    </div>
                    <Progress 
                      value={report.pageSpeed.mobile.accessibility} 
                      className={getProgressColor(report.pageSpeed.mobile.accessibility)}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Best Practices</span>
                      <span className={`text-sm font-medium ${getScoreColor(report.pageSpeed.mobile.bestPractices)}`}>
                        {report.pageSpeed.mobile.bestPractices}
                      </span>
                    </div>
                    <Progress 
                      value={report.pageSpeed.mobile.bestPractices} 
                      className={getProgressColor(report.pageSpeed.mobile.bestPractices)}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Desktop</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Performance</span>
                      <span className={`text-sm font-medium ${getScoreColor(report.pageSpeed.desktop.performance)}`}>
                        {report.pageSpeed.desktop.performance}
                      </span>
                    </div>
                    <Progress 
                      value={report.pageSpeed.desktop.performance} 
                      className={getProgressColor(report.pageSpeed.desktop.performance)}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">SEO</span>
                      <span className={`text-sm font-medium ${getScoreColor(report.pageSpeed.desktop.seo)}`}>
                        {report.pageSpeed.desktop.seo}
                      </span>
                    </div>
                    <Progress 
                      value={report.pageSpeed.desktop.seo} 
                      className={getProgressColor(report.pageSpeed.desktop.seo)}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Accessibility</span>
                      <span className={`text-sm font-medium ${getScoreColor(report.pageSpeed.desktop.accessibility)}`}>
                        {report.pageSpeed.desktop.accessibility}
                      </span>
                    </div>
                    <Progress 
                      value={report.pageSpeed.desktop.accessibility} 
                      className={getProgressColor(report.pageSpeed.desktop.accessibility)}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Best Practices</span>
                      <span className={`text-sm font-medium ${getScoreColor(report.pageSpeed.desktop.bestPractices)}`}>
                        {report.pageSpeed.desktop.bestPractices}
                      </span>
                    </div>
                    <Progress 
                      value={report.pageSpeed.desktop.bestPractices} 
                      className={getProgressColor(report.pageSpeed.desktop.bestPractices)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="mobile" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Core Web Vitals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">First Contentful Paint (FCP)</p>
                        <p className="text-xs text-muted-foreground">Time to first content</p>
                      </div>
                      <p className="text-sm font-medium">{formatTime(report.pageSpeed.mobile.fcp)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Largest Contentful Paint (LCP)</p>
                        <p className="text-xs text-muted-foreground">Time to largest content</p>
                      </div>
                      <p className="text-sm font-medium">{formatTime(report.pageSpeed.mobile.lcp)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Cumulative Layout Shift (CLS)</p>
                        <p className="text-xs text-muted-foreground">Visual stability</p>
                      </div>
                      <p className="text-sm font-medium">{report.pageSpeed.mobile.cls.toFixed(3)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Total Blocking Time (TBT)</p>
                        <p className="text-xs text-muted-foreground">Interactivity</p>
                      </div>
                      <p className="text-sm font-medium">{formatTime(report.pageSpeed.mobile.tbt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Scores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Performance</span>
                        <span className={`text-sm font-medium ${getScoreColor(report.pageSpeed.mobile.performance)}`}>
                          {report.pageSpeed.mobile.performance}
                        </span>
                      </div>
                      <Progress 
                        value={report.pageSpeed.mobile.performance} 
                        className={getProgressColor(report.pageSpeed.mobile.performance)}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">SEO</span>
                        <span className={`text-sm font-medium ${getScoreColor(report.pageSpeed.mobile.seo)}`}>
                          {report.pageSpeed.mobile.seo}
                        </span>
                      </div>
                      <Progress 
                        value={report.pageSpeed.mobile.seo} 
                        className={getProgressColor(report.pageSpeed.mobile.seo)}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Accessibility</span>
                        <span className={`text-sm font-medium ${getScoreColor(report.pageSpeed.mobile.accessibility)}`}>
                          {report.pageSpeed.mobile.accessibility}
                        </span>
                      </div>
                      <Progress 
                        value={report.pageSpeed.mobile.accessibility} 
                        className={getProgressColor(report.pageSpeed.mobile.accessibility)}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Best Practices</span>
                        <span className={`text-sm font-medium ${getScoreColor(report.pageSpeed.mobile.bestPractices)}`}>
                          {report.pageSpeed.mobile.bestPractices}
                        </span>
                      </div>
                      <Progress 
                        value={report.pageSpeed.mobile.bestPractices} 
                        className={getProgressColor(report.pageSpeed.mobile.bestPractices)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="desktop" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Core Web Vitals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">First Contentful Paint (FCP)</p>
                        <p className="text-xs text-muted-foreground">Time to first content</p>
                      </div>
                      <p className="text-sm font-medium">{formatTime(report.pageSpeed.desktop.fcp)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Largest Contentful Paint (LCP)</p>
                        <p className="text-xs text-muted-foreground">Time to largest content</p>
                      </div>
                      <p className="text-sm font-medium">{formatTime(report.pageSpeed.desktop.lcp)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Cumulative Layout Shift (CLS)</p>
                        <p className="text-xs text-muted-foreground">Visual stability</p>
                      </div>
                      <p className="text-sm font-medium">{report.pageSpeed.desktop.cls.toFixed(3)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Total Blocking Time (TBT)</p>
                        <p className="text-xs text-muted-foreground">Interactivity</p>
                      </div>
                      <p className="text-sm font-medium">{formatTime(report.pageSpeed.desktop.tbt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Scores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Performance</span>
                        <span className={`text-sm font-medium ${getScoreColor(report.pageSpeed.desktop.performance)}`}>
                          {report.pageSpeed.desktop.performance}
                        </span>
                      </div>
                      <Progress 
                        value={report.pageSpeed.desktop.performance} 
                        className={getProgressColor(report.pageSpeed.desktop.performance)}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">SEO</span>
                        <span className={`text-sm font-medium ${getScoreColor(report.pageSpeed.desktop.seo)}`}>
                          {report.pageSpeed.desktop.seo}
                        </span>
                      </div>
                      <Progress 
                        value={report.pageSpeed.desktop.seo} 
                        className={getProgressColor(report.pageSpeed.desktop.seo)}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Accessibility</span>
                        <span className={`text-sm font-medium ${getScoreColor(report.pageSpeed.desktop.accessibility)}`}>
                          {report.pageSpeed.desktop.accessibility}
                        </span>
                      </div>
                      <Progress 
                        value={report.pageSpeed.desktop.accessibility} 
                        className={getProgressColor(report.pageSpeed.desktop.accessibility)}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Best Practices</span>
                        <span className={`text-sm font-medium ${getScoreColor(report.pageSpeed.desktop.bestPractices)}`}>
                          {report.pageSpeed.desktop.bestPractices}
                        </span>
                      </div>
                      <Progress 
                        value={report.pageSpeed.desktop.bestPractices} 
                        className={getProgressColor(report.pageSpeed.desktop.bestPractices)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 