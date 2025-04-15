"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, Info, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Globe, Tag } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { CompetitorInput, Competitor } from "./competitor-input"
import { KeywordGroups, KeywordGroup } from "./keyword-groups"
import { getUserSubscription } from "@/services/subscription"
import { IndustrySelect } from "./industry-select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

// URL validation with more comprehensive checks
const urlSchema = z.string()
  .min(1, { message: "URL is required" })
  .refine(
    (url) => /^(https?:\/\/)?(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+(:\d+)?(\/\S*)?$/.test(url),
    { message: "Please enter a valid URL (e.g., https://example.com)" }
  )
  .refine(
    (url) => url.startsWith('http://') || url.startsWith('https://'),
    { message: "URL must start with http:// or https://" }
  );

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Project name must be at least 2 characters.",
  }),
  url: urlSchema,
  description: z.string().optional(),
  crawlFrequency: z.enum(["monthly", "weekly", "daily"]).default("monthly"),
  targetKeywords: z.string().optional(),
  competitors: z.string().optional(),
  excludeUrls: z.string().optional(),
  followRobotsTxt: z.boolean().default(true),
  maxPages: z.coerce.number().int().min(1).max(10000).default(50),
  industry: z.string().optional(),
  notifyOnCompletion: z.boolean().default(true),
  autoGenerateTasks: z.boolean().default(true),
  status: z.enum(["active", "archived", "deleted"]).default("active"),
});

interface ProjectSettingsFormProps {
  userId: string;
  project: any;
}

