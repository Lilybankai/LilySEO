"use client";

import React from 'react';
import { Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { usePdfTheme } from '@/context/ThemeContext';

interface ExecutiveSummaryProps {
  overallScore: number;
  categoryScores: Record<string, number>;
  issuesSummary: {
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  pageSpeedScores: {
    mobile: number;
    desktop: number;
  };
  backlinksCount?: number;
  keywordsCount?: number;
  auditData?: any;
  isProUser?: boolean;
  useAiContent?: boolean;
  mobileScore?: number;
  desktopScore?: number;
  topIssuesByCategory?: Record<string, { title: string; severity: string }[]>;
}

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  overallScore,
  categoryScores,
  issuesSummary = { high: 0, medium: 0, low: 0, total: 0 },
  pageSpeedScores = { mobile: 0, desktop: 0 },
  backlinksCount,
  keywordsCount,
  auditData,
  isProUser = false,
  useAiContent = false,
  mobileScore,
  desktopScore,
  topIssuesByCategory
}) => {
  const { theme } = usePdfTheme();
  
  // Ensure issuesSummary has all required fields with fallbacks
  const safeIssuesSummary = {
    high: issuesSummary?.high || 0,
    medium: issuesSummary?.medium || 0,
    low: issuesSummary?.low || 0,
    total: issuesSummary?.total || 0
  };
  
  // Ensure pageSpeedScores has all required fields with fallbacks
  const safePageSpeedScores = {
    mobile: pageSpeedScores?.mobile || 0,
    desktop: pageSpeedScores?.desktop || 0
  };
  
  // Add null checking before using Object.entries
  const hasValidAiContent = auditData?.ai_content && typeof auditData.ai_content === 'object';
  const hasValidAiExecSummary = auditData?.ai_executive_summary && typeof auditData.ai_executive_summary === 'string';
  
  // When doing getAiContent, add null checks
  const getAiContent = () => {
    // Check if we should use AI content
    if (!useAiContent) return null;
    
    // Try to get AI content from different possible locations
    let aiContent = null;
    
    if (hasValidAiExecSummary) {
      aiContent = auditData.ai_executive_summary;
    } else if (hasValidAiContent && auditData.ai_content.executive_summary) {
      aiContent = auditData.ai_content.executive_summary;
    }
    
    // Add defensive check for job_content
    if (!aiContent && auditData?.job_content && typeof auditData.job_content === 'object') {
      aiContent = auditData.job_content.executiveSummary;
    }
    
    return aiContent;
  };
  
  // Get AI content from auditData if available - add better fallback handling
  const aiExecutiveSummary = getAiContent();
  
  // Check if the summary appears to be a fallback/error message
  const isFallbackContent = aiExecutiveSummary && 
    typeof aiExecutiveSummary === 'string' && 
    (aiExecutiveSummary.includes('fallback') || 
    aiExecutiveSummary.includes('error'));
  
  // Log AI content availability for debugging
  console.log('ExecutiveSummary - AI content available:', {
    useAiContent,
    hasAiContent: !!aiExecutiveSummary,
    aiContentLength: aiExecutiveSummary ? aiExecutiveSummary.length : 0,
    isFallbackContent,
    aiContentType: typeof aiExecutiveSummary
  });
  
  // Decide which summary to use:
  // If useAiContent is true AND we have a non-fallback AI summary, use it.
  // Otherwise, use the standard summary.
  const displayAiSummary = useAiContent && aiExecutiveSummary && !isFallbackContent;
  const effectiveExecutiveSummary = displayAiSummary 
    ? aiExecutiveSummary 
    : generateStandardExecutiveSummary(auditData);
  
  // Function to generate a standard executive summary from audit data
  function generateStandardExecutiveSummary(data: any): string {
    try {
      // Extract domain from URL
      const url = data.url || '';
      let domain = url;
      try {
        if (url && url.includes('://')) {
          const urlObj = new URL(url);
          domain = urlObj.hostname;
        }
      } catch (e) {
        // Ignore URL parsing errors
      }
      
      // Get overall score
      const score = data.score || data.report?.score?.overall || 0;
      
      // Determine quality level
      let quality = "needs improvement";
      if (score >= 80) quality = "excellent";
      else if (score >= 65) quality = "good";
      else if (score >= 50) quality = "fair";
      
      // Count issues
      const issues = data.report?.issues || {};
      const totalIssues = Object.values(issues)
        .reduce((total: number, items: any) => 
          total + (Array.isArray(items) ? items.length : 0), 0);
      
      // Mention top categories that need improvement
      const categories = data.report?.score?.categories || {};
      const lowCategories = Object.entries(categories)
        .filter(([_, score]) => (score as number) < 60)
        .map(([key, _]) => key)
        .slice(0, 2)
        .map(formatCategoryName);
      
      // Create improvement areas text
      let improvementText = "";
      if (lowCategories.length > 0) {
        improvementText = `Focus areas for improvement include ${lowCategories.join(' and ')}.`;
      }
      
      // Construct the summary
      return `This SEO audit for ${domain} reveals an overall score of ${Math.round(score)}/100, indicating ${quality} performance. We identified ${totalIssues} issues that are impacting your search visibility. ${improvementText} Addressing the recommendations in this report will help improve your website's search engine rankings and user experience.`;
    } catch (error) {
      console.error('Error generating standard executive summary:', error);
      return "This SEO audit report provides a comprehensive analysis of your website's search engine optimization. It identifies key issues affecting your site's performance and offers actionable recommendations for improvement.";
    }
  }
  
  // Helper function to format category names
  function formatCategoryName(category: string): string {
    // Handle camelCase or snake_case
    const formatted = category
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/_/g, ' ') // Replace underscores with spaces
      .toLowerCase()
      .trim();
    
    // Capitalize first letter
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }
  
  // Function to get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e'; // green
    if (score >= 50) return '#eab308'; // yellow
    return '#ef4444'; // red
  };
  
  const styles = StyleSheet.create({
    page: {
      padding: 40,
      backgroundColor: '#ffffff',
      fontFamily: theme.fontFamily,
    },
    header: {
      fontSize: 24,
      color: theme.primaryColor,
      marginBottom: 20,
      textAlign: 'center',
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      color: theme.primaryColor,
      marginBottom: 10,
      borderBottom: `1pt solid ${theme.secondaryColor}`,
      paddingBottom: 5,
    },
    scoreCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 20,
    },
    scoreText: {
      color: '#ffffff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
    },
    scoreDetails: {
      flex: 1,
    },
    scoreLabel: {
      fontSize: 14,
      color: theme.secondaryColor,
      marginBottom: 5,
    },
    scoreBarContainer: {
      height: 8,
      backgroundColor: '#f1f1f1',
      borderRadius: 4,
      overflow: 'hidden',
    },
    scoreBar: {
      height: '100%',
    },
    issuesSummary: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 15,
    },
    issueBox: {
      width: '30%',
      padding: 10,
      backgroundColor: '#f9fafb',
      borderRadius: 4,
      alignItems: 'center',
    },
    issueCount: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 5,
    },
    issueLabel: {
      fontSize: 10,
      color: theme.secondaryColor,
    },
    keyMetrics: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    metricItem: {
      width: '50%',
      marginBottom: 15,
    },
    metricLabel: {
      fontSize: 10,
      color: theme.secondaryColor,
      marginBottom: 3,
    },
    metricValue: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.primaryColor,
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
    aiContent: {
      marginBottom: 15,
      padding: 10,
      backgroundColor: '#f0f9ff', // light blue background
      borderRadius: 4,
      border: '1pt solid #93c5fd', // light blue border
    },
    aiContentHeading: {
      fontSize: 12,
      color: theme.primaryColor,
      marginBottom: 5,
      fontWeight: 'bold',
    },
    aiContentText: {
      fontSize: 10,
      lineHeight: 1.5,
    },
    aiContentFooter: {
      fontSize: 8,
      marginTop: 5,
      color: theme.secondaryColor,
      fontStyle: 'italic',
    }
  });

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Executive Summary</Text>
      
      {/* Display AI-generated content if available and enabled */}
      {useAiContent && effectiveExecutiveSummary && (
        <View style={[styles.section, styles.aiContent]}>
          <Text style={styles.aiContentHeading}>
            {isFallbackContent ? 'Executive Summary' : 'AI-Generated Executive Summary'}
          </Text>
          <Text style={styles.aiContentText}>{effectiveExecutiveSummary}</Text>
          {!isFallbackContent && (
            <Text style={styles.aiContentFooter}>Generated with Azure OpenAI GPT-4o</Text>
          )}
        </View>
      )}
      
      {/* Overall Score */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overall SEO Score</Text>
        <View style={styles.scoreRow}>
          <View style={[styles.scoreCircle, { backgroundColor: getScoreColor(overallScore) }]}>
            <Text style={styles.scoreText}>{Math.round(overallScore)}</Text>
          </View>
          <View style={styles.scoreDetails}>
            <Text style={styles.scoreLabel}>
              {overallScore >= 80 ? 'Excellent' : overallScore >= 50 ? 'Needs Improvement' : 'Poor'}
            </Text>
            <View style={styles.scoreBarContainer}>
              <View 
                style={[
                  styles.scoreBar, 
                  { width: `${overallScore}%`, backgroundColor: getScoreColor(overallScore) }
                ]} 
              />
            </View>
          </View>
        </View>
      </View>
      
      {/* Category Scores */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category Scores</Text>
        {Object.entries(categoryScores || {}).map(([category, score], index) => (
          <View key={index} style={styles.scoreRow}>
            <View style={[styles.scoreCircle, { backgroundColor: getScoreColor(score as number) }]}>
              <Text style={styles.scoreText}>{Math.round(score as number)}</Text>
            </View>
            <View style={styles.scoreDetails}>
              <Text style={styles.scoreLabel}>
                {formatCategoryName(category)}
              </Text>
              <View style={styles.scoreBarContainer}>
                <View 
                  style={[
                    styles.scoreBar, 
                    { width: `${score}%`, backgroundColor: getScoreColor(score as number) }
                  ]} 
                />
              </View>
            </View>
          </View>
        ))}
      </View>
      
      {/* Issues Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Issues Found</Text>
        <View style={styles.issuesSummary}>
          <View style={styles.issueBox}>
            <Text style={[styles.issueCount, { color: '#ef4444' }]}>{safeIssuesSummary.high}</Text>
            <Text style={styles.issueLabel}>Critical Issues</Text>
          </View>
          <View style={styles.issueBox}>
            <Text style={[styles.issueCount, { color: '#eab308' }]}>{safeIssuesSummary.medium}</Text>
            <Text style={styles.issueLabel}>Warnings</Text>
          </View>
          <View style={styles.issueBox}>
            <Text style={[styles.issueCount, { color: '#22c55e' }]}>{safeIssuesSummary.low}</Text>
            <Text style={styles.issueLabel}>Notices</Text>
          </View>
        </View>
      </View>
      
      {/* Key Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.keyMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Mobile Page Speed</Text>
            <Text style={styles.metricValue}>{safePageSpeedScores.mobile}/100</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Desktop Page Speed</Text>
            <Text style={styles.metricValue}>{safePageSpeedScores.desktop}/100</Text>
          </View>
          {backlinksCount !== undefined && (
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Backlinks</Text>
              <Text style={styles.metricValue}>{backlinksCount}</Text>
            </View>
          )}
          {keywordsCount !== undefined && (
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Keywords</Text>
              <Text style={styles.metricValue}>{keywordsCount}</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Footer */}
      <View style={styles.footer}>
        <Text>{theme.footerText}</Text>
      </View>
      
      {/* Page Number */}
      <Text style={styles.pageNumber}>2</Text>
    </Page>
  );
};

export default ExecutiveSummary; 