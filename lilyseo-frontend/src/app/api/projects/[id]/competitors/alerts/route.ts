import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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

    // Check if the project belongs to the user
    const { data: project } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', params.id)
      .eq('user_id', session.session.user.id)
      .single();

    if (!project) {
      return new NextResponse(
        JSON.stringify({ error: 'Project not found or unauthorized' }),
        { status: 404 }
      );
    }

    // Get alert settings
    const { data: settings, error } = await supabase
      .from('competitor_alert_settings')
      .select('*')
      .eq('project_id', params.id)
      .eq('user_id', session.session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
      console.error('Error fetching alert settings:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Error fetching alert settings' }),
        { status: 500 }
      );
    }

    if (!settings) {
      // Return 404 so the client knows to create new settings
      return new NextResponse(
        JSON.stringify({ error: 'No alert settings found' }),
        { status: 404 }
      );
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Unexpected error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
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

    // Check if the project belongs to the user
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

    // Parse request body
    const requestBody = await request.json();

    // Validate and apply tier-based restrictions
    const email_alerts = project.subscription_tier !== 'free' && Boolean(requestBody.email_alerts);
    const daily_digest = project.subscription_tier === 'enterprise' && Boolean(requestBody.daily_digest);

    // Format the settings
    const alertSettings = {
      user_id: session.session.user.id,
      project_id: params.id,
      email_alerts,
      dashboard_alerts: Boolean(requestBody.dashboard_alerts),
      alert_threshold: Math.min(Math.max(Number(requestBody.alert_threshold) || 10, 1), 50),
      daily_digest,
      weekly_digest: Boolean(requestBody.weekly_digest),
      metrics_to_monitor: Array.isArray(requestBody.metrics_to_monitor) ? 
        requestBody.metrics_to_monitor : 
        ['seo_metrics.domainAuthority', 'technical_metrics.pageSpeed.desktop', 'seo_metrics.backlinks'],
    };

    // Create alert settings
    const { data: newSettings, error } = await supabase
      .from('competitor_alert_settings')
      .insert(alertSettings)
      .select()
      .single();

    if (error) {
      console.error('Error creating alert settings:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Error creating alert settings' }),
        { status: 500 }
      );
    }

    return NextResponse.json(newSettings);
  } catch (error) {
    console.error('Unexpected error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
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

    // Check if the project belongs to the user
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

    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('competitor_alert_settings')
      .select('id')
      .eq('project_id', params.id)
      .eq('user_id', session.session.user.id)
      .single();

    if (!existingSettings) {
      // If no settings exist, call the POST handler
      return POST(request, { params });
    }

    // Parse request body
    const requestBody = await request.json();

    // Validate and apply tier-based restrictions
    const email_alerts = project.subscription_tier !== 'free' && Boolean(requestBody.email_alerts);
    const daily_digest = project.subscription_tier === 'enterprise' && Boolean(requestBody.daily_digest);

    // Format the settings
    const alertSettings = {
      email_alerts,
      dashboard_alerts: Boolean(requestBody.dashboard_alerts),
      alert_threshold: Math.min(Math.max(Number(requestBody.alert_threshold) || 10, 1), 50),
      daily_digest,
      weekly_digest: Boolean(requestBody.weekly_digest),
      metrics_to_monitor: Array.isArray(requestBody.metrics_to_monitor) ? 
        requestBody.metrics_to_monitor : 
        ['seo_metrics.domainAuthority', 'technical_metrics.pageSpeed.desktop', 'seo_metrics.backlinks'],
      updated_at: new Date().toISOString(),
    };

    // Update alert settings
    const { data: updatedSettings, error } = await supabase
      .from('competitor_alert_settings')
      .update(alertSettings)
      .eq('id', existingSettings.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating alert settings:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Error updating alert settings' }),
        { status: 500 }
      );
    }

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Unexpected error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500 }
    );
  }
} 