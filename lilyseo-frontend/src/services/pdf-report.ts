/**
 * PDF Report Service
 * 
 * This service handles generating PDF reports for SEO audits.
 * It provides functions to create and download PDF reports.
 */

import jsPDF from 'jspdf';
import { LegacySeoReport } from "./seo-analysis";
import { CompetitorAnalysis } from "./competitor-analysis";
import { Database } from "@/lib/supabase/database.types";

type WhiteLabelSettings = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  logo_url: string | null;
  logo_alt: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  company_name: string;
  custom_domain: string | null;
  custom_css: string | null;
  custom_js: string | null;
  custom_copyright: string | null;
  social_links: Record<string, string> | null;
  navigation: Record<string, string> | null;
  footer_navigation: Record<string, string> | null;
  is_active: boolean;
};

interface PdfTemplate {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  companyName: string;
  contactInfo: string;
  footerText: string;
}

const defaultTemplate: PdfTemplate = {
  primaryColor: '#0066cc',
  secondaryColor: '#4d4d4d',
  fontFamily: 'helvetica',
  companyName: 'LilySEO',
  contactInfo: 'contact@lilyseo.com',
  footerText: '© LilySEO - Professional SEO Analysis'
};

/**
 * Converts white label settings to a PDF template
 */
function whiteLabelSettingsToPdfTemplate(settings: WhiteLabelSettings): PdfTemplate {
  return {
    logo: settings.logo_url || undefined,
    primaryColor: settings.primary_color || defaultTemplate.primaryColor,
    secondaryColor: settings.secondary_color || defaultTemplate.secondaryColor,
    fontFamily: 'helvetica', // We'll stick with helvetica for PDF compatibility
    companyName: settings.company_name,
    contactInfo: settings.custom_domain || defaultTemplate.contactInfo,
    footerText: settings.custom_copyright || defaultTemplate.footerText
  };
}

/**
 * Generates a PDF report for an SEO audit with white-label support
 */
export async function generateSeoReportPdf(
  report: LegacySeoReport,
  projectName: string,
  whiteLabelSettings?: WhiteLabelSettings
): Promise<Blob> {
  const template = whiteLabelSettings 
    ? whiteLabelSettingsToPdfTemplate(whiteLabelSettings)
    : defaultTemplate;

  const doc = new jsPDF();
  
  // Set font
  doc.setFont(template.fontFamily);
  
  // Add header
  if (template.logo) {
    doc.addImage(template.logo, 'PNG', 10, 10, 50, 20);
  }
  
  doc.setFontSize(24);
  doc.setTextColor(template.primaryColor);
  doc.text(template.companyName, 70, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(template.secondaryColor);
  doc.text(template.contactInfo, 70, 30);
  
  // Add report title
  doc.setFontSize(20);
  doc.setTextColor(template.primaryColor);
  doc.text('SEO Audit Report', 14, 50);
  
  // Add project info
  doc.setFontSize(14);
  doc.setTextColor(template.secondaryColor);
  doc.text(`Project: ${projectName}`, 14, 60);
  doc.text(`URL: ${report.url}`, 14, 70);
  doc.text(`Date: ${new Date(report.crawlDate).toLocaleDateString()}`, 14, 80);
  
  // Add overall score
  doc.setFontSize(16);
  doc.setTextColor(template.primaryColor);
  doc.text('Overall Score', 14, 100);
  
  // Add score circle
  const score = report.score.overall;
  doc.setDrawColor(template.primaryColor);
  doc.setFillColor(template.primaryColor);
  doc.circle(40, 120, 15, 'FD');
  
  doc.setTextColor('#ffffff');
  doc.setFontSize(14);
  doc.text(score.toString(), 35, 125);
  
  // Add category scores
  doc.setTextColor(template.secondaryColor);
  doc.setFontSize(14);
  let y = 150;
  
  Object.entries(report.score.categories).forEach(([category, score]) => {
    doc.text(`${category}: ${score}/100`, 14, y);
    y += 10;
  });
  
  // Add issues summary
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(template.primaryColor);
  doc.text('Issues Found', 14, 20);
  
  y = 40;
  Object.entries(report.issues).forEach(([category, issues]) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.setTextColor(template.secondaryColor);
    doc.text(`${category}: ${issues.length} issues`, 14, y);
    y += 10;
    
    issues.forEach(issue => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(10);
      doc.text(`• ${issue.title}`, 20, y);
      y += 5;
      doc.text(`  Severity: ${issue.severity}`, 20, y);
      y += 5;
      doc.text(`  URL: ${issue.url}`, 20, y);
      y += 10;
    });
  });
  
  // Add PageSpeed metrics
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(template.primaryColor);
  doc.text('PageSpeed Metrics', 14, 20);
  
  y = 40;
  doc.setFontSize(14);
  doc.setTextColor(template.secondaryColor);
  doc.text('Mobile', 14, y);
  y += 10;
  
  Object.entries(report.pageSpeed.mobile).forEach(([metric, value]) => {
    doc.setFontSize(10);
    doc.text(`${metric}: ${value}`, 20, y);
    y += 8;
  });
  
  y += 10;
  doc.setFontSize(14);
  doc.text('Desktop', 14, y);
  y += 10;
  
  Object.entries(report.pageSpeed.desktop).forEach(([metric, value]) => {
    doc.setFontSize(10);
    doc.text(`${metric}: ${value}`, 20, y);
    y += 8;
  });
  
  // Add keywords
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(template.primaryColor);
  doc.text('Keywords', 14, 20);
  
  y = 40;
  doc.setFontSize(14);
  doc.setTextColor(template.secondaryColor);
  doc.text('Found Keywords', 14, y);
  y += 10;
  
  doc.setFontSize(10);
  const foundKeywords = report.keywords.found.join(', ');
  const foundKeywordsLines = doc.splitTextToSize(foundKeywords, 180);
  doc.text(foundKeywordsLines, 20, y);
  y += foundKeywordsLines.length * 8 + 10;
  
  doc.setFontSize(14);
  doc.text('Suggested Keywords', 14, y);
  y += 10;
  
  doc.setFontSize(10);
  const suggestedKeywords = report.keywords.suggested.join(', ');
  const suggestedKeywordsLines = doc.splitTextToSize(suggestedKeywords, 180);
  doc.text(suggestedKeywordsLines, 20, y);
  
  // Add footer to all pages
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFontSize(10);
  doc.setTextColor(template.secondaryColor);
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(template.footerText, 14, doc.internal.pageSize.height - 10);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
  }
  
  return doc.output('blob');
}

