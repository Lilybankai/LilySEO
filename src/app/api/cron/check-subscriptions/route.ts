import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { updateUserSubscription } from '@/services/subscription';

// This endpoint will be called by a scheduled job (e.g., Vercel Cron Jobs)
// to check and renew subscriptions

export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const { searchParams } = new URL(request.url);
    const cronSecret = searchParams.get('secret');
    
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get all users with active subscriptions
    const { data: activeSubscriptions, error: fetchError } = await supabase
      .from('profiles')
      .select('id, subscription_tier, subscription_status, subscription_renewal_date')
      .in('subscription_status', ['active', 'past_due'])
      .not('subscription_tier', 'is', null);
      
    if (fetchError) {
      console.error('Error fetching active subscriptions:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }
    
    console.log(`Found ${activeSubscriptions.length} active subscriptions to process`);
    
    const today = new Date();
    const results = {
      processed: 0,
      renewed: 0,
      downgraded: 0,
      errors: 0
    };
    
    // Process each active subscription
    for (const subscription of activeSubscriptions) {
      try {
        results.processed++;
        const renewalDate = new Date(subscription.subscription_renewal_date);
        
        // Check if renewal date has passed
        if (today > renewalDate) {
          console.log(`Processing renewal for user ${subscription.id}`);
          
          // Check if this is a real subscription (non-free) that needs renewal
          if (subscription.subscription_tier !== 'free') {
            // For PayPal subscriptions, the webhook should handle the renewal
            // This is just a fallback to ensure users aren't stuck
            
            // Here we would typically call PayPal API to check subscription status
            // For now we just log it and propagate the changes
            
            // Propagate tier to all projects to ensure they have the correct settings
            const propagationResult = await updateUserSubscription(
              subscription.id, 
              subscription.subscription_tier
            );
            
            if (propagationResult) {
              // Update renewal date (add 30 days)
              await supabase
                .from('profiles')
                .update({
                  subscription_renewal_date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', subscription.id);
                
              results.renewed++;
            } else {
              results.errors++;
            }
          }
        }
      } catch (error) {
        console.error(`Error processing subscription for user ${subscription.id}:`, error);
        results.errors++;
      }
    }
    
    // Also handle canceled subscriptions that have reached their end date
    const { data: canceledSubscriptions, error: canceledError } = await supabase
      .from('profiles')
      .select('id, subscription_tier, subscription_status, subscription_renewal_date')
      .eq('subscription_status', 'canceled')
      .not('subscription_tier', 'is', null);
      
    if (canceledError) {
      console.error('Error fetching canceled subscriptions:', canceledError);
    } else {
      console.log(`Found ${canceledSubscriptions.length} canceled subscriptions to check`);
      
      // Process each canceled subscription
      for (const subscription of canceledSubscriptions) {
        try {
          const endDate = new Date(subscription.subscription_renewal_date);
          
          // Check if end date has passed - time to downgrade to free
          if (today > endDate) {
            console.log(`Downgrading canceled subscription for user ${subscription.id}`);
            
            // Update subscription to free tier
            await supabase
              .from('profiles')
              .update({
                subscription_tier: 'free',
                subscription_status: 'active',
                updated_at: new Date().toISOString(),
              })
              .eq('id', subscription.id);
              
            // Propagate tier change to all projects
            await updateUserSubscription(subscription.id, 'free');
            
            results.downgraded++;
          }
        } catch (error) {
          console.error(`Error processing canceled subscription for user ${subscription.id}:`, error);
          results.errors++;
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Subscription check completed',
      stats: results
    });
  } catch (error) {
    console.error('Error checking subscriptions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 