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

    // First check if the project belongs to the user
    const { data: project } = await supabase
      .from('projects')
      .select('id, user_id, subscription_tier')
      .eq('id', params.id)
      .eq('user_id', session.session.user.id)
      .single();

    if (!project) {
      return new NextResponse(
        JSON.stringify({ error: 'Project not found or unauthorized' }),
        { status: 404 }
      );
    }

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
    const days = daysParam ? parseInt(daysParam, 10) : 30;
    const metrics = url.searchParams.get('metrics')?.split(',') || [
      'seo_metrics.domainAuthority', 
      'seo_metrics.pageAuthority', 
      'technical_metrics.pageSpeed.desktop'
    ];

    // Validate days parameter
    if (isNaN(days) || days <= 0) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid days parameter. Must be a positive number.' }),
        { status: 400 }
      );
    }

    // Determine maximum days based on subscription tier
    let maxDays = 1; // Default for free tier
    if (project.subscription_tier === 'enterprise') {
      maxDays = 365; // 12 months for enterprise
    } else if (project.subscription_tier === 'pro') {
      maxDays = 30; // 30 days for pro
    }

    // Limit days to maximum allowed
    const effectiveDays = Math.min(days, maxDays);

    // Retrieve historical data
    const { data: history, error } = await supabase.rpc(
      'get_competitor_history',
      {
        p_competitor_id: params.competitorId,
        p_days: effectiveDays
      }
    );

    if (error) {
      console.error('Error fetching competitor history:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Error fetching competitor history' }),
        { status: 500 }
      );
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
        requestedDays: days,
        effectiveDays,
        maxDays,
        tier: project.subscription_tier,
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