/**
 * Generates a PDF report for a competitor analysis
 * @param analysis The competitor analysis to generate a PDF for
 * @param projectName The name of the project
 * @returns A promise that resolves to a Blob containing the PDF
 */
export async function generateCompetitorReportPdf(
  analysis: CompetitorAnalysis,
  projectName: string
): Promise<Blob> {
  // In a real implementation, this would use a PDF generation library like jsPDF
  // For now, we'll simulate the PDF generation
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Create a mock PDF blob
  // In a real implementation, this would be the actual PDF content
  const pdfContent = `
    LilySEO Competitor Analysis Report
    Project: ${projectName}
    Competitor: ${analysis.competitorUrl}
    Date: ${new Date(analysis.analysisDate).toLocaleDateString()}
    
    Metrics:
    - Domain: ${analysis.metrics.domain}
    - Traffic Estimate: ${analysis.metrics.trafficEstimate.toLocaleString()}
    - Keyword Count: ${analysis.metrics.keywordCount.toLocaleString()}
    - Backlinks: ${analysis.metrics.backlinks.toLocaleString()}
    - Domain Authority: ${analysis.metrics.domainAuthority}
    - Backlinks Overlap: ${analysis.metrics.backlinksOverlap}
    
    Social Metrics:
    - Facebook: ${analysis.metrics.socialMetrics.facebook.toLocaleString()}
    - Twitter: ${analysis.metrics.socialMetrics.twitter.toLocaleString()}
    - LinkedIn: ${analysis.metrics.socialMetrics.linkedin.toLocaleString()}
    - Pinterest: ${analysis.metrics.socialMetrics.pinterest.toLocaleString()}
    
    Top Keywords:
    ${analysis.metrics.topKeywords.map(keyword => `
      - ${keyword.keyword}
      - Position: ${keyword.position}
      - Volume: ${keyword.volume.toLocaleString()}
      - Difficulty: ${keyword.difficulty}
    `).join('\n')}
    
    Content Gaps:
    ${analysis.metrics.contentGaps.map(gap => `
      - ${gap.keyword}
      - Competitor Position: ${gap.competitorPosition}
      - Volume: ${gap.volume.toLocaleString()}
      - Difficulty: ${gap.difficulty}
    `).join('\n')}
    
    Strengths:
    ${analysis.strengthsWeaknesses.strengths.map(strength => `- ${strength}`).join('\n')}
    
    Weaknesses:
    ${analysis.strengthsWeaknesses.weaknesses.map(weakness => `- ${weakness}`).join('\n')}
    
    Opportunities:
    ${analysis.strengthsWeaknesses.opportunities.map(opportunity => `- ${opportunity}`).join('\n')}
  `;
  
  // Convert the content to a Blob
  const blob = new Blob([pdfContent], { type: 'application/pdf' });
  
  return blob;
}

/**
 * Downloads a PDF report
 * @param blob The PDF blob to download
 * @param filename The filename for the downloaded PDF
 */
export function downloadPdf(blob: Blob, filename: string): void {
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a link element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Append the link to the document
  document.body.appendChild(link);
  
  // Click the link to trigger the download
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
} 