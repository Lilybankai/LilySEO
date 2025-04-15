import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowUpRight, Bell, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useSubscription } from '@/hooks/use-subscription';
import { ErrorAlert } from '@/components/ui/error-alert';

interface Competitor {
  id: string;
  name: string;
  url: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  last_analyzed?: string;
  created_at: string;
}

interface AlertSettings {
  id?: string;
  competitor_id: string;
  enabled: boolean;
  metrics: {
    domain_authority: {
      enabled: boolean;
      threshold: number;
      direction: 'increase' | 'decrease' | 'both';
    };
    backlinks: {
      enabled: boolean;
      threshold: number;
      direction: 'increase' | 'decrease' | 'both';
    };
    keywords: {
      enabled: boolean;
      threshold: number;
      direction: 'increase' | 'decrease' | 'both';
    };
  };
  notification_email?: string;
  notification_frequency: 'immediate' | 'daily' | 'weekly';
}

interface CompetitorAlertSettingsProps {
  projectId: string;
  competitorId: string;
  competitor: Competitor;
}

export function CompetitorAlertSettings({ 
  projectId, 
  competitorId,
  competitor
}: CompetitorAlertSettingsProps) {
  const [settings, setSettings] = useState<AlertSettings>({
    competitor_id: competitorId,
    enabled: false,
    metrics: {
      domain_authority: {
        enabled: true,
        threshold: 5,
        direction: 'both'
      },
      backlinks: {
        enabled: true,
        threshold: 10,
        direction: 'both'
      },
      keywords: {
        enabled: true,
        threshold: 5,
        direction: 'both'
      }
    },
    notification_frequency: 'daily'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { subscription } = useSubscription();

  useEffect(() => {
    async function fetchAlertSettings() {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}/competitors/${competitorId}/alerts`);
        
        if (!response.ok) {
          if (response.status === 404) {
            // No settings found, use defaults
            return;
          }
          throw new Error('Failed to fetch alert settings');
        }
        
        const data = await response.json();
        setSettings(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching alert settings:', err);
        setError((err as Error).message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (projectId && competitorId) {
      fetchAlertSettings();
    }
  }, [projectId, competitorId]);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/projects/${projectId}/competitors/${competitorId}/alerts`, {
        method: settings.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save alert settings');
      }
      
      const data = await response.json();
      setSettings(data);
      
      toast({
        title: 'Alert Settings Saved',
        description: 'Your alert settings have been updated successfully.',
      });
    } catch (err) {
      setError((err as Error).message || 'An unexpected error occurred');
      
      toast({
        title: 'Error',
        description: 'Failed to save alert settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Check if the user's subscription allows alerts
  const isSubscriptionLimited = subscription?.tier === 'free';

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-8 w-2/5" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-3/5" /></CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-8 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return <ErrorAlert description={error} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          Alert Settings
        </CardTitle>
        <CardDescription>
          Configure alerts for changes in {competitor.name}'s metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isSubscriptionLimited && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Subscription Required</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Competitor alerts are available on Pro and Enterprise plans.</span>
              <Button variant="link" className="p-0 h-auto" onClick={() => {}}>
                Upgrade Now <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enable-alerts" className="text-base">Enable Alerts</Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications when metrics change significantly
            </p>
          </div>
          <Switch 
            id="enable-alerts" 
            checked={settings.enabled} 
            onCheckedChange={(checked) => 
              setSettings(prev => ({ ...prev, enabled: checked }))
            }
            disabled={isSubscriptionLimited}
          />
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium mb-4">What to monitor</h3>
          
          <div className="space-y-6">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="domain-authority-toggle" className="font-medium">Domain Authority</Label>
                <Switch 
                  id="domain-authority-toggle" 
                  checked={settings.metrics.domain_authority.enabled} 
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev, 
                      metrics: {
                        ...prev.metrics,
                        domain_authority: {
                          ...prev.metrics.domain_authority,
                          enabled: checked
                        }
                      }
                    }))
                  }
                  disabled={isSubscriptionLimited || !settings.enabled}
                />
              </div>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <Label>Alert Threshold</Label>
                  <span className="text-sm font-medium">
                    {settings.metrics.domain_authority.threshold}%
                  </span>
                </div>
                <Slider 
                  value={[settings.metrics.domain_authority.threshold]} 
                  min={1} 
                  max={20} 
                  step={1} 
                  onValueChange={(value) => 
                    setSettings(prev => ({
                      ...prev, 
                      metrics: {
                        ...prev.metrics,
                        domain_authority: {
                          ...prev.metrics.domain_authority,
                          threshold: value[0]
                        }
                      }
                    }))
                  }
                  disabled={isSubscriptionLimited || !settings.enabled || !settings.metrics.domain_authority.enabled}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Alert me when domain authority changes by this percentage
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={settings.metrics.domain_authority.direction === 'increase' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => 
                    setSettings(prev => ({
                      ...prev, 
                      metrics: {
                        ...prev.metrics,
                        domain_authority: {
                          ...prev.metrics.domain_authority,
                          direction: 'increase'
                        }
                      }
                    }))
                  }
                  disabled={isSubscriptionLimited || !settings.enabled || !settings.metrics.domain_authority.enabled}
                >
                  Increases
                </Button>
                <Button 
                  variant={settings.metrics.domain_authority.direction === 'decrease' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => 
                    setSettings(prev => ({
                      ...prev, 
                      metrics: {
                        ...prev.metrics,
                        domain_authority: {
                          ...prev.metrics.domain_authority,
                          direction: 'decrease'
                        }
                      }
                    }))
                  }
                  disabled={isSubscriptionLimited || !settings.enabled || !settings.metrics.domain_authority.enabled}
                >
                  Decreases
                </Button>
                <Button 
                  variant={settings.metrics.domain_authority.direction === 'both' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => 
                    setSettings(prev => ({
                      ...prev, 
                      metrics: {
                        ...prev.metrics,
                        domain_authority: {
                          ...prev.metrics.domain_authority,
                          direction: 'both'
                        }
                      }
                    }))
                  }
                  disabled={isSubscriptionLimited || !settings.enabled || !settings.metrics.domain_authority.enabled}
                >
                  Both
                </Button>
              </div>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="backlinks-toggle" className="font-medium">Backlinks</Label>
                <Switch 
                  id="backlinks-toggle" 
                  checked={settings.metrics.backlinks.enabled} 
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev, 
                      metrics: {
                        ...prev.metrics,
                        backlinks: {
                          ...prev.metrics.backlinks,
                          enabled: checked
                        }
                      }
                    }))
                  }
                  disabled={isSubscriptionLimited || !settings.enabled}
                />
              </div>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <Label>Alert Threshold</Label>
                  <span className="text-sm font-medium">
                    {settings.metrics.backlinks.threshold}%
                  </span>
                </div>
                <Slider 
                  value={[settings.metrics.backlinks.threshold]} 
                  min={5} 
                  max={50} 
                  step={5} 
                  onValueChange={(value) => 
                    setSettings(prev => ({
                      ...prev, 
                      metrics: {
                        ...prev.metrics,
                        backlinks: {
                          ...prev.metrics.backlinks,
                          threshold: value[0]
                        }
                      }
                    }))
                  }
                  disabled={isSubscriptionLimited || !settings.enabled || !settings.metrics.backlinks.enabled}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Alert me when backlinks change by this percentage
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={settings.metrics.backlinks.direction === 'increase' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => 
                    setSettings(prev => ({
                      ...prev, 
                      metrics: {
                        ...prev.metrics,
                        backlinks: {
                          ...prev.metrics.backlinks,
                          direction: 'increase'
                        }
                      }
                    }))
                  }
                  disabled={isSubscriptionLimited || !settings.enabled || !settings.metrics.backlinks.enabled}
                >
                  Increases
                </Button>
                <Button 
                  variant={settings.metrics.backlinks.direction === 'decrease' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => 
                    setSettings(prev => ({
                      ...prev, 
                      metrics: {
                        ...prev.metrics,
                        backlinks: {
                          ...prev.metrics.backlinks,
                          direction: 'decrease'
                        }
                      }
                    }))
                  }
                  disabled={isSubscriptionLimited || !settings.enabled || !settings.metrics.backlinks.enabled}
                >
                  Decreases
                </Button>
                <Button 
                  variant={settings.metrics.backlinks.direction === 'both' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => 
                    setSettings(prev => ({
                      ...prev, 
                      metrics: {
                        ...prev.metrics,
                        backlinks: {
                          ...prev.metrics.backlinks,
                          direction: 'both'
                        }
                      }
                    }))
                  }
                  disabled={isSubscriptionLimited || !settings.enabled || !settings.metrics.backlinks.enabled}
                >
                  Both
                </Button>
              </div>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="keywords-toggle" className="font-medium">Keywords</Label>
                <Switch 
                  id="keywords-toggle" 
                  checked={settings.metrics.keywords.enabled} 
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev, 
                      metrics: {
                        ...prev.metrics,
                        keywords: {
                          ...prev.metrics.keywords,
                          enabled: checked
                        }
                      }
                    }))
                  }
                  disabled={isSubscriptionLimited || !settings.enabled}
                />
              </div>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <Label>Alert Threshold</Label>
                  <span className="text-sm font-medium">
                    {settings.metrics.keywords.threshold}%
                  </span>
                </div>
                <Slider 
                  value={[settings.metrics.keywords.threshold]} 
                  min={5} 
                  max={50} 
                  step={5} 
                  onValueChange={(value) => 
                    setSettings(prev => ({
                      ...prev, 
                      metrics: {
                        ...prev.metrics,
                        keywords: {
                          ...prev.metrics.keywords,
                          threshold: value[0]
                        }
                      }
                    }))
                  }
                  disabled={isSubscriptionLimited || !settings.enabled || !settings.metrics.keywords.enabled}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Alert me when keyword count changes by this percentage
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={settings.metrics.keywords.direction === 'increase' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => 
                    setSettings(prev => ({
                      ...prev, 
                      metrics: {
                        ...prev.metrics,
                        keywords: {
                          ...prev.metrics.keywords,
                          direction: 'increase'
                        }
                      }
                    }))
                  }
                  disabled={isSubscriptionLimited || !settings.enabled || !settings.metrics.keywords.enabled}
                >
                  Increases
                </Button>
                <Button 
                  variant={settings.metrics.keywords.direction === 'decrease' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => 
                    setSettings(prev => ({
                      ...prev, 
                      metrics: {
                        ...prev.metrics,
                        keywords: {
                          ...prev.metrics.keywords,
                          direction: 'decrease'
                        }
                      }
                    }))
                  }
                  disabled={isSubscriptionLimited || !settings.enabled || !settings.metrics.keywords.enabled}
                >
                  Decreases
                </Button>
                <Button 
                  variant={settings.metrics.keywords.direction === 'both' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => 
                    setSettings(prev => ({
                      ...prev, 
                      metrics: {
                        ...prev.metrics,
                        keywords: {
                          ...prev.metrics.keywords,
                          direction: 'both'
                        }
                      }
                    }))
                  }
                  disabled={isSubscriptionLimited || !settings.enabled || !settings.metrics.keywords.enabled}
                >
                  Both
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="font-medium mb-4">Notification Settings</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="notification-email">Email Address</Label>
              <Input 
                id="notification-email" 
                type="email" 
                placeholder="your@email.com" 
                className="mt-1"
                value={settings.notification_email || ''}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, notification_email: e.target.value }))
                }
                disabled={isSubscriptionLimited || !settings.enabled}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to use your account email
              </p>
            </div>
            
            <div>
              <Label className="mb-2 block">Notification Frequency</Label>
              <div className="flex gap-2">
                <Button 
                  variant={settings.notification_frequency === 'immediate' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => 
                    setSettings(prev => ({ ...prev, notification_frequency: 'immediate' }))
                  }
                  disabled={isSubscriptionLimited || !settings.enabled}
                >
                  Immediate
                </Button>
                <Button 
                  variant={settings.notification_frequency === 'daily' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => 
                    setSettings(prev => ({ ...prev, notification_frequency: 'daily' }))
                  }
                  disabled={isSubscriptionLimited || !settings.enabled}
                >
                  Daily
                </Button>
                <Button 
                  variant={settings.notification_frequency === 'weekly' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => 
                    setSettings(prev => ({ ...prev, notification_frequency: 'weekly' }))
                  }
                  disabled={isSubscriptionLimited || !settings.enabled}
                >
                  Weekly
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <Button 
          className="w-full md:w-auto"
          onClick={handleSaveSettings}
          disabled={isSubscriptionLimited || saving || !settings.enabled}
        >
          {saving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" /> Save Settings
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
} 