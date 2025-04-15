import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { cancelPayPalSubscriptionAPI } from '@/lib/paypal'; // Import the PayPal API cancel function

// Placeholder function for PayPal API interaction
// In reality, this would use the PayPal SDK or direct fetch calls
// with proper authentication (Bearer token from getPayPalAccessToken)
async function cancelPayPalSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
  console.log(`Simulating cancellation for PayPal Subscription ID: ${subscriptionId}`);
  // TODO: Implement actual PayPal API call here
  // 1. Get PayPal Access Token (client ID + secret)
  // 2. Send POST request to https://api.paypal.com/v1/billing/subscriptions/{subscriptionId}/cancel
  //    with Authorization: Bearer <ACCESS_TOKEN>
  //    and appropriate body (e.g., { reason: "User downgraded to free plan" })
  // 3. Handle response (success 204 No Content, or error)
  
  // For now, assume success for demonstration
  const success = true; // Replace with actual API call result
  if (success) {
    return { success: true };
  } else {
    return { success: false, error: "Failed to cancel PayPal subscription (Simulated Error)" };
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    // 1. Authenticate User
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. Get User's Profile and current PayPal Subscription ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('paypal_subscription_id, subscription_tier')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error(`Error fetching profile for user ${userId}:`, profileError);
      return NextResponse.json({ error: 'Could not find user profile.' }, { status: 404 });
    }

    // Check if user is already free or has no PayPal ID
    if (profile.subscription_tier !== 'free' && profile.paypal_subscription_id) {
       // 3. Cancel PayPal Subscription using the imported function
       console.log(`Attempting PayPal cancellation for user ${userId}, sub ID: ${profile.paypal_subscription_id}`);
       const cancelResult = await cancelPayPalSubscriptionAPI(profile.paypal_subscription_id);
       if (!cancelResult.success) {
         console.error(`Failed to cancel PayPal subscription ${profile.paypal_subscription_id} for user ${userId}:`, cancelResult.error);
         return NextResponse.json({ error: `Could not cancel external subscription: ${cancelResult.error}` }, { status: 500 });
       }
       console.log(`Successfully cancelled PayPal subscription ${profile.paypal_subscription_id} for user ${userId}`);
    } else {
      console.log(`User ${userId} is already free or has no PayPal ID. Skipping PayPal cancellation.`);
    }

    // 4. Update Supabase Profile to Free Tier
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_tier: 'free',
        subscription_status: 'canceled', 
        paypal_subscription_id: null, 
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error(`Error updating profile to free tier for user ${userId}:`, updateError);
      return NextResponse.json({ error: `Failed to update profile after cancellation: ${updateError.message}` }, { status: 500 });
    }

    console.log(`Successfully downgraded user ${userId} to free plan.`);
    return NextResponse.json({ message: 'Successfully downgraded to Free plan.' });

  } catch (error: any) {
    console.error('Error in /api/subscriptions/downgrade:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 