export function ProjectSettingsForm({ userId, project }: ProjectSettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [keywordGroups, setKeywordGroups] = useState<KeywordGroup[]>([]);
  const [subscription, setSubscription] = useState<{
    isPro: boolean;
    isEnterprise: boolean;
    tier: string;
  }>({
    isPro: false,
    isEnterprise: false,
    tier: 'free'
  });
  
  // Fetch user subscription on component mount
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const userSubscription = await getUserSubscription();
        setSubscription({
          isPro: userSubscription.isPro,
          isEnterprise: userSubscription.isEnterprise,
          tier: userSubscription.tier
        });
      } catch (error) {
        console.error("Error fetching subscription:", error);
      }
    };
    
    fetchSubscription();
    
    // Initialize competitors from project data
    if (project.competitors && Array.isArray(project.competitors)) {
      setCompetitors(
        project.competitors.map((url: string) => ({ url, name: new URL(url).hostname }))
      );
    }
    
    // Initialize keyword groups from project data
    if (project.keywords && Array.isArray(project.keywords)) {
      // For simplicity, we'll put all keywords in one group
      if (project.keywords.length > 0) {
        setKeywordGroups([
          { name: "Main Keywords", keywords: project.keywords.join(", ") }
        ]);
      }
    }
  }, [project]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: project.name || "",
      url: project.url || "https://",
      description: project.description || "",
      crawlFrequency: project.crawl_frequency || "monthly",
      targetKeywords: project.keywords ? project.keywords.join(", ") : "",
      competitors: project.competitors ? project.competitors.join(", ") : "",
      excludeUrls: project.exclude_urls || "",
      followRobotsTxt: project.follow_robots_txt !== false, // Default to true if not set
      maxPages: project.max_pages || 50,
      industry: project.industry || "",
      notifyOnCompletion: project.notify_on_completion !== false, // Default to true if not set
      autoGenerateTasks: project.auto_generate_tasks !== false, // Default to true if not set
      status: project.status || "active",
    },
  });
  
  // Update form values when subscription changes
  useEffect(() => {
    // If user is not pro or enterprise, set crawl frequency to monthly
    if (!subscription.isPro && !subscription.isEnterprise && form.getValues('crawlFrequency') !== 'monthly') {
      form.setValue('crawlFrequency', 'monthly');
      toast.warning("Your subscription plan only allows monthly crawls. Upgrade for more frequent crawls.");
    }
  }, [subscription, form]);

  const handleFrequencyChange = (value: string) => {
    if (value === "weekly" && !subscription.isPro && !subscription.isEnterprise) {
      toast.error("Weekly crawls require a Pro subscription. Please upgrade to use this feature.");
      return;
    }
    
    if (value === "daily" && !subscription.isEnterprise) {
      toast.error("Daily crawls require an Enterprise subscription. Please upgrade to use this feature.");
      return;
    }
    
    // Type assertion to ensure value is one of the allowed values
    if (value === "monthly" || value === "weekly" || value === "daily") {
      form.setValue('crawlFrequency', value as "monthly" | "weekly" | "daily");
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const supabase = createClient();
      
      // Prepare the data for update
      const updateData = {
        name: values.name,
        url: values.url,
        description: values.description,
        crawl_frequency: values.crawlFrequency,
        keywords: values.targetKeywords ? values.targetKeywords.split(',').map(k => k.trim()) : [],
        competitors: competitors.map(c => c.url),
        exclude_urls: values.excludeUrls,
        follow_robots_txt: values.followRobotsTxt,
        max_pages: values.maxPages,
        industry: values.industry,
        notify_on_completion: values.notifyOnCompletion,
        auto_generate_tasks: values.autoGenerateTasks,
        status: values.status,
        updated_at: new Date().toISOString(),
      };
      
      // Update the project
      const { error: updateError } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", project.id)
        .eq("user_id", userId);
      
      if (updateError) {
        throw new Error(updateError.message);
      }
      
      setSuccess(true);
      toast.success("Project settings updated successfully");
      
      // Refresh the page to show updated data
      router.refresh();
    } catch (err) {
      console.error("Error updating project:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      toast.error("Failed to update project settings");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Settings</CardTitle>
            <CardDescription>
              Configure the basic settings for your project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Website" {...field} />
                  </FormControl>
                  <FormDescription>
                    A name to identify your project
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    The main URL of your website
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of your project" 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description to help you remember what this project is about
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <FormControl>
                    <IndustrySelect 
                      value={field.value || ""} 
                      onValueChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Select the industry that best matches your website
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Crawl Settings</CardTitle>
            <CardDescription>
              Configure how your website is crawled
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="crawlFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Crawl Frequency</FormLabel>
                  <div className="space-y-4">
                    <RadioGroup
                      value={field.value}
                      onValueChange={handleFrequencyChange}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="monthly" id="monthly" />
                        <Label htmlFor="monthly">Monthly</Label>
                        <Badge variant="outline" className="ml-2">Free</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value="weekly" 
                          id="weekly" 
                          disabled={!subscription.isPro && !subscription.isEnterprise}
                        />
                        <Label htmlFor="weekly" className={!subscription.isPro && !subscription.isEnterprise ? "text-muted-foreground" : ""}>
                          Weekly
                        </Label>
                        <Badge variant="outline" className="ml-2">Pro</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value="daily" 
                          id="daily" 
                          disabled={!subscription.isEnterprise}
                        />
                        <Label htmlFor="daily" className={!subscription.isEnterprise ? "text-muted-foreground" : ""}>
                          Daily
                        </Label>
                        <Badge variant="outline" className="ml-2">Enterprise</Badge>
                      </div>
                    </RadioGroup>
                  </div>
                  <FormDescription>
                    How often your website should be crawled
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Collapsible
              open={showAdvanced}
              onOpenChange={setShowAdvanced}
              className="border rounded-md p-4"
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer">
                  <h3 className="text-lg font-medium">Advanced Crawl Settings</h3>
                  <Button variant="ghost" size="sm">
                    {showAdvanced ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <FormField
                  control={form.control}
                  name="maxPages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Pages to Crawl</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          max={10000} 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Limit the number of pages to crawl (1-10,000)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="excludeUrls"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exclude URLs</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="/admin/*, /private/*, /cart/*" 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        URLs to exclude from crawling (comma-separated, supports * wildcard)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="followRobotsTxt"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Follow robots.txt</FormLabel>
                        <FormDescription>
                          Respect the rules in your website's robots.txt file
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Keywords & Competitors</CardTitle>
            <CardDescription>
              Configure target keywords and competitors to track
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="targetKeywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Keywords</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="seo tools, website analysis, keyword research" 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Keywords you want to rank for (comma-separated)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Competitors</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCompetitors([...competitors, { url: "", name: "" }])}
                >
                  Add Competitor
                </Button>
              </div>
              
              <div className="space-y-2">
                {competitors.map((competitor, index) => (
                  <CompetitorInput
                    key={index}
                    competitor={competitor}
                    onChange={(updated) => {
                      const newCompetitors = [...competitors];
                      newCompetitors[index] = updated;
                      setCompetitors(newCompetitors);
                    }}
                    onRemove={() => {
                      const newCompetitors = [...competitors];
                      newCompetitors.splice(index, 1);
                      setCompetitors(newCompetitors);
                    }}
                  />
                ))}
                
                {competitors.length === 0 && (
                  <div className="text-center p-4 border border-dashed rounded-md text-muted-foreground">
                    No competitors added yet. Click "Add Competitor" to start tracking.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Configure how you want to be notified about your project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="notifyOnCompletion"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Notify on Completion</FormLabel>
                    <FormDescription>
                      Receive notifications when audits are completed
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="autoGenerateTasks"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Auto-generate Tasks</FormLabel>
                    <FormDescription>
                      Automatically create tasks based on audit findings
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
            <CardDescription>
              Change the status of your project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                      <SelectItem value="deleted">Deleted</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Set the project status. Archived projects won't be crawled. Deleted projects will be removed after 30 days.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Project settings updated successfully</AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
} 