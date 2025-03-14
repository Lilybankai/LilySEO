"use client"

import { useState } from "react"
import { X, Check, Sparkles, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface UpgradePromptProps {
  currentTier: string
  onClose: () => void
  feature?: 'weekly_crawl' | 'daily_crawl' | 'keyword_grouping' | 'competitor_analysis' | 'white_label' | 'advanced_features'
}

interface PlanFeature {
  name: string
  free: boolean
  pro: boolean
  enterprise: boolean
  highlight?: boolean
}

export function UpgradePrompt({ currentTier, onClose, feature }: UpgradePromptProps) {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'enterprise'>(
    feature === 'daily_crawl' ? 'enterprise' : 'pro'
  )
  
  const getFeatureTitle = () => {
    switch (feature) {
      case 'weekly_crawl':
        return "Weekly Crawls"
      case 'daily_crawl':
        return "Daily Crawls"
      case 'keyword_grouping':
        return "Keyword Grouping"
      case 'competitor_analysis':
        return "Competitor Analysis"
      case 'white_label':
        return "White Label Reports"
      default:
        return "Premium Features"
    }
  }
  
  const getFeatureDescription = () => {
    switch (feature) {
      case 'weekly_crawl':
        return "Upgrade to Pro or Enterprise to access weekly crawls and get more frequent SEO insights."
      case 'daily_crawl':
        return "Upgrade to Enterprise to access daily crawls for the most up-to-date SEO data."
      case 'keyword_grouping':
        return "Organize your keywords into logical groups for better analysis and tracking."
      case 'competitor_analysis':
        return "Compare your SEO performance against your competitors with detailed analysis."
      case 'white_label':
        return "Create professional, branded reports without LilySEO branding."
      default:
        return "Unlock premium features to supercharge your SEO performance."
    }
  }
  
  const features: PlanFeature[] = [
    { 
      name: "Projects", 
      free: true, 
      pro: true, 
      enterprise: true 
    },
    { 
      name: "Monthly Crawls", 
      free: true, 
      pro: true, 
      enterprise: true 
    },
    { 
      name: "Weekly Crawls", 
      free: false, 
      pro: true, 
      enterprise: true,
      highlight: feature === 'weekly_crawl'
    },
    { 
      name: "Daily Crawls", 
      free: false, 
      pro: false, 
      enterprise: true,
      highlight: feature === 'daily_crawl'
    },
    { 
      name: "Keyword Tracking", 
      free: true, 
      pro: true, 
      enterprise: true 
    },
    { 
      name: "Keyword Grouping", 
      free: false, 
      pro: true, 
      enterprise: true,
      highlight: feature === 'keyword_grouping'
    },
    { 
      name: "Competitor Analysis", 
      free: false, 
      pro: true, 
      enterprise: true,
      highlight: feature === 'competitor_analysis'
    },
    { 
      name: "Advanced Crawl Settings", 
      free: false, 
      pro: true, 
      enterprise: true,
      highlight: feature === 'advanced_features'
    },
    { 
      name: "White Label Reports", 
      free: false, 
      pro: true, 
      enterprise: true,
      highlight: feature === 'white_label'
    },
    { 
      name: "Priority Support", 
      free: false, 
      pro: false, 
      enterprise: true 
    },
  ]
  
  const limits = {
    free: {
      projects: 3,
      keywords: 100,
      competitors: 3
    },
    pro: {
      projects: 10,
      keywords: 500,
      competitors: 10
    },
    enterprise: {
      projects: 50,
      keywords: 2000,
      competitors: 30
    }
  }
  
  const handleUpgrade = () => {
    // Navigate to the pricing page with the selected plan highlighted
    router.push(`/pricing?plan=${selectedPlan}`)
    onClose()
  }
  
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Upgrade to Unlock {getFeatureTitle()}
              </CardTitle>
              <CardDescription className="mt-2">
                {getFeatureDescription()}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free Plan */}
            <div className={`border rounded-lg p-4 ${currentTier === 'free' ? 'border-primary' : 'border-border'}`}>
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium">Free</h3>
                <div className="mt-2">
                  <span className="text-2xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                {currentTier === 'free' && (
                  <Badge variant="outline" className="mt-2">Current Plan</Badge>
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Includes:</p>
                <ul className="space-y-1">
                  <li className="text-sm flex items-center">
                    <span className="mr-2 text-muted-foreground">•</span>
                    Up to {limits.free.projects} projects
                  </li>
                  <li className="text-sm flex items-center">
                    <span className="mr-2 text-muted-foreground">•</span>
                    Up to {limits.free.keywords} keywords
                  </li>
                  <li className="text-sm flex items-center">
                    <span className="mr-2 text-muted-foreground">•</span>
                    Up to {limits.free.competitors} competitors
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Pro Plan */}
            <div 
              className={`border rounded-lg p-4 ${selectedPlan === 'pro' ? 'border-primary ring-1 ring-primary' : 'border-border'} ${feature === 'daily_crawl' ? 'opacity-75' : ''}`}
              onClick={() => feature !== 'daily_crawl' && setSelectedPlan('pro')}
            >
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium">Pro</h3>
                <div className="mt-2">
                  <span className="text-2xl font-bold">$49</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                {currentTier === 'pro' && (
                  <Badge variant="outline" className="mt-2">Current Plan</Badge>
                )}
                {selectedPlan === 'pro' && currentTier !== 'pro' && (
                  <Badge variant="secondary" className="mt-2">Recommended</Badge>
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Everything in Free, plus:</p>
                <ul className="space-y-1">
                  <li className="text-sm flex items-center">
                    <span className="mr-2 text-muted-foreground">•</span>
                    Up to {limits.pro.projects} projects
                  </li>
                  <li className="text-sm flex items-center">
                    <span className="mr-2 text-muted-foreground">•</span>
                    Up to {limits.pro.keywords} keywords
                  </li>
                  <li className="text-sm flex items-center">
                    <span className="mr-2 text-muted-foreground">•</span>
                    Up to {limits.pro.competitors} competitors
                  </li>
                  <li className="text-sm flex items-center font-medium text-primary">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    Weekly crawls
                  </li>
                  <li className="text-sm flex items-center font-medium text-primary">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    Keyword grouping
                  </li>
                  <li className="text-sm flex items-center font-medium text-primary">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    Competitor analysis
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Enterprise Plan */}
            <div 
              className={`border rounded-lg p-4 ${selectedPlan === 'enterprise' ? 'border-primary ring-1 ring-primary' : 'border-border'}`}
              onClick={() => setSelectedPlan('enterprise')}
            >
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium">Enterprise</h3>
                <div className="mt-2">
                  <span className="text-2xl font-bold">$199</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                {currentTier === 'enterprise' && (
                  <Badge variant="outline" className="mt-2">Current Plan</Badge>
                )}
                {selectedPlan === 'enterprise' && currentTier !== 'enterprise' && (
                  <Badge variant="secondary" className="mt-2">Recommended</Badge>
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Everything in Pro, plus:</p>
                <ul className="space-y-1">
                  <li className="text-sm flex items-center">
                    <span className="mr-2 text-muted-foreground">•</span>
                    Up to {limits.enterprise.projects} projects
                  </li>
                  <li className="text-sm flex items-center">
                    <span className="mr-2 text-muted-foreground">•</span>
                    Up to {limits.enterprise.keywords} keywords
                  </li>
                  <li className="text-sm flex items-center">
                    <span className="mr-2 text-muted-foreground">•</span>
                    Up to {limits.enterprise.competitors} competitors
                  </li>
                  <li className="text-sm flex items-center font-medium text-primary">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    Daily crawls
                  </li>
                  <li className="text-sm flex items-center font-medium text-primary">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    Priority support
                  </li>
                  <li className="text-sm flex items-center font-medium text-primary">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    API access
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Feature Comparison</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium">Feature</th>
                    <th className="px-4 py-2 text-center font-medium">Free</th>
                    <th className="px-4 py-2 text-center font-medium">Pro</th>
                    <th className="px-4 py-2 text-center font-medium">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, index) => (
                    <tr 
                      key={index} 
                      className={`border-t border-border ${feature.highlight ? 'bg-primary/5' : ''}`}
                    >
                      <td className={`px-4 py-2 text-sm ${feature.highlight ? 'font-medium text-primary' : ''}`}>
                        {feature.name}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {feature.free ? (
                          <Check className="h-4 w-4 mx-auto text-primary" />
                        ) : (
                          <X className="h-4 w-4 mx-auto text-muted-foreground" />
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {feature.pro ? (
                          <Check className="h-4 w-4 mx-auto text-primary" />
                        ) : (
                          <X className="h-4 w-4 mx-auto text-muted-foreground" />
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {feature.enterprise ? (
                          <Check className="h-4 w-4 mx-auto text-primary" />
                        ) : (
                          <X className="h-4 w-4 mx-auto text-muted-foreground" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Maybe Later
          </Button>
          
          <Button 
            onClick={handleUpgrade}
            className="flex items-center gap-1"
            disabled={
              (selectedPlan === 'pro' && currentTier === 'pro') || 
              (selectedPlan === 'enterprise' && currentTier === 'enterprise')
            }
          >
            Upgrade to {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 