"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, BellRing, Check, Clock, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AlertSettingsProps {
  projectId: string;
  userTier: 'free' | 'pro' | 'enterprise';
}

interface AlertSettings {
  id: string;
  user_id: string;
  project_id: string;
  email_alerts: boolean;
  dashboard_alerts: boolean;
  alert_threshold: number;
  daily_digest: boolean;
  weekly_digest: boolean;
  metrics_to_monitor: string[];
  created_at: string;
  updated_at: string;
}

const defaultMetricsOptions = [
  { label: 'Domain Authority', value: 'seo_metrics.domainAuthority' },
  { label: 'Page Authority', value: 'seo_metrics.pageAuthority' },
  { label: 'Backlinks', value: 'seo_metrics.backlinks' },
  { label: 'Desktop Speed', value: 'technical_metrics.pageSpeed.desktop' },
  { label: 'Mobile Speed', value: 'technical_metrics.pageSpeed.mobile' },
  { label: 'Core Web Vitals', value: 'technical_metrics.coreWebVitals.lcp' },
  { label: 'Word Count', value: 'content_metrics.averageWordCount' },
  { label: 'Page Count', value: 'content_metrics.pageCount' },
  { label: 'Keywords', value: 'keyword_data.totalKeywords' }
];

export default function AlertSettings({ projectId, userTier }: AlertSettingsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  
  // State for form values
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [dashboardAlerts, setDashboardAlerts] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(10);
  const [dailyDigest, setDailyDigest] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [metricsToMonitor, setMetricsToMonitor] = useState<string[]>([]);
  
  // Determine feature availability based on tier
  const canUseEmailAlerts = userTier === 'pro' || userTier === 'enterprise';
  const canUseDailyDigest = userTier === 'enterprise';
  
  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, [projectId]);
  
  // Fetch alert settings
  async function fetchSettings() {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/projects/${projectId}/competitors/alerts`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // No settings found, use defaults based on tier
          initializeDefaultSettings();
          return;
        }
        throw new Error('Failed to fetch alert settings');
      }
      
      const data = await response.json();
      setSettings(data);
      
      // Update form states
      setEmailAlerts(data.email_alerts);
      setDashboardAlerts(data.dashboard_alerts);
      setAlertThreshold(data.alert_threshold);
      setDailyDigest(data.daily_digest);
      setWeeklyDigest(data.weekly_digest);
      setMetricsToMonitor(data.metrics_to_monitor || []);
      
    } catch (err: any) {
      console.error('Error fetching alert settings:', err);
      setError(err.message || 'Failed to load alert settings');
      initializeDefaultSettings();
    } finally {
      setIsLoading(false);
    }
  }
  
  // Initialize default settings based on tier
  function initializeDefaultSettings() {
    setEmailAlerts(false);
    setDashboardAlerts(true);
    setAlertThreshold(10);
    setDailyDigest(userTier === 'enterprise');
    setWeeklyDigest(userTier === 'pro' || userTier === 'free');
    setMetricsToMonitor([
      'seo_metrics.domainAuthority',
      'technical_metrics.pageSpeed.desktop',
      'seo_metrics.backlinks'
    ]);
  }
  
  // Save settings
  async function saveSettings() {
    try {
      setIsSaving(true);
      setError(null);
      
      // Apply tier-based restrictions
      const formattedSettings = {
        email_alerts: canUseEmailAlerts && emailAlerts,
        dashboard_alerts: dashboardAlerts,
        alert_threshold: alertThreshold,
        daily_digest: canUseDailyDigest && dailyDigest,
        weekly_digest: weeklyDigest,
        metrics_to_monitor: metricsToMonitor
      };
      
      const response = await fetch(`/api/projects/${projectId}/competitors/alerts`, {
        method: settings ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedSettings)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save alert settings');
      }
      
      const data = await response.json();
      setSettings(data);
      
      toast({
        title: "Settings Saved",
        description: "Your alert preferences have been updated.",
        duration: 3000
      });
      
    } catch (err: any) {
      console.error('Error saving alert settings:', err);
      setError(err.message || 'Failed to save alert settings');
      
      toast({
        title: "Error",
        description: "Failed to save alert settings. Please try again.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsSaving(false);
    }
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BellRing className="h-5 w-5 mr-2 text-primary" />
          Change Alert Settings
        </CardTitle>
        <CardDescription>
          Get notified when competitor metrics change significantly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Alert Types</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="dashboard-alerts" 
                    checked={dashboardAlerts}
                    onCheckedChange={setDashboardAlerts}
                  />
                  <Label htmlFor="dashboard-alerts">Dashboard Alerts</Label>
                </div>
                <Badge variant="secondary">All Tiers</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="email-alerts" 
                    checked={emailAlerts}
                    onCheckedChange={setEmailAlerts}
                    disabled={!canUseEmailAlerts}
                  />
                  <Label htmlFor="email-alerts" className={!canUseEmailAlerts ? "text-muted-foreground" : ""}>
                    Email Alerts
                  </Label>
                </div>
                <Badge variant="secondary">Pro & Enterprise</Badge>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-medium mb-2">Alert Frequency</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="weekly-digest" 
                    checked={weeklyDigest}
                    onCheckedChange={setWeeklyDigest}
                  />
                  <Label htmlFor="weekly-digest">Weekly Digest</Label>
                </div>
                <Badge variant="secondary">All Tiers</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="daily-digest" 
                    checked={dailyDigest}
                    onCheckedChange={setDailyDigest}
                    disabled={!canUseDailyDigest}
                  />
                  <Label htmlFor="daily-digest" className={!canUseDailyDigest ? "text-muted-foreground" : ""}>
                    Daily Digest
                  </Label>
                </div>
                <Badge variant="secondary">Enterprise Only</Badge>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium">Alert Threshold</h3>
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" /> {alertThreshold}% Change
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Receive alerts when metrics change by this percentage or more
            </p>
            <Input
              type="range"
              min="1"
              max="50"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-medium mb-2">Metrics to Monitor</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Select which metrics to track for significant changes
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {defaultMetricsOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.value}
                    checked={metricsToMonitor.includes(option.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setMetricsToMonitor([...metricsToMonitor, option.value]);
                      } else {
                        setMetricsToMonitor(
                          metricsToMonitor.filter((value) => value !== option.value)
                        );
                      }
                    }}
                  />
                  <Label htmlFor={option.value}>{option.label}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={fetchSettings} disabled={isSaving}>
          Reset
        </Button>
        <Button onClick={saveSettings} disabled={isSaving}>
          {isSaving ? (
            <>Saving...</>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" /> Save Settings
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 