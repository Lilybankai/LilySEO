"use client";

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { usePdfTheme } from '@/context/ThemeContext';

interface Issue {
  title: string;
  description?: string;
  url?: string;
  severity: 'high' | 'medium' | 'low' | 'info';
  priority?: 'critical' | 'high' | 'medium' | 'low';
}

interface IssueSectionProps {
  title: string;
  issues: Issue[];
}

const IssueSection: React.FC<IssueSectionProps> = ({ title, issues }) => {
  const { theme } = usePdfTheme();
  
  // Function to get severity color
  const getSeverityColor = (severity: string, priority?: string) => {
    if (priority === 'critical' || severity === 'high' || priority === 'high') {
      return '#ef4444'; // red
    }
    if (severity === 'medium' || priority === 'medium') {
      return '#eab308'; // yellow
    }
    return '#22c55e'; // green for low or info
  };
  
  // Group issues by severity for better organization
  const groupedIssues = {
    critical: issues.filter(issue => issue.priority === 'critical'),
    high: issues.filter(issue => (issue.severity === 'high' || issue.priority === 'high') && issue.priority !== 'critical'),
    medium: issues.filter(issue => (issue.severity === 'medium' || issue.priority === 'medium') && !['critical', 'high'].includes(issue.priority || '')),
    low: issues.filter(issue => (issue.severity === 'low' || issue.priority === 'low') && !['critical', 'high', 'medium'].includes(issue.priority || '')),
    info: issues.filter(issue => issue.severity === 'info' && !['critical', 'high', 'medium', 'low'].includes(issue.priority || '')),
  };
  
  const styles = StyleSheet.create({
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
    severityTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      marginTop: 10,
      marginBottom: 5,
    },
    issueItem: {
      marginBottom: 8,
      paddingLeft: 10,
    },
    issueTitle: {
      fontSize: 11,
      marginBottom: 3,
    },
    issueDescription: {
      fontSize: 9,
      color: '#4b5563',
      marginBottom: 2,
    },
    issueUrl: {
      fontSize: 8,
      color: theme.primaryColor,
    },
    noIssues: {
      fontSize: 11,
      color: '#4b5563',
      fontStyle: 'italic',
      marginTop: 5,
    },
  });

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      
      {issues.length === 0 ? (
        <Text style={styles.noIssues}>No issues found</Text>
      ) : (
        <>
          {/* Critical Issues */}
          {groupedIssues.critical.length > 0 && (
            <>
              <Text style={[styles.severityTitle, { color: '#ef4444' }]}>
                Critical Issues ({groupedIssues.critical.length})
              </Text>
              {groupedIssues.critical.map((issue, index) => (
                <View key={index} style={styles.issueItem}>
                  <Text style={[styles.issueTitle, { color: getSeverityColor(issue.severity, issue.priority) }]}>
                    • {issue.title}
                  </Text>
                  {issue.description && (
                    <Text style={styles.issueDescription}>{issue.description}</Text>
                  )}
                  {issue.url && (
                    <Text style={styles.issueUrl}>{issue.url}</Text>
                  )}
                </View>
              ))}
            </>
          )}
          
          {/* High Issues */}
          {groupedIssues.high.length > 0 && (
            <>
              <Text style={[styles.severityTitle, { color: '#ef4444' }]}>
                High Priority Issues ({groupedIssues.high.length})
              </Text>
              {groupedIssues.high.map((issue, index) => (
                <View key={index} style={styles.issueItem}>
                  <Text style={[styles.issueTitle, { color: getSeverityColor(issue.severity, issue.priority) }]}>
                    • {issue.title}
                  </Text>
                  {issue.description && (
                    <Text style={styles.issueDescription}>{issue.description}</Text>
                  )}
                  {issue.url && (
                    <Text style={styles.issueUrl}>{issue.url}</Text>
                  )}
                </View>
              ))}
            </>
          )}
          
          {/* Medium Issues */}
          {groupedIssues.medium.length > 0 && (
            <>
              <Text style={[styles.severityTitle, { color: '#eab308' }]}>
                Medium Priority Issues ({groupedIssues.medium.length})
              </Text>
              {groupedIssues.medium.map((issue, index) => (
                <View key={index} style={styles.issueItem}>
                  <Text style={[styles.issueTitle, { color: getSeverityColor(issue.severity, issue.priority) }]}>
                    • {issue.title}
                  </Text>
                  {issue.description && (
                    <Text style={styles.issueDescription}>{issue.description}</Text>
                  )}
                  {issue.url && (
                    <Text style={styles.issueUrl}>{issue.url}</Text>
                  )}
                </View>
              ))}
            </>
          )}
          
          {/* Low Issues */}
          {groupedIssues.low.length > 0 && (
            <>
              <Text style={[styles.severityTitle, { color: '#22c55e' }]}>
                Low Priority Issues ({groupedIssues.low.length})
              </Text>
              {groupedIssues.low.map((issue, index) => (
                <View key={index} style={styles.issueItem}>
                  <Text style={[styles.issueTitle, { color: getSeverityColor(issue.severity, issue.priority) }]}>
                    • {issue.title}
                  </Text>
                  {issue.description && (
                    <Text style={styles.issueDescription}>{issue.description}</Text>
                  )}
                  {issue.url && (
                    <Text style={styles.issueUrl}>{issue.url}</Text>
                  )}
                </View>
              ))}
            </>
          )}
          
          {/* Info Issues */}
          {groupedIssues.info.length > 0 && (
            <>
              <Text style={[styles.severityTitle, { color: '#3b82f6' }]}>
                Info ({groupedIssues.info.length})
              </Text>
              {groupedIssues.info.map((issue, index) => (
                <View key={index} style={styles.issueItem}>
                  <Text style={[styles.issueTitle, { color: '#3b82f6' }]}>
                    • {issue.title}
                  </Text>
                  {issue.description && (
                    <Text style={styles.issueDescription}>{issue.description}</Text>
                  )}
                  {issue.url && (
                    <Text style={styles.issueUrl}>{issue.url}</Text>
                  )}
                </View>
              ))}
            </>
          )}
        </>
      )}
    </View>
  );
};

export default IssueSection; 