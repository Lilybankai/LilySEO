"use client";

import React from 'react';
import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer';
import { usePdfTheme } from '@/context/ThemeContext';
import CoverPage from './CoverPage';
import ExecutiveSummary from './ExecutiveSummary';
import IssueSection from './IssueSection';
import PerformanceMetrics from './PerformanceMetrics';
import EndPage from './EndPage';

// Register custom fonts
Font.register({
  family: 'Poppins',
  fonts: [
    { src: '/fonts/Poppins-Regular.ttf' },
    { src: '/fonts/Poppins-Bold.ttf', fontWeight: 'bold' },
    { src: '/fonts/Poppins-Light.ttf', fontWeight: 'light' },
  ],
});

Font.register({
  family: 'Montserrat',
  fonts: [
    { src: '/fonts/Montserrat-Regular.ttf' },
    { src: '/fonts/Montserrat-Bold.ttf', fontWeight: 'bold' },
    { src: '/fonts/Montserrat-Light.ttf', fontWeight: 'light' },
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
  const coverPage = true; // Always include
  pageCounter++; // Start counting after cover page

  // Page numbers for main section
  const executiveSummaryPage = theme.includeOptions.executiveSummary ? pageCounter++ : null;
  const performanceMetricsPage = theme.includeOptions.performance ? pageCounter++ : null;
  const onPageSEOPage = theme.includeOptions.onPageSEO ? pageCounter++ : null;
  const technicalSEOPage = theme.includeOptions.technicalSEO ? pageCounter++ : null;
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