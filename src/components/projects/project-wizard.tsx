"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, ChevronRight, ChevronLeft, Sparkles, Globe, Tag, Settings, AlertCircle, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getUserSubscription } from "@/services/subscription"
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt"

interface ProjectWizardProps {
  onComplete: (data: any) => void
  onCancel: () => void
  userId: string
}

interface FormData {
  name: string
  url: string
  description: string
  industry: string
  crawlFrequency: string
  targetKeywords: string
  location: string
  competitors: { name: string; url: string }[]
  keywordGroups: { name: string; keywords: string[] }[]
  advancedSettings: {
    excludeUrls: string
    followRobotsTxt: boolean
    maxPages: number
  }
}

export function ProjectWizard({ onComplete, onCancel, userId }: ProjectWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    url: 'https://',
    description: '',
    industry: '',
    location: '',
    crawlFrequency: 'monthly',
    targetKeywords: '',
    competitors: [],
    keywordGroups: [],
    advancedSettings: {
      excludeUrls: '',
      followRobotsTxt: true,
      maxPages: 100
    }
  })
  const [subscription, setSubscription] = useState<{
    isPro: boolean;
    isEnterprise: boolean;
    tier: string;
  }>({
    isPro: false,
    isEnterprise: false,
    tier: 'free'
  })
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch user subscription on component mount
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const userSubscription = await getUserSubscription()
        setSubscription({
          isPro: userSubscription.isPro,
          isEnterprise: userSubscription.isEnterprise,
          tier: userSubscription.tier
        })
      } catch (error) {
        console.error("Error fetching subscription:", error)
      }
    }
    
    fetchSubscription()
  }, [])

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  const validateStep = () => {
    const newErrors: Record<string, string> = {}
    
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        newErrors.name = "Project name is required"
      } else if (formData.name.length < 2) {
        newErrors.name = "Project name must be at least 2 characters"
      }
      
      if (!formData.url.trim()) {
        newErrors.url = "Website URL is required"
      } else if (!formData.url.startsWith('http://') && !formData.url.startsWith('https://')) {
        newErrors.url = "URL must start with http:// or https://"
      } else if (!/^(https?:\/\/)?(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+(:\d+)?(\/\S*)?$/.test(formData.url)) {
        newErrors.url = "Please enter a valid URL"
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1)
      } else {
        handleSubmit()
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      onCancel()
    }
  }

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      // Handle nested fields (e.g., advancedSettings.maxPages)
      const [parent, child] = field.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent as keyof typeof formData],
          [child]: value
        }
      });
    } else {
      // Handle regular fields
      setFormData({
        ...formData,
        [field]: value
      });
    }
    
    // Clear any errors for the field
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  }

  const handleAdvancedSettingsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      advancedSettings: {
        ...prev.advancedSettings,
        [field]: value
      }
    }))
  }

  const handleFrequencyChange = (value: string) => {
    if (value === "weekly" && !subscription.isPro && !subscription.isEnterprise) {
      setShowUpgradePrompt(true)
      return
    }
    
    if (value === "daily" && !subscription.isEnterprise) {
      setShowUpgradePrompt(true)
      return
    }
    
    handleInputChange("crawlFrequency", value)
  }

  const handleSubmit = () => {
    // Validate the form
    if (!formData.name) {
      setErrors({ name: "Project name is required" })
      return
    }
    
    if (!formData.url) {
      setErrors({ url: "URL is required" })
      return
    }
    
    // Format the data for submission
    const formattedData = {
      name: formData.name,
      url: formData.url,
      description: formData.description,
      crawlFrequency: formData.crawlFrequency,
      maxPages: formData.advancedSettings.maxPages,
      targetKeywords: formData.targetKeywords,
      competitors: formData.competitors,
      keywordGroups: formData.keywordGroups,
      advancedOptions: true,
      excludeUrls: formData.advancedSettings.excludeUrls,
      followRobotsTxt: formData.advancedSettings.followRobotsTxt,
      industry: formData.industry,
      location: formData.location
    }
    
    onComplete(formattedData)
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-md font-medium">Basic Information</h3>
              
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium">
                  Project Name<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="My Website"
                  className="w-full px-3 py-2 border border-input rounded-md"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  A name to identify your project
                </p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="url" className="block text-sm font-medium">
                  Website URL<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id="url"
                  value={formData.url}
                  onChange={(e) => handleInputChange("url", e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-input rounded-md"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  The full URL of your website including https://
                </p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="location" className="block text-sm font-medium">
                  Location (Optional)
                </label>
                <input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="e.g., New York, London, Global"
                  className="w-full px-3 py-2 border border-input rounded-md"
                />
                <p className="text-sm text-muted-foreground">
                  If your business targets a specific location, add it here
                </p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Brief description of your website"
                  className="w-full px-3 py-2 border border-input rounded-md resize-none h-24"
                />
                <p className="text-sm text-muted-foreground">
                  Add notes or details about this project
                </p>
              </div>
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-md font-medium">Crawl Settings</h3>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label htmlFor="crawlFrequency" className="block text-sm font-medium">Crawl Frequency</label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>How often your website will be automatically crawled and analyzed.</p>
                        <p className="mt-2 font-semibold">Tier Limits:</p>
                        <ul className="list-disc pl-4 mt-1">
                          <li>Free: Monthly only</li>
                          <li>Pro: Weekly available</li>
                          <li>Enterprise: Daily available</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <select
                  id="crawlFrequency"
                  value={formData.crawlFrequency}
                  onChange={(e) => handleFrequencyChange(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly" disabled={!subscription.isPro && !subscription.isEnterprise}>Weekly (Pro+)</option>
                  <option value="daily" disabled={!subscription.isEnterprise}>Daily (Enterprise)</option>
                </select>
                <p className="text-sm text-muted-foreground">
                  How often your website will be automatically crawled
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label htmlFor="maxPages" className="block text-sm font-medium">Maximum Pages to Crawl</label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>The maximum number of pages that will be crawled and analyzed.</p>
                        <p className="mt-2 font-semibold">Tier Limits:</p>
                        <ul className="list-disc pl-4 mt-1">
                          <li>Free: 50 pages max</li>
                          <li>Pro: 500 pages max</li>
                          <li>Enterprise: Unlimited</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <input
                  id="maxPages"
                  type="number"
                  min="1"
                  max={subscription.isEnterprise ? 10000 : subscription.isPro ? 500 : 50}
                  value={formData.advancedSettings.maxPages}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    const maxAllowed = subscription.isEnterprise ? 10000 : subscription.isPro ? 500 : 50;
                    if (value > maxAllowed) {
                      handleInputChange("advancedSettings.maxPages", maxAllowed);
                      // Show a message about the limit
                      alert(`Maximum pages limited to ${maxAllowed} on your current plan`);
                    } else {
                      handleInputChange("advancedSettings.maxPages", value);
                    }
                  }}
                  className="w-full px-3 py-2 border border-input rounded-md"
                />
                <p className="text-sm text-muted-foreground">
                  {subscription.tier === 'free' && (
                    <span className="text-amber-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Limited to 50 pages on Free plan
                    </span>
                  )}
                  {subscription.tier === 'pro' && (
                    <span>Limited to 500 pages on Pro plan</span>
                  )}
                  {subscription.tier === 'enterprise' && (
                    <span>Unlimited pages available</span>
                  )}
                </p>
              </div>
            </div>
            
            {(subscription.isPro || subscription.isEnterprise) && (
              <div className="border border-border rounded-md p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-medium flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    Advanced Settings
                    <Badge variant="outline">Pro & Enterprise</Badge>
                  </h3>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="excludeUrls" className="block text-sm font-medium">
                    Exclude URLs (Optional)
                  </label>
                  <textarea
                    id="excludeUrls"
                    value={formData.advancedSettings.excludeUrls}
                    onChange={(e) => handleAdvancedSettingsChange("excludeUrls", e.target.value)}
                    placeholder="/admin/*, /wp-login.php, /cart/*"
                    className="w-full px-3 py-2 border border-input rounded-md resize-none h-20"
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter URL patterns to exclude from crawling, separated by commas. Wildcards (*) are supported.
                  </p>
                </div>
                
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="followRobotsTxt"
                    checked={formData.advancedSettings.followRobotsTxt}
                    onChange={(e) => handleAdvancedSettingsChange("followRobotsTxt", e.target.checked)}
                    className="mt-1 h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                  />
                  <div>
                    <label htmlFor="followRobotsTxt" className="block text-sm font-medium">
                      Respect robots.txt
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Follow the rules in the website's robots.txt file
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {!subscription.isPro && !subscription.isEnterprise && (
              <Alert className="bg-muted/50 border-primary/20">
                <Sparkles className="h-4 w-4 text-primary" />
                <AlertTitle>Unlock Advanced Settings</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>Upgrade to Pro or Enterprise to access advanced crawl settings</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-primary text-primary"
                    onClick={() => setShowUpgradePrompt(true)}
                  >
                    Upgrade Now
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-md font-medium flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                Target Keywords
              </h3>
              
              <div className="space-y-2">
                <label htmlFor="targetKeywords" className="block text-sm font-medium">
                  Keywords (Optional)
                </label>
                <textarea
                  id="targetKeywords"
                  value={formData.targetKeywords}
                  onChange={(e) => handleInputChange("targetKeywords", e.target.value)}
                  placeholder="keyword1, keyword2, keyword3"
                  className="w-full px-3 py-2 border border-input rounded-md resize-none h-24"
                />
                <p className="text-sm text-muted-foreground">
                  Enter keywords you want to target, separated by commas. These will be used for AI analysis.
                </p>
              </div>
            </div>
            
            {(subscription.isPro || subscription.isEnterprise) ? (
              <div className="border border-border rounded-md p-4">
                <h3 className="text-md font-medium mb-4 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  Keyword Groups
                  <Badge variant="outline">Pro & Enterprise</Badge>
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Organize your keywords into logical groups for better analysis and tracking.
                  You can add keyword groups in the full editor after creating your project.
                </p>
              </div>
            ) : (
              <Alert className="bg-muted/50 border-primary/20">
                <Sparkles className="h-4 w-4 text-primary" />
                <AlertTitle>Unlock Keyword Grouping</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>Upgrade to Pro or Enterprise to organize keywords into groups</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-primary text-primary"
                    onClick={() => setShowUpgradePrompt(true)}
                  >
                    Upgrade Now
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )
      
      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-md font-medium flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Competitor Analysis
              </h3>
              
              <div className="space-y-2">
                <p className="text-sm">
                  Add your main competitors to compare your SEO performance against them.
                  You can add competitors in the full editor after creating your project.
                </p>
              </div>
            </div>
            
            <Alert className="bg-success-background border-success-text/20">
              <CheckCircle className="h-4 w-4 text-success-text" />
              <AlertTitle>Ready to Create Your Project</AlertTitle>
              <AlertDescription>
                You've completed all the steps. Click "Create Project" to start tracking your website's SEO performance.
              </AlertDescription>
            </Alert>
            
            {!subscription.isPro && !subscription.isEnterprise && (
              <Alert className="bg-muted/50 border-primary/20">
                <Sparkles className="h-4 w-4 text-primary" />
                <AlertTitle>Unlock More Features</AlertTitle>
                <AlertDescription className="flex flex-col gap-2">
                  <span>Upgrade to Pro or Enterprise to access:</span>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Weekly or daily crawls</li>
                    <li>Advanced crawl settings</li>
                    <li>Keyword grouping</li>
                    <li>Competitor analysis</li>
                    <li>White-label reports</li>
                  </ul>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-primary text-primary self-end mt-2"
                    onClick={() => setShowUpgradePrompt(true)}
                  >
                    Upgrade Now
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-primary">
                {currentStep === 1 && "Project Details"}
                {currentStep === 2 && "Crawl Settings"}
                {currentStep === 3 && "Keywords"}
                {currentStep === 4 && "Competitor Analysis"}
              </CardTitle>
              <CardDescription>
                Step {currentStep} of {totalSteps}
              </CardDescription>
            </div>
            <Badge variant={subscription.isPro ? "secondary" : subscription.isEnterprise ? "default" : "outline"}>
              {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Plan
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        
        <CardContent>
          {renderStepContent()}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            {currentStep === 1 ? "Cancel" : "Back"}
          </Button>
          
          <Button
            onClick={handleNext}
            className="flex items-center gap-1"
          >
            {currentStep === totalSteps ? "Create Project" : "Next"}
            {currentStep !== totalSteps && <ChevronRight className="h-4 w-4" />}
          </Button>
        </CardFooter>
      </Card>
      
      {showUpgradePrompt && (
        <UpgradePrompt
          currentTier={subscription.tier}
          onClose={() => setShowUpgradePrompt(false)}
          feature={
            formData.crawlFrequency === "weekly" ? "weekly_crawl" :
            formData.crawlFrequency === "daily" ? "daily_crawl" : 
            currentStep === 3 ? "keyword_grouping" : 
            "advanced_features"
          }
        />
      )}
    </>
  )
} 