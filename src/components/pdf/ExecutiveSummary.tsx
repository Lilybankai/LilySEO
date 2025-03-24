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
}

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  overallScore,
  categoryScores,
  issuesSummary,
  pageSpeedScores,
  backlinksCount,
  keywordsCount,
}) => {
  const { theme } = usePdfTheme();
  
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
  });

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Executive Summary</Text>
      
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
        {Object.entries(categoryScores).map(([category, score], index) => (
          <View key={index} style={styles.scoreRow}>
            <View style={[styles.scoreCircle, { backgroundColor: getScoreColor(score) }]}>
              <Text style={styles.scoreText}>{Math.round(score)}</Text>
            </View>
            <View style={styles.scoreDetails}>
              <Text style={styles.scoreLabel}>
                {category.replace(/([A-Z])/g, ' $1').trim()}
              </Text>
              <View style={styles.scoreBarContainer}>
                <View 
                  style={[
                    styles.scoreBar, 
                    { width: `${score}%`, backgroundColor: getScoreColor(score) }
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
            <Text style={[styles.issueCount, { color: '#ef4444' }]}>{issuesSummary.high}</Text>
            <Text style={styles.issueLabel}>Critical Issues</Text>
          </View>
          <View style={styles.issueBox}>
            <Text style={[styles.issueCount, { color: '#eab308' }]}>{issuesSummary.medium}</Text>
            <Text style={styles.issueLabel}>Warnings</Text>
          </View>
          <View style={styles.issueBox}>
            <Text style={[styles.issueCount, { color: '#22c55e' }]}>{issuesSummary.low}</Text>
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
            <Text style={styles.metricValue}>{pageSpeedScores.mobile}/100</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Desktop Page Speed</Text>
            <Text style={styles.metricValue}>{pageSpeedScores.desktop}/100</Text>
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