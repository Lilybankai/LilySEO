"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getUserSubscription, subscriptionPlans, SubscriptionPlan, createPayPalSubscription, capturePayPalOrder } from '@/services/subscription'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

export default function SubscriptionPage() {
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
  }, [searchParams])

  // Load current user subscription
  useEffect(() => {
    async function loadUserAndSubscription() {
      try {
        setLoading(true)
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/signin')
          return
        }
        
        setUserId(user.id)
        
        // Get current subscription
        const subscription = await getUserSubscription()
        setCurrentSubscription(subscription)
        
        // Check if we need to show payment success message
        const success = searchParams.get('success')
        if (success === 'true') {
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
  }, [router, supabase, searchParams])

  // Handle successful PayPal payment
  async function handleSuccessfulPayment(orderId: string, planId: string) {
    try {
      setProcessingPayment(true)
      
      // Capture the payment
      const result = await capturePayPalOrder(orderId, planId)
      
      if (result.success) {
        setPaymentStatus({
          success: true,
          message: 'Payment successful! Your subscription has been updated.'
        })
        
        // Reload subscription details
        const subscription = await getUserSubscription()
        setCurrentSubscription(subscription)
      } else {
        setPaymentStatus({
          success: false,
          message: 'There was a problem processing your payment. Please try again.'
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
    }
  }

  // Handle subscription plan selection
  async function handleSelectPlan(plan: SubscriptionPlan) {
    try {
      // If selecting the current plan, do nothing
      if (plan.tier === currentSubscription?.tier) {
        return
      }
      
      // If selecting free plan, simple update
      if (plan.tier === 'free') {
        setProcessingPayment(true)
        
        const response = await fetch('/api/subscriptions/create-paypal-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: 'free' })
        })
        
        if (response.ok) {
          // Reload subscription details
          const subscription = await getUserSubscription()
          setCurrentSubscription(subscription)
          
          setPaymentStatus({
            success: true,
            message: 'Successfully downgraded to Free plan'
          })
        } else {
          setPaymentStatus({
            success: false,
            message: 'Failed to update subscription'
          })
        }
        
        setProcessingPayment(false)
        return
      }
      
      // For paid plans, initiate PayPal flow
      setProcessingPayment(true)
      
      const { orderID } = await createPayPalSubscription(plan.id)
      
      // Store the order details in local storage (temp)
      localStorage.setItem('pendingSubscription', JSON.stringify({
        orderId: orderID,
        planId: plan.id
      }))
      
      // PayPal buttons component will handle the rest
    } catch (error) {
      console.error('Error selecting plan:', error)
      setProcessingPayment(false)
      setPaymentStatus({
        success: false,
        message: 'Failed to initiate payment process. Please try again.'
      })
    }
  }

  // Calculate price with discount for yearly billing
  function getAdjustedPrice(plan: SubscriptionPlan) {
    if (billingCycle === 'yearly') {
      // 20% discount for yearly billing
      return Math.round(plan.price * 12 * 0.8)
    }
    return plan.price
  }

  if (loading) {
    return (
      <div className="container max-w-6xl py-8">
        <h1 className="text-3xl font-bold mb-8">Subscription</h1>
        
        <div className="grid gap-8">
          <Skeleton className="w-full h-24" />
          <div className="grid gap-8 md:grid-cols-3">
            <Skeleton className="w-full h-96" />
            <Skeleton className="w-full h-96" />
            <Skeleton className="w-full h-96" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <PayPalScriptProvider options={{ 
      clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
      currency: "USD"
    }}>
      <div className="container max-w-6xl py-8">
        <h1 className="text-3xl font-bold mb-4">Subscription Management</h1>
        <p className="text-muted-foreground mb-8">
          Choose the plan that best fits your needs. Upgrade or downgrade at any time.
        </p>
        
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
        <Card className="mb-8">
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
                  Active
                </Badge>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Next Billing Date</p>
                <p className="font-medium">
                  {currentSubscription?.tier === 'free' 
                    ? 'Not applicable' 
                    : 'March 20, 2025'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-8">
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
                          onClick={() => handleSelectPlan(plan)}
                          disabled={processingPayment}
                        >
                          {processingPayment ? 'Processing...' : 'Downgrade to Free'}
                        </Button>
                      ) : (
                        <div className="w-full">
                          <PayPalButtons
                            style={{ layout: "vertical" }}
                            disabled={processingPayment}
                            createOrder={async () => {
                              const { orderID } = await createPayPalSubscription(plan.id)
                              return orderID
                            }}
                            onApprove={async (data) => {
                              setProcessingPayment(true)
                              try {
                                await capturePayPalOrder(data.orderID, plan.id)
                                
                                // Reload subscription
                                const subscription = await getUserSubscription()
                                setCurrentSubscription(subscription)
                                
                                setPaymentStatus({
                                  success: true,
                                  message: `Successfully upgraded to ${plan.name} plan!`
                                })
                              } catch (error) {
                                console.error('Error capturing order:', error)
                                setPaymentStatus({
                                  success: false,
                                  message: 'Failed to process payment. Please try again.'
                                })
                              } finally {
                                setProcessingPayment(false)
                              }
                            }}
                            onCancel={() => {
                              setPaymentStatus({
                                success: false,
                                message: 'Payment was canceled. Your subscription has not been changed.'
                              })
                            }}
                            onError={(err) => {
                              console.error('PayPal error:', err)
                              setPaymentStatus({
                                success: false,
                                message: 'There was an error processing your payment. Please try again.'
                              })
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