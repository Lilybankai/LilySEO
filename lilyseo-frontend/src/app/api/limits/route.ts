import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';

// Helper function to organize limits by plan
function organizeLimits(usageLimits: any[], subscriptionLimits: any[]) {
  const limitsByPlan: Record<string, Record<string, number | string | null>> = {
    free: {},
    pro: {},
    enterprise: {},
  };

  // Process usage limits
  usageLimits.forEach(limit => {
    if (limitsByPlan[limit.plan_type]) {
      limitsByPlan[limit.plan_type][limit.feature_name] = limit.monthly_limit === -1 ? 'Unlimited' : limit.monthly_limit;
    }
  });

  // Process subscription limits (e.g., team members)
  subscriptionLimits.forEach(limit => {
    if (limitsByPlan[limit.subscription_tier]) {
      limitsByPlan[limit.subscription_tier]['team_member_limit'] = limit.team_member_limit === -1 ? 'Unlimited' : limit.team_member_limit;
    }
  });

  return limitsByPlan;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // No auth needed for public limits data, but you could add it if required
    // const { data: { session } } = await supabase.auth.getSession();
    // if (!session) {
    //   return new NextResponse(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
    // }

    // Fetch all usage limits
    const { data: usageLimits, error: usageError } = await supabase
      .from('usage_limits')
      .select('plan_type, feature_name, monthly_limit');

    if (usageError) {
      console.error('Error fetching usage limits:', usageError);
      return new NextResponse(JSON.stringify({ error: 'Failed to fetch usage limits' }), { status: 500 });
    }

    // Fetch all subscription limits
    const { data: subscriptionLimits, error: subError } = await supabase
      .from('subscription_limits')
      .select('subscription_tier, team_member_limit');

    if (subError) {
      console.error('Error fetching subscription limits:', subError);
      return new NextResponse(JSON.stringify({ error: 'Failed to fetch subscription limits' }), { status: 500 });
    }

    const organizedLimits = organizeLimits(usageLimits || [], subscriptionLimits || []);

    return NextResponse.json(organizedLimits);

  } catch (error) {
    console.error('Unexpected error fetching limits:', error);
    return new NextResponse(JSON.stringify({ error: 'An unexpected error occurred' }), { status: 500 });
  }
} 