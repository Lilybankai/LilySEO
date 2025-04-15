import { TechnicalIssuesSummary, OnPageSeoSummary, OverallHealthTrendReport, HealthTrendDataPoint } from './basicReports';
import { GSCPerformanceReport, GSCPerformanceDataPoint } from './gscReports';
import { BasicCompetitorReport, CompetitorSnapshot } from './competitorReports';

/**
 * Converts TechnicalIssuesSummary data into a CSV string.
 * @param data The technical issues summary data.
 * @returns A CSV formatted string.
 */
export function generateTechnicalIssuesCsv(data: TechnicalIssuesSummary): string {
  // Define headers
  const headers = [
    'Project ID',
    'Audit ID',
    'Audit Date',
    '4xx Error Pages',
    '5xx Error Pages',
    'Slow Pages',
    'Redirect Issues',
    // Add headers for sample URLs if included
  ];

  // Define row data
  const rows = [
    [
      data.projectId,
      data.auditId,
      data.auditDate,
      data.errorPages4xx,
      data.errorPages5xx,
      data.slowPages,
      data.redirectIssues,
    ].map(value => `"${String(value ?? '').replace(/"/g, '""')}"`), // Escape quotes and handle null/undefined
  ];

  // Combine headers and rows
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\r\n'); // Use CRLF for line endings
}

/**
 * Converts OnPageSeoSummary data into a CSV string.
 * @param data The on-page SEO summary data.
 * @returns A CSV formatted string.
 */
export function generateOnPageSeoCsv(data: OnPageSeoSummary): string {
  const headers = [
    'Project ID',
    'Audit ID',
    'Audit Date',
    'Pages Missing Titles',
    'Pages Missing Descriptions',
    'Pages Duplicate Titles',
    'Pages Duplicate Descriptions',
    'Avg Readability Score', // Optional
    // Add headers for sample URLs if included
  ];

  const rows = [
    [
      data.projectId,
      data.auditId,
      data.auditDate,
      data.pagesWithMissingTitles,
      data.pagesWithMissingDescriptions,
      data.pagesWithDuplicateTitles,
      data.pagesWithDuplicateDescriptions,
      data.averageReadabilityScore ?? 'N/A',
    ].map(value => `"${String(value ?? '').replace(/"/g, '""')}"`),
  ];

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\r\n');
}

/**
 * Converts OverallHealthTrendReport data into a CSV string.
 * @param data The health trend report data.
 * @returns A CSV formatted string.
 */
export function generateHealthTrendCsv(data: OverallHealthTrendReport): string {
  const headers = [
    'Audit Date',
    'Overall Score',
    // Add other headers if included in HealthTrendDataPoint
  ];

  // Handle case with no data
  if (!data.trendData || data.trendData.length === 0) {
    return headers.join(',') + '\r\n' + '"No data available for the selected period.",""'
  }

  const rows = data.trendData.map((point: HealthTrendDataPoint) => {
    return [
      point.auditDate,
      point.overallScore,
      // Add other data points here
    ].map(value => `"${String(value ?? '').replace(/"/g, '""')}"`);
  });

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\r\n');
}

/**
 * Converts GSCPerformanceReport data into a CSV string.
 * @param data The GSC performance report data.
 * @returns A CSV formatted string.
 */
export function generateGscPerformanceCsv(data: GSCPerformanceReport): string {
  const headers = [
    'Date',
    'Clicks',
    'Impressions',
    'CTR',
    'Average Position',
  ];

  // Handle case with no data or error
  if (data.error || !data.performanceData || data.performanceData.length === 0) {
     const errorMsg = data.error || 'No data available for the selected period.';
     // Ensure the number of empty columns matches the header count
     return headers.join(',') + '\r\n' + `"${errorMsg.replace(/"/g, '""')}"` + ','.repeat(headers.length - 1);
  }

  const rows = data.performanceData.map((point: GSCPerformanceDataPoint) => {
    return [
      point.date,
      point.clicks,
      point.impressions,
      (point.ctr * 100).toFixed(2) + '%', // Format CTR as percentage
      point.position.toFixed(2), // Format position
    ].map(value => `"${String(value ?? '').replace(/"/g, '""')}"`);
  });

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\r\n');
}

/**
 * Converts BasicCompetitorReport data into a CSV string.
 * @param data The basic competitor report data.
 * @returns A CSV formatted string.
 */
export function generateCompetitorSnapshotCsv(data: BasicCompetitorReport): string {
  const headers = [
    'Competitor Name',
    'URL',
    'Last Analysis Date',
    'Domain Authority', // Example metric
    'Linking Domains', // Example metric
    'Keywords Tracked', // Example metric
    'Estimated Traffic', // Example metric
    // Add other headers based on CompetitorSnapshot structure
  ];

  // Handle case with no data or error
  if (data.error || !data.competitors || data.competitors.length === 0) {
     const errorMsg = data.error || 'No competitor data available.';
     return headers.join(',') + '\r\n' + `"${errorMsg.replace(/"/g, '""')}"` + ','.repeat(headers.length - 1);
  }

  const rows = data.competitors.map((comp: CompetitorSnapshot) => {
    return [
      comp.name,
      comp.url,
      comp.lastAnalysisDate || 'N/A',
      comp.domainAuthority ?? 'N/A', // Use nullish coalescing for optional metrics
      comp.linkingDomains ?? 'N/A',
      comp.keywordsTracked ?? 'N/A',
      comp.estimatedTraffic ?? 'N/A',
      // Add other data points here
    ].map(value => `"${String(value ?? '').replace(/"/g, '""')}"`);
  });

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\r\n');
} 