import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateUserSubscription } from '@/services/subscription';
import { notifyPaymentIssue } from '@/lib/notification-utils';

// PayPal webhook ID
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;

// Function to verify PayPal webhook signature
function verifyWebhookSignature(
  body: string,
  headers: {
    'paypal-auth-algo': string;
    'paypal-cert-url': string;
    'paypal-transmission-id': string;
    'paypal-transmission-sig': string;
    'paypal-transmission-time': string;
  }
) {
  // This is a simplified version. For production, implement full signature verification
  // based on PayPal documentation: https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature
  return true; // Placeholder - implement proper verification for production
}

export async function POST(request: Request) {
  try {
    // Get request headers for signature verification
    const headers = {
      'paypal-auth-algo': request.headers.get('paypal-auth-algo') || '',
      'paypal-cert-url': request.headers.get('paypal-cert-url') || '',
      'paypal-transmission-id': request.headers.get('paypal-transmission-id') || '',
      'paypal-transmission-sig': request.headers.get('paypal-transmission-sig') || '',
      'paypal-transmission-time': request.headers.get('paypal-transmission-time') || '',
    };

    // Get request body
    const body = await request.text();
    
    // Verify webhook signature for security (important for production)
    if (!verifyWebhookSignature(body, headers)) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    // Parse the webhook payload
    const event = JSON.parse(body);
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Handle different webhook event types
    switch (event.event_type) {
      case 'PAYMENT.SALE.COMPLETED':
        // A payment has been successfully processed
        await handlePaymentCompleted(supabase, event);
        break;
        
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        // A subscription has been activated
        await handleSubscriptionActivated(supabase, event);
        break;
        
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        // A subscription has been cancelled
        await handleSubscriptionCancelled(supabase, event);
        break;
        
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        // A subscription payment has failed
        await handlePaymentFailed(supabase, event);
        break;
        
      default:
        console.log(`Unhandled PayPal webhook event: ${event.event_type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing PayPal webhook:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

// Handler for successful payment completion
async function handlePaymentCompleted(supabase: any, event: any) {
  try {
    const resourceId = event.resource.id; // PayPal payment ID
    const subscriptionId = event.resource.billing_agreement_id; // PayPal subscription ID
    
    // Find the payment record in our database
    const { data: paymentOrder, error: paymentError } = await supabase
      .from('payment_orders')
      .select('user_id, plan_id')
      .eq('subscription_id', subscriptionId)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (paymentError || !paymentOrder || paymentOrder.length === 0) {
      console.error('Payment record not found for:', subscriptionId);
      return;
    }
    
    const userId = paymentOrder[0].user_id;
    
    // Record the payment
    await supabase.from('subscription_payments').insert({
      user_id: userId,
      payment_id: resourceId,
      subscription_id: subscriptionId,
      amount: event.resource.amount.total,
      currency: event.resource.amount.currency,
      status: event.resource.state,
      payment_date: new Date().toISOString(),
    });
    
    // Update subscription renewal date
    await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      })
      .eq('id', userId);
      
    console.log(`Payment processed for user ${userId}, subscription ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling payment completion:', error);
  }
}

// Handler for subscription activation
async function handleSubscriptionActivated(supabase: any, event: any) {
  try {
    const subscriptionId = event.resource.id;
    
    // Find the user associated with this subscription
    const { data: subscription, error: subError } = await supabase
      .from('payment_orders')
      .select('user_id, plan_id')
      .eq('subscription_id', subscriptionId)
      .single();
      
    if (subError || !subscription) {
      console.error('Subscription not found:', subscriptionId);
      return;
    }
    
    const userId = subscription.user_id;
    const planId = subscription.plan_id;
    
    // Update user profile with subscription details
    await supabase
      .from('profiles')
      .update({
        subscription_tier: planId,
        subscription_status: 'active',
        subscription_id: subscriptionId,
        subscription_updated_at: new Date().toISOString(),
        subscription_renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('id', userId);
      
    // Propagate tier changes to all projects
    await updateUserSubscription(userId, planId);
    
    console.log(`Subscription activated for user ${userId}, plan ${planId}`);
  } catch (error) {
    console.error('Error handling subscription activation:', error);
  }
}

// Handler for subscription cancellation
async function handleSubscriptionCancelled(supabase: any, event: any) {
  try {
    const subscriptionId = event.resource.id;
    
    // Find the user associated with this subscription
    const { data: subscription, error: subError } = await supabase
      .from('payment_orders')
      .select('user_id')
      .eq('subscription_id', subscriptionId)
      .single();
      
    if (subError || !subscription) {
      console.error('Subscription not found:', subscriptionId);
      return;
    }
    
    const userId = subscription.user_id;
    
    // Update user profile - this will downgrade them to free tier at the end of their billing period
    await supabase
      .from('profiles')
      .update({
        subscription_status: 'canceled',
        subscription_updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
      
    console.log(`Subscription cancelled for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

// Handler for failed subscription payment
async function handlePaymentFailed(supabase: any, event: any) {
  try {
    const resource = event.resource;
    const userId = resource.custom_id; // We store the user ID in the custom_id field
    const subscriptionId = resource.id;
    
    // Update subscription status to past_due
    await supabase
      .from('profiles')
      .update({
        subscription_status: 'past_due',
        subscription_updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
      
    // Implement notification to user about payment failure
    await notifyPaymentIssue(userId);
    
    console.log(`Payment failed for user ${userId}, subscription ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
} 