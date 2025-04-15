import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTechnicalIssuesSummary, getOnPageSeoSummary, getOverallHealthTrend } from '@/lib/reports/basicReports'
import { 
    generateTechnicalIssuesCsv, 
    generateOnPageSeoCsv, 
    generateHealthTrendCsv, 
    generateGscPerformanceCsv,
    generateCompetitorSnapshotCsv
} from '@/lib/reports/csvExport'
import { getGSCPerformanceData } from '@/lib/reports/gscReports'
import { getBasicCompetitorReport } from '@/lib/reports/competitorReports'
import { Database } from '@/lib/supabase/database.types'
import { SupabaseClient } from '@supabase/supabase-js'

// Define available report templates
const reportTemplates = [
  {
    id: 'technical-summary',
    name: 'Technical Issues Summary',
    description: 'Overview of technical SEO errors from the latest audit.',
    requiredTier: 'free', // Minimum tier required to view
    exportTier: 'pro' // Minimum tier required for CSV export
  },
  {
    id: 'onpage-summary',
    name: 'On-Page SEO Summary',
    description: 'Overview of on-page content issues from the latest audit.',
    requiredTier: 'free',
    exportTier: 'pro'
  },
  {
    id: 'health-trend',
    name: 'Overall Health Trend',
    description: 'Track your overall SEO health score over time.',
    requiredTier: 'pro', // Example: Make this Pro+ feature
    exportTier: 'pro'
  },
  {
    id: 'gsc-performance',
    name: 'GSC Performance Overview',
    description: 'View clicks, impressions, CTR, and position from Google Search Console.',
    requiredTier: 'free', // Requires GSC connection setup
    exportTier: 'pro'
  },
  {
    id: 'competitor-snapshot',
    name: 'Basic Competitor Snapshot',
    description: 'View key metrics for configured competitors based on latest analysis.',
    requiredTier: 'pro', // Example: Make this Pro+
    exportTier: 'pro'
  },
  // Add more templates here in later phases
];

async function checkUserTier(supabase: SupabaseClient<Database>): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'free'; // Default to free if no user

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

    if (error || !profile) {
        console.error("Error fetching user profile for tier check:", error);
        return 'free'; // Default to free on error
    }
    return String(profile.subscription_tier ?? 'free');
}

function hasRequiredTier(userTier: string, requiredTier: string): boolean {
    const tiers: { [key: string]: number } = { free: 0, pro: 1, enterprise: 2 };
    return (tiers[userTier.toLowerCase()] ?? 0) >= (tiers[requiredTier.toLowerCase()] ?? 0);
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const userTier = await checkUserTier(supabase);

  // Filter templates based on user tier for viewing
  const availableTemplates = reportTemplates.filter(template =>
    hasRequiredTier(userTier, template.requiredTier)
  );

  return NextResponse.json(availableTemplates);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { projectId, templateId, format = 'json', startDate, endDate } = body;

  // Basic validation for dates if needed for GSC
  if (templateId === 'gsc-performance' && (!startDate || !endDate)) {
      return NextResponse.json({ error: 'startDate and endDate are required for GSC Performance report' }, { status: 400 });
  }
  
  // Fallback dates for GSC if not provided (e.g., last 30 days)
  const defaultEndDate = new Date().toISOString().split('T')[0]; // Today
  const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ago
  
  const finalStartDate = startDate || defaultStartDate;
  const finalEndDate = endDate || defaultEndDate;

  if (!projectId || !templateId) {
    return NextResponse.json({ error: 'projectId and templateId are required' }, { status: 400 });
  }

  const template = reportTemplates.find(t => t.id === templateId);
  if (!template) {
    return NextResponse.json({ error: 'Invalid templateId' }, { status: 400 });
  }

  const userTier = await checkUserTier(supabase);

  // Check if user has permission to view this report template
  if (!hasRequiredTier(userTier, template.requiredTier)) {
      return NextResponse.json({ error: 'Your current plan does not allow access to this report.' }, { status: 403 });
  }

  // Check if user has permission for the requested format (export)
  if (format === 'csv' && !hasRequiredTier(userTier, template.exportTier)) {
      return NextResponse.json({ error: 'CSV export requires a Pro or Enterprise plan.' }, { status: 403 });
  }

  let reportData: any = null;
  let error = null;

  try {
    if (templateId === 'technical-summary') {
      reportData = await getTechnicalIssuesSummary(projectId, supabase);
    } else if (templateId === 'onpage-summary') {
      reportData = await getOnPageSeoSummary(projectId, supabase);
    } else if (templateId === 'health-trend') {
      reportData = await getOverallHealthTrend(projectId, supabase, startDate, endDate);
    } else if (templateId === 'gsc-performance') {
      reportData = await getGSCPerformanceData(projectId, supabase, finalStartDate, finalEndDate);
    } else if (templateId === 'competitor-snapshot') {
      reportData = await getBasicCompetitorReport(projectId, supabase);
    } else {
      return NextResponse.json({ error: 'Report generation not implemented for this template yet.' }, { status: 501 });
    }

    // Check if GSC or Competitor report specifically returned an error message within the data object
    if ((templateId === 'gsc-performance' || templateId === 'competitor-snapshot') && reportData?.error) {
        error = reportData.error;
        reportData = null; // Don't proceed with error data
    } else if (!reportData) {
        error = 'Failed to generate report data or no data found.';
    }

  } catch (err) {
    console.error(`Error generating report ${templateId} for project ${projectId}:`, err);
    error = 'An error occurred while generating the report.';
    reportData = null; 
  }

  if (error) {
      return NextResponse.json({ error: error }, { status: 500 });
  }

  // Handle response format
  if (format === 'csv') {
    let csvString = '';
    let filename = `${templateId}_${projectId}`; // Default filename
    
    if (templateId === 'technical-summary' && reportData) {
      csvString = generateTechnicalIssuesCsv(reportData);
    } else if (templateId === 'onpage-summary' && reportData) {
      csvString = generateOnPageSeoCsv(reportData);
    } else if (templateId === 'health-trend' && reportData) {
      csvString = generateHealthTrendCsv(reportData);
      filename = `${templateId}_${projectId}_${startDate || 'start'}_to_${endDate || 'end'}.csv`;
    } else if (templateId === 'gsc-performance' && reportData) {
      csvString = generateGscPerformanceCsv(reportData);
      filename = `${templateId}_${projectId}_${startDate || 'start'}_to_${endDate || 'end'}.csv`;
    } else if (templateId === 'competitor-snapshot' && reportData) {
      csvString = generateCompetitorSnapshotCsv(reportData);
      filename = `${templateId}_${projectId}_${reportData.reportDate?.split('T')[0] || 'snapshot'}.csv`;
    } else {
        if (!reportData) return NextResponse.json({ error: 'Failed to generate data for CSV export.' }, { status: 500 });
        return NextResponse.json({ error: 'CSV export not implemented for this template.' }, { status: 501 });
    }

    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`); // Use dynamic filename

    return new Response(csvString, { headers });

  } else {
    // Default to JSON format
    return NextResponse.json(reportData);
  }
} 