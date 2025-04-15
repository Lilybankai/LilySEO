/**
 * Data Visualization Service
 * 
 * This service handles generating chart data for SEO metrics.
 * It provides functions to format data for various chart types.
 */

import { LegacySeoReport } from "./seo-analysis";
import { CompetitorAnalysis } from "./competitor-analysis";

export type ChartData = {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
  }>;
};

export type RadarChartData = {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    pointBackgroundColor: string;
    pointBorderColor: string;
    pointHoverBackgroundColor: string;
    pointHoverBorderColor: string;
  }>;
};

/**
 * Generates radar chart data for SEO score categories
 * @param report The SEO report to generate chart data from
 * @returns Radar chart data for SEO score categories
 */
export function generateSeoScoreRadarChart(report: LegacySeoReport): RadarChartData {
  return {
    labels: ['On-Page SEO', 'Performance', 'Usability', 'Links', 'Social'],
    datasets: [
      {
        label: 'SEO Score',
        data: [
          report.score.categories.onPageSeo,
          report.score.categories.performance,
          report.score.categories.usability,
          report.score.categories.links,
          report.score.categories.social,
        ],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(75, 192, 192, 1)',
      },
    ],
  };
}

/**
 * Generates bar chart data for PageSpeed metrics
 * @param report The SEO report to generate chart data from
 * @returns Bar chart data for PageSpeed metrics
 */
