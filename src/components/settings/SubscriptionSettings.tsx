'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getUserSubscription, subscriptionPlans, SubscriptionPlan, createPayPalSubscription, capturePayPalOrder } from '@/services/subscription'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { Check, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from "sonner";

// Define the expected return type for capturePayPalOrder, allowing message to be optional
type CaptureResult = 
  | { success: true }
  | { success: false; message?: string }; // Made message optional

// Define props interface
interface SubscriptionSettingsProps {
  setActiveSection: (key: string) => void;
}

// Renamed export, add props
export function SubscriptionSettings({ setActiveSection }: SubscriptionSettingsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [paymentStatus, setPaymentStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({})
  const [isDowngrading, setIsDowngrading] = useState(false);

  // Check for success or canceled payment parameters
  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')
    const orderId = searchParams.get('orderId')
    const planId = searchParams.get('planId')
    
    if (success === 'true' && orderId && planId) {
      handleSuccessfulPayment(orderId, planId)
    } else if (canceled === 'true') {
      setPaymentStatus({
        success: false,
        message: 'Payment was canceled. Your subscription has not been changed.'
      })
    }
    // Consider clearing params after handling? 
    // router.replace('/dashboard/settings') // Might be too aggressive
  }, [searchParams])

  // Load current user subscription
  useEffect(() => {
    async function loadUserAndSubscription() {
      try {
        setLoading(true)
        
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/signin') // Keep redirect for safety
          return
        }
        
        setUserId(user.id)
        
        const subscription = await getUserSubscription()
        setCurrentSubscription(subscription)
        
        // Check if we need to show payment success message (even if already loaded)
        const success = searchParams.get('success')
        if (success === 'true' && !paymentStatus.message) { // Avoid double messages
          setPaymentStatus({
            success: true,
            message: `Successfully upgraded to ${subscription.tier} plan!`
          })
        }
        
      } catch (error) {
        console.error('Error loading subscription:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadUserAndSubscription()
  }, [router, supabase, searchParams, paymentStatus.message]) // Added paymentStatus.message dependency

  // Handle successful PayPal payment
  async function handleSuccessfulPayment(orderId: string, planId: string) {
    try {
      setProcessingPayment(true)
      
      // Explicitly type the result
      const result: CaptureResult = await capturePayPalOrder(orderId, planId)
      
      if (result.success) {
        setPaymentStatus({
          success: true,
          message: 'Payment successful! Your subscription has been updated.'
        })
        
        const subscription = await getUserSubscription()
        setCurrentSubscription(subscription)
      } else {
        // Provide a default message if result.message is missing
        const errorMessage = result.message || 'There was a problem processing your payment. Please try again.';
        setPaymentStatus({
          success: false,
          message: errorMessage
        })
      }
    } catch (error) {
      console.error('Error capturing payment:', error)
      setPaymentStatus({
        success: false,
        message: 'Payment processing failed. Please contact support.'
      })
    } finally {
      setProcessingPayment(false)
      // Clear query params after processing
      router.replace('/dashboard/settings', undefined); // Use router.replace to clear params without page reload if possible in Next.js
    }
  }

  // Handle subscription plan selection (removed - handled by PayPalButtons createOrder)
  // async function handleSelectPlan(plan: SubscriptionPlan) { ... }

  // Calculate price with discount for yearly billing
  function getAdjustedPrice(plan: SubscriptionPlan) {
    if (billingCycle === 'yearly') {
      return Math.round(plan.price * 12 * 0.8)
    }
    return plan.price
  }

  // Function to handle Manage Billing click
  const handleManageBilling = () => {
    // TODO: Replace with actual PayPal Customer Portal integration if available
    // This usually involves calling a backend endpoint to create a portal session
    // For now, redirect to generic PayPal account settings or a placeholder
    window.open('https://www.paypal.com/myaccount/settings/', '_blank');
    // Alternatively: alert('Manage Billing integration pending backend implementation.');
  };

  // Function to handle downgrade click
  const handleDowngradeToFree = async () => {
    if (!confirm("Are you sure you want to downgrade to the Free plan? Your current subscription will be cancelled.")) {
      return;
    }
    setIsDowngrading(true);
    setPaymentStatus({}); // Clear previous status messages
    try {
      const response = await fetch('/api/subscriptions/downgrade', { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to downgrade subscription.");
      }

      // Refresh subscription state
      const subscription = await getUserSubscription();
      setCurrentSubscription(subscription);
      setPaymentStatus({ success: true, message: data.message || "Successfully downgraded to Free plan." });
      toast.success(data.message || "Successfully downgraded to Free plan.");

    } catch (error: any) {
      console.error("Error downgrading subscription:", error);
      setPaymentStatus({ success: false, message: error.message || "Could not downgrade subscription." });
      toast.error(error.message || "Could not downgrade subscription.");
    } finally {
      setIsDowngrading(false);
    }
  };

  if (loading) {
    return (
      // Simplified Loading state for component context
      <div className="grid gap-8 py-8">
        <Skeleton className="w-full h-24" />
        <div className="grid gap-8 md:grid-cols-3">
          <Skeleton className="w-full h-96" />
          <Skeleton className="w-full h-96" />
          <Skeleton className="w-full h-96" />
        </div>
      </div>
    )
  }

  return (
    <PayPalScriptProvider options={{ 
      clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '', // Ensure this is loaded correctly
      currency: "USD"
    }}>
      {/* Removed outer container and h1 - handled by SettingsLayout */}
      <div className="space-y-8">
        {/* Payment Status Alert */}
        {paymentStatus.message && (
          <Alert 
            variant={paymentStatus.success ? "default" : "destructive"}
            className="mb-8"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {paymentStatus.success ? 'Success' : 'Error'}
            </AlertTitle>
            <AlertDescription>
              {paymentStatus.message}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Current Subscription Info */}
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>
              Your current plan and billing information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold capitalize">{currentSubscription?.tier || 'Free'}</span>
                  <Badge variant={
                    currentSubscription?.tier === 'enterprise' 
                      ? 'default' 
                      : currentSubscription?.tier === 'pro' 
                        ? 'secondary' 
                        : 'outline'
                  }>
                    {currentSubscription?.tier === 'enterprise' 
                      ? 'Enterprise' 
                      : currentSubscription?.tier === 'pro' 
                        ? 'Pro' 
                        : 'Free'}
                  </Badge>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Badge variant="outline" className="capitalize">
                  {/* Assuming active for now, needs real status from DB */}
                  {currentSubscription?.status || 'Active'}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Next Billing Date</p>
                <p className="font-medium">
                  {currentSubscription?.tier === 'free' 
                    ? 'Not applicable' 
                    : /* Replace with actual billing date from DB */
                      currentSubscription?.next_billing_date 
                      ? new Date(currentSubscription.next_billing_date).toLocaleDateString() 
                      : 'Unavailable'}
                </p>
              </div>
              {/* Add Manage Billing Button if applicable */}
              {currentSubscription?.tier !== 'free' && (
                 <Button 
                  variant="outline" 
                  onClick={handleManageBilling}
                 >
                   Manage Billing
                 </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Billing Cycle Toggle */}
        <div className="flex justify-center">
          <Tabs 
            value={billingCycle} 
            onValueChange={(v) => setBillingCycle(v as 'monthly' | 'yearly')}
            className="w-[400px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">
                Yearly
                <span className="ml-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  Save 20%
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Subscription Plans */}
        <div className="grid gap-8 md:grid-cols-3">
          {subscriptionPlans.map((plan) => {
            const isCurrentPlan = currentSubscription?.tier === plan.tier
            const price = getAdjustedPrice(plan)
            
            return (
              <Card 
                key={plan.id}
                className={`flex flex-col ${plan.recommended ? 'border-primary ring-2 ring-primary ring-opacity-50' : ''}`}
              >
                {plan.recommended && (
                  <div className="rounded-t-lg bg-primary py-1 text-center text-sm font-medium text-primary-foreground">
                    Recommended
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    {isCurrentPlan && (
                      <Badge variant="outline" className="ml-2">Current Plan</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {plan.tier === 'free' 
                      ? 'Basic SEO functionality' 
                      : plan.tier === 'pro' 
                        ? 'Advanced SEO tools for serious marketers' 
                        : 'Enterprise-grade SEO platform'}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-grow">
                  <div className="mb-4">
                    <span className="text-3xl font-bold">${price}</span>
                    <span className="text-muted-foreground ml-1">
                      {billingCycle === 'yearly' ? '/year' : '/month'}
                    </span>
                  </div>
                  
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter className="pt-4">
                  {isCurrentPlan ? (
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <>
                      {plan.tier === 'free' ? (
                        <Button 
                          className="w-full" 
                          onClick={handleDowngradeToFree}
                          disabled={isDowngrading || processingPayment || currentSubscription?.tier === 'free'}
                        >
                          {isDowngrading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                          ) : null}
                          {isDowngrading ? 'Processing...' : 'Downgrade to Free'}
                        </Button>
                      ) : (
                        <div className="w-full">
                          <PayPalButtons
                            style={{ layout: "vertical" }}
                            disabled={processingPayment}
                            createOrder={async () => {
                              // Ensure NEXT_PUBLIC_PAYPAL_CLIENT_ID is available
                              if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
                                console.error("PayPal Client ID not configured");
                                toast.error("Payment system not configured. Please contact support.");
                                return ""; // Must return a string, even if empty
                              }
                              try {
                                const { orderID } = await createPayPalSubscription(plan.id); // Use the plan ID from the loop
                                return orderID;
                              } catch (error) {
                                console.error("Error creating PayPal order:", error);
                                toast.error("Could not initiate payment. Please try again.");
                                return ""; // Must return a string
                              }
                            }}
                            onApprove={async (data) => {
                              setProcessingPayment(true);
                              try {
                                const result = await capturePayPalOrder(data.orderID, plan.id); 
                                if (result.success) {
                                  // Fetch updated subscription details
                                  const subscription = await getUserSubscription();
                                  setCurrentSubscription(subscription);
                                  
                                  // Update profile with PayPal Subscription ID if received
                                  if (result.paypalSubscriptionId && userId) {
                                    const supabase = createClient();
                                    const { error: updateError } = await supabase
                                      .from('profiles')
                                      .update({ paypal_subscription_id: result.paypalSubscriptionId })
                                      .eq('id', userId);
                                      
                                    if (updateError) {
                                      console.error('Failed to save PayPal subscription ID:', updateError);
                                      // Non-critical error, maybe toast a warning?
                                      toast.warning("Subscription activated, but failed to save billing ID.");
                                    }
                                  }
                                  
                                  setPaymentStatus({
                                    success: true,
                                    message: `Successfully upgraded to ${plan.name} plan!`
                                  });
                                  router.replace('/dashboard/settings', undefined);
                                } else {
                                   // Use message from result if available
                                   throw new Error(result.message || 'Failed to capture payment');
                                 }
                               } catch (error) {
                                 console.error('Error capturing order:', error);
                                 let errorMessage = 'Failed to process payment. Please try again.';
                                 if (error instanceof Error) {
                                   errorMessage = error.message;
                                 }
                                 // Explicitly define the type of the object being passed
                                 const newStatus: { success: boolean; message: string } = {
                                   success: false,
                                   message: errorMessage
                                 };
                                 setPaymentStatus(newStatus); // Set state with the typed object
                               } finally {
                                setProcessingPayment(false);
                              }
                            }}
                            onCancel={() => {
                              setPaymentStatus({
                                success: false,
                                message: 'Payment was canceled. Your subscription has not been changed.'
                              });
                            }}
                            onError={(err) => {
                              console.error('PayPal error:', err);
                              setPaymentStatus({
                                success: false,
                                message: 'An error occurred with the payment provider. Please try again.'
                              });
                            }}
                          />
                        </div>
                      )}
                    </>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </PayPalScriptProvider>
  )
} 