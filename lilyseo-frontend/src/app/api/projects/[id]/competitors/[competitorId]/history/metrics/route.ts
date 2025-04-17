import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function GET(
  request: Request,
  { params }: { params: { id: string; competitorId: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: session } = await supabase.auth.getSession();

    if (!session.session) {
      return new NextResponse(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401 }
      );
    }

    // Get project and user profile to check ownership and get tier
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        user_id,
        profiles ( subscription_tier )
      `)
      .eq('id', params.id)
      .eq('user_id', session.session.user.id)
      .single();

    if (projectError || !projectData) {
      // Handle error or not found...
      const status = projectError?.code === 'PGRST116' ? 404 : 500;
      const message = status === 404 ? 'Project not found or unauthorized' : 'Database error fetching project';
      if (projectError) console.error('Error fetching project/profile:', projectError);
      return new NextResponse(JSON.stringify({ error: message }), { status });
    }
    
    // Extract user tier, default to 'free'
    const profileInfo = Array.isArray(projectData.profiles) ? projectData.profiles[0] : projectData.profiles;
    const userTier = profileInfo?.subscription_tier ?? 'free';
    console.log(`User tier for project ${params.id}: ${userTier}`);

    // Check if the competitor belongs to the project
    const { data: competitor } = await supabase
      .from('competitors')
      .select('id, name, url, status')
      .eq('id', params.competitorId)
      .eq('project_id', params.id)
      .single();

    if (!competitor) {
      return new NextResponse(
        JSON.stringify({ error: 'Competitor not found or not associated with this project' }),
        { status: 404 }
      );
    }

    // Extract query parameters
    const url = new URL(request.url);
    const daysParam = url.searchParams.get('days');
    const requestedDays = daysParam ? parseInt(daysParam, 10) : 30;
    const metrics = url.searchParams.get('metrics')?.split(',') || [
      'seo_metrics.domainAuthority', 
      'seo_metrics.pageAuthority', 
      'technical_metrics.pageSpeed.desktop'
    ];

    // Validate days parameter
    if (isNaN(requestedDays) || requestedDays <= 0) {
      return new NextResponse(JSON.stringify({ error: 'Invalid days parameter. Must be a positive number.' }), { status: 400 });
    }

    // Fetch maximum history days allowed for the tier
    const { data: limitData, error: limitError } = await supabase
      .from('usage_limits')
      .select('monthly_limit')
      .eq('plan_type', userTier)
      .eq('feature_name', 'competitor_history_days')
      .single();

    let maxDays = 1; // Default limit (free tier)
    if (limitError) {
        console.error(`Error fetching competitor_history_days limit for tier ${userTier}, using default:`, limitError);
    } else if (limitData) {
        // Use fetched limit, cap at 365 for practicality even if unlimited (-1)
        maxDays = limitData.monthly_limit === -1 ? 365 : limitData.monthly_limit;
    }
    console.log(`Max history days for tier ${userTier}: ${maxDays}`);

    // Limit days to maximum allowed
    const effectiveDays = Math.min(requestedDays, maxDays);

    // Retrieve historical data
    const { data: history, error: historyError } = await supabase.rpc(
        'get_competitor_history',
        {
          p_competitor_id: params.competitorId,
          p_days: effectiveDays
        }
    );

    if (historyError) {
      console.error('Error fetching competitor history:', historyError);
      return new NextResponse(JSON.stringify({ error: 'Error fetching competitor history' }), { status: 500 });
    }

    // Process history to extract requested metrics
    const timelineData = processMetrics(history || [], metrics);

    // Format response with competitor details and timeline data
    const response = {
      competitor: {
        id: competitor.id,
        name: competitor.name,
        url: competitor.url,
        status: competitor.status
      },
      metrics: timelineData,
      meta: {
        requestedDays: requestedDays,
        effectiveDays,
        maxDays,
        tier: userTier,
        dataPoints: timelineData.labels.length
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500 }
    );
  }
}

// Helper function to process metrics from history data
function processMetrics(history: any[], metricPaths: string[]) {
  // Sort by date ascending
  const sortedHistory = [...history].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  // Extract dates for labels
  const labels = sortedHistory.map(item => 
    new Date(item.created_at).toISOString().split('T')[0]
  );
  
  // Extract metric data
  const datasets = metricPaths.map(metricPath => {
    const pathParts = metricPath.split('.');
    
    // Extract values for this metric
    const data = sortedHistory.map(item => {
      let value = item;
      for (const part of pathParts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          value = null;
          break;
        }
      }
      return typeof value === 'number' ? value : null;
    });
    
    // Calculate percent changes
    const changes = data.map((value, index) => {
      if (index === 0 || value === null) {
        return null;
      }
      
      const previous = data[index - 1];
      // Check if previous is null or zero to avoid division issues
      if (previous === null || previous === 0) {
        return null;
      }
      
      return ((value - previous) / previous) * 100;
    });
    
    return {
      metricPath,
      label: getMetricLabel(metricPath),
      data,
      changes
    };
  });
  
  return {
    labels,
    datasets
  };
}

// Helper to generate human-readable labels for metrics
function getMetricLabel(metricPath: string): string {
  const labels: Record<string, string> = {
    'seo_metrics.domainAuthority': 'Domain Authority',
    'seo_metrics.pageAuthority': 'Page Authority',
    'seo_metrics.backlinks': 'Backlinks',
    'seo_metrics.totalLinks': 'Total Links',
    'technical_metrics.pageSpeed.desktop': 'Desktop Speed',
    'technical_metrics.pageSpeed.mobile': 'Mobile Speed',
    'technical_metrics.mobileFriendliness': 'Mobile Friendliness',
    'technical_metrics.coreWebVitals.lcp': 'Largest Contentful Paint',
    'technical_metrics.coreWebVitals.fid': 'First Input Delay',
    'technical_metrics.coreWebVitals.cls': 'Cumulative Layout Shift',
    'content_metrics.averageWordCount': 'Average Word Count',
    'content_metrics.totalWords': 'Total Words',
    'content_metrics.pageCount': 'Page Count',
    'content_metrics.schemaMarkupUsage': 'Schema Markup Usage',
    'keyword_data.totalKeywords': 'Total Keywords',
    'keyword_data.uniqueKeywords': 'Unique Keywords'
  };
  
  return labels[metricPath] || metricPath.split('.').pop() || metricPath;
} 