"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2, Search } from "lucide-react";
import { isCrawlerServiceAvailable } from "@/lib/crawler-service-client";
import { AuditStatusDisplay } from "@/components/audit/audit-status-display";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface NewAuditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function NewAuditPage(props: NewAuditPageProps) {
  const params = use(props.params);
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCrawlerAvailable, setIsCrawlerAvailable] = useState<boolean | null>(null);
  const [auditOptions, setAuditOptions] = useState({
    checkSeo: true,
    checkPerformance: true,
    checkMobile: true,
    checkSecurity: true,
    checkAccessibility: true,
  });
  const [auditDepth, setAuditDepth] = useState<"basic" | "standard" | "deep">("standard");
  const [description, setDescription] = useState("");
  const [createdAuditId, setCreatedAuditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [auditLimits, setAuditLimits] = useState<{
    total: number;
    used: number;
    remaining: number;
    isLimited: boolean;
  } | null>(null);

  // Check crawler service availability and audit limits on component mount
  useEffect(() => {
    const checkServices = async () => {
      try {
        // Check crawler service
        const available = await isCrawlerServiceAvailable();
        setIsCrawlerAvailable(available);
        
        // Check audit limits
        const response = await fetch(`/api/users/me/audit-limits`);
        if (response.ok) {
          const limits = await response.json();
          setAuditLimits(limits);
        }
      } catch (error) {
        console.error("Error checking services:", error);
        setIsCrawlerAvailable(false);
      }
    };
    
    checkServices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check if user has reached their audit limit
      if (auditLimits?.isLimited && auditLimits.remaining <= 0) {
        toast({
          title: "Audit Limit Reached",
          description: "You've reached your monthly audit limit. Upgrade your plan for more audits.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      const response = await fetch("/api/audits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: params.id,
          url: "", // The API will get the URL from the project
          description,
          auditOptions,
          auditDepth,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start audit");
      }

      const data = await response.json();
      
      toast({
        title: "Audit started successfully",
        description: "You can monitor the progress below.",
      });
      
      // Set the created audit ID and hide the form
      setCreatedAuditId(data.id);
      setShowForm(false);
    } catch (error) {
      console.error("Error starting audit:", error);
      toast({
        title: "Failed to start audit",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const handleAuditComplete = () => {
    // Wait a moment before redirecting to ensure the user sees the completion
    setTimeout(() => {
      router.push(`/projects/${params.id}`);
      router.refresh();
    }, 2000);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">New Audit</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>

      {isCrawlerAvailable === false && (
        <Card className="border-destructive">
          <CardHeader className="text-destructive">
            <CardTitle>Crawler Service Unavailable</CardTitle>
            <CardDescription>
              The SEO crawler service is currently unavailable. Audits may not complete successfully.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      
      {auditLimits?.isLimited && auditLimits.remaining <= 3 && auditLimits.remaining > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="text-yellow-700">Audit Limit Warning</AlertTitle>
          <AlertDescription>
            You have {auditLimits.remaining} audit{auditLimits.remaining === 1 ? '' : 's'} remaining this month.
            {auditLimits.remaining === 1 ? ' This is your last audit before reaching your limit.' : ''}
          </AlertDescription>
        </Alert>
      )}
      
      {auditLimits?.isLimited && auditLimits.remaining <= 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Audit Limit Reached</AlertTitle>
          <AlertDescription>
            You've reached your monthly audit limit of {auditLimits.total}. 
            Upgrade your plan for more audits or wait until next month.
          </AlertDescription>
        </Alert>
      )}

      {createdAuditId && (
        <AuditStatusDisplay 
          auditId={createdAuditId} 
          projectId={params.id}
          onComplete={handleAuditComplete}
        />
      )}

      {showForm && (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Audit Configuration</CardTitle>
              <CardDescription>
                Configure the settings for your SEO audit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Audit Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Audit Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="checkSeo"
                      checked={auditOptions.checkSeo}
                      onCheckedChange={(checked) =>
                        setAuditOptions({ ...auditOptions, checkSeo: !!checked })
                      }
                    />
                    <Label htmlFor="checkSeo">SEO Analysis</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="checkPerformance"
                      checked={auditOptions.checkPerformance}
                      onCheckedChange={(checked) =>
                        setAuditOptions({ ...auditOptions, checkPerformance: !!checked })
                      }
                    />
                    <Label htmlFor="checkPerformance">Performance Analysis</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="checkMobile"
                      checked={auditOptions.checkMobile}
                      onCheckedChange={(checked) =>
                        setAuditOptions({ ...auditOptions, checkMobile: !!checked })
                      }
                    />
                    <Label htmlFor="checkMobile">Mobile Friendliness</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="checkSecurity"
                      checked={auditOptions.checkSecurity}
                      onCheckedChange={(checked) =>
                        setAuditOptions({ ...auditOptions, checkSecurity: !!checked })
                      }
                    />
                    <Label htmlFor="checkSecurity">Security Check</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="checkAccessibility"
                      checked={auditOptions.checkAccessibility}
                      onCheckedChange={(checked) =>
                        setAuditOptions({ ...auditOptions, checkAccessibility: !!checked })
                      }
                    />
                    <Label htmlFor="checkAccessibility">Accessibility Check</Label>
                  </div>
                </div>
              </div>

              {/* Audit Depth */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Audit Depth</h3>
                <RadioGroup
                  value={auditDepth}
                  onValueChange={(value: string) => setAuditDepth(value as "basic" | "standard" | "deep")}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="basic" id="basic" />
                    <Label htmlFor="basic">Basic (Quick Scan)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="standard" id="standard" />
                    <Label htmlFor="standard">Standard (Recommended)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="deep" id="deep" />
                    <Label htmlFor="deep">Deep (Thorough Analysis)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Audit Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add notes or context for this audit"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                disabled={isSubmitting || (auditLimits?.isLimited && auditLimits.remaining <= 0)} 
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Audit...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Start Audit
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}
    </div>
  );
} 