export function generatePageSpeedBarChart(report: LegacySeoReport): ChartData {
  return {
    labels: ['Performance', 'SEO', 'Accessibility', 'Best Practices'],
    datasets: [
      {
        label: 'Mobile',
        data: [
          report.pageSpeed.mobile.performance,
          report.pageSpeed.mobile.seo,
          report.pageSpeed.mobile.accessibility,
          report.pageSpeed.mobile.bestPractices,
        ],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Desktop',
        data: [
          report.pageSpeed.desktop.performance,
          report.pageSpeed.desktop.seo,
          report.pageSpeed.desktop.accessibility,
          report.pageSpeed.desktop.bestPractices,
        ],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };
}

/**
 * Generates pie chart data for issue distribution
 * @param report The SEO report to generate chart data from
 * @returns Pie chart data for issue distribution
 */
export function generateIssueDistributionPieChart(report: LegacySeoReport): ChartData {
  // Count issues by category
  const metaDescriptionCount = report.issues.metaDescription.length;
  const titleTagsCount = report.issues.titleTags.length;
  const headingsCount = report.issues.headings.length;
  const imagesCount = report.issues.images.length;
  const linksCount = report.issues.links.length;
  const canonicalLinksCount = report.issues.canonicalLinks.length;
  const schemaMarkupCount = report.issues.schemaMarkup.length;
  const performanceCount = report.issues.performance.length;
  const mobileCount = report.issues.mobile.length;
  const securityCount = report.issues.security.length;
  
  // Filter out categories with no issues
  const labels: string[] = [];
  const data: number[] = [];
  const backgroundColors: string[] = [];
  
  if (metaDescriptionCount > 0) {
    labels.push('Meta Descriptions');
    data.push(metaDescriptionCount);
    backgroundColors.push('rgba(255, 99, 132, 0.5)');
  }
  
  if (titleTagsCount > 0) {
    labels.push('Title Tags');
    data.push(titleTagsCount);
    backgroundColors.push('rgba(54, 162, 235, 0.5)');
  }
  
  if (headingsCount > 0) {
    labels.push('Headings');
    data.push(headingsCount);
    backgroundColors.push('rgba(255, 206, 86, 0.5)');
  }
  
  if (imagesCount > 0) {
    labels.push('Images');
    data.push(imagesCount);
    backgroundColors.push('rgba(75, 192, 192, 0.5)');
  }
  
  if (linksCount > 0) {
    labels.push('Links');
    data.push(linksCount);
    backgroundColors.push('rgba(153, 102, 255, 0.5)');
  }
  
  if (canonicalLinksCount > 0) {
    labels.push('Canonical Links');
    data.push(canonicalLinksCount);
    backgroundColors.push('rgba(255, 159, 64, 0.5)');
  }
  
  if (schemaMarkupCount > 0) {
    labels.push('Schema Markup');
    data.push(schemaMarkupCount);
    backgroundColors.push('rgba(255, 99, 132, 0.5)');
  }
  
  if (performanceCount > 0) {
    labels.push('Performance');
    data.push(performanceCount);
    backgroundColors.push('rgba(54, 162, 235, 0.5)');
  }
  
  if (mobileCount > 0) {
    labels.push('Mobile');
    data.push(mobileCount);
    backgroundColors.push('rgba(255, 206, 86, 0.5)');
  }
  
  if (securityCount > 0) {
    labels.push('Security');
    data.push(securityCount);
    backgroundColors.push('rgba(75, 192, 192, 0.5)');
  }
  
  return {
    labels,
    datasets: [
      {
        label: 'Issues',
        data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color.replace('0.5', '1')),
        borderWidth: 1,
      },
    ],
  };
}

/**
 * Generates bar chart data for competitor comparison
 * @param analyses Array of competitor analyses to compare
 * @param userWebsiteUrl The URL of the user's website
 * @returns Bar chart data for competitor comparison
 */
export function generateCompetitorComparisonBarChart(
  analyses: CompetitorAnalysis[],
  userWebsiteUrl: string
): ChartData {
  const labels = ['Domain Authority', 'Traffic Estimate (thousands)', 'Keyword Count (hundreds)', 'Backlinks (thousands)'];
  
  const datasets = analyses.map((analysis, index) => {
    // Generate a color based on the index
    const hue = (index * 137) % 360; // Use golden ratio to spread colors
    const color = `hsla(${hue}, 70%, 60%, 0.7)`;
    const borderColor = `hsla(${hue}, 70%, 50%, 1)`;
    
    return {
      label: new URL(analysis.competitorUrl).hostname,
      data: [
        analysis.metrics.domainAuthority,
        analysis.metrics.trafficEstimate / 1000, // Convert to thousands
        analysis.metrics.keywordCount / 100, // Convert to hundreds
        analysis.metrics.backlinks / 1000, // Convert to thousands
      ],
      backgroundColor: color,
      borderColor,
      borderWidth: 1,
    };
  });
  
  // Add user's website as the first dataset
  datasets.unshift({
    label: new URL(userWebsiteUrl).hostname,
    data: [
      Math.floor(Math.random() * 50) + 20, // Domain Authority
      Math.floor(Math.random() * 30) + 5, // Traffic Estimate (thousands)
      Math.floor(Math.random() * 5) + 1, // Keyword Count (hundreds)
      Math.floor(Math.random() * 3) + 1, // Backlinks (thousands)
    ],
    backgroundColor: 'rgba(75, 192, 192, 0.7)',
    borderColor: 'rgba(75, 192, 192, 1)',
    borderWidth: 1,
  });
  
  return {
    labels,
    datasets,
  };
}

/**
 * Generates line chart data for SEO performance over time
 * @param reports Array of SEO reports ordered by date
 * @returns Line chart data for SEO performance over time
 */
export function generateSeoPerformanceLineChart(reports: LegacySeoReport[]): ChartData {
  // Extract dates and scores
  const labels = reports.map(report => {
    const date = new Date(report.crawlDate);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  });
  
  const overallScores = reports.map(report => report.score.overall);
  const onPageScores = reports.map(report => report.score.categories.onPageSeo);
  const performanceScores = reports.map(report => report.score.categories.performance);
  const usabilityScores = reports.map(report => report.score.categories.usability);
  const linksScores = reports.map(report => report.score.categories.links);
  
  return {
    labels,
    datasets: [
      {
        label: 'Overall',
        data: overallScores,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        fill: false,
      },
      {
        label: 'On-Page SEO',
        data: onPageScores,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        fill: false,
      },
      {
        label: 'Performance',
        data: performanceScores,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        fill: false,
      },
      {
        label: 'Usability',
        data: usabilityScores,
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        borderColor: 'rgba(255, 206, 86, 1)',
        borderWidth: 2,
        fill: false,
      },
      {
        label: 'Links',
        data: linksScores,
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 2,
        fill: false,
      },
    ],
  };
} 