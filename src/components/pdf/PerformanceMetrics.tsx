"use client";

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { usePdfTheme } from '@/context/ThemeContext';

interface PageSpeedMetrics {
  performance: number;
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  cls: number; // Cumulative Layout Shift
  tbt: number; // Total Blocking Time
  si?: number; // Speed Index
  tti?: number; // Time to Interactive
}

interface PerformanceMetricsProps {
  mobile: PageSpeedMetrics;
  desktop: PageSpeedMetrics;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  mobile,
  desktop,
}) => {
  const { theme } = usePdfTheme();
  
  // Function to get color based on performance score
  const getPerformanceColor = (score: number) => {
    if (score >= 90) return '#22c55e'; // green
    if (score >= 50) return '#eab308'; // yellow
    return '#ef4444'; // red
  };
  
  // Format metric values (some are in ms, others are unitless)
  const formatMetricValue = (key: string, value: number) => {
    if (key === 'cls') return value.toFixed(2); // Unitless
    if (key === 'performance') return `${Math.round(value * 100)}/100`;
    // Convert ms to seconds for time-based metrics
    return `${(value / 1000).toFixed(1)}s`;
  };
  
  // Get a human-readable name for the metric
  const getMetricName = (key: string) => {
    const metricNames: Record<string, string> = {
      performance: 'Performance Score',
      fcp: 'First Contentful Paint',
      lcp: 'Largest Contentful Paint',
      cls: 'Cumulative Layout Shift',
      tbt: 'Total Blocking Time',
      si: 'Speed Index',
      tti: 'Time to Interactive',
    };
    return metricNames[key] || key;
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
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
    },
    scoreCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 15,
    },
    scoreText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: 'bold',
    },
    deviceTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.primaryColor,
      marginBottom: 10,
      marginTop: 15,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    metricItem: {
      width: '50%',
      marginBottom: 8,
    },
    metricName: {
      fontSize: 10,
      color: theme.secondaryColor,
    },
    metricValue: {
      fontSize: 12,
      fontWeight: 'bold',
    },
  });

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Performance Metrics</Text>
      
      {/* Mobile Performance */}
      <Text style={styles.deviceTitle}>Mobile</Text>
      <View style={styles.scoreRow}>
        <View style={[
          styles.scoreCircle, 
          { backgroundColor: getPerformanceColor(mobile.performance * 100) }
        ]}>
          <Text style={styles.scoreText}>
            {Math.round(mobile.performance * 100)}
          </Text>
        </View>
        <Text style={{ flex: 1, fontSize: 12, color: theme.secondaryColor }}>
          Mobile performance score from Google PageSpeed Insights
        </Text>
      </View>
      
      <View style={styles.metricsGrid}>
        {Object.entries(mobile).filter(([key]) => key !== 'performance').map(([key, value], index) => (
          <View key={index} style={styles.metricItem}>
            <Text style={styles.metricName}>{getMetricName(key)}</Text>
            <Text style={styles.metricValue}>{formatMetricValue(key, value)}</Text>
          </View>
        ))}
      </View>
      
      {/* Desktop Performance */}
      <Text style={styles.deviceTitle}>Desktop</Text>
      <View style={styles.scoreRow}>
        <View style={[
          styles.scoreCircle, 
          { backgroundColor: getPerformanceColor(desktop.performance * 100) }
        ]}>
          <Text style={styles.scoreText}>
            {Math.round(desktop.performance * 100)}
          </Text>
        </View>
        <Text style={{ flex: 1, fontSize: 12, color: theme.secondaryColor }}>
          Desktop performance score from Google PageSpeed Insights
        </Text>
      </View>
      
      <View style={styles.metricsGrid}>
        {Object.entries(desktop).filter(([key]) => key !== 'performance').map(([key, value], index) => (
          <View key={index} style={styles.metricItem}>
            <Text style={styles.metricName}>{getMetricName(key)}</Text>
            <Text style={styles.metricValue}>{formatMetricValue(key, value)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default PerformanceMetrics; 