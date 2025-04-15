"use client";

import React, { useState, useEffect } from 'react';
import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer';
import { usePdfTheme } from '@/context/ThemeContext';
import CoverPage from './CoverPage';
import ExecutiveSummary from './ExecutiveSummary';
import IssueSection from './IssueSection';
import IssuesSummary from './IssuesSummary';
import PerformanceMetrics from './PerformanceMetrics';
import EndPage from './EndPage';
import { PdfCoverTemplate, getTemplateById, DEFAULT_TEMPLATE } from '@/utils/pdf-utils';
import { categorizeIssues, generateRecommendations } from '@/utils/issue-transformers';
import { 
  isValidAuditData, 
  sanitizeAuditData, 
  validateClientInfo, 
  generateIssuesSummary, 
  withPdfErrorHandling,
  logPdfGeneration,
  SafeAuditData as ImportedSafeAuditData
} from '@/utils/pdf-error-handling';

// Register custom fonts - using Google Fonts hosted versions
/*
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
*/

// Register a fallback sans-serif font to ensure PDF generation works
// We keep Open Sans registration for now as a general fallback, though Helvetica should be used by default.
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
  useAiContent?: boolean;
}

// Update the SafeAuditData interface to include all the properties needed
// Use the imported alias or redefine if necessary
export type SafeAuditData = ImportedSafeAuditData;

// Add error styles at the beginning of the file
const errorStyles = StyleSheet.create({
  errorPage: {
    padding: 30,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 24,
    color: '#e11d48',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  errorMessage: {
    fontSize: 16,
    marginBottom: 24,
    color: '#374151',
  },
  errorHelp: {
    fontSize: 14,
    color: '#6b7280',
  },
});

// Check if the URL is external or base64 image data
const isExternalUrl = (url: string): boolean => {
  return url.startsWith('http') || url.startsWith('data:image');
};

// Add a simple wrapper to handle errors in the SEOAuditReport component
const SafeComponent = ({ children }: { children: React.ReactNode }) => {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error('Error rendering PDF component:', error);
    return (
      <Document>
        <Page size="A4">
          <View style={{ margin: 30 }}>
            <Text>Error rendering PDF. Please try again.</Text>
          </View>
        </Page>
      </Document>
    );
  }
};

