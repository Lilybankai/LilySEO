import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { subscriptionPlans, updateUserSubscription } from '@/services/subscription';
import { notifySubscriptionChange } from '@/lib/notification-utils';

// PayPal SDK configuration
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// Function to get access token from PayPal
async function getPayPalAccessToken() {
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get PayPal access token: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: Request) {
  try {
    // Get the current user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get orderID and planId from request
    const { orderID, planId } = await request.json();
    
    if (!orderID || !planId) {
      return NextResponse.json({ error: 'Order ID and plan ID are required' }, { status: 400 });
    }

    // Find the plan
    const plan = subscriptionPlans.find(p => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // Get order from database to verify it belongs to this user
    const { data: orderData, error: orderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('order_id', orderID)
      .eq('user_id', user.id)
      .single();

    if (orderError || !orderData) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Capture the order in PayPal
    const captureResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!captureResponse.ok) {
      const errorText = await captureResponse.text();
      throw new Error(`Failed to capture PayPal order: ${errorText}`);
    }

    const captureData = await captureResponse.json();

    // Update order status in database
    await supabase
      .from('payment_orders')
      .update({
        status: captureData.status,
        updated_at: new Date().toISOString(),
        payment_details: captureData,
      })
      .eq('order_id', orderID);

    // Update user subscription in Supabase
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        subscription_tier: plan.tier,
        subscription_status: 'active',
        subscription_updated_at: new Date().toISOString(),
        subscription_renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error updating user profile:', profileError);
      return NextResponse.json({ error: 'Failed to update subscription status' }, { status: 500 });
    }

    // Propagate tier changes to all user projects via the crawler service
    const propagationResult = await updateUserSubscription(user.id, plan.tier);
    
    if (!propagationResult) {
      console.warn('Failed to propagate tier changes to projects');
    }

    // Create notification for the user about subscription change
    await notifySubscriptionChange(user.id, plan.name);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully upgraded to ${plan.name} plan` 
    });
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 