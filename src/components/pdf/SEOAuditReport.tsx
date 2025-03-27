"use client";

import React from 'react';
import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer';
import { usePdfTheme } from '@/context/ThemeContext';
import CoverPage from './CoverPage';
import ExecutiveSummary from './ExecutiveSummary';
import IssueSection from './IssueSection';
import PerformanceMetrics from './PerformanceMetrics';
import EndPage from './EndPage';

// Register custom fonts - using Google Fonts hosted versions
Font.register({
  family: 'Poppins',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff', fontWeight: 'normal' }, // Regular
    { src: 'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLCz7Z1xlEw.woff', fontWeight: 'bold' }, // Bold
    { src: 'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLEj6Z1xlEw.woff', fontWeight: 'light' }, // Light
  ],
});

Font.register({
  family: 'Montserrat',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCs16Hw_aXc.woff', fontWeight: 'normal' }, // Regular
    { src: 'https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM73w_aXc.woff', fontWeight: 'bold' }, // Bold
    { src: 'https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCu173w_aXc.woff', fontWeight: 'light' }, // Light
  ],
});

// Register a fallback sans-serif font to ensure PDF generation works
Font.register({
  family: 'sans-serif',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/opensans/v35/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVc.woff', fontWeight: 'normal' }, // Open Sans as backup
  ],
});

interface SEOAuditReportProps {
  auditData: any;
  clientInfo?: {
    name?: string;
    logo?: string;
    email?: string;
    phone?: string;
    website?: string;
  };
  includeRecommendations?: boolean;
  customNotes?: string;
  templateId?: string;
}

const SEOAuditReport: React.FC<SEOAuditReportProps> = ({
  auditData,
  clientInfo,
  includeRecommendations = true,
  customNotes,
  templateId,
}) => {
  const { theme } = usePdfTheme();
  
  // Extract data from the audit
  const reportData = auditData.report || {};
  const projectName = auditData.projects?.name || "Website";
  const auditDate = new Date(auditData.created_at).toLocaleDateString();
  const auditScore = auditData.score || 0;
  const url = auditData.url || "";
  
  // Extract issues from the report
  const metaDescriptionIssues = reportData?.issues?.metaDescription || [];
  const titleTagIssues = reportData?.issues?.titleTags || [];
  const headingIssues = reportData?.issues?.headings || [];
  const imageIssues = reportData?.issues?.images || [];
  const linkIssues = reportData?.issues?.links || [];
  const performanceIssues = reportData?.issues?.performance || [];
  const mobileIssues = reportData?.issues?.mobile || [];
  const securityIssues = reportData?.issues?.security || [];
  
  // Get category scores
  const categoryScores = reportData?.score?.categories || {
    onPageSeo: 0,
    performance: 0,
    usability: 0,
    links: 0,
    social: 0
  };
  
  // PageSpeed metrics
  const pageSpeed = reportData?.pageSpeed || {
    mobile: { performance: 0, cls: 0, fcp: 0, lcp: 0, tbt: 0 },
    desktop: { performance: 0, cls: 0, fcp: 0, lcp: 0, tbt: 0 }
  };
  
  // MOZ data
  const mozData = reportData?.mozData || {
    domainAuthority: 0,
    pageAuthority: 0,
    linkingDomains: 0,
    totalLinks: 0
  };
  
  // Backlinks and Keywords count
  const backlinksCount = mozData.linkingDomains;
  const keywordsCount = (reportData?.keywords?.found || []).length + (reportData?.keywords?.suggested || []).length;
  
  // Calculate total issues
  const totalIssues = 
    metaDescriptionIssues.length + 
    titleTagIssues.length + 
    headingIssues.length + 
    imageIssues.length + 
    linkIssues.length + 
    performanceIssues.length + 
    mobileIssues.length + 
    securityIssues.length;
  
  // Calculate issue counts by severity across all categories
  const calculateIssueSeverity = (issues: any[]) => {
    return {
      high: issues.filter(issue => issue.severity === 'high' || issue.priority === 'high' || issue.priority === 'critical').length,
      medium: issues.filter(issue => issue.severity === 'medium' || issue.priority === 'medium').length,
      low: issues.filter(issue => issue.severity === 'low' || issue.priority === 'low' || issue.severity === 'info').length,
    };
  };
  
  const metaIssuesBySeverity = calculateIssueSeverity(metaDescriptionIssues);
  const titleIssuesBySeverity = calculateIssueSeverity(titleTagIssues);
  const headingIssuesBySeverity = calculateIssueSeverity(headingIssues);
  const imageIssuesBySeverity = calculateIssueSeverity(imageIssues);
  const linkIssuesBySeverity = calculateIssueSeverity(linkIssues);
  const performanceIssuesBySeverity = calculateIssueSeverity(performanceIssues);
  const mobileIssuesBySeverity = calculateIssueSeverity(mobileIssues);
  const securityIssuesBySeverity = calculateIssueSeverity(securityIssues);
  
  const issuesSummary = {
    high: metaIssuesBySeverity.high + 
          titleIssuesBySeverity.high + 
          headingIssuesBySeverity.high + 
          imageIssuesBySeverity.high +
          linkIssuesBySeverity.high +
          performanceIssuesBySeverity.high +
          mobileIssuesBySeverity.high +
          securityIssuesBySeverity.high,
    medium: metaIssuesBySeverity.medium + 
            titleIssuesBySeverity.medium + 
            headingIssuesBySeverity.medium + 
            imageIssuesBySeverity.medium +
            linkIssuesBySeverity.medium +
            performanceIssuesBySeverity.medium +
            mobileIssuesBySeverity.medium +
            securityIssuesBySeverity.medium,
    low: metaIssuesBySeverity.low + 
         titleIssuesBySeverity.low + 
         headingIssuesBySeverity.low + 
         imageIssuesBySeverity.low +
         linkIssuesBySeverity.low +
         performanceIssuesBySeverity.low +
         mobileIssuesBySeverity.low +
         securityIssuesBySeverity.low,
    total: totalIssues
  };
  
  // Generate recommendations based on high-priority issues
  const generateRecommendations = () => {
    if (!includeRecommendations || !theme.includeOptions.recommendations) return [];
    
    const recommendations: string[] = [];
    
    if (metaIssuesBySeverity.high > 0) {
      recommendations.push("Fix critical meta description issues to improve search engine visibility");
    }
    
    if (titleIssuesBySeverity.high > 0) {
      recommendations.push("Optimize title tags for better search engine rankings");
    }
    
    if (headingIssuesBySeverity.high > 0) {
      recommendations.push("Improve heading structure for better content organization and SEO");
    }
    
    if (imageIssuesBySeverity.high > 0) {
      recommendations.push("Add alt tags to images to improve accessibility and SEO");
    }
    
    if (linkIssuesBySeverity.high > 0) {
      recommendations.push("Fix broken links and improve internal linking structure");
    }
    
    if (performanceIssuesBySeverity.high > 0) {
      recommendations.push("Optimize website performance for better user experience and SEO rankings");
    }
    
    if (pageSpeed.mobile.performance < 0.5) {
      recommendations.push("Improve mobile page speed for better user experience and SEO rankings");
    }
    
    if (mozData.domainAuthority < 30) {
      recommendations.push("Work on building more high-quality backlinks to improve domain authority");
    }
    
    // If no specific recommendations, add some general ones
    if (recommendations.length === 0) {
      recommendations.push("Continue monitoring your website's SEO performance");
      recommendations.push("Regularly update your content to keep it fresh and relevant");
      recommendations.push("Focus on building high-quality backlinks from authoritative websites");
    }
    
    return recommendations;
  };
  
  const styles = StyleSheet.create({
    page: {
      padding: 40,
      backgroundColor: theme.colorMode === 'Grayscale' ? '#ffffff' : '#ffffff',
      fontFamily: theme.fontFamily,
    },
    section: {
      margin: 10,
      padding: 10,
    },
    footer: {
      position: 'absolute',
      bottom: 30,
      left: 40,
      right: 40,
      textAlign: 'center',
      fontSize: 10,
      color: theme.secondaryColor,
    },
    pageNumber: {
      position: 'absolute',
      bottom: 30,
      right: 40,
      fontSize: 10,
      color: theme.secondaryColor,
    },
  });

  // Calculate what page numbers should be shown based on which sections are included
  let pageCounter = 1;
  const coverPage = true; // Always included
  pageCounter++; // Start counting after cover page

  // Page numbers for main section
  const executiveSummaryPage = theme.includeOptions.executiveSummary ? pageCounter++ : null;
  const performanceMetricsPage = theme.includeOptions.performance ? pageCounter++ : null;
  const onPageSEOPage = theme.includeOptions.onPageSEO ? pageCounter++ : null;
  const technicalSEOPage = theme.includeOptions.technicalSEO ? pageCounter++ : null;
  const structuredDataPage = theme.includeOptions.structuredData ? pageCounter++ : null;
  const internalLinksPage = theme.includeOptions.internalLinks ? pageCounter++ : null;
  const userExperiencePage = theme.includeOptions.userExperience ? pageCounter++ : null;
  const endPage = true; // Always include
  
  return (
    <Document title={`${projectName} - SEO Audit Report`} creator="LilySEO">
      {/* Cover Page - Always included */}
      <CoverPage 
        reportTitle="SEO Audit Report"
        projectName={projectName}
        reportDate={auditDate}
        url={url}
        clientName={clientInfo?.name}
        clientLogo={clientInfo?.logo}
      />
      
      {/* Executive Summary */}
      {theme.includeOptions.executiveSummary && (
        <ExecutiveSummary 
          overallScore={auditScore}
          categoryScores={categoryScores}
          issuesSummary={issuesSummary}
          pageSpeedScores={{
            mobile: pageSpeed.mobile.performance * 100,
            desktop: pageSpeed.desktop.performance * 100
          }}
          backlinksCount={backlinksCount}
          keywordsCount={keywordsCount}
        />
      )}
      
      {/* Performance Metrics Page */}
      {theme.includeOptions.performance && (
        <Page size={theme.pageSize} style={styles.page}>
          <PerformanceMetrics 
            mobile={pageSpeed.mobile}
            desktop={pageSpeed.desktop}
          />
          
          <View style={styles.footer}>
            <Text>{theme.footerText}</Text>
          </View>
          {performanceMetricsPage && (
            <Text style={styles.pageNumber}>{performanceMetricsPage}</Text>
          )}
        </Page>
      )}
      
      {/* On-Page SEO Issues */}
      {theme.includeOptions.onPageSEO && (
        <Page size={theme.pageSize} style={styles.page}>
          <IssueSection 
            title="Meta Description Issues"
            issues={metaDescriptionIssues}
          />
          
          <IssueSection 
            title="Title Tag Issues"
            issues={titleTagIssues}
          />
          
          <IssueSection 
            title="Heading Issues"
            issues={headingIssues}
          />
          
          <View style={styles.footer}>
            <Text>{theme.footerText}</Text>
          </View>
          {onPageSEOPage && (
            <Text style={styles.pageNumber}>{onPageSEOPage}</Text>
          )}
        </Page>
      )}
      
      {/* Technical SEO Issues */}
      {theme.includeOptions.technicalSEO && (
        <Page size={theme.pageSize} style={styles.page}>
          <IssueSection 
            title="Image Issues"
            issues={imageIssues}
          />
          
          <IssueSection 
            title="Link Issues"
            issues={linkIssues}
          />
          
          <IssueSection 
            title="Performance Issues"
            issues={performanceIssues}
          />
          
          <View style={styles.footer}>
            <Text>{theme.footerText}</Text>
          </View>
          {technicalSEOPage && (
            <Text style={styles.pageNumber}>{technicalSEOPage}</Text>
          )}
        </Page>
      )}
      
      {/* Structured Data Issues */}
      {theme.includeOptions.structuredData && (
        <Page size={theme.pageSize} style={styles.page}>
          <View style={styles.section}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: theme.primaryColor }}>
              Structured Data Validation
            </Text>
            <Text style={{ fontSize: 12, marginBottom: 20, color: theme.secondaryColor }}>
              Analysis of your website's schema.org markup and structured data implementation
            </Text>
            
            {reportData.issues && reportData.issues.schemaMarkup && reportData.issues.schemaMarkup.length > 0 ? (
              <IssueSection 
                title="Schema Markup Issues"
                issues={reportData.issues.schemaMarkup}
              />
            ) : (
              <View style={{ padding: 20, backgroundColor: '#f8f9fa', borderRadius: 5, marginBottom: 20 }}>
                <Text style={{ fontSize: 14, color: '#10b981', fontWeight: 'bold' }}>
                  No Schema Markup Issues Detected
                </Text>
                <Text style={{ fontSize: 12, color: theme.secondaryColor, marginTop: 10 }}>
                  Your website's structured data implementation appears to be properly configured.
                  Well-implemented schema markup helps search engines understand your content and can enable
                  rich results in search engine results pages.
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.footer}>
            <Text>{theme.footerText}</Text>
          </View>
          {structuredDataPage && (
            <Text style={styles.pageNumber}>{structuredDataPage}</Text>
          )}
        </Page>
      )}
      
      {/* Internal Links Analysis */}
      {theme.includeOptions.internalLinks && reportData.internalLinkData && (
        <Page size={theme.pageSize} style={styles.page}>
          <View style={styles.section}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: theme.primaryColor }}>
              Internal Link Optimization
            </Text>
            <Text style={{ fontSize: 12, marginBottom: 20, color: theme.secondaryColor }}>
              Analysis of your website's internal linking structure and opportunities for improvement
            </Text>
            
            {/* Internal Link Statistics */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>Link Statistics</Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Total Pages</Text>
                  <Text style={{ fontSize: 16 }}>{reportData.internalLinkData.graph.nodes.length}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Total Links</Text>
                  <Text style={{ fontSize: 16 }}>{reportData.internalLinkData.graph.links.length}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Orphaned Pages</Text>
                  <Text style={{ fontSize: 16 }}>{reportData.internalLinkData.orphanedPages.length}</Text>
                </View>
              </View>
            </View>
            
            {/* Orphaned Pages */}
            {reportData.internalLinkData.orphanedPages.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#e11d48' }}>
                  Orphaned Pages
                </Text>
                <Text style={{ fontSize: 12, marginBottom: 10, color: theme.secondaryColor }}>
                  Pages with no incoming links that should be connected to your site structure
                </Text>
                
                <View style={{ backgroundColor: '#fef2f2', padding: 10, borderRadius: 5 }}>
                  {reportData.internalLinkData.orphanedPages.slice(0, 5).map((page: string, index: number) => (
                    <Text key={index} style={{ fontSize: 11, marginBottom: 4 }}>• {page}</Text>
                  ))}
                  {reportData.internalLinkData.orphanedPages.length > 5 && (
                    <Text style={{ fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>
                      + {reportData.internalLinkData.orphanedPages.length - 5} more orphaned pages
                    </Text>
                  )}
                </View>
              </View>
            )}
            
            {/* Link Improvement Suggestions */}
            {reportData.internalLinkData.suggestions.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>
                  Link Improvement Suggestions
                </Text>
                <Text style={{ fontSize: 12, marginBottom: 10, color: theme.secondaryColor }}>
                  Recommendations to improve internal linking structure and user navigation
                </Text>
                
                {reportData.internalLinkData.suggestions.slice(0, 3).map((suggestion: { target: string, sources: string[], reason: string }, index: number) => (
                  <View key={index} style={{ marginBottom: 10, padding: 8, backgroundColor: '#f0f9ff', borderRadius: 5 }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold' }}>
                      Add links to: {suggestion.target}
                    </Text>
                    <Text style={{ fontSize: 11, marginBottom: 4, color: theme.secondaryColor }}>
                      {suggestion.reason}
                    </Text>
                    <Text style={{ fontSize: 11 }}>
                      From pages: {suggestion.sources.slice(0, 2).join(', ')}
                      {suggestion.sources.length > 2 ? ` + ${suggestion.sources.length - 2} more` : ''}
                    </Text>
                  </View>
                ))}
                
                {reportData.internalLinkData.suggestions.length > 3 && (
                  <Text style={{ fontSize: 11, fontStyle: 'italic' }}>
                    + {reportData.internalLinkData.suggestions.length - 3} more suggestions
                  </Text>
                )}
              </View>
            )}
            
            {/* Best Practices */}
            <View>
              <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>
                Internal Linking Best Practices
              </Text>
              <View style={{ marginLeft: 10 }}>
                <Text style={{ fontSize: 11, marginBottom: 4 }}>• Use descriptive anchor text with relevant keywords</Text>
                <Text style={{ fontSize: 11, marginBottom: 4 }}>• Create a logical site structure with clear navigation</Text>
                <Text style={{ fontSize: 11, marginBottom: 4 }}>• Link from high-authority pages to important content</Text>
                <Text style={{ fontSize: 11, marginBottom: 4 }}>• Ensure every page is reachable within 3-4 clicks from the homepage</Text>
                <Text style={{ fontSize: 11 }}>• Regularly audit and fix orphaned and underlinked pages</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.footer}>
            <Text>{theme.footerText}</Text>
          </View>
          {internalLinksPage && (
            <Text style={styles.pageNumber}>{internalLinksPage}</Text>
          )}
        </Page>
      )}
      
      {/* User Experience Issues */}
      {theme.includeOptions.userExperience && (
        <Page size={theme.pageSize} style={styles.page}>
          <IssueSection 
            title="Mobile Usability Issues"
            issues={mobileIssues}
          />
          
          <IssueSection 
            title="Security Issues"
            issues={securityIssues}
          />
          
          <View style={styles.footer}>
            <Text>{theme.footerText}</Text>
          </View>
          {userExperiencePage && (
            <Text style={styles.pageNumber}>{userExperiencePage}</Text>
          )}
        </Page>
      )}
      
      {/* End Page - Always included but recommendations are conditional */}
      <EndPage 
        contactEmail={clientInfo?.email || theme.contactInfo}
        contactPhone={clientInfo?.phone}
        contactWebsite={clientInfo?.website}
        recommendations={generateRecommendations()}
        additionalNotes={customNotes}
      />
    </Document>
  );
};

export default SEOAuditReport; 