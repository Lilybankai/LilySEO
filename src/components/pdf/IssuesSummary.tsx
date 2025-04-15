import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { usePdfTheme } from '@/context/ThemeContext';

// Define the props for the component
interface IssuesSummaryProps {
  issues: {
    category: string;
    items: Array<{
      title: string;
      description: string;
      severity: 'high' | 'medium' | 'low' | 'info';
      examples?: string[];
    }>;
  }[];
  showExamples?: boolean;
}

// Define the component
const IssuesSummary: React.FC<IssuesSummaryProps> = ({ 
  issues,
  showExamples = false
}) => {
  const { theme } = usePdfTheme();
  
  // Map severity levels to colors
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#ef4444'; // red-500
      case 'medium':
        return '#f97316'; // orange-500
      case 'low':
        return '#facc15'; // yellow-400
      case 'info':
        return '#3b82f6'; // blue-500
      default:
        return '#6b7280'; // gray-500
    }
  };
  
  // Calculate total issues by severity
  const calculateTotalsBySeverity = () => {
    const totals = {
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
      total: 0
    };
    
    issues.forEach(category => {
      category.items.forEach(item => {
        switch(item.severity) {
          case 'high':
            totals.high++;
            break;
          case 'medium':
            totals.medium++;
            break;
          case 'low':
            totals.low++;
            break;
          case 'info':
            totals.info++;
            break;
        }
        totals.total++;
      });
    });
    
    return totals;
  };
  
  const issueTotals = calculateTotalsBySeverity();
  
  // Create styles for the component
  const styles = StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    header: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
      color: theme.primaryColor,
    },
    summaryContainer: {
      flexDirection: 'row',
      marginBottom: 15,
      padding: 10,
      backgroundColor: '#f8fafc',
      borderRadius: 4,
    },
    severityItem: {
      flex: 1,
      alignItems: 'center',
    },
    severityCount: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 5,
    },
    severityLabel: {
      fontSize: 10,
      color: theme.secondaryColor,
    },
    categoryContainer: {
      marginBottom: 15,
    },
    categoryHeader: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8,
      color: theme.primaryColor,
      padding: 8,
      backgroundColor: '#f1f5f9',
      borderRadius: 4,
    },
    issueItem: {
      marginBottom: 10,
      padding: 8,
      borderLeftWidth: 3,
      borderLeftColor: '#d1d5db',
      backgroundColor: '#ffffff',
    },
    issueTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    issueDescription: {
      fontSize: 12,
      marginBottom: 6,
      color: theme.secondaryColor,
    },
    severityTag: {
      position: 'absolute',
      top: 8,
      right: 8,
      fontSize: 10,
      padding: 4,
      borderRadius: 4,
      color: '#ffffff',
    },
    examplesHeader: {
      fontSize: 11,
      fontWeight: 'bold',
      marginTop: 6,
      marginBottom: 4,
    },
    exampleItem: {
      fontSize: 10,
      marginLeft: 10,
      marginBottom: 2,
      color: theme.secondaryColor,
    },
    noIssues: {
      fontSize: 14,
      color: '#10b981',
      fontWeight: 'bold',
      textAlign: 'center',
      padding: 20,
      backgroundColor: '#f0fdf4',
      borderRadius: 4,
    },
  });

  // If there are no issues, display a success message
  if (issueTotals.total === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Issues Summary</Text>
        <View style={styles.summaryContainer}>
          <Text style={styles.noIssues}>
            Great job! No issues were found.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Issues Summary</Text>
      
      {/* Summary counts by severity */}
      <View style={styles.summaryContainer}>
        <View style={styles.severityItem}>
          <Text style={[styles.severityCount, { color: getSeverityColor('high') }]}>
            {issueTotals.high}
          </Text>
          <Text style={styles.severityLabel}>Critical</Text>
        </View>
        <View style={styles.severityItem}>
          <Text style={[styles.severityCount, { color: getSeverityColor('medium') }]}>
            {issueTotals.medium}
          </Text>
          <Text style={styles.severityLabel}>Important</Text>
        </View>
        <View style={styles.severityItem}>
          <Text style={[styles.severityCount, { color: getSeverityColor('low') }]}>
            {issueTotals.low}
          </Text>
          <Text style={styles.severityLabel}>Minor</Text>
        </View>
        <View style={styles.severityItem}>
          <Text style={[styles.severityCount, { color: getSeverityColor('info') }]}>
            {issueTotals.info}
          </Text>
          <Text style={styles.severityLabel}>Info</Text>
        </View>
      </View>
      
      {/* Issues by category */}
      {issues.map((category, categoryIndex) => (
        <View key={`category-${categoryIndex}`} style={styles.categoryContainer}>
          <Text style={styles.categoryHeader}>
            {category.category} ({category.items.length})
          </Text>
          
          {/* List of issues in this category */}
          {category.items.map((issue, issueIndex) => (
            <View 
              key={`issue-${categoryIndex}-${issueIndex}`} 
              style={[
                styles.issueItem, 
                { borderLeftColor: getSeverityColor(issue.severity) }
              ]}
            >
              <Text style={styles.issueTitle}>{issue.title}</Text>
              <Text style={styles.issueDescription}>{issue.description}</Text>
              
              <Text 
                style={[
                  styles.severityTag,
                  { backgroundColor: getSeverityColor(issue.severity) }
                ]}
              >
                {issue.severity.toUpperCase()}
              </Text>
              
              {/* Example instances if available and enabled */}
              {showExamples && issue.examples && issue.examples.length > 0 && (
                <View>
                  <Text style={styles.examplesHeader}>
                    Examples ({Math.min(issue.examples.length, 3)} of {issue.examples.length}):
                  </Text>
                  {issue.examples.slice(0, 3).map((example, exampleIndex) => (
                    <Text 
                      key={`example-${categoryIndex}-${issueIndex}-${exampleIndex}`} 
                      style={styles.exampleItem}
                    >
                      • {example}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

export default IssuesSummary; 