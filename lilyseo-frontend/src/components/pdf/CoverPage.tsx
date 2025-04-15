"use client";

import React from 'react';
import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { usePdfTheme } from '@/context/ThemeContext';

interface CoverPageProps {
  reportTitle: string;
  projectName: string;
  reportDate: string;
  url?: string;
  clientName?: string;
  clientLogo?: string;
}

const CoverPage: React.FC<CoverPageProps> = ({
  reportTitle,
  projectName,
  reportDate,
  url,
  clientName,
  clientLogo,
}) => {
  const { theme } = usePdfTheme();
  
  const styles = StyleSheet.create({
    page: {
      padding: 40,
      backgroundColor: '#ffffff',
      fontFamily: theme.fontFamily,
    },
    header: {
      marginBottom: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    companyLogo: {
      width: 120,
      height: 40,
      objectFit: 'contain',
      marginBottom: 10,
    },
    clientLogo: {
      width: 100,
      height: 35,
      objectFit: 'contain',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 80,
    },
    title: {
      fontSize: 28,
      color: theme.primaryColor,
      marginBottom: 16,
      textAlign: 'center',
    },
    projectName: {
      fontSize: 20,
      color: theme.secondaryColor,
      marginBottom: 8,
      textAlign: 'center',
    },
    reportDate: {
      fontSize: 14,
      color: theme.secondaryColor,
      marginBottom: 24,
      textAlign: 'center',
    },
    url: {
      fontSize: 12,
      color: theme.primaryColor,
      textAlign: 'center',
      marginBottom: 40,
    },
    clientSection: {
      position: 'absolute',
      bottom: 60,
      left: 40,
      right: 40,
      textAlign: 'center',
    },
    preparedFor: {
      fontSize: 12,
      color: theme.secondaryColor,
      marginBottom: 10,
    },
    clientName: {
      fontSize: 16,
      color: theme.primaryColor,
      marginBottom: 5,
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
  });

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        {theme.logoUrl && (
          <Image src={theme.logoUrl} style={styles.companyLogo} />
        )}
        <Text style={{ fontSize: 12, color: theme.secondaryColor }}>
          {reportDate}
        </Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>{reportTitle}</Text>
        <Text style={styles.projectName}>{projectName}</Text>
        {url && <Text style={styles.url}>{url}</Text>}
      </View>
      
      {clientName && (
        <View style={styles.clientSection}>
          <Text style={styles.preparedFor}>Prepared for:</Text>
          {clientLogo && <Image src={clientLogo} style={styles.clientLogo} />}
          <Text style={styles.clientName}>{clientName}</Text>
        </View>
      )}
      
      <View style={styles.footer}>
        <Text>{theme.footerText}</Text>
      </View>
    </Page>
  );
};

export default CoverPage; 