const SEOAuditReport: React.FC<SEOAuditReportProps> = ({
  auditData,
  clientInfo,
  includeRecommendations = true,
  customNotes = '',
  templateId = 'default',
  useAiContent = false,
}) => {
  const { theme } = usePdfTheme();
  const [template, setTemplate] = useState<PdfCoverTemplate | null>(null);
  // Keep safeData state for potentially async operations or other uses if needed
  const [safeDataState, setSafeDataState] = useState<SafeAuditData>({}); 
  const [safeClientInfo, setSafeClientInfo] = useState(clientInfo || {});
  const [issueSummaryData, setIssueSummaryData] = useState({ 
    critical: 0, 
    high: 0, 
    medium: 0, 
    low: 0, 
    total: 0, 
    byCategoryCount: {} as Record<string, number> 
  });
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [topIssuesByCategory, setTopIssuesByCategory] = useState<{ [category: string]: { title: string; severity: string; }[] }>({});
  const [issuesCount, setIssuesCount] = useState<number>(0);
  const [issueCategoryNames, setIssueCategoryNames] = useState<string[]>([]);
  
  // Check for pro user or override for testing
  const checkIsProOverride = () => {
    // @ts-ignore - window.__override_isPro is set by the Test Override button
    return !!(typeof window !== 'undefined' && (window as any).__override_isPro);
  };
  
  // Force isProUser to true if override is set
  const isProUserWithOverride = !!clientInfo || checkIsProOverride();
  
  // Sanitize data directly from props for immediate use during render
  const projectName = auditData?.projects?.name || 'Unknown Project';
  const projectUrl = auditData?.url || auditData?.projects?.url || 'https://example.com'; 
  const score = auditData?.score || auditData?.report?.score?.overall || 0;
  
  // Extract category scores (using camelCase format for PDF)
  const categoryScores = {
    onPageSeo: auditData?.report?.score?.categories?.onPageSeo || 0,
    performance: auditData?.report?.score?.categories?.performance || 0,
    usability: auditData?.report?.score?.categories?.usability || 0,
    links: auditData?.report?.score?.categories?.links || 0,
    social: auditData?.report?.score?.categories?.social || 0
  };
  
  // Get page speed scores
  const mobilePageSpeedScore = auditData?.report?.pageSpeed?.mobile?.performance || 0;
  const desktopPageSpeedScore = auditData?.report?.pageSpeed?.desktop?.performance || 0;
  
  // Extract issue counts by severity
  const highIssuesCount = 
    Object.values(auditData?.report?.issues || {})
      .flat()
      .filter((issue: any) => issue?.priority === 'high' || issue?.severity === 'high')
      .length;
      
  const mediumIssuesCount = 
    Object.values(auditData?.report?.issues || {})
      .flat()
      .filter((issue: any) => issue?.priority === 'medium' || issue?.severity === 'medium')
      .length;
      
  const lowIssuesCount = 
    Object.values(auditData?.report?.issues || {})
      .flat()
      .filter((issue: any) => issue?.priority === 'low' || issue?.severity === 'low')
      .length;
  
  // Additional SEO metrics from the audit data
  const backlinksCount = auditData?.report?.mozData?.linkingDomains || 0;
  const keywordsCount = (auditData?.report?.keywords?.length ?? 0) + 
    (auditData?.keywords?.suggested?.length ?? 0);
  
  // Debug what we received
  useEffect(() => {
    console.log('SEOAuditReport - auditData received:', {
      score: auditData?.score,
      hasProjects: !!auditData?.projects,
      projectName: auditData?.projects?.name,
      hasReport: !!auditData?.report,
      reportKeys: auditData?.report ? Object.keys(auditData.report) : []
    });
    
    if (auditData?.report?.score?.categories) {
      console.log('SEOAuditReport - report categories:', auditData.report.score.categories);
    }
    
    console.log('SEOAuditReport - issues overview:', {
      hasMetaDesc: !!auditData?.report?.issues?.metaDescription,
      hasTitleIssues: !!auditData?.report?.issues?.titleTags,
      hasHeadingIssues: !!auditData?.report?.issues?.headings,
      totalIssueTypes: auditData?.report?.issues ? Object.keys(auditData.report.issues).length : 0
    });
    
    if (auditData?.report?.pageSpeed) {
      console.log('SEOAuditReport - pageSpeed data:', {
        mobileScore: auditData.report.pageSpeed.mobile?.performance,
        desktopScore: auditData.report.pageSpeed.desktop?.performance
      });
    }
  }, [auditData]);
  
  // Load the template based on the provided templateId
  useEffect(() => {
    try {
      const loadedTemplate = getTemplateById(templateId);
      setTemplate(loadedTemplate || DEFAULT_TEMPLATE);
    } catch (error) {
      console.error("Error loading template:", error);
      setTemplate(DEFAULT_TEMPLATE);
    }
  }, [templateId]);

  // Sanitize and validate the data on mount - Keep this for other parts of the component if needed
  useEffect(() => {
    try {
      logPdfGeneration('start', { hasData: !!auditData });
      
      // Validate the audit data
      if (!isValidAuditData(auditData)) {
        setHasError(true);
        setErrorMessage('Invalid or incomplete audit data provided');
        return;
      }
      
      // Sanitize and prepare the data for state
      const sanitizedData = sanitizeAuditData(auditData);
      setSafeDataState(sanitizedData); // Use the state setter
      
      // Validate client info
      if (clientInfo) {
        setSafeClientInfo(validateClientInfo(clientInfo));
      }
      
      // Generate issues summary using the direct audit data, not the sanitized version
      // This ensures we access the real issue data structure
      const allIssues = [];
      
      // Collect issues directly from the original auditData
      if (auditData.report?.issues) {
        const issuesObj = auditData.report.issues;
        
        // Add each type of issue to our allIssues array
        if (Array.isArray(issuesObj.metaDescription)) allIssues.push(...issuesObj.metaDescription);
        if (Array.isArray(issuesObj.titleTags)) allIssues.push(...issuesObj.titleTags);
        if (Array.isArray(issuesObj.headings)) allIssues.push(...issuesObj.headings);
        if (Array.isArray(issuesObj.images)) allIssues.push(...issuesObj.images);
        if (Array.isArray(issuesObj.links)) allIssues.push(...issuesObj.links);
        if (Array.isArray(issuesObj.performance)) allIssues.push(...issuesObj.performance);
        if (Array.isArray(issuesObj.mobile)) allIssues.push(...issuesObj.mobile);
        if (Array.isArray(issuesObj.security)) allIssues.push(...issuesObj.security);
        if (Array.isArray(issuesObj.schemaMarkup)) allIssues.push(...issuesObj.schemaMarkup);
      }
      
      // If we have seo issues in a different format, add those as well
      if (Array.isArray(auditData.report?.issues?.seo)) {
        allIssues.push(...auditData.report.issues.seo);
      }
      
      console.log('SEOAuditReport - Processed issues:', { 
        totalIssuesCollected: allIssues.length,
        issueTypes: allIssues.map(i => i.category || 'unknown').filter((v, i, a) => a.indexOf(v) === i)
      });
      
      // Generate the issue summary using the collected issues
      const summary = generateIssuesSummary(allIssues);
      setIssueSummaryData(summary);
      
      logPdfGeneration('processing', {
        dataProcessed: true,
        issuesCount: summary.total,
        categoriesCount: Object.keys(summary.byCategoryCount).length
      });
    } catch (error) {
      console.error("Error processing audit data:", error);
      setHasError(true);
      setErrorMessage('Error preparing report data');
      logPdfGeneration('error', { error });
    }
  }, [auditData, clientInfo]);

  // Extract data using immediateSafeData for rendering PDF content
  const url = projectUrl;
  const reportDate = auditData?.projects?.created_at 
    ? new Date(auditData.projects.created_at).toLocaleDateString() 
    : new Date().toLocaleDateString();
  
  // Extract issues directly from auditData for consistent access
  // This avoids the type checking issues with the sanitized structure
  const metaDescriptionIssues = auditData?.report?.issues?.metaDescription || [];
  const titleTagIssues = auditData?.report?.issues?.titleTags || [];
  const headingIssues = auditData?.report?.issues?.headings || [];
  const imageIssues = auditData?.report?.issues?.images || [];
  const linkIssues = auditData?.report?.issues?.links || [];
  const performanceIssues = auditData?.report?.issues?.performance || [];
  const mobileIssues = auditData?.report?.issues?.mobile || [];
  const securityIssues = auditData?.report?.issues?.security || [];
  const schemaMarkupIssues = auditData?.report?.issues?.schemaMarkup || [];
  
  // PageSpeed metrics safely
  const pageSpeed = auditData?.report?.pageSpeed || {
    mobile: { performance: 0, cls: 0, fcp: 0, lcp: 0, tbt: 0 },
    desktop: { performance: 0, cls: 0, fcp: 0, lcp: 0, tbt: 0 }
  };
  
  // Make sure we have valid PageSpeed objects with fallbacks
  const safePageSpeed = {
    mobile: pageSpeed.mobile || { performance: 0, cls: 0, fcp: 0, lcp: 0, tbt: 0 },
    desktop: pageSpeed.desktop || { performance: 0, cls: 0, fcp: 0, lcp: 0, tbt: 0 }
  };
  
  // MOZ data safely
  const mozData = auditData?.report?.mozData || {
    domainAuthority: 0,
    pageAuthority: 0,
    linkingDomains: 0,
    totalLinks: 0
  };
  
  // Calculate total issues from the extracted arrays
  const totalIssues = metaDescriptionIssues.length + 
                     titleTagIssues.length + 
                     headingIssues.length + 
                     imageIssues.length + 
                     linkIssues.length + 
                     performanceIssues.length + 
                     mobileIssues.length + 
                     securityIssues.length + 
                     schemaMarkupIssues.length;
                     
  // Create a summary of issues by severity
  // We can use the issueSummaryData state here as it's calculated in useEffect
  const calculatedIssueSummary = issueSummaryData || {
    high: 0,
    medium: 0,
    low: 0,
    total: 0
  };
  
  // Use the new issue categorization - use immediateSafeData safely
  const issueCategories = React.useMemo(() => 
    categorizeIssues(auditData?.report?.issues || {}), 
    [auditData?.report?.issues]
  );
  
  // Transform issueCategories for ExecutiveSummary prop - use immediateSafeData
  const topIssuesForSummary = React.useMemo(() => issueCategories.reduce((acc, categoryData) => {
    const categoryName = categoryData.category || 'Unknown Category';
    acc[categoryName] = categoryData.items.slice(0, 3).map(item => ({ 
      title: item.title,
      severity: item.severity 
    }));
    return acc;
  }, {} as Record<string, { title: string; severity: string }[]>), [issueCategories]);
  
  // Get internal link data directly from auditData
  const internalLinkData = auditData?.internalLinkData;
  
  // Generate recommendations based on the issues - use immediateSafeData
  const generateIssueBasedRecommendations = React.useCallback(() => {
    if (!includeRecommendations || !theme.includeOptions.recommendations) return [];
    return generateRecommendations(issueCategories, 5);
  }, [includeRecommendations, theme.includeOptions.recommendations, issueCategories]);
  
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
    errorPage: {
      padding: 30,
      backgroundColor: '#fff',
      fontFamily: theme.fontFamily || 'Helvetica',
    },
    errorTitle: {
      fontSize: 24,
      color: '#E53E3E',
      marginBottom: 20,
      fontWeight: 'bold',
    },
    errorMessage: {
      fontSize: 14,
      color: '#4A5568',
      marginBottom: 20,
    },
    errorHelp: {
      fontSize: 12,
      color: '#718096',
    },
  });

  // Calculate what page numbers should be shown based on which sections are included
  let pageCounter = 1;
  const coverPage = true; // Always included
  pageCounter++; // Start counting after cover page

  // Page numbers for main section
  const executiveSummaryPage = theme.includeOptions.executiveSummary ? pageCounter++ : null;
  // Account for the Issues Summary page if Executive Summary is included
  if (theme.includeOptions.executiveSummary) pageCounter++;
  const performanceMetricsPage = theme.includeOptions.performance ? pageCounter++ : null;
  const onPageSEOPage = theme.includeOptions.onPageSEO ? pageCounter++ : null;
  const technicalSEOPage = theme.includeOptions.technicalSEO ? pageCounter++ : null;
  const structuredDataPage = theme.includeOptions.structuredData && schemaMarkupIssues.length > 0 ? pageCounter++ : null;
  const internalLinksPage = theme.includeOptions.internalLinks && internalLinkData ? pageCounter++ : null;
  const userExperiencePage = theme.includeOptions.userExperience ? pageCounter++ : null;
  const endPage = true; // Always include
  const finalEndPageNumber = pageCounter; // The number for the last page
  
  // Debug AI content in SEOAuditReport
  useEffect(() => {
    if (useAiContent) {
      console.log('SEOAuditReport - AI content check:', {
        hasAiContent: !!(auditData?.ai_content || auditData?.ai_executive_summary),
        aiContentSummaryLength: auditData?.ai_content?.executive_summary?.length || 
                              auditData?.ai_executive_summary?.length || 0,
        aiContentRecommendationsCount: auditData?.ai_content?.recommendations?.length || 
                                     auditData?.ai_recommendations?.length || 0
      });
    }
  }, [auditData, useAiContent]);

  // Add a function to safely check data existence before rendering sections
  const canRenderData = (dataProperty: any): boolean => {
    return !!dataProperty && typeof dataProperty === 'object';
  };

  // Handle rendering error state
  if (hasError) {
    return (
      <Document title={`Error - SEO Audit Report`}>
        <Page size="A4" style={styles.errorPage}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Error Generating Report</Text>
            <Text style={styles.errorMessage}>{errorMessage || 'An unexpected error occurred'}</Text>
          </View>
        </Page>
      </Document>
    );
  }

  // Wrap document render in a try/catch
  try {
    return (
      <Document
        title={`SEO Audit Report - ${projectName}`}
        author={theme.companyName}
        subject={`SEO Audit for ${projectUrl}`}
        keywords="SEO, Audit, Report"
        creator={theme.companyName}
        producer={theme.companyName}
      >
        {/* Cover Page */}
        {coverPage && (
          <Page size={theme.pageSize} style={styles.page}>
            <CoverPage 
              projectName={projectName}
              url={url}
              score={score}
              date={reportDate}
              clientInfo={isProUserWithOverride ? safeClientInfo : undefined}
              templateId={templateId}
            />
          </Page>
        )}
        
        {/* Executive Summary */}
        {theme.includeOptions.executiveSummary && (
          <>
            <Page size={theme.pageSize} style={styles.page}>
              <ExecutiveSummary 
                overallScore={score} 
                categoryScores={categoryScores}
                issuesSummary={{
                  high: calculatedIssueSummary?.high || 0,
                  medium: calculatedIssueSummary?.medium || 0,
                  low: calculatedIssueSummary?.low || 0,
                  total: calculatedIssueSummary?.total || 0
                }}
                pageSpeedScores={{
                  mobile: mobilePageSpeedScore || 0,
                  desktop: desktopPageSpeedScore || 0
                }}
                backlinksCount={backlinksCount}
                keywordsCount={keywordsCount}
                auditData={auditData}
                useAiContent={useAiContent}
                isProUser={isProUserWithOverride}
                mobileScore={mobilePageSpeedScore}
                desktopScore={desktopPageSpeedScore}
                topIssuesByCategory={topIssuesForSummary}
              />
              
              <View style={styles.footer}>
                <Text>{theme.footerText}</Text>
              </View>
              {executiveSummaryPage && (
                <Text style={styles.pageNumber}>{executiveSummaryPage}</Text>
              )}
            </Page>
            
            {/* Add Issues Summary page - only show if we have issues */}
            {calculatedIssueSummary.total > 0 && (
              <Page size={theme.pageSize} style={styles.page}>
                <IssuesSummary 
                  issues={issueCategories}
                  issueData={calculatedIssueSummary}
                  categoryIssues={issueCategories}
                  topIssues={topIssuesForSummary}
                  auditData={auditData}
                  useAiContent={useAiContent}
                  isProUser={isProUserWithOverride}
                />
                
                <View style={styles.footer}>
                  <Text>{theme.footerText}</Text>
                </View>
                <Text style={styles.pageNumber}>{executiveSummaryPage ? executiveSummaryPage + 1 : pageCounter}</Text>
              </Page>
            )}
          </>
        )}
        
        {/* Performance Metrics */}
        {theme.includeOptions.performance && canRenderData(safePageSpeed) && (
          <Page size={theme.pageSize} style={styles.page}>
            <PerformanceMetrics 
              mobile={safePageSpeed.mobile}
              desktop={safePageSpeed.desktop}
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
            {metaDescriptionIssues.length > 0 && (
              <IssueSection 
                title="Meta Description Issues"
                issues={metaDescriptionIssues}
                auditData={auditData} 
                useAiContent={useAiContent}
                isProUser={isProUserWithOverride}
              />
            )}
            
            {titleTagIssues.length > 0 && (
              <IssueSection 
                title="Title Tag Issues"
                issues={titleTagIssues}
                auditData={auditData}
                useAiContent={useAiContent}
                isProUser={isProUserWithOverride}
              />
            )}
            
            {headingIssues.length > 0 && (
              <IssueSection 
                title="Heading Issues"
                issues={headingIssues}
                auditData={auditData}
                useAiContent={useAiContent}
                isProUser={isProUserWithOverride}
              />
            )}
            
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
              auditData={auditData}
              useAiContent={useAiContent}
              isProUser={isProUserWithOverride}
            />
            
            <IssueSection 
              title="Link Issues"
              issues={linkIssues}
              auditData={auditData}
              useAiContent={useAiContent}
              isProUser={isProUserWithOverride}
            />
            
            <IssueSection 
              title="Performance Issues"
              issues={performanceIssues}
              auditData={auditData}
              useAiContent={useAiContent}
              isProUser={isProUserWithOverride}
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
        {theme.includeOptions.structuredData && schemaMarkupIssues.length > 0 && (
          <Page size={theme.pageSize} style={styles.page}>
            <View style={styles.section}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: theme.primaryColor }}>
                Structured Data Validation
              </Text>
              <Text style={{ fontSize: 12, marginBottom: 20, color: theme.secondaryColor }}>
                Analysis of your website's schema.org markup and structured data implementation
              </Text>
              
              <IssueSection 
                title="Schema Markup Issues"
                issues={schemaMarkupIssues}
                auditData={auditData}
                useAiContent={useAiContent}
                isProUser={isProUserWithOverride}
              />
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
        {theme.includeOptions.internalLinks && internalLinkData && (
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
                    <Text style={{ fontSize: 16 }}>{internalLinkData.graph?.nodes?.length ?? 0}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Total Links</Text>
                    <Text style={{ fontSize: 16 }}>{internalLinkData.graph?.links?.length ?? 0}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Orphaned Pages</Text>
                    <Text style={{ fontSize: 16 }}>{internalLinkData.orphanedPages?.length ?? 0}</Text>
                  </View>
                </View>
              </View>
              
              {/* Orphaned Pages */}
              {internalLinkData.orphanedPages?.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#e11d48' }}>
                    Orphaned Pages
                  </Text>
                  <Text style={{ fontSize: 12, marginBottom: 10, color: theme.secondaryColor }}>
                    Pages with no incoming links that should be connected to your site structure
                  </Text>
                  
                  <View style={{ backgroundColor: '#fef2f2', padding: 10, borderRadius: 5 }}>
                    {internalLinkData.orphanedPages.slice(0, 5).map((page: string, index: number) => (
                      <Text key={index} style={{ fontSize: 11, marginBottom: 4 }}>• {page}</Text>
                    ))}
                    {internalLinkData.orphanedPages.length > 5 && (
                      <Text style={{ fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>
                        + {internalLinkData.orphanedPages.length - 5} more orphaned pages
                      </Text>
                    )}
                  </View>
                </View>
              )}
              
              {/* Link Improvement Suggestions */}
              {internalLinkData.suggestions?.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>
                    Link Improvement Suggestions
                  </Text>
                  <Text style={{ fontSize: 12, marginBottom: 10, color: theme.secondaryColor }}>
                    Recommendations to improve internal linking structure and user navigation
                  </Text>
                  
                  {internalLinkData.suggestions.slice(0, 3).map((suggestion: { target: string, sources: string[], reason: string }, index: number) => (
                    <View key={index} style={{ marginBottom: 10, padding: 8, backgroundColor: '#f0f9ff', borderRadius: 5 }}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold' }}>
                        Add links to: {suggestion.target}
                      </Text>
                      <Text style={{ fontSize: 11, marginBottom: 4, color: theme.secondaryColor }}>
                        {suggestion.reason}
                      </Text>
                      <Text style={{ fontSize: 11 }}>
                        From pages: {suggestion.sources?.slice(0, 2).join(', ') ?? ''}
                        {suggestion.sources?.length > 2 ? ` + ${suggestion.sources.length - 2} more` : ''}
                      </Text>
                    </View>
                  ))}
                  
                  {internalLinkData.suggestions.length > 3 && (
                    <Text style={{ fontSize: 11, fontStyle: 'italic' }}>
                      + {internalLinkData.suggestions.length - 3} more suggestions
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
              auditData={auditData}
              useAiContent={useAiContent}
              isProUser={isProUserWithOverride}
            />
            
            <IssueSection 
              title="Security Issues"
              issues={securityIssues} 
              auditData={auditData}
              useAiContent={useAiContent}
              isProUser={isProUserWithOverride}
            />
            
            <View style={styles.footer}>
              <Text>{theme.footerText}</Text>
            </View>
            {userExperiencePage && (
              <Text style={styles.pageNumber}>{userExperiencePage}</Text>
            )}
          </Page>
        )}
        
        {/* End Page */}
        <EndPage 
          contactEmail={safeClientInfo?.email || theme.contactInfo}
          contactPhone={safeClientInfo?.phone}
          contactWebsite={safeClientInfo?.website}
          recommendations={generateIssueBasedRecommendations()} // Uses memoized issueCategories
          additionalNotes={customNotes}
          auditData={auditData} // Pass raw data if EndPage needs it
          useAiContent={useAiContent}
          isProUser={isProUserWithOverride}
          pageNumber={finalEndPageNumber} // Pass the final page number
        />
      </Document>
    );
  } catch (error) {
    console.error('Error rendering PDF:', error);
    return (
      <Document title="Error - SEO Audit Report">
        <Page size="A4" style={errorStyles.errorPage}>
          <View style={errorStyles.errorContainer}>
            <Text style={errorStyles.errorTitle}>Error Generating PDF</Text>
            <Text style={errorStyles.errorMessage}>
              An error occurred while generating your PDF. Please try again or contact support.
            </Text>
          </View>
        </Page>
      </Document>
    );
  }
};

export default withPdfErrorHandling(
  SEOAuditReport, 
  (error) => {
    console.error("Caught error in SEOAuditReport:", error);
    
    // Get a user-friendly error message
    const userErrorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    // Return a minimal error document
    return (
      <Document title="Error - SEO Audit Report">
        <Page size="A4" style={errorStyles.errorPage}>
          <View style={{ marginTop: 100, alignItems: 'center' }}>
            <Text style={errorStyles.errorTitle}>Error Generating Report</Text>
            <Text style={errorStyles.errorMessage}>{userErrorMessage}</Text>
            <Text style={errorStyles.errorHelp}>
              Please check that you have provided valid audit data and try again.
            </Text>
          </View>
        </Page>
      </Document>
    );
  }
); 