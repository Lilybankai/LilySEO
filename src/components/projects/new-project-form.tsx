"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, Info, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Globe, Tag, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { CompetitorInput, Competitor } from "./competitor-input"
import { KeywordGroups, KeywordGroup } from "./keyword-groups"
import { getUserSubscription } from "@/services/subscription"
import { ProjectWizard } from "./project-wizard"
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt"
import { IndustrySelect } from "./industry-select"
import { TemplateSelect } from "./template-select"
import { SearchConsoleButton } from "@/components/google/search-console-button"
import { RecommendationsDisplay } from "@/components/ai/recommendations-display"
import { AiRecommendation } from "@/services/ai-recommendations"
import { useSubscription } from "@/hooks/use-subscription"

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
  crawlDepth: z.coerce.number().int().min(1).max(10).default(3),
  targetKeywords: z.string().optional(),
  competitors: z.string().optional(),
  advancedOptions: z.boolean().default(false),
  excludeUrls: z.string().optional(),
  followRobotsTxt: z.boolean().default(true),
  maxPages: z.coerce.number().int().min(1).max(10000).default(100),
  industry: z.string().optional(),
});

interface NewProjectFormProps {
  userId: string;
  isFirstTime?: boolean;
}

export function NewProjectForm({ userId, isFirstTime = false }: NewProjectFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [keywordGroups, setKeywordGroups] = useState<KeywordGroup[]>([]);
  const [useWizard, setUseWizard] = useState(isFirstTime);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState<{
    show: boolean;
    feature: 'weekly_crawl' | 'daily_crawl' | 'keyword_grouping' | 'competitor_analysis' | 'white_label' | 'advanced_features';
  }>({ show: false, feature: 'advanced_features' });
  const [subscription, setSubscription] = useState<{
    isPro: boolean;
    isEnterprise: boolean;
    tier: string;
  }>({
    isPro: false,
    isEnterprise: false,
    tier: 'free'
  });
  const [industry, setIndustry] = useState<string>("")
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [competitorSectionOpen, setCompetitorSectionOpen] = useState(false)
  
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
  }, []);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      url: "https://",
      description: "",
      crawlFrequency: "monthly",
      crawlDepth: 3,
      targetKeywords: "",
      competitors: "",
      advancedOptions: false,
      excludeUrls: "",
      followRobotsTxt: true,
      maxPages: 100,
      industry: "",
    },
  });
  
  // Update form values when subscription changes
  useEffect(() => {
    // If user is not pro or enterprise, set crawl frequency to monthly
    if (!subscription.isPro && !subscription.isEnterprise) {
      form.setValue('crawlFrequency', 'monthly');
    }
  }, [subscription, form]);

  const handleFrequencyChange = (value: string) => {
    if (value === "weekly" && !subscription.isPro && !subscription.isEnterprise) {
      setShowUpgradePrompt({ 
        show: true, 
        feature: 'weekly_crawl' 
      });
      return;
    }
    
    if (value === "daily" && !subscription.isEnterprise) {
      setShowUpgradePrompt({ 
        show: true, 
        feature: 'daily_crawl' 
      });
      return;
    }
    
    // Type assertion to ensure value is one of the allowed values
    if (value === "monthly" || value === "weekly" || value === "daily") {
      form.setValue('crawlFrequency', value as "monthly" | "weekly" | "daily");
    }
  };

  const handleAdvancedTabClick = () => {
    if (!subscription.isPro && !subscription.isEnterprise) {
      setShowUpgradePrompt({ 
        show: true, 
        feature: 'advanced_features' 
      });
      return;
    }
  };

  const handleKeywordGroupsClick = () => {
    if (!subscription.isPro && !subscription.isEnterprise) {
      setShowUpgradePrompt({ 
        show: true, 
        feature: 'keyword_grouping' 
      });
      return;
    }
    
    setShowAdvanced(!showAdvanced);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const supabase = createClient();
      
      // First check if the user exists in the profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, subscription_tier")
        .eq("id", userId)
        .single();
      
      if (profileError) {
        throw new Error("User profile not found. Please complete your profile setup first.");
      }
      
      // Check for duplicate project URLs
      const { data: existingProjects, error: projectsError } = await supabase
        .from("projects")
        .select("id, url")
        .eq("user_id", userId)
        .eq("status", "active");
      
      if (!projectsError && existingProjects) {
        const normalizedUrl = values.url.toLowerCase().replace(/\/$/, "");
        const duplicate = existingProjects.find(p => 
          p.url.toLowerCase().replace(/\/$/, "") === normalizedUrl
        );
        
        if (duplicate) {
          throw new Error("You already have a project with this URL. Please use a different URL or update the existing project.");
        }
      }
      
      // Process keywords from the form input
      let keywordsArray: string[] = [];
      
      // Add keywords from the simple input
      if (values.targetKeywords) {
        keywordsArray = [
          ...keywordsArray,
          ...values.targetKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
        ];
      }
      
      // Add keywords from keyword groups
      keywordGroups.forEach(group => {
        keywordsArray = [...keywordsArray, ...group.keywords];
      });
      
      // Remove duplicates
      keywordsArray = [...new Set(keywordsArray)];
      
      // Process competitors
      const competitorsArray = competitors.map(c => `${c.name}|${c.url}`);
      
      // Prepare advanced options
      const advancedOptions = values.advancedOptions ? {
        excludeUrls: values.excludeUrls ? values.excludeUrls.split(',').map(u => u.trim()).filter(u => u.length > 0) : [],
        followRobotsTxt: values.followRobotsTxt,
        maxPages: values.maxPages
      } : null;
      
      // Create the project
      const { data, error: createError } = await supabase
        .from("projects")
        .insert({
          user_id: userId,
          name: values.name,
          url: values.url,
          description: values.description || null,
          status: "active",
          crawl_frequency: values.crawlFrequency,
          crawl_depth: values.crawlDepth,
          keywords: keywordsArray.length > 0 ? keywordsArray : null,
          competitors: competitorsArray.length > 0 ? competitorsArray : null,
          industry: values.industry || null,
          settings: {
            advancedOptions,
            keywordGroups: keywordGroups.length > 0 ? keywordGroups.map(g => ({
              name: g.name,
              keywords: g.keywords
            })) : null
          }
        })
        .select("id")
        .single()
      
      if (createError) {
        throw createError;
      }
      
      setSuccess(true);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 2000);
    } catch (error: any) {
      setError(error.message || "An error occurred while creating the project.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleWizardComplete = (data: any) => {
    // Set form values from wizard data
    form.setValue('name', data.name);
    form.setValue('url', data.url);
    form.setValue('description', data.description);
    form.setValue('crawlFrequency', data.crawlFrequency);
    form.setValue('crawlDepth', data.crawlDepth);
    form.setValue('targetKeywords', data.targetKeywords);
    
    // Set competitors and keyword groups
    setCompetitors(data.competitors);
    setKeywordGroups(data.keywordGroups);
    
    // Set advanced settings if available
    if (data.advancedSettings) {
      form.setValue('excludeUrls', data.advancedSettings.excludeUrls);
      form.setValue('followRobotsTxt', data.advancedSettings.followRobotsTxt);
      form.setValue('maxPages', data.advancedSettings.maxPages);
    }
    
    // Switch to form view
    setUseWizard(false);
  };

  const handleApplyRecommendation = (recommendation: AiRecommendation) => {
    switch (recommendation.type) {
      case "keyword":
        // Add new keywords without duplicates
        const currentKeywords = form.getValues("targetKeywords") || "";
        // Since AiRecommendation doesn't have a value property, we need to handle this differently
        // For now, we'll just append the recommendation title as a keyword
        const newKeyword = recommendation.title.replace(/^Add keyword: /i, "").trim();
        const keywordsArray = currentKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
        if (!keywordsArray.includes(newKeyword)) {
          keywordsArray.push(newKeyword);
        }
        form.setValue("targetKeywords", keywordsArray.join(', '));
        break;
        
      case "competitor":
        // Add new competitor based on recommendation
        // Extract competitor info from description or title
        const competitorMatch = recommendation.description.match(/https?:\/\/[^\s,]+/);
        if (competitorMatch) {
          const competitorUrl = competitorMatch[0];
          const competitorName = competitorUrl.replace(/^https?:\/\/(www\.)?/, '').split('.')[0];
          
          // Check if competitor already exists
          const existingCompetitor = competitors.find(c => c.url === competitorUrl);
          if (!existingCompetitor) {
            // Generate a unique ID for the new competitor
            const newId = `comp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            setCompetitors([...competitors, { id: newId, name: competitorName, url: competitorUrl }]);
          }
        }
        break;
        
      case "crawl_setting":
        // Update crawl settings based on recommendation
        if (recommendation.description.includes("crawl frequency")) {
          // Try to extract frequency from description
          if (recommendation.description.includes("weekly")) {
            form.setValue("crawlFrequency", "weekly");
          } else if (recommendation.description.includes("daily")) {
            form.setValue("crawlFrequency", "daily");
          } else if (recommendation.description.includes("monthly")) {
            form.setValue("crawlFrequency", "monthly");
          }
        }
        
        if (recommendation.description.includes("crawl depth")) {
          // Try to extract depth from description
          const depthMatch = recommendation.description.match(/depth (\d+)/i);
          if (depthMatch && depthMatch[1]) {
            const depth = parseInt(depthMatch[1]);
            if (depth >= 1 && depth <= 10) {
              form.setValue("crawlDepth", depth);
            }
          }
        }
        break;
        
      case "general":
        // General recommendations don't have direct form actions
        break;
    }
    
    toast.success("Applied recommendation");
  }
  
  const getCurrentFormData = () => {
    const values = form.getValues()
    return {
      name: values.name,
      url: values.url,
      description: values.description,
      crawlFrequency: values.crawlFrequency,
      crawlDepth: values.crawlDepth,
      targetKeywords: values.targetKeywords,
      competitors,
      keywordGroups,
      industry: values.industry,
      advancedSettings: {
        excludeUrls: values.excludeUrls,
        followRobotsTxt: values.followRobotsTxt,
        maxPages: values.maxPages,
      }
    }
  }
  
  const applyTemplate = (templateData: any) => {
    console.log("applyTemplate called with:", templateData);
    
    // Get current project name to preserve it
    const currentName = form.getValues('name');
    
    // Apply basic settings but preserve the project name if it's already set
    if (!currentName || currentName.trim() === '') {
      form.setValue('name', templateData.name || '');
    }
    
    form.setValue('description', templateData.description || '')
    form.setValue('crawlFrequency', templateData.settings?.crawl_frequency || 'monthly')
    form.setValue('crawlDepth', templateData.settings?.crawl_depth || 3)
    form.setValue('targetKeywords', templateData.settings?.keywords ? templateData.settings.keywords.join(', ') : '')
    form.setValue('industry', templateData.industry || '')
    
    console.log("Applied basic settings");
    
    // Apply competitors and keyword groups if available
    if (templateData.settings?.competitors) {
      const competitors = templateData.settings.competitors.map((url: string) => ({
        name: url.split('.')[0],
        url: url.startsWith('http') ? url : `https://${url}`
      }));
      console.log("Setting competitors:", competitors);
      setCompetitors(competitors);
    }
    
    if (templateData.keywordGroups) {
      console.log("Setting keyword groups:", templateData.keywordGroups);
      setKeywordGroups(templateData.keywordGroups);
    }
    
    // Apply advanced settings if available
    if (templateData.advancedSettings) {
      console.log("Applying advanced settings:", templateData.advancedSettings);
      form.setValue('excludeUrls', templateData.advancedSettings.excludeUrls || '')
      form.setValue('followRobotsTxt', templateData.advancedSettings.followRobotsTxt !== undefined 
        ? templateData.advancedSettings.followRobotsTxt 
        : true)
      form.setValue('maxPages', templateData.advancedSettings.maxPages || 100)
    }
    
    // Show toast notification for template application
    toast.success(`Template "${templateData.name}" applied successfully!`);
    
    console.log("Template applied successfully");
  }
  
  // Update industry when form value changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'industry') {
        setIndustry(value.industry || '')
      }
      
      // Show recommendations when URL is entered
      if (name === 'url' && value.url && value.url.startsWith('http')) {
        setShowRecommendations(true)
      }
    })
    
    return () => subscription.unsubscribe()
  }, [form.watch])

  if (useWizard) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Create Your First Project</h1>
          <Button 
            variant="outline" 
            onClick={() => setUseWizard(false)}
          >
            Switch to Advanced Form
          </Button>
        </div>
        
        <ProjectWizard 
          userId={userId} 
          onComplete={handleWizardComplete} 
          onCancel={() => setUseWizard(false)} 
        />
      </div>
    );
  }

  return (
    <Card className="bg-card border border-border shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold text-primary">Create New Project</CardTitle>
            <CardDescription>
              Add a website to start tracking and improving its SEO performance
            </CardDescription>
          </div>
          {isFirstTime && (
            <Button 
              variant="outline" 
              onClick={() => setUseWizard(true)}
              className="flex items-center gap-1"
            >
              <Sparkles className="h-4 w-4" />
              Use Guided Setup
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 border-green-500 text-green-500">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Project created successfully! Redirecting to dashboard...
            </AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    A name to identify your project (e.g., Company Website, Blog)
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
                      <div className="flex items-center">
                        <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="https://example.com" {...field} />
                      </div>
                  </FormControl>
                  <FormDescription>
                    The full URL of your website including https://
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <IndustrySelect
                        value={field.value || ""}
                        onChange={field.onChange}
                        url={form.getValues('url')}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Select your website's industry for better recommendations
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <FormLabel className="block mb-2">Templates</FormLabel>
                <TemplateSelect
                  onSelect={applyTemplate}
                  onSave={getCurrentFormData}
                  industry={industry}
                  disabled={isLoading}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Load a saved template or save current settings
                </p>
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of your website" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Add notes or details about this project
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="crawlFrequency"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FormLabel>Crawl Frequency</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>How often your website will be automatically crawled for SEO analysis. Higher frequencies are available on Pro and Enterprise plans.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="monthly" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Monthly <Badge variant="outline" className="ml-2">Free</Badge>
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem 
                              value="weekly" 
                              disabled={!subscription.isPro && !subscription.isEnterprise} 
                              onClick={() => {
                                if (!subscription.isPro && !subscription.isEnterprise) {
                                  handleFrequencyChange("weekly");
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className={`font-normal ${!subscription.isPro && !subscription.isEnterprise ? 'text-muted-foreground' : ''}`}>
                            Weekly <Badge variant="outline" className="ml-2">Pro & Enterprise</Badge>
                          </FormLabel>
                          {!subscription.isPro && !subscription.isEnterprise && (
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="text-primary p-0 h-auto"
                              onClick={() => handleFrequencyChange("weekly")}
                            >
                              Upgrade
                            </Button>
                          )}
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem 
                              value="daily" 
                              disabled={!subscription.isEnterprise} 
                              onClick={() => {
                                if (!subscription.isEnterprise) {
                                  handleFrequencyChange("daily");
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className={`font-normal ${!subscription.isEnterprise ? 'text-muted-foreground' : ''}`}>
                            Daily <Badge variant="outline" className="ml-2">Enterprise Only</Badge>
                          </FormLabel>
                          {!subscription.isEnterprise && (
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="text-primary p-0 h-auto"
                              onClick={() => handleFrequencyChange("daily")}
                            >
                              Upgrade
                            </Button>
                          )}
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="crawlDepth"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Crawl Depth</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Crawl depth determines how many levels of links the crawler will follow from your homepage. Higher values will analyze more pages but take longer.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value.toString()}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select crawl depth" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 - Homepage only</SelectItem>
                          <SelectItem value="2">2 - Homepage + direct links</SelectItem>
                          <SelectItem value="3">3 - Standard depth (recommended)</SelectItem>
                          <SelectItem value="4">4 - Deep crawl</SelectItem>
                          <SelectItem value="5">5 - Very deep crawl</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      How many levels of links to follow from your homepage
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                <TabsTrigger 
                  value="advanced" 
                  disabled={!subscription.isPro && !subscription.isEnterprise}
                  onClick={handleAdvancedTabClick}
                >
                  Advanced Settings
                  {!subscription.isPro && !subscription.isEnterprise && (
                    <Badge variant="outline" className="ml-2">Pro & Enterprise</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-6 pt-4">
                <FormField
                  control={form.control}
                  name="targetKeywords"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Target Keywords (Optional)</FormLabel>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>Enter keywords you want to target, separated by commas. These will be used for AI analysis to provide more relevant recommendations.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <FormControl>
                        <Textarea 
                          placeholder="keyword1, keyword2, keyword3" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="flex items-center justify-between">
                        <span>Enter keywords you want to target, separated by commas</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleKeywordGroupsClick}
                          className="flex items-center gap-1"
                        >
                          <Tag className="h-3 w-3" />
                          {showAdvanced ? "Hide Keyword Groups" : "Show Keyword Groups"}
                          {showAdvanced ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                        </Button>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {showAdvanced && (subscription.isPro || subscription.isEnterprise) && (
                  <div className="border border-border rounded-md p-4">
                    <h3 className="text-md font-medium mb-4 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      Keyword Groups
                      <Badge variant="outline">Pro & Enterprise</Badge>
                    </h3>
                    <KeywordGroups
                      groups={keywordGroups}
                      onChange={setKeywordGroups}
                      disabled={isLoading}
                    />
                  </div>
                )}
                
                <Collapsible open={competitorSectionOpen} onOpenChange={setCompetitorSectionOpen}>
                  <div className="flex items-center justify-between cursor-pointer py-2 border-b border-border" onClick={() => setCompetitorSectionOpen(!competitorSectionOpen)}>
                    <h3 className="text-md font-medium flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      Competitor Analysis
                    </h3>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      {competitorSectionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                  <CollapsibleContent className="pt-4">
                    <CompetitorInput
                      competitors={competitors}
                      onChange={setCompetitors}
                      disabled={isLoading}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-6 pt-4">
                <div className="border border-border rounded-md p-4 space-y-4">
                  <h3 className="text-md font-medium">Advanced Crawl Settings</h3>
                  
                  <FormField
                    control={form.control}
                    name="excludeUrls"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exclude URLs (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="/admin/*, /wp-login.php, /cart/*" 
                            className="resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Enter URL patterns to exclude from crawling, separated by commas. Wildcards (*) are supported.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="followRobotsTxt"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Respect robots.txt</FormLabel>
                          <FormDescription>
                            Follow the rules in the website's robots.txt file
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
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
                          />
                        </FormControl>
                        <FormDescription>
                          Limit the number of pages to crawl (1-10,000)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Google Search Console integration */}
            <div className="border border-border rounded-md p-4">
              <h3 className="text-md font-medium mb-4 flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Google Search Console Integration
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your project to Google Search Console to get more accurate SEO data and insights.
                You'll need to have your website verified in Search Console first.
              </p>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (form.getValues('url') && !isLoading) {
                      // Call the SearchConsoleButton's connect function
                      // This is a workaround since we can't use the disabled prop
                      const searchConsoleBtn = document.getElementById('search-console-btn');
                      if (searchConsoleBtn) {
                        searchConsoleBtn.click();
                      }
                    }
                  }}
                  className={!form.getValues('url') || isLoading ? "opacity-50" : ""}
                >
                  Connect to Search Console
                </Button>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Project...
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
            </div>
          </form>
        </Form>
        
        {/* AI Recommendations */}
        {showRecommendations && form.getValues('url') && (
          <div className="mt-6">
            <RecommendationsDisplay
              projectData={{
                url: form.getValues('url'),
                industry: industry || undefined,
                keywords: (() => {
                  const targetKeywords = form.getValues('targetKeywords');
                  return targetKeywords 
                    ? targetKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
                    : [];
                })(),
                competitors: competitors.map(c => c.url),
                crawlFrequency: form.getValues('crawlFrequency') || "monthly",
                crawlDepth: form.getValues('crawlDepth') || 3
              }}
              onApply={handleApplyRecommendation}
            />
          </div>
        )}
      </CardContent>
      
      {showUpgradePrompt.show && (
        <UpgradePrompt
          currentTier={subscription.tier}
          onClose={() => setShowUpgradePrompt({ show: false, feature: 'advanced_features' })}
          feature={showUpgradePrompt.feature}
        />
      )}
    </Card>
  